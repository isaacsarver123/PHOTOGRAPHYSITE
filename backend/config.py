import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']

# API Keys
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')

# JWT
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-change-me')
JWT_ALGORITHM = "HS256"
CLIENT_JWT_SECRET = os.environ.get('JWT_SECRET', os.environ.get('ADMIN_SECRET', 'fallback_secret_change_me'))

# Admin
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

# Email
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@skylinemedia.ca')
SMTP_HOST = os.environ.get('SMTP_HOST', '')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')

# Photo Storage
PHOTO_STORAGE_PATH = os.environ.get('PHOTO_STORAGE_PATH', str(ROOT_DIR / 'uploads'))
PHOTO_RETENTION_DAYS = int(os.environ.get('PHOTO_RETENTION_DAYS', '30'))
UPLOAD_DIR = Path(PHOTO_STORAGE_PATH)
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

# Pricing Packages (CAD) - mutable, loaded from DB on startup
PACKAGES = {
    "quick_aerial": {
        "id": "quick_aerial",
        "name": "Quick Aerial",
        "price": 199.00,
        "currency": "CAD",
        "description": "Best for small listings, quick flips, and agents testing our service",
        "features": [
            "8-12 aerial photos",
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
