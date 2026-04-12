from fastapi import APIRouter, Request, Response, Depends, UploadFile, File
from fastapi.responses import FileResponse
from datetime import datetime, timezone
from pathlib import Path
import shutil

import config
from database import db
from models import AdminLoginRequest, SettingsUpdate
from auth import (
    verify_password, create_access_token, create_refresh_token,
    require_admin, hash_password
)
from email_service import send_email

router = APIRouter()


@router.post("/admin/login")
async def admin_login(request: AdminLoginRequest, response: Response):
    email = request.email.lower()
    admin = await db.admins.find_one({"email": email}, {"_id": 0})
    if not admin:
        raise __import__('fastapi').HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(request.password, admin["password_hash"]):
        raise __import__('fastapi').HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(admin["id"], admin["email"], "admin")
    refresh_token = create_refresh_token(admin["id"])
    response.set_cookie(
        key="admin_token", value=access_token,
        httponly=True, secure=True, samesite="none", max_age=86400, path="/"
    )
    return {"id": admin["id"], "email": admin["email"], "name": admin["name"], "role": admin["role"], "token": access_token}


@router.get("/admin/me")
async def get_admin_me(admin: dict = Depends(require_admin)):
    return admin


@router.post("/admin/logout")
async def admin_logout(response: Response):
    response.delete_cookie(key="admin_token", path="/")
    return {"message": "Logged out"}


@router.get("/admin/settings")
async def get_settings(admin: dict = Depends(require_admin)):
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    if not settings:
        settings = {
            "id": "app_settings",
            "photo_storage_path": config.PHOTO_STORAGE_PATH,
            "photo_retention_days": config.PHOTO_RETENTION_DAYS,
            "smtp_host": config.SMTP_HOST,
            "smtp_port": config.SMTP_PORT,
            "smtp_user": config.SMTP_USER,
            "smtp_password": "***" if config.SMTP_PASSWORD else "",
            "sender_email": config.SENDER_EMAIL
        }
    else:
        if settings.get("smtp_password"):
            settings["smtp_password"] = "***"
    return settings


@router.put("/admin/settings")
async def update_settings(settings_update: SettingsUpdate, admin: dict = Depends(require_admin)):
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}

    if settings_update.photo_storage_path:
        new_path = Path(settings_update.photo_storage_path)
        new_path.mkdir(exist_ok=True, parents=True)
        config.PHOTO_STORAGE_PATH = str(new_path)
        config.UPLOAD_DIR = new_path
        update_data["photo_storage_path"] = config.PHOTO_STORAGE_PATH
    if settings_update.photo_retention_days is not None:
        config.PHOTO_RETENTION_DAYS = settings_update.photo_retention_days
        update_data["photo_retention_days"] = config.PHOTO_RETENTION_DAYS
    if settings_update.smtp_host is not None:
        config.SMTP_HOST = settings_update.smtp_host
        update_data["smtp_host"] = config.SMTP_HOST
    if settings_update.smtp_port is not None:
        config.SMTP_PORT = settings_update.smtp_port
        update_data["smtp_port"] = config.SMTP_PORT
    if settings_update.smtp_user is not None:
        config.SMTP_USER = settings_update.smtp_user
        update_data["smtp_user"] = config.SMTP_USER
    if settings_update.smtp_password is not None:
        config.SMTP_PASSWORD = settings_update.smtp_password
        update_data["smtp_password"] = config.SMTP_PASSWORD
    if settings_update.sender_email is not None:
        config.SENDER_EMAIL = settings_update.sender_email
        update_data["sender_email"] = config.SENDER_EMAIL

    await db.settings.update_one({"id": "app_settings"}, {"$set": update_data}, upsert=True)
    masked = {**update_data}
    if "smtp_password" in masked and masked["smtp_password"]:
        masked["smtp_password"] = "***"
    return {"message": "Settings updated", "settings": masked}


@router.post("/admin/test-email")
async def test_email(admin: dict = Depends(require_admin)):
    test_html = """
    <html><body style="font-family: Arial, sans-serif; background-color: #0a0a0a; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #141414; padding: 40px; border-radius: 8px; border: 1px solid #333;">
            <h2 style="color: #d4af37; margin-bottom: 20px;">SkyLine Media - Test Email</h2>
            <p style="color: #fff;">This is a test email from your SkyLine Media SMTP configuration.</p>
            <p style="color: #999;">If you're seeing this, your email setup is working correctly!</p>
        </div>
    </body></html>
    """
    result = await send_email(admin["email"], "SkyLine Media - SMTP Test", test_html)
    if result and result.get("status") == "sent":
        return {"message": "Test email sent successfully", "status": "sent"}
    elif result and result.get("status") == "error":
        return {"message": result.get("error", "Email sending failed"), "status": "error"}
    elif result and result.get("status") == "mocked":
        return {"message": "Email is currently in mock mode. Configure SMTP or Resend to send real emails.", "status": "mocked"}
    raise __import__('fastapi').HTTPException(status_code=500, detail="Failed to send test email. Check your SMTP/Resend settings.")


