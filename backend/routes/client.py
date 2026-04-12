from fastapi import APIRouter, Request, Response, Depends, HTTPException
from datetime import datetime, timezone
from pathlib import Path
import bcrypt
import logging

import config
from database import db
from models import ClientLoginRequest, ClientChangePassword, ClientUpdateProfile
from auth import (
    get_current_user, require_auth, create_client_token,
    get_client_folder_name
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/auth/login")
async def client_login(request_data: ClientLoginRequest, response: Response):
    email = request_data.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not bcrypt.checkpw(request_data.password.encode("utf-8"), user["password_hash"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_client_token(user["user_id"], user["email"])
    response.set_cookie(key="client_token", value=token, httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60)
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    return safe_user


@router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.model_dump()


@router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="client_token", path="/")
    return {"message": "Logged out"}


@router.post("/auth/change-password")
async def change_password(data: ClientChangePassword, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    if not user_doc or not user_doc.get("password_hash"):
        raise HTTPException(status_code=400, detail="No password set")
    if not bcrypt.checkpw(data.current_password.encode("utf-8"), user_doc["password_hash"].encode("utf-8")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    new_hash = bcrypt.hashpw(data.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    await db.users.update_one({"user_id": user.user_id}, {"$set": {"password_hash": new_hash}})
    return {"message": "Password updated successfully"}


@router.put("/auth/profile")
async def update_profile(data: ClientUpdateProfile, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    old_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    old_folder = get_client_folder_name(old_user.get("name", ""), old_user.get("email", ""))
    update = {}
    if data.name:
        update["name"] = data.name
    if update:
        await db.users.update_one({"user_id": user.user_id}, {"$set": update})
    updated = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    new_folder = get_client_folder_name(updated.get("name", ""), updated.get("email", ""))
    if old_folder != new_folder:
        old_path = Path(config.PHOTO_STORAGE_PATH) / old_folder
        new_path = Path(config.PHOTO_STORAGE_PATH) / new_folder
        if old_path.exists() and not new_path.exists():
            old_path.rename(new_path)
            await db.client_photos.update_many(
                {"user_id": user.user_id, "folder_name": old_folder},
                {"$set": {"folder_name": new_folder}}
            )
            logger.info(f"Renamed photo folder: {old_folder} -> {new_folder}")
    safe = {k: v for k, v in updated.items() if k != "password_hash"}
    return safe


@router.get("/client/photos")
async def get_client_photos(request: Request):
    user = await require_auth(request)
    photos = await db.client_photos.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    now = datetime.now(timezone.utc)
    for photo in photos:
        if photo.get("delete_after"):
            delete_at = datetime.fromisoformat(photo["delete_after"].replace("Z", "+00:00"))
            days_remaining = (delete_at - now).days
            photo["days_remaining"] = max(0, days_remaining)
            photo["deletion_warning"] = days_remaining <= 7
        else:
            photo["days_remaining"] = None
            photo["deletion_warning"] = False
    return photos


@router.get("/client/stats")
async def get_client_stats(request: Request):
    user = await require_auth(request)
    total_bookings = await db.bookings.count_documents({"user_id": user.user_id})
    completed_bookings = await db.bookings.count_documents({"user_id": user.user_id, "status": "completed"})
    total_photos = await db.client_photos.count_documents({"user_id": user.user_id})
    return {"total_bookings": total_bookings, "completed_bookings": completed_bookings, "total_photos": total_photos}
