from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
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
import bcrypt
import jwt
import asyncio
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# API Keys & Config
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-change-me')
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@skylinemedia.ca')
SMTP_HOST = os.environ.get('SMTP_HOST', '')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
PHOTO_STORAGE_PATH = os.environ.get('PHOTO_STORAGE_PATH', str(ROOT_DIR / 'uploads'))
PHOTO_RETENTION_DAYS = int(os.environ.get('PHOTO_RETENTION_DAYS', '30'))

# Create uploads directory
UPLOAD_DIR = Path(PHOTO_STORAGE_PATH)
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

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

# ==================== PASSWORD & JWT HELPERS ====================

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str = "user") -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# ==================== EMAIL HELPER ====================

async def send_email(to_email: str, subject: str, html_content: str):
    """Send email via SMTP or Resend API"""
    # Try SMTP first
    if SMTP_HOST and SMTP_USER and SMTP_PASSWORD:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            msg = MIMEMultipart('alternative')
            msg['From'] = SENDER_EMAIL
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(html_content, 'html'))
            
            def _send():
                with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                    server.starttls()
                    server.login(SMTP_USER, SMTP_PASSWORD)
                    server.send_message(msg)
            
            await asyncio.to_thread(_send)
            logger.info(f"Email sent via SMTP to {to_email}: {subject}")
            return {"id": "smtp_sent", "status": "sent"}
        except Exception as e:
            logger.error(f"SMTP email failed: {e}")
            return None
    
    # Fall back to Resend
    if RESEND_API_KEY and RESEND_API_KEY != 're_mock_key':
        try:
            import resend
            resend.api_key = RESEND_API_KEY
            params = {
                "from": SENDER_EMAIL,
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            email = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"Email sent via Resend to {to_email}: {email}")
            return email
        except Exception as e:
            logger.error(f"Resend email failed: {e}")
            return None
    
    # Mock fallback
    logger.info(f"[MOCK EMAIL] To: {to_email}, Subject: {subject}")
    logger.info(f"[MOCK EMAIL] Content: {html_content[:200]}...")
    return {"id": "mock_email_id", "status": "mocked"}

async def send_booking_request_email(booking: dict):
    """Send booking request confirmation email"""
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px;">
            <img src="https://customer-assets.emergentagent.com/job_drone-home-showcase/artifacts/t1ak4xlw_Skyline%20Media%20logo%20with%20golden%20peaks%20%281%29.png" alt="SkyLine Media" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #0a0a0a; margin-bottom: 20px;">Booking Request Received!</h1>
            <p>Hi {booking['name']},</p>
            <p>Thank you for your booking request with SkyLine Media. We've received your request and will review it shortly.</p>
            
            <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p><strong>Requested Date:</strong> {booking['scheduled_date']}</p>
                <p><strong>Time:</strong> {booking['scheduled_time']}</p>
                <p><strong>Package:</strong> {booking['package_id'].title()}</p>
                <p><strong>Property:</strong> {booking['property_address']}</p>
                <p><strong>Location:</strong> {booking.get('service_area', 'Calgary/Edmonton')}</p>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <p>Our team will review your request and confirm availability. Once approved, you'll receive an email with:</p>
            <ul>
                <li>Confirmed date and time</li>
                <li>Final pricing details</li>
                <li>Secure payment link</li>
            </ul>
            
            <p style="margin-top: 30px;">Best regards,<br>SkyLine Media<br>Calgary & Edmonton, Alberta</p>
        </div>
    </body>
    </html>
    """
    await send_email(booking['email'], "Booking Request Received - SkyLine Media", html)

async def send_booking_approved_email(booking: dict, payment_url: str):
    """Send booking approved email with payment link"""
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px;">
            <img src="https://customer-assets.emergentagent.com/job_drone-home-showcase/artifacts/t1ak4xlw_Skyline%20Media%20logo%20with%20golden%20peaks%20%281%29.png" alt="SkyLine Media" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #0a0a0a; margin-bottom: 20px;">Booking Approved!</h1>
            <p>Hi {booking['name']},</p>
            <p>Great news! Your booking request has been approved.</p>
            
            <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p><strong>Confirmed Date:</strong> {booking['scheduled_date']}</p>
                <p><strong>Time:</strong> {booking['scheduled_time']}</p>
                <p><strong>Package:</strong> {booking['package_id'].title()}</p>
                <p><strong>Property:</strong> {booking['property_address']}</p>
                <p><strong>Total:</strong> ${booking['total_amount']:.2f} CAD</p>
            </div>
            
            <p><strong>Complete Your Payment:</strong></p>
            <p>Please click the button below to complete your payment and confirm your booking:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{payment_url}" style="background: #d4af37; color: black; padding: 15px 30px; text-decoration: none; font-weight: bold; display: inline-block;">
                    Pay ${booking['total_amount']:.2f} CAD
                </a>
            </div>
            
            <p style="color: #666; font-size: 12px;">This payment link will expire in 24 hours.</p>
            
            <p style="margin-top: 30px;">Best regards,<br>SkyLine Media<br>Calgary & Edmonton, Alberta</p>
        </div>
    </body>
    </html>
    """
    await send_email(booking['email'], "Booking Approved - Complete Your Payment", html)

