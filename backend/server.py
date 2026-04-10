from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# API Keys
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class PortfolioItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: str  # residential, commercial, land, construction
    image_url: str
    before_image_url: Optional[str] = None
    after_image_url: Optional[str] = None
    location: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClientPhoto(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    booking_id: str
    title: str
    url: str
    thumbnail_url: str
    download_url: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    name: str
    email: str
    phone: str
    property_address: str
    property_type: str  # residential, commercial, land
    package_id: str  # starter, professional, premium
    scheduled_date: str
    scheduled_time: str
    notes: Optional[str] = None
    status: str = "pending"  # pending, confirmed, completed, cancelled
    payment_status: str = "pending"  # pending, paid, refunded
    payment_session_id: Optional[str] = None
    total_amount: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    property_address: Optional[str] = None
    service_type: str
    message: str
    status: str = "new"  # new, contacted, closed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str  # user, assistant
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    booking_id: Optional[str] = None
    user_email: Optional[str] = None
    amount: float
    currency: str = "usd"
    status: str = "initiated"  # initiated, paid, failed, expired
    payment_status: str = "pending"
    metadata: Optional[Dict[str, str]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== REQUEST/RESPONSE MODELS ====================

class BookingCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    property_address: str
    property_type: str
    package_id: str
    scheduled_date: str
    scheduled_time: str
    notes: Optional[str] = None

class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    property_address: Optional[str] = None
    service_type: str
    message: str

class ChatRequest(BaseModel):
    session_id: str
    message: str

class CheckoutRequest(BaseModel):
    booking_id: str
    origin_url: str

# ==================== PRICING PACKAGES ====================

PACKAGES = {
    "starter": {
        "id": "starter",
        "name": "Starter Package",
        "price": 299.00,
        "description": "Perfect for small residential properties",
        "features": [
            "Up to 15 aerial photos",
            "1 property walkthrough video",
            "Basic color correction",
            "24-48 hour delivery",
            "Commercial usage rights"
        ],
        "recommended_for": "Single-family homes, condos"
    },
    "professional": {
        "id": "professional",
        "name": "Professional Package",
        "price": 599.00,
        "description": "Ideal for larger properties and real estate agents",
        "features": [
            "Up to 30 aerial photos",
            "2 property videos (aerial + ground)",
            "Advanced color grading",
            "Before/After comparison shots",
            "Interactive virtual tour",
            "12-24 hour delivery",
            "Commercial usage rights"
        ],
        "recommended_for": "Large homes, estates, commercial properties",
        "popular": True
    },
    "premium": {
        "id": "premium",
        "name": "Premium Package",
        "price": 999.00,
        "description": "Complete coverage for luxury and commercial properties",
        "features": [
            "Unlimited aerial photos",
            "4K cinematic video production",
            "Twilight/sunset shots",
            "3D property mapping",
            "Interactive virtual tour",
            "Social media ready content",
            "Same-day delivery available",
            "Full commercial rights"
        ],
        "recommended_for": "Luxury homes, commercial real estate, developments"
    }
}

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        return None
    
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    """Require authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token via Emergent Auth"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client:
        auth_response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    
    if auth_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    auth_data = auth_response.json()
    user_email = auth_data.get("email")
    user_name = auth_data.get("name")
    user_picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": user_name, "picture": user_picture}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": user_email,
            "name": user_name,
            "picture": user_picture,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ==================== PORTFOLIO ENDPOINTS ====================

@api_router.get("/portfolio", response_model=List[Dict])
async def get_portfolio(category: Optional[str] = None):
    """Get portfolio items"""
    query = {}
    if category:
        query["category"] = category
    
    items = await db.portfolio.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items

@api_router.get("/portfolio/{item_id}")
async def get_portfolio_item(item_id: str):
    """Get single portfolio item"""
    item = await db.portfolio.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

# ==================== BOOKING ENDPOINTS ====================

@api_router.get("/packages")
async def get_packages():
    """Get all pricing packages"""
    return list(PACKAGES.values())

@api_router.get("/packages/{package_id}")
async def get_package(package_id: str):
    """Get single package"""
    if package_id not in PACKAGES:
        raise HTTPException(status_code=404, detail="Package not found")
    return PACKAGES[package_id]

@api_router.post("/bookings")
async def create_booking(booking: BookingCreate, request: Request):
    """Create a new booking"""
    user = await get_current_user(request)
    
    if booking.package_id not in PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    package = PACKAGES[booking.package_id]
    
    booking_doc = Booking(
        user_id=user.user_id if user else None,
        name=booking.name,
        email=booking.email,
        phone=booking.phone,
        property_address=booking.property_address,
        property_type=booking.property_type,
        package_id=booking.package_id,
        scheduled_date=booking.scheduled_date,
        scheduled_time=booking.scheduled_time,
        notes=booking.notes,
        total_amount=package["price"]
    )
    
    doc = booking_doc.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.bookings.insert_one(doc)
    
    return {"id": booking_doc.id, "total_amount": package["price"]}

@api_router.get("/bookings")
async def get_user_bookings(request: Request):
    """Get bookings for current user"""
    user = await require_auth(request)
    bookings = await db.bookings.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return bookings

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, request: Request):
    """Get single booking"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

# ==================== PAYMENT ENDPOINTS ====================

@api_router.post("/payments/checkout")
async def create_checkout(checkout_req: CheckoutRequest, request: Request):
    """Create Stripe checkout session"""
    from emergentintegrations.payments.stripe.checkout import (
        StripeCheckout, CheckoutSessionRequest
    )
    
    booking = await db.bookings.find_one({"id": checkout_req.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    origin_url = checkout_req.origin_url
    success_url = f"{origin_url}/booking/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/booking"
    
    webhook_url = f"{str(request.base_url)}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=float(booking["total_amount"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "booking_id": checkout_req.booking_id,
            "email": booking["email"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    payment_doc = PaymentTransaction(
        session_id=session.session_id,
        booking_id=checkout_req.booking_id,
        user_email=booking["email"],
        amount=float(booking["total_amount"]),
        currency="usd",
        metadata={"booking_id": checkout_req.booking_id}
    )
    
    doc = payment_doc.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.payment_transactions.insert_one(doc)
    
    # Update booking with payment session
    await db.bookings.update_one(
        {"id": checkout_req.booking_id},
        {"$set": {"payment_session_id": session.session_id}}
    )
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    """Get payment status"""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY)
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction status
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": status.status,
            "payment_status": status.payment_status
        }}
    )
    
    # If paid, update booking
    if status.payment_status == "paid":
        transaction = await db.payment_transactions.find_one(
            {"session_id": session_id},
            {"_id": 0}
        )
        if transaction and transaction.get("booking_id"):
            await db.bookings.update_one(
                {"id": transaction["booking_id"]},
                {"$set": {
                    "payment_status": "paid",
                    "status": "confirmed"
                }}
            )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update payment transaction
        await db.payment_transactions.update_one(
            {"session_id": webhook_response.session_id},
            {"$set": {
                "status": webhook_response.payment_status,
                "payment_status": webhook_response.payment_status
            }}
        )
        
        # Update booking if payment successful
        if webhook_response.payment_status == "paid":
            booking_id = webhook_response.metadata.get("booking_id")
            if booking_id:
                await db.bookings.update_one(
                    {"id": booking_id},
                    {"$set": {
                        "payment_status": "paid",
                        "status": "confirmed"
                    }}
                )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

# ==================== CONTACT ENDPOINTS ====================

@api_router.post("/contact")
async def create_contact(contact: ContactCreate):
    """Create a contact/quote request"""
    contact_doc = ContactRequest(
        name=contact.name,
        email=contact.email,
        phone=contact.phone,
        property_address=contact.property_address,
        service_type=contact.service_type,
        message=contact.message
    )
    
    doc = contact_doc.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.contacts.insert_one(doc)
    
    return {"message": "Thank you! We'll get back to you within 24 hours.", "id": contact_doc.id}

# ==================== AI CHAT ENDPOINTS ====================

@api_router.post("/chat")
async def chat(chat_req: ChatRequest):
    """Chat with AI assistant"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Get chat history
    history = await db.chat_messages.find(
        {"session_id": chat_req.session_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    
    # Save user message
    user_msg = ChatMessage(
        session_id=chat_req.session_id,
        role="user",
        content=chat_req.message
    )
    user_doc = user_msg.model_dump()
    user_doc["created_at"] = user_doc["created_at"].isoformat()
    await db.chat_messages.insert_one(user_doc)
    
    # Create system message about the business
    system_message = """You are a helpful assistant for SkyView Drone Photography, a professional drone aerial photography company specializing in DJI high-quality drones for real estate.

Business Information:
- We serve residential and commercial real estate clients
- FAA Part 107 certified pilots
- DJI equipment: Mavic 3 Pro, Inspire 3, Mini 4 Pro
- Service areas: Major metropolitan areas and suburbs
- Turnaround: 24-48 hours for standard, same-day available for Premium

Pricing Packages:
1. Starter ($299): 15 aerial photos, 1 video, 24-48hr delivery
2. Professional ($599): 30 photos, 2 videos, virtual tour, 12-24hr delivery - MOST POPULAR
3. Premium ($999): Unlimited photos, 4K video, twilight shots, 3D mapping, same-day available

Be friendly, professional, and helpful. Answer questions about services, pricing, booking, and availability. If someone wants to book, direct them to the Booking page. For quotes, suggest the Contact page."""

    # Build conversation
    chat = LlmChat(
        api_key=ANTHROPIC_API_KEY,
        session_id=chat_req.session_id,
        system_message=system_message
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    
    # Send message
    user_message = UserMessage(text=chat_req.message)
    response = await chat.send_message(user_message)
    
    # Save assistant message
    assistant_msg = ChatMessage(
        session_id=chat_req.session_id,
        role="assistant",
        content=response
    )
    assistant_doc = assistant_msg.model_dump()
    assistant_doc["created_at"] = assistant_doc["created_at"].isoformat()
    await db.chat_messages.insert_one(assistant_doc)
    
    return {"response": response}

@api_router.get("/chat/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    messages = await db.chat_messages.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return messages

# ==================== CLIENT DASHBOARD ENDPOINTS ====================

@api_router.get("/client/photos")
async def get_client_photos(request: Request):
    """Get photos for authenticated client"""
    user = await require_auth(request)
    photos = await db.client_photos.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return photos

@api_router.get("/client/stats")
async def get_client_stats(request: Request):
    """Get stats for authenticated client"""
    user = await require_auth(request)
    
    total_bookings = await db.bookings.count_documents({"user_id": user.user_id})
    completed_bookings = await db.bookings.count_documents({
        "user_id": user.user_id,
        "status": "completed"
    })
    total_photos = await db.client_photos.count_documents({"user_id": user.user_id})
    
    return {
        "total_bookings": total_bookings,
        "completed_bookings": completed_bookings,
        "total_photos": total_photos
    }

# ==================== SEED DATA ====================

@api_router.post("/seed-portfolio")
async def seed_portfolio():
    """Seed portfolio with sample data"""
    portfolio_items = [
        {
            "id": str(uuid.uuid4()),
            "title": "Modern Lakefront Estate",
            "description": "Stunning aerial views showcasing waterfront property with private dock",
            "category": "residential",
            "image_url": "https://images.unsplash.com/photo-1606586243531-92e25ac0c0aa?w=1200",
            "before_image_url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
            "after_image_url": "https://images.unsplash.com/photo-1606586243531-92e25ac0c0aa?w=800",
            "location": "Lake Austin, TX",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Downtown Commercial Complex",
            "description": "Multi-story commercial building aerial photography for marketing",
            "category": "commercial",
            "image_url": "https://images.unsplash.com/photo-1669003153246-cb591207e66e?w=1200",
            "location": "Austin, TX",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Luxury Suburban Home",
            "description": "Beautiful aerial shots highlighting landscaping and pool",
            "category": "residential",
            "image_url": "https://images.unsplash.com/photo-1641441371947-47dd2f4a4276?w=1200",
            "before_image_url": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
            "after_image_url": "https://images.unsplash.com/photo-1641441371947-47dd2f4a4276?w=800",
            "location": "Westlake Hills, TX",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Agricultural Land Survey",
            "description": "Comprehensive aerial mapping for 500-acre ranch property",
            "category": "land",
            "image_url": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200",
            "location": "Hill Country, TX",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "New Development Progress",
            "description": "Construction progress documentation for residential development",
            "category": "construction",
            "image_url": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200",
            "location": "Round Rock, TX",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Twilight Property Showcase",
            "description": "Premium twilight aerial photography for luxury listing",
            "category": "residential",
            "image_url": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200",
            "location": "Barton Creek, TX",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.portfolio.delete_many({})
    await db.portfolio.insert_many(portfolio_items)
    
    return {"message": f"Seeded {len(portfolio_items)} portfolio items"}

# ==================== BASIC ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "SkyView Drone Photography API"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
