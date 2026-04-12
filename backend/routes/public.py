from fastapi import APIRouter, Request, HTTPException
from typing import Optional, List, Dict
from datetime import datetime, timezone
from pathlib import Path
import uuid
import bcrypt
import logging

import config
from database import db
from models import (
    BookingCreate, Booking, ContactRequest, ContactCreate,
    ChatMessage, ChatRequest
)
from auth import get_current_user, require_auth, generate_random_password, get_client_folder_name
from email_service import send_email, send_booking_request_email

logger = logging.getLogger(__name__)
router = APIRouter()


# ==================== PHOTO CLEANUP ====================

async def cleanup_expired_photos():
    now = datetime.now(timezone.utc)
    expired_photos = await db.client_photos.find(
        {"delete_after": {"$ne": None, "$lt": now.isoformat()}}, {"_id": 0}
    ).to_list(1000)
    for photo in expired_photos:
        try:
            file_path = Path(config.PHOTO_STORAGE_PATH) / photo["booking_id"] / photo["filename"]
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted expired photo: {file_path}")
            await db.client_photos.delete_one({"id": photo["id"]})
        except Exception as e:
            logger.error(f"Error deleting photo {photo['id']}: {e}")
    return len(expired_photos)


# ==================== PUBLIC PORTFOLIO ====================

@router.get("/portfolio", response_model=List[Dict])
async def get_portfolio(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    items = await db.portfolio.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items

@router.get("/portfolio/{item_id}")
async def get_portfolio_item(item_id: str):
    item = await db.portfolio.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


# ==================== PACKAGES ====================

@router.get("/packages")
async def get_packages():
    return list(config.PACKAGES.values())

@router.get("/packages/{package_id}")
async def get_package(package_id: str):
    if package_id not in config.PACKAGES:
        raise HTTPException(status_code=404, detail="Package not found")
    return config.PACKAGES[package_id]


# ==================== BOOKINGS ====================

@router.post("/bookings")
async def create_booking(booking: BookingCreate, request: Request):
    user = await get_current_user(request)
    if booking.package_id not in config.PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    package = config.PACKAGES[booking.package_id]

    client_email = booking.email.lower()
    existing_user = await db.users.find_one({"email": client_email}, {"_id": 0})
    generated_password = None

    if not existing_user:
        generated_password = generate_random_password()
        password_hash = bcrypt.hashpw(generated_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id, "email": client_email, "name": booking.name,
            "password_hash": password_hash, "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
        logger.info(f"Auto-created client account for {client_email}")
    else:
        user_id = existing_user["user_id"]

    booking_doc = Booking(
        user_id=user_id if not user else user.user_id,
        name=booking.name, email=booking.email, phone=booking.phone,
        property_address=booking.property_address, property_type=booking.property_type,
        service_area=booking.service_area, package_id=booking.package_id,
        scheduled_date=booking.scheduled_date, scheduled_time=booking.scheduled_time,
        notes=booking.notes, total_amount=package["price"],
        status="pending", payment_status="pending"
    )
    doc = booking_doc.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.bookings.insert_one(doc)
    await send_booking_request_email(doc)

    if generated_password:
        credentials_html = f"""
        <html><body style="font-family: Arial, sans-serif; background-color: #0a0a0a; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #141414; padding: 40px; border-radius: 8px; border: 1px solid #333;">
                <h2 style="color: #d4af37; margin-bottom: 20px;">Welcome to SkyLine Media!</h2>
                <p style="color: #fff;">Hello, {booking.name}!</p>
                <p style="color: #ccc;">Your booking has been submitted and a client account has been created for you.</p>
                <div style="background: #1a1a1a; padding: 20px; margin: 20px 0; border: 1px solid #333;">
                    <p style="color: #d4af37; margin: 0 0 10px 0; font-weight: bold;">Your Login Credentials</p>
                    <p style="color: #fff; margin: 5px 0;">Email: <strong>{client_email}</strong></p>
                    <p style="color: #fff; margin: 5px 0;">Password: <strong>{generated_password}</strong></p>
                </div>
                <p style="color: #999; font-size: 14px;">You can change your password anytime from your dashboard profile.</p>
            </div>
        </body></html>
        """
        await send_email(client_email, "SkyLine Media - Your Account Details", credentials_html)

    return {
        "id": booking_doc.id, "total_amount": package["price"],
        "currency": "CAD", "status": "pending",
        "message": "Booking request submitted! We'll review and get back to you within 24 hours.",
        "account_created": generated_password is not None
    }

@router.get("/bookings")
async def get_user_bookings(request: Request):
    user = await require_auth(request)
    bookings = await db.bookings.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return bookings

@router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, request: Request):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@router.get("/bookings/{booking_id}/payment")
async def get_booking_payment_info(booking_id: str):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] != "approved":
        raise HTTPException(status_code=400, detail="Booking not approved for payment")
    return {
        "id": booking["id"], "name": booking["name"], "email": booking["email"],
        "package_id": booking["package_id"], "scheduled_date": booking["scheduled_date"],
        "scheduled_time": booking["scheduled_time"], "property_address": booking["property_address"],
        "total_amount": booking["total_amount"], "payment_url": booking.get("payment_url"), "currency": "CAD"
    }


# ==================== CONTACT ====================

