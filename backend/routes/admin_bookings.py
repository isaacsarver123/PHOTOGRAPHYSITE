from fastapi import APIRouter, Request, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional
import uuid
import shutil
import logging

import config
from database import db
from models import (
    BookingApprovalRequest, BookingStatusUpdate, PaymentTransaction, ClientPhoto
)
from auth import require_admin, get_client_folder_name
from email_service import send_booking_approved_email, send_photos_ready_email

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/admin/bookings")
async def get_admin_bookings(admin: dict = Depends(require_admin), status: Optional[str] = None, limit: int = 50):
    query = {}
    if status:
        query["status"] = status
    bookings = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return bookings


@router.get("/admin/bookings/{booking_id}")
async def get_admin_booking(booking_id: str, admin: dict = Depends(require_admin)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    photos = await db.client_photos.find({"booking_id": booking_id}, {"_id": 0}).to_list(100)
    booking["photos"] = photos
    return booking


@router.post("/admin/bookings/{booking_id}/approve")
async def approve_booking(booking_id: str, approval: BookingApprovalRequest, request: Request, admin: dict = Depends(require_admin)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] != "pending":
        raise HTTPException(status_code=400, detail="Booking is not pending approval")

    update_data = {"status": "approved", "payment_status": "awaiting_payment", "approved_at": datetime.now(timezone.utc).isoformat()}
    if approval.scheduled_date:
        update_data["scheduled_date"] = approval.scheduled_date
    if approval.scheduled_time:
        update_data["scheduled_time"] = approval.scheduled_time
    if approval.admin_notes:
        update_data["admin_notes"] = approval.admin_notes

    origin_url = str(request.base_url).rstrip('/').replace('/api', '').replace('http://', 'https://')
    if 'localhost' in origin_url or '0.0.0.0' in origin_url:
        origin_url = "https://drone-home-showcase.preview.emergentagent.com"

    success_url = f"{origin_url}/booking/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/booking/payment/{booking_id}"
    webhook_url = f"{str(request.base_url)}api/webhook/stripe"

    stripe_checkout = StripeCheckout(api_key=config.STRIPE_API_KEY, webhook_url=webhook_url)
    checkout_request = CheckoutSessionRequest(
        amount=float(booking["total_amount"]), currency="cad",
        success_url=success_url, cancel_url=cancel_url,
        metadata={"booking_id": booking_id, "email": booking["email"]}
    )
    session = await stripe_checkout.create_checkout_session(checkout_request)

    update_data["payment_session_id"] = session.session_id
    update_data["payment_url"] = session.url
    await db.bookings.update_one({"id": booking_id}, {"$set": update_data})

    payment_doc = PaymentTransaction(
        session_id=session.session_id, booking_id=booking_id,
        user_email=booking["email"], amount=float(booking["total_amount"]),
        currency="cad", metadata={"booking_id": booking_id}
    )
    doc = payment_doc.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.payment_transactions.insert_one(doc)

    updated_booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    await send_booking_approved_email(updated_booking, session.url)
    return {"message": "Booking approved", "payment_url": session.url}


@router.put("/admin/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status_update: BookingStatusUpdate, admin: dict = Depends(require_admin)):
    update_data = {"status": status_update.status}
    if status_update.admin_notes:
        update_data["admin_notes"] = status_update.admin_notes
    result = await db.bookings.update_one({"id": booking_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    if status_update.status == "completed":
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if booking:
            await send_photos_ready_email(booking)
    return {"message": "Status updated"}


@router.delete("/admin/bookings/{booking_id}")
async def delete_booking(booking_id: str, admin: dict = Depends(require_admin)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    photos = await db.client_photos.find({"booking_id": booking_id}, {"_id": 0}).to_list(100)
    for photo in photos:
        try:
            folder = photo.get("folder_name", "")
            if folder:
                file_path = Path(config.PHOTO_STORAGE_PATH) / folder / booking_id / photo["filename"]
            else:
                file_path = Path(config.PHOTO_STORAGE_PATH) / booking_id / photo["filename"]
            if file_path.exists():
                file_path.unlink()
            parent = file_path.parent
            if parent.exists() and not any(parent.iterdir()):
                parent.rmdir()
        except Exception as e:
            print(f"Error deleting photo file: {e}")
    await db.client_photos.delete_many({"booking_id": booking_id})
    await db.bookings.delete_one({"id": booking_id})
    return {"message": "Booking deleted successfully"}


@router.post("/admin/bookings/{booking_id}/photos")
async def upload_photo(booking_id: str, file: UploadFile = File(...), title: str = Form(""), admin: dict = Depends(require_admin)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    user_id = booking.get("user_id", "")
    client = await db.users.find_one({"user_id": user_id}, {"_id": 0}) if user_id else None
    if client:
        folder_name = get_client_folder_name(client.get("name", ""), client.get("email", ""))
    else:
        folder_name = get_client_folder_name(booking.get("name", ""), booking.get("email", ""))

    ext = Path(file.filename).suffix or ".jpg"
    photo_id = str(uuid.uuid4())
    filename = f"{photo_id}{ext}"
    client_dir = Path(config.PHOTO_STORAGE_PATH) / folder_name / booking_id
    client_dir.mkdir(exist_ok=True, parents=True)
    file_path = client_dir / filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    file_size = file_path.stat().st_size

    photo = ClientPhoto(
        id=photo_id, user_id=user_id, booking_id=booking_id,
        title=title or file.filename, filename=filename,
        url=f"/api/photos/{booking_id}/{filename}",
        thumbnail_url=f"/api/photos/{booking_id}/{filename}",
        download_url=f"/api/photos/{booking_id}/{filename}/download",
        file_size=file_size
    )
    doc = photo.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["folder_name"] = folder_name
    await db.client_photos.insert_one(doc)
    return {"id": photo_id, "url": photo.url, "message": "Photo uploaded"}


@router.delete("/admin/photos/{photo_id}")
async def delete_photo(photo_id: str, admin: dict = Depends(require_admin)):
    photo = await db.client_photos.find_one({"id": photo_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    folder = photo.get("folder_name", "")
    if folder:
        file_path = Path(config.PHOTO_STORAGE_PATH) / folder / photo["booking_id"] / photo["filename"]
    else:
        file_path = Path(config.PHOTO_STORAGE_PATH) / photo["booking_id"] / photo["filename"]
    if file_path.exists():
        file_path.unlink()
    await db.client_photos.delete_one({"id": photo_id})
    return {"message": "Photo deleted"}


@router.post("/admin/cleanup-photos")
async def trigger_photo_cleanup(admin: dict = Depends(require_admin)):
    from routes.public import cleanup_expired_photos
    deleted_count = await cleanup_expired_photos()
    return {"message": f"Cleaned up {deleted_count} expired photos"}


@router.get("/photos/{booking_id}/{filename}")
async def get_photo(booking_id: str, filename: str):
    photo = await db.client_photos.find_one({"booking_id": booking_id, "filename": filename}, {"_id": 0})
    if photo and photo.get("folder_name"):
        file_path = Path(config.PHOTO_STORAGE_PATH) / photo["folder_name"] / booking_id / filename
    else:
        file_path = Path(config.PHOTO_STORAGE_PATH) / booking_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Photo not found")
    return FileResponse(file_path)


@router.get("/photos/{booking_id}/{filename}/download")
async def download_photo(booking_id: str, filename: str, request: Request):
    photo = await db.client_photos.find_one({"booking_id": booking_id, "filename": filename}, {"_id": 0})
    if photo and photo.get("folder_name"):
        file_path = Path(config.PHOTO_STORAGE_PATH) / photo["folder_name"] / booking_id / filename
    else:
        file_path = Path(config.PHOTO_STORAGE_PATH) / booking_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Photo not found")
    if photo and not photo.get("first_downloaded_at"):
        delete_after = datetime.now(timezone.utc) + timedelta(days=config.PHOTO_RETENTION_DAYS)
        await db.client_photos.update_one({"id": photo["id"]}, {"$set": {"first_downloaded_at": datetime.now(timezone.utc).isoformat(), "delete_after": delete_after.isoformat(), "download_count": 1}})
    elif photo:
        await db.client_photos.update_one({"id": photo["id"]}, {"$inc": {"download_count": 1}})
    return FileResponse(file_path, filename=filename, media_type="application/octet-stream")
