from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
import logging
import asyncio
from datetime import datetime, timezone
import uuid

import config
from database import db, client as mongo_client
from auth import hash_password, verify_password

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create the main app and API router
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Import and include all route modules
from routes.admin_auth import router as admin_auth_router
from routes.admin_bookings import router as admin_bookings_router
from routes.admin_cms import router as admin_cms_router
from routes.client import router as client_router
from routes.public import router as public_router, cleanup_expired_photos
from routes.payments import router as payments_router

api_router.include_router(admin_auth_router)
api_router.include_router(admin_bookings_router)
api_router.include_router(admin_cms_router)
api_router.include_router(client_router)
api_router.include_router(public_router)
api_router.include_router(payments_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== STARTUP / SHUTDOWN ====================

async def photo_cleanup_scheduler():
    while True:
        try:
            await asyncio.sleep(6 * 60 * 60)
            deleted = await cleanup_expired_photos()
            if deleted > 0:
                logger.info(f"Scheduled cleanup: deleted {deleted} expired photos")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Photo cleanup scheduler error: {e}")


@app.on_event("startup")
async def startup_event():
    # Seed admin user
    existing_admin = await db.admins.find_one({"email": config.ADMIN_EMAIL.lower()}, {"_id": 0})
    if existing_admin is None:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": config.ADMIN_EMAIL.lower(),
            "name": "Admin",
            "role": "admin",
            "password_hash": hash_password(config.ADMIN_PASSWORD),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admins.insert_one(admin_doc)
        logger.info(f"Admin user created: {config.ADMIN_EMAIL}")
    else:
        if not verify_password(config.ADMIN_PASSWORD, existing_admin["password_hash"]):
            await db.admins.update_one(
                {"email": config.ADMIN_EMAIL.lower()},
                {"$set": {"password_hash": hash_password(config.ADMIN_PASSWORD)}}
            )
            logger.info("Admin password updated")

    # Seed settings
    existing_settings = await db.settings.find_one({"id": "app_settings"})
    if not existing_settings:
        await db.settings.insert_one({
            "id": "app_settings",
            "photo_storage_path": config.PHOTO_STORAGE_PATH,
            "photo_retention_days": config.PHOTO_RETENTION_DAYS,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.admins.create_index("email", unique=True)

    # Run initial cleanup and start scheduler
    await cleanup_expired_photos()
    asyncio.create_task(photo_cleanup_scheduler())

    # Seed site content defaults
    existing_content = await db.site_content.find_one({"id": "site_content"})
    if not existing_content:
        await db.site_content.insert_one({
            "id": "site_content",
            "phone": "(825) 962-3425", "email": "info@skylinemedia.net",
            "main_location": "Central Alberta",
            "service_areas": [
                {"name": "Central Alberta (Red Deer & Area)", "fee": 0},
                {"name": "Edmonton & Area", "fee": 80},
                {"name": "Calgary & Area", "fee": 80}
            ],
            "travel_fee_note": "$80 CAD extra for Edmonton or Calgary.",
            "fleet": [
                {"name": "DJI Mavic 3 Pro", "description": "Flagship tri-camera system with 4/3 CMOS Hasselblad, 5.1K video & 46-min flight time", "image": "/compliance-image.png"},
                {"name": "DJI Air 3", "description": "Dual-camera powerhouse with 48MP photos, 4K/100fps video & 46-min flight time", "image": "/air3-image.png"},
                {"name": "DJI Avata 2", "description": "Immersive FPV drone with 4K/60fps, ultra-wide 155 FOV & motion controller", "image": "/avata2-image.png"},
                {"name": "BetaFPV Pavo 20 Pro (DJI O4 Pro)", "description": "Indoor FPV drone with 4K camera, designed for smooth interior fly-throughs", "image": ""}
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        })

    # Load custom packages
    custom_pkgs = await db.custom_packages.find_one({"id": "custom_packages"}, {"_id": 0})
    if custom_pkgs and custom_pkgs.get("packages"):
        config.PACKAGES = {pkg["id"]: pkg for pkg in custom_pkgs["packages"]}
        logger.info("Loaded custom packages from database")

    logger.info("Startup complete")


@app.on_event("shutdown")
async def shutdown_db_client():
    mongo_client.close()