@router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(require_admin)):
    total_bookings = await db.bookings.count_documents({})
    pending_bookings = await db.bookings.count_documents({"status": "pending"})
    approved_bookings = await db.bookings.count_documents({"status": "approved"})
    confirmed_bookings = await db.bookings.count_documents({"status": "confirmed"})
    completed_bookings = await db.bookings.count_documents({"status": "completed"})
    total_clients = await db.users.count_documents({})
    total_contacts = await db.contacts.count_documents({})
    new_contacts = await db.contacts.count_documents({"status": "new"})
    paid_bookings = await db.bookings.find({"payment_status": "paid"}, {"_id": 0, "total_amount": 1}).to_list(1000)
    total_revenue = sum(b.get("total_amount", 0) for b in paid_bookings)
    return {
        "total_bookings": total_bookings, "pending_bookings": pending_bookings,
        "approved_bookings": approved_bookings, "confirmed_bookings": confirmed_bookings,
        "completed_bookings": completed_bookings, "total_clients": total_clients,
        "total_contacts": total_contacts, "new_contacts": new_contacts,
        "total_revenue": total_revenue, "currency": "CAD"
    }


@router.get("/admin/clients")
async def get_admin_clients(admin: dict = Depends(require_admin), limit: int = 50):
    clients = await db.users.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    for client in clients:
        booking_count = await db.bookings.count_documents({"user_id": client.get("user_id")})
        client["booking_count"] = booking_count
    return clients


@router.delete("/admin/clients/{user_id}")
async def delete_client(user_id: str, admin: dict = Depends(require_admin)):
    """Delete a client and all their associated data"""
    from pathlib import Path
    import config

    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise __import__('fastapi').HTTPException(status_code=404, detail="Client not found")

    # Delete client photos from disk
    photos = await db.client_photos.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    for photo in photos:
        try:
            folder = photo.get("folder_name", "")
            if folder:
                file_path = Path(config.PHOTO_STORAGE_PATH) / folder / photo["booking_id"] / photo["filename"]
            else:
                file_path = Path(config.PHOTO_STORAGE_PATH) / photo["booking_id"] / photo["filename"]
            if file_path.exists():
                file_path.unlink()
        except Exception:
            pass

    # Delete all client data from DB
    await db.client_photos.delete_many({"user_id": user_id})
    await db.bookings.delete_many({"user_id": user_id})
    await db.users.delete_one({"user_id": user_id})

    return {"message": "Client and all associated data deleted"}


@router.get("/admin/contacts")
async def get_admin_contacts(admin: dict = Depends(require_admin), status: str = None, limit: int = 50):
    query = {}
    if status:
        query["status"] = status
    contacts = await db.contacts.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return contacts


@router.put("/admin/contacts/{contact_id}/status")
async def update_contact_status(contact_id: str, status: str, admin: dict = Depends(require_admin)):
    result = await db.contacts.update_one({"id": contact_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise __import__('fastapi').HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Status updated"}


@router.post("/admin/favicon")
async def upload_favicon(file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    """Upload a custom favicon image (PNG, JPG, ICO, SVG)"""
    from PIL import Image
    import io

    allowed = {".png", ".jpg", ".jpeg", ".ico", ".svg", ".webp"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed:
        raise __import__('fastapi').HTTPException(status_code=400, detail=f"File type {ext} not supported. Use PNG, JPG, ICO, or SVG.")

    content = await file.read()
    public_dir = config.ROOT_DIR.parent / "frontend" / "public"
    build_dir = config.ROOT_DIR.parent / "frontend" / "build"

    if ext == ".ico":
        # Save ICO directly
        for d in [public_dir, build_dir]:
            if d.exists():
                (d / "favicon.ico").write_bytes(content)
    elif ext == ".svg":
        for d in [public_dir, build_dir]:
            if d.exists():
                (d / "favicon.svg").write_bytes(content)
    else:
        # Convert image to favicon sizes
        img = Image.open(io.BytesIO(content))
        for d in [public_dir, build_dir]:
            if d.exists():
                img.resize((64, 64), Image.LANCZOS).save(str(d / "favicon.ico"), format="ICO")
                img.resize((32, 32), Image.LANCZOS).save(str(d / "favicon-32x32.png"), format="PNG")
                img.resize((180, 180), Image.LANCZOS).save(str(d / "apple-touch-icon.png"), format="PNG")

    return {"message": "Favicon updated. Hard refresh your browser (Ctrl+Shift+R) to see it."}


@router.get("/admin/favicon/preview")
async def get_favicon_preview(admin: dict = Depends(require_admin)):
    """Get current favicon"""
    build_dir = config.ROOT_DIR.parent / "frontend" / "build"
    public_dir = config.ROOT_DIR.parent / "frontend" / "public"
    for d in [build_dir, public_dir]:
        ico = d / "favicon.ico"
        if ico.exists():
            return FileResponse(ico, media_type="image/x-icon")
    raise __import__('fastapi').HTTPException(status_code=404, detail="No favicon found")