@router.post("/contact")
async def create_contact(contact: ContactCreate):
    contact_doc = ContactRequest(
        name=contact.name, email=contact.email, phone=contact.phone,
        property_address=contact.property_address, service_type=contact.service_type,
        service_area=contact.service_area, message=contact.message
    )
    doc = contact_doc.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.contacts.insert_one(doc)
    html = f"""<html><body>
        <h2>New Contact Request - SkyLine Media</h2>
        <p><strong>Name:</strong> {contact.name}</p><p><strong>Email:</strong> {contact.email}</p>
        <p><strong>Phone:</strong> {contact.phone or 'N/A'}</p><p><strong>Service:</strong> {contact.service_type}</p>
        <p><strong>Area:</strong> {contact.service_area.title()}</p><p><strong>Message:</strong> {contact.message}</p>
    </body></html>"""
    await send_email(config.ADMIN_EMAIL, f"New Contact Request from {contact.name}", html)
    return {"message": "Thank you! We'll get back to you within 24 hours.", "id": contact_doc.id}


# ==================== AI CHAT ====================

@router.post("/chat")
async def chat(chat_req: ChatRequest):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    history = await db.chat_messages.find({"session_id": chat_req.session_id}, {"_id": 0}).sort("created_at", 1).to_list(50)
    user_msg = ChatMessage(session_id=chat_req.session_id, role="user", content=chat_req.message)
    user_doc = user_msg.model_dump()
    user_doc["created_at"] = user_doc["created_at"].isoformat()
    await db.chat_messages.insert_one(user_doc)

    system_message = """You are a helpful assistant for SkyLine Media, a professional drone aerial photography company specializing in DJI high-quality drones for real estate in Alberta, Canada.

Business Information:
- We serve Calgary and Edmonton, Alberta
- FAA Part 107 certified pilots (Transport Canada compliant)
- DJI equipment: Mavic 3 Pro, Inspire 3, Mini 4 Pro
- Turnaround: 24-48 hours for standard, same-day available for Premium

Pricing Packages (all prices in CAD):
1. Starter ($399 CAD): 15 aerial photos, 1 video, 24-48hr delivery
2. Professional ($799 CAD): 30 photos, 2 videos, virtual tour, 12-24hr delivery - MOST POPULAR
3. Premium ($1,299 CAD): Unlimited photos, 4K video, twilight shots, 3D mapping, same-day available

Booking Process:
1. Submit a booking request with your preferred date
2. We review and confirm availability
3. Once approved, you'll receive a payment link
4. Pay to confirm your booking

Be friendly, professional, and helpful. Answer questions about services, pricing, booking, and availability. If someone wants to book, direct them to the Booking page."""

    chat_client = LlmChat(
        api_key=config.ANTHROPIC_API_KEY,
        session_id=chat_req.session_id,
        system_message=system_message
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    user_message = UserMessage(text=chat_req.message)
    response = await chat_client.send_message(user_message)

    assistant_msg = ChatMessage(session_id=chat_req.session_id, role="assistant", content=response)
    assistant_doc = assistant_msg.model_dump()
    assistant_doc["created_at"] = assistant_doc["created_at"].isoformat()
    await db.chat_messages.insert_one(assistant_doc)
    return {"response": response}

@router.get("/chat/{session_id}")
async def get_chat_history(session_id: str):
    messages = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return messages


# ==================== SEED & HEALTH ====================

@router.post("/seed-portfolio")
async def seed_portfolio():
    portfolio_items = [
        {"id": str(uuid.uuid4()), "title": "Modern Calgary Estate", "description": "Stunning aerial views showcasing luxury property", "category": "residential", "image_url": "https://images.unsplash.com/photo-1606586243531-92e25ac0c0aa?w=1200", "before_image_url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800", "after_image_url": "https://images.unsplash.com/photo-1606586243531-92e25ac0c0aa?w=800", "location": "Calgary, AB", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Downtown Edmonton Commercial", "description": "Multi-story commercial building aerial photography", "category": "commercial", "image_url": "https://images.unsplash.com/photo-1669003153246-cb591207e66e?w=1200", "location": "Edmonton, AB", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Luxury Suburban Home", "description": "Beautiful aerial shots highlighting landscaping and pool", "category": "residential", "image_url": "https://images.unsplash.com/photo-1641441371947-47dd2f4a4276?w=1200", "before_image_url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", "after_image_url": "https://images.unsplash.com/photo-1641441371947-47dd2f4a4276?w=800", "location": "Calgary, AB", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Alberta Ranch Survey", "description": "Comprehensive aerial mapping for 500-acre ranch", "category": "land", "image_url": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200", "location": "Rural Alberta", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "New Development Progress", "description": "Construction progress documentation", "category": "construction", "image_url": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200", "location": "Edmonton, AB", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Twilight Property Showcase", "description": "Premium twilight aerial photography", "category": "residential", "image_url": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200", "location": "Calgary, AB", "created_at": datetime.now(timezone.utc).isoformat()}
    ]
    await db.portfolio.delete_many({})
    await db.portfolio.insert_many(portfolio_items)
    return {"message": f"Seeded {len(portfolio_items)} portfolio items"}

@router.get("/")
async def root():
    return {"message": "SkyLine Media API", "version": "2.0", "currency": "CAD"}

@router.get("/health")
async def health():
    return {"status": "healthy"}