async def send_photos_ready_email(booking: dict):
    """Send photos ready email with 30-day warning"""
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px;">
            <img src="https://customer-assets.emergentagent.com/job_drone-home-showcase/artifacts/t1ak4xlw_Skyline%20Media%20logo%20with%20golden%20peaks%20%281%29.png" alt="SkyLine Media" style="height: 60px; margin-bottom: 20px;">
            <h1 style="color: #0a0a0a; margin-bottom: 20px;">Your Photos Are Ready!</h1>
            <p>Hi {booking['name']},</p>
            <p>Great news! Your drone photography session is complete and your photos are ready for download.</p>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #856404;"><strong>⚠️ Important:</strong> Your photos will be automatically deleted 30 days after your first download. Please make sure to download and save all your photos before then.</p>
            </div>
            
            <p>Log in to your dashboard to view and download your images.</p>
            
            <p style="margin-top: 30px;">Best regards,<br>SkyLine Media<br>Calgary & Edmonton, Alberta</p>
        </div>
    </body>
    </html>
    """
    await send_email(booking['email'], "Your Photos Are Ready - SkyLine Media", html)

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class AdminUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: str = "admin"
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    category: str
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
    filename: str
    url: str
    thumbnail_url: str
    download_url: str
    file_size: int = 0
    first_downloaded_at: Optional[str] = None
    delete_after: Optional[str] = None
    download_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    name: str
    email: str
    phone: str
    property_address: str
    property_type: str
    service_area: str = "calgary"  # calgary or edmonton
    package_id: str
    scheduled_date: str
    scheduled_time: str
    notes: Optional[str] = None
    status: str = "pending"  # pending, approved, confirmed, completed, cancelled
    payment_status: str = "pending"  # pending, awaiting_payment, paid, refunded
    payment_session_id: Optional[str] = None
    payment_url: Optional[str] = None
    total_amount: float = 0.0
    admin_notes: Optional[str] = None
    approved_at: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    property_address: Optional[str] = None
    service_type: str
    service_area: str = "calgary"
    message: str
    status: str = "new"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    booking_id: Optional[str] = None
    user_email: Optional[str] = None
    amount: float
    currency: str = "cad"
    status: str = "initiated"
    payment_status: str = "pending"
    metadata: Optional[Dict[str, str]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "app_settings"
    photo_storage_path: str = "/app/backend/uploads"
    photo_retention_days: int = 30
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    sender_email: str = "noreply@skylinemedia.ca"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== REQUEST/RESPONSE MODELS ====================

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

class BookingCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    property_address: str
    property_type: str
    service_area: str = "calgary"
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
    service_area: str = "calgary"
    message: str

class ChatRequest(BaseModel):
    session_id: str
    message: str

class BookingApprovalRequest(BaseModel):
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    admin_notes: Optional[str] = None

class BookingStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None

class SettingsUpdate(BaseModel):
    photo_storage_path: Optional[str] = None
    photo_retention_days: Optional[int] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    sender_email: Optional[str] = None

# ==================== PRICING PACKAGES (CAD) ====================

PACKAGES = {
    "quick_aerial": {
        "id": "quick_aerial",
        "name": "Quick Aerial",
        "price": 199.00,
        "currency": "CAD",
        "description": "Best for small listings, quick flips, and agents testing our service",
        "features": [
            "8-12 aerial photos",
            "1 short aerial video (30-45 sec)",
            "Basic color correction",
            "48-hour delivery",
            "MLS-ready exports"
        ],
        "notes": "No interior work. Shoot time under ~20 minutes.",
        "recommended_for": "Small listings, quick flips, first-time clients"
    },
    "aerial_plus": {
        "id": "aerial_plus",
        "name": "Aerial Plus",
        "price": 299.00,
        "currency": "CAD",
        "description": "Best for standard homes and serious real estate agents",
        "features": [
            "15-20 aerial photos",
            "1 cinematic aerial video (60 sec)",
            "Optional indoor FPV fly-through (simple pass)",
            "Enhanced color grading",
            "24-48 hour delivery",
            "Commercial usage rights"
        ],
        "recommended_for": "Standard homes, most real estate agents",
        "popular": True
    },
    "fpv_showcase": {
        "id": "fpv_showcase",
        "name": "FPV Showcase",
        "price": 649.00,
        "currency": "CAD",
        "description": "Best for standout listings that need the wow factor",
        "features": [
            "15 aerial photos",
            "1 cinematic aerial video",
            "Full indoor FPV fly-through (stabilized, smooth path)",
            "Edited highlight video (60-90 sec total)",
            "Social media cut (vertical reel)",
            "24-hour delivery"
        ],
        "recommended_for": "Standout listings, luxury properties"
    }
}

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token (for client OAuth)"""
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

