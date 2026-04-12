from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid


# ==================== DB MODELS ====================

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
    service_area: str = "calgary"
    package_id: str
    scheduled_date: str
    scheduled_time: str
    notes: Optional[str] = None
    status: str = "pending"
    payment_status: str = "pending"
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

class ClientLoginRequest(BaseModel):
    email: EmailStr
    password: str

class ClientChangePassword(BaseModel):
    current_password: str
    new_password: str

class ClientUpdateProfile(BaseModel):
    name: Optional[str] = None