async def get_current_admin(request: Request) -> dict:
    """Get current admin from JWT token"""
    token = request.cookies.get("admin_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access" or payload.get("role") != "admin":
            raise HTTPException(status_code=401, detail="Invalid token")
        
        admin = await db.admins.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not admin:
            raise HTTPException(status_code=401, detail="Admin not found")
        
        return admin
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(request: Request) -> dict:
    """Require authenticated admin"""
    return await get_current_admin(request)

# ==================== PHOTO CLEANUP TASK ====================

async def cleanup_expired_photos():
    """Delete photos that are past their retention period"""
    now = datetime.now(timezone.utc)
    expired_photos = await db.client_photos.find({
        "delete_after": {"$ne": None, "$lt": now.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    for photo in expired_photos:
        try:
            file_path = Path(PHOTO_STORAGE_PATH) / photo["booking_id"] / photo["filename"]
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted expired photo: {file_path}")
            
            await db.client_photos.delete_one({"id": photo["id"]})
        except Exception as e:
            logger.error(f"Error deleting photo {photo['id']}: {e}")
    
    return len(expired_photos)

# ==================== ADMIN AUTH ENDPOINTS ====================

@api_router.post("/admin/login")
async def admin_login(request: AdminLoginRequest, response: Response):
    """Admin login with email/password"""
    email = request.email.lower()
    admin = await db.admins.find_one({"email": email}, {"_id": 0})
    
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(request.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(admin["id"], admin["email"], "admin")
    refresh_token = create_refresh_token(admin["id"])
    
    response.set_cookie(
        key="admin_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=86400,
        path="/"
    )
    
    return {
        "id": admin["id"],
        "email": admin["email"],
        "name": admin["name"],
        "role": admin["role"],
        "token": access_token
    }

@api_router.get("/admin/me")
async def get_admin_me(admin: dict = Depends(require_admin)):
    """Get current admin info"""
    return admin

@api_router.post("/admin/logout")
async def admin_logout(response: Response):
    """Admin logout"""
    response.delete_cookie(key="admin_token", path="/")
    return {"message": "Logged out"}

# ==================== ADMIN SETTINGS ENDPOINTS ====================

@api_router.get("/admin/settings")
async def get_settings(admin: dict = Depends(require_admin)):
    """Get app settings"""
    settings = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    if not settings:
        settings = {
            "id": "app_settings",
            "photo_storage_path": PHOTO_STORAGE_PATH,
            "photo_retention_days": PHOTO_RETENTION_DAYS,
            "smtp_host": SMTP_HOST,
            "smtp_port": SMTP_PORT,
            "smtp_user": SMTP_USER,
            "smtp_password": "***" if SMTP_PASSWORD else "",
            "sender_email": SENDER_EMAIL
        }
    else:
        if settings.get("smtp_password"):
            settings["smtp_password"] = "***"
    return settings

@api_router.put("/admin/settings")
async def update_settings(settings_update: SettingsUpdate, admin: dict = Depends(require_admin)):
    """Update app settings"""
    global PHOTO_STORAGE_PATH, PHOTO_RETENTION_DAYS, UPLOAD_DIR, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SENDER_EMAIL
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if settings_update.photo_storage_path:
        new_path = Path(settings_update.photo_storage_path)
        new_path.mkdir(exist_ok=True, parents=True)
        PHOTO_STORAGE_PATH = str(new_path)
        UPLOAD_DIR = new_path
        update_data["photo_storage_path"] = PHOTO_STORAGE_PATH
    
    if settings_update.photo_retention_days is not None:
        PHOTO_RETENTION_DAYS = settings_update.photo_retention_days
        update_data["photo_retention_days"] = PHOTO_RETENTION_DAYS
    
    if settings_update.smtp_host is not None:
        SMTP_HOST = settings_update.smtp_host
        update_data["smtp_host"] = SMTP_HOST
    
    if settings_update.smtp_port is not None:
        SMTP_PORT = settings_update.smtp_port
        update_data["smtp_port"] = SMTP_PORT
    
    if settings_update.smtp_user is not None:
        SMTP_USER = settings_update.smtp_user
        update_data["smtp_user"] = SMTP_USER
    
    if settings_update.smtp_password is not None:
        SMTP_PASSWORD = settings_update.smtp_password
        update_data["smtp_password"] = SMTP_PASSWORD
    
    if settings_update.sender_email is not None:
        SENDER_EMAIL = settings_update.sender_email
        update_data["sender_email"] = SENDER_EMAIL
    
    await db.settings.update_one(
        {"id": "app_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    masked = {**update_data}
    if "smtp_password" in masked and masked["smtp_password"]:
        masked["smtp_password"] = "***"
    
    return {"message": "Settings updated", "settings": masked}

@api_router.post("/admin/cleanup-photos")
async def trigger_photo_cleanup(admin: dict = Depends(require_admin)):
    """Manually trigger photo cleanup"""
    deleted_count = await cleanup_expired_photos()
    return {"message": f"Cleaned up {deleted_count} expired photos"}

@api_router.post("/admin/test-email")
async def test_email(admin: dict = Depends(require_admin)):
    """Send a test email to verify SMTP configuration"""
    test_html = """
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #0a0a0a; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #141414; padding: 40px; border-radius: 8px; border: 1px solid #333;">
            <h2 style="color: #d4af37; margin-bottom: 20px;">SkyLine Media - Test Email</h2>
            <p style="color: #fff;">This is a test email from your SkyLine Media SMTP configuration.</p>
            <p style="color: #999;">If you're seeing this, your email setup is working correctly!</p>
        </div>
    </body>
    </html>
    """
    result = await send_email(admin["email"], "SkyLine Media - SMTP Test", test_html)
    if result and result.get("status") != "mocked":
        return {"message": "Test email sent successfully", "status": "sent"}
    elif result and result.get("status") == "mocked":
        return {"message": "Email is currently in mock mode. Configure SMTP settings to send real emails.", "status": "mocked"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send test email. Check your SMTP settings.")


# ==================== ADMIN CMS ENDPOINTS ====================

@api_router.get("/admin/site-content")
async def get_site_content(admin: dict = Depends(require_admin)):
    """Get editable site content"""
    content = await db.site_content.find_one({"id": "site_content"}, {"_id": 0})
    if not content:
        content = {"id": "site_content", "phone": "", "email": "", "main_location": "", "service_areas": [], "travel_fee_note": "", "fleet": []}
    return content

@api_router.put("/admin/site-content")
async def update_site_content(request: Request, admin: dict = Depends(require_admin)):
    """Update editable site content"""
    data = await request.json()
    data["id"] = "site_content"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.site_content.update_one(
        {"id": "site_content"},
        {"$set": data},
        upsert=True
    )
    return {"message": "Site content updated"}

@api_router.get("/site-content")
async def get_public_site_content():
    """Get site content for public pages"""
    content = await db.site_content.find_one({"id": "site_content"}, {"_id": 0})
    if not content:
        content = {
            "phone": "(825) 962-3425",
            "email": "info@skylinemedia.ca",
            "main_location": "Central Alberta",
            "service_areas": [
                {"name": "Central Alberta (Red Deer & Area)", "fee": 0},
                {"name": "Edmonton & Area", "fee": 80},
                {"name": "Calgary & Area", "fee": 80}
            ],
            "travel_fee_note": "$80 CAD extra for Edmonton or Calgary. Other locations can be arranged via booking request.",
            "fleet": []
        }
    return content

@api_router.get("/admin/packages")
async def get_admin_packages(admin: dict = Depends(require_admin)):
    """Get packages for admin editing"""
    custom = await db.custom_packages.find_one({"id": "custom_packages"}, {"_id": 0})
    if custom and custom.get("packages"):
        return custom["packages"]
    return list(PACKAGES.values())

@api_router.put("/admin/packages")
async def update_admin_packages(request: Request, admin: dict = Depends(require_admin)):
    """Update pricing packages"""
    global PACKAGES
    data = await request.json()
    packages_list = data.get("packages", [])
    
    new_packages = {}
    for pkg in packages_list:
        new_packages[pkg["id"]] = pkg
    
    PACKAGES = new_packages
    
    await db.custom_packages.update_one(
        {"id": "custom_packages"},
        {"$set": {"id": "custom_packages", "packages": packages_list, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Packages updated"}



# ==================== ADMIN DASHBOARD ENDPOINTS ====================

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(require_admin)):
    """Get admin dashboard stats"""
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
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "approved_bookings": approved_bookings,
        "confirmed_bookings": confirmed_bookings,
        "completed_bookings": completed_bookings,
        "total_clients": total_clients,
        "total_contacts": total_contacts,
        "new_contacts": new_contacts,
        "total_revenue": total_revenue,
        "currency": "CAD"
    }

@api_router.get("/admin/bookings")
async def get_admin_bookings(
    admin: dict = Depends(require_admin),
    status: Optional[str] = None,
    limit: int = 50
):
    """Get all bookings for admin"""
    query = {}
    if status:
        query["status"] = status
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return bookings

@api_router.get("/admin/bookings/{booking_id}")
async def get_admin_booking(booking_id: str, admin: dict = Depends(require_admin)):
    """Get single booking details"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    photos = await db.client_photos.find({"booking_id": booking_id}, {"_id": 0}).to_list(100)
    booking["photos"] = photos
    
    return booking

@api_router.post("/admin/bookings/{booking_id}/approve")
async def approve_booking(
    booking_id: str,
    approval: BookingApprovalRequest,
    request: Request,
    admin: dict = Depends(require_admin)
):
    """Approve booking and send payment link"""
    from emergentintegrations.payments.stripe.checkout import (
        StripeCheckout, CheckoutSessionRequest
    )
    
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["status"] != "pending":
        raise HTTPException(status_code=400, detail="Booking is not pending approval")
    
    # Update booking with approved details
    update_data = {
        "status": "approved",
        "payment_status": "awaiting_payment",
        "approved_at": datetime.now(timezone.utc).isoformat()
    }
    
    if approval.scheduled_date:
        update_data["scheduled_date"] = approval.scheduled_date
    if approval.scheduled_time:
        update_data["scheduled_time"] = approval.scheduled_time
    if approval.admin_notes:
        update_data["admin_notes"] = approval.admin_notes
    
    # Create Stripe checkout session
    origin_url = str(request.base_url).rstrip('/').replace('/api', '').replace('http://', 'https://')
    if 'localhost' in origin_url or '0.0.0.0' in origin_url:
        origin_url = "https://drone-home-showcase.preview.emergentagent.com"
    
    success_url = f"{origin_url}/booking/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/booking/payment/{booking_id}"
    
    webhook_url = f"{str(request.base_url)}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=float(booking["total_amount"]),
        currency="cad",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "booking_id": booking_id,
            "email": booking["email"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    update_data["payment_session_id"] = session.session_id
    update_data["payment_url"] = session.url
    
    await db.bookings.update_one({"id": booking_id}, {"$set": update_data})
    
    # Create payment transaction record
    payment_doc = PaymentTransaction(
        session_id=session.session_id,
        booking_id=booking_id,
        user_email=booking["email"],
        amount=float(booking["total_amount"]),
        currency="cad",
        metadata={"booking_id": booking_id}
    )
    
    doc = payment_doc.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.payment_transactions.insert_one(doc)
    
    # Send approval email with payment link
    updated_booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    await send_booking_approved_email(updated_booking, session.url)
    
    return {"message": "Booking approved", "payment_url": session.url}

@api_router.put("/admin/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    status_update: BookingStatusUpdate,
    admin: dict = Depends(require_admin)
):
    """Update booking status"""
    update_data = {"status": status_update.status}
    if status_update.admin_notes:
        update_data["admin_notes"] = status_update.admin_notes
    
    result = await db.bookings.update_one(
        {"id": booking_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if status_update.status == "completed":
        booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if booking:
            await send_photos_ready_email(booking)
    
    return {"message": "Status updated"}

@api_router.get("/admin/clients")
async def get_admin_clients(admin: dict = Depends(require_admin), limit: int = 50):
    """Get all clients"""
    clients = await db.users.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    
    for client in clients:
        booking_count = await db.bookings.count_documents({"user_id": client.get("user_id")})
        client["booking_count"] = booking_count
    
    return clients

@api_router.get("/admin/contacts")
async def get_admin_contacts(
    admin: dict = Depends(require_admin),
    status: Optional[str] = None,
    limit: int = 50
):
    """Get all contact requests"""
    query = {}
    if status:
        query["status"] = status
    
    contacts = await db.contacts.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return contacts

@api_router.put("/admin/contacts/{contact_id}/status")
async def update_contact_status(
    contact_id: str,
    status: str,
    admin: dict = Depends(require_admin)
):
    """Update contact request status"""
    result = await db.contacts.update_one(
        {"id": contact_id},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    return {"message": "Status updated"}

# ==================== PHOTO UPLOAD ENDPOINTS ====================

@api_router.post("/admin/bookings/{booking_id}/photos")
async def upload_photo(
    booking_id: str,
    file: UploadFile = File(...),
    title: str = Form(""),
    admin: dict = Depends(require_admin)
):
    """Upload photo for a booking"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    ext = Path(file.filename).suffix or ".jpg"
    photo_id = str(uuid.uuid4())
    filename = f"{photo_id}{ext}"
    
    booking_dir = Path(PHOTO_STORAGE_PATH) / booking_id
    booking_dir.mkdir(exist_ok=True, parents=True)
    
    file_path = booking_dir / filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = file_path.stat().st_size
    
    photo = ClientPhoto(
        id=photo_id,
        user_id=booking.get("user_id", ""),
        booking_id=booking_id,
        title=title or file.filename,
        filename=filename,
        url=f"/api/photos/{booking_id}/{filename}",
        thumbnail_url=f"/api/photos/{booking_id}/{filename}",
        download_url=f"/api/photos/{booking_id}/{filename}/download",
        file_size=file_size
    )
    
    doc = photo.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.client_photos.insert_one(doc)
    
    return {"id": photo_id, "url": photo.url, "message": "Photo uploaded"}

@api_router.delete("/admin/photos/{photo_id}")
async def delete_photo(photo_id: str, admin: dict = Depends(require_admin)):
    """Delete a photo"""
    photo = await db.client_photos.find_one({"id": photo_id}, {"_id": 0})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    file_path = Path(PHOTO_STORAGE_PATH) / photo["booking_id"] / photo["filename"]
    if file_path.exists():
        file_path.unlink()
    
    await db.client_photos.delete_one({"id": photo_id})
    
    return {"message": "Photo deleted"}

@api_router.get("/photos/{booking_id}/{filename}")
async def get_photo(booking_id: str, filename: str):
    """Serve photo file"""
    file_path = Path(PHOTO_STORAGE_PATH) / booking_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Photo not found")
    
    return FileResponse(file_path)

@api_router.get("/photos/{booking_id}/{filename}/download")
async def download_photo(booking_id: str, filename: str, request: Request):
    """Download photo file and track download for 30-day deletion"""
    file_path = Path(PHOTO_STORAGE_PATH) / booking_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Update photo with first download timestamp
    photo = await db.client_photos.find_one(
        {"booking_id": booking_id, "filename": filename},
        {"_id": 0}
    )
    
    if photo and not photo.get("first_downloaded_at"):
        delete_after = datetime.now(timezone.utc) + timedelta(days=PHOTO_RETENTION_DAYS)
        await db.client_photos.update_one(
            {"id": photo["id"]},
            {"$set": {
                "first_downloaded_at": datetime.now(timezone.utc).isoformat(),
                "delete_after": delete_after.isoformat(),
                "download_count": 1
            }}
        )
    elif photo:
        await db.client_photos.update_one(
            {"id": photo["id"]},
            {"$inc": {"download_count": 1}}
        )
    
    return FileResponse(
        file_path,
        filename=filename,
        media_type="application/octet-stream"
    )

# ==================== CLIENT AUTH ENDPOINTS ====================

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token via Emergent Auth"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    async with httpx.AsyncClient() as http_client:
        auth_response = await http_client.get(
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
    
    existing_user = await db.users.find_one({"email": user_email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": user_name, "picture": user_picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": user_email,
            "name": user_name,
            "picture": user_picture,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
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
    """Create a new booking REQUEST (not confirmed yet)"""
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
        service_area=booking.service_area,
        package_id=booking.package_id,
        scheduled_date=booking.scheduled_date,
        scheduled_time=booking.scheduled_time,
        notes=booking.notes,
        total_amount=package["price"],
        status="pending",
        payment_status="pending"
    )
    
    doc = booking_doc.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.bookings.insert_one(doc)
    
    # Send booking request confirmation email
    await send_booking_request_email(doc)
    
    return {
        "id": booking_doc.id,
        "total_amount": package["price"],
        "currency": "CAD",
        "status": "pending",
        "message": "Booking request submitted! We'll review and get back to you within 24 hours."
    }

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

@api_router.get("/bookings/{booking_id}/payment")
async def get_booking_payment_info(booking_id: str):
    """Get booking payment info for payment page"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["status"] != "approved":
        raise HTTPException(status_code=400, detail="Booking not approved for payment")
    
    return {
        "id": booking["id"],
        "name": booking["name"],
        "email": booking["email"],
        "package_id": booking["package_id"],
        "scheduled_date": booking["scheduled_date"],
        "scheduled_time": booking["scheduled_time"],
        "property_address": booking["property_address"],
        "total_amount": booking["total_amount"],
        "payment_url": booking.get("payment_url"),
        "currency": "CAD"
    }

# ==================== PAYMENT ENDPOINTS ====================

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    """Get payment status"""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY)
    status = await stripe_checkout.get_checkout_status(session_id)
    
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": status.status,
            "payment_status": status.payment_status
        }}
    )
    
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
        "currency": "cad"
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
        
        await db.payment_transactions.update_one(
            {"session_id": webhook_response.session_id},
            {"$set": {
                "status": webhook_response.payment_status,
                "payment_status": webhook_response.payment_status
            }}
        )
        
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
        service_area=contact.service_area,
        message=contact.message
    )
    
    doc = contact_doc.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.contacts.insert_one(doc)
    
    html = f"""
    <html>
    <body>
        <h2>New Contact Request - SkyLine Media</h2>
        <p><strong>Name:</strong> {contact.name}</p>
        <p><strong>Email:</strong> {contact.email}</p>
        <p><strong>Phone:</strong> {contact.phone or 'N/A'}</p>
        <p><strong>Service:</strong> {contact.service_type}</p>
        <p><strong>Area:</strong> {contact.service_area.title()}</p>
        <p><strong>Message:</strong> {contact.message}</p>
    </body>
    </html>
    """
    await send_email(ADMIN_EMAIL, f"New Contact Request from {contact.name}", html)
    
    return {"message": "Thank you! We'll get back to you within 24 hours.", "id": contact_doc.id}

# ==================== AI CHAT ENDPOINTS ====================

@api_router.post("/chat")
async def chat(chat_req: ChatRequest):
    """Chat with AI assistant"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    history = await db.chat_messages.find(
        {"session_id": chat_req.session_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    
    user_msg = ChatMessage(
        session_id=chat_req.session_id,
        role="user",
        content=chat_req.message
    )
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

    chat = LlmChat(
        api_key=ANTHROPIC_API_KEY,
        session_id=chat_req.session_id,
        system_message=system_message
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    
    user_message = UserMessage(text=chat_req.message)
    response = await chat.send_message(user_message)
    
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
    """Get photos for authenticated client with deletion warning"""
    user = await require_auth(request)
    photos = await db.client_photos.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Add days remaining for each photo
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
            "title": "Modern Calgary Estate",
            "description": "Stunning aerial views showcasing luxury property in Calgary's prestigious neighborhoods",
            "category": "residential",
            "image_url": "https://images.unsplash.com/photo-1606586243531-92e25ac0c0aa?w=1200",
            "before_image_url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
            "after_image_url": "https://images.unsplash.com/photo-1606586243531-92e25ac0c0aa?w=800",
            "location": "Calgary, AB",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Downtown Edmonton Commercial",
            "description": "Multi-story commercial building aerial photography for marketing",
            "category": "commercial",
            "image_url": "https://images.unsplash.com/photo-1669003153246-cb591207e66e?w=1200",
            "location": "Edmonton, AB",
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
            "location": "Calgary, AB",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Alberta Ranch Survey",
            "description": "Comprehensive aerial mapping for 500-acre ranch property",
            "category": "land",
            "image_url": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200",
            "location": "Rural Alberta",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "New Development Progress",
            "description": "Construction progress documentation for residential development",
            "category": "construction",
            "image_url": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200",
            "location": "Edmonton, AB",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Twilight Property Showcase",
            "description": "Premium twilight aerial photography for luxury listing",
            "category": "residential",
            "image_url": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200",
            "location": "Calgary, AB",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.portfolio.delete_many({})
    await db.portfolio.insert_many(portfolio_items)
    
    return {"message": f"Seeded {len(portfolio_items)} portfolio items"}

# ==================== BASIC ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "SkyLine Media API", "version": "2.0", "currency": "CAD"}

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

# ==================== STARTUP EVENT ====================

async def photo_cleanup_scheduler():
    """Background task that runs photo cleanup every 6 hours"""
    while True:
        try:
            await asyncio.sleep(6 * 60 * 60)  # 6 hours
            deleted = await cleanup_expired_photos()
            if deleted > 0:
                logger.info(f"Scheduled cleanup: deleted {deleted} expired photos")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Photo cleanup scheduler error: {e}")

@app.on_event("startup")
async def startup_event():
    """Seed admin user and settings on startup"""
    # Admin user
    existing_admin = await db.admins.find_one({"email": ADMIN_EMAIL.lower()}, {"_id": 0})
    
    if existing_admin is None:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL.lower(),
            "name": "Admin",
            "role": "admin",
            "password_hash": hash_password(ADMIN_PASSWORD),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admins.insert_one(admin_doc)
        logger.info(f"Admin user created: {ADMIN_EMAIL}")
    else:
        if not verify_password(ADMIN_PASSWORD, existing_admin["password_hash"]):
            await db.admins.update_one(
                {"email": ADMIN_EMAIL.lower()},
                {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}}
            )
            logger.info("Admin password updated")
    
    # Settings
    existing_settings = await db.settings.find_one({"id": "app_settings"})
    if not existing_settings:
        await db.settings.insert_one({
            "id": "app_settings",
            "photo_storage_path": PHOTO_STORAGE_PATH,
            "photo_retention_days": PHOTO_RETENTION_DAYS,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.admins.create_index("email", unique=True)
    
    # Run initial photo cleanup and start scheduler
    await cleanup_expired_photos()
    asyncio.create_task(photo_cleanup_scheduler())
    
    # Seed site content defaults if not present
    existing_content = await db.site_content.find_one({"id": "site_content"})
    if not existing_content:
        await db.site_content.insert_one({
            "id": "site_content",
            "phone": "(825) 962-3425",
            "email": "info@skylinemedia.ca",
            "main_location": "Central Alberta",
            "service_areas": [
                {"name": "Central Alberta (Red Deer & Area)", "fee": 0},
                {"name": "Edmonton & Area", "fee": 80},
                {"name": "Calgary & Area", "fee": 80}
            ],
            "travel_fee_note": "$80 CAD extra for Edmonton or Calgary. Other locations can be arranged via booking request.",
            "fleet": [
                {"name": "DJI Mavic 3 Pro", "description": "Flagship tri-camera system with 4/3 CMOS Hasselblad, 5.1K video & 46-min flight time", "image": "/compliance-image.png"},
                {"name": "DJI Air 3", "description": "Dual-camera powerhouse with 48MP photos, 4K/100fps video & 46-min flight time", "image": "/air3-image.png"},
                {"name": "DJI Avata 2", "description": "Immersive FPV drone with 4K/60fps, ultra-wide 155° FOV & motion controller", "image": "/avata2-image.png"},
                {"name": "BetaFPV Pavo 20 Pro", "description": "Indoor FPV drone with 4K camera, designed for smooth interior fly-throughs", "image": ""}
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Load custom packages if saved
    custom_pkgs = await db.custom_packages.find_one({"id": "custom_packages"}, {"_id": 0})
    if custom_pkgs and custom_pkgs.get("packages"):
        global PACKAGES
        PACKAGES = {pkg["id"]: pkg for pkg in custom_pkgs["packages"]}
        logger.info("Loaded custom packages from database")
    
    logger.info("Startup complete")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
