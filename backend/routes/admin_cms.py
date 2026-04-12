from fastapi import APIRouter, Request, Depends, HTTPException
from datetime import datetime, timezone
import uuid

import config
from database import db
from auth import require_admin

router = APIRouter()

# ==================== CMS DEFAULTS ====================

DEFAULTS = {
    "hero": {
        "headline": "Aerial Photography\nFor Real Estate",
        "subtitle": "Professional drone photography and videography that makes your property listings stand out. Serving Central Alberta.",
        "cta_text": "Book a Shoot",
        "cta_link": "/booking",
        "background_image": "https://images.unsplash.com/photo-1606586243531-92e25ac0c0aa?w=1920&q=80"
    },
    "stats": [
        {"value": "500+", "label": "Properties Shot"},
        {"value": "50+", "label": "Real Estate Agents"},
        {"value": "24hr", "label": "Average Delivery"},
        {"value": "100%", "label": "Client Satisfaction"}
    ],
    "about": {
        "tagline": "Central Alberta & Red Deer",
        "headline": "Aerial Perspectives That\nSell Properties",
        "description": "Serving Central Alberta, Red Deer, and surrounding areas. We deliver exceptional aerial photography that helps real estate professionals stand out in a competitive market. Our fleet of DJI drones captures every angle with precision and artistry. Edmonton and Calgary available for an additional $80 CAD travel fee.",
        "compliance_title": "Transport Canada Compliant",
        "compliance_text": "All our pilots hold Transport Canada Advanced Operations certificates, maintaining full compliance with Canadian aviation regulations.",
        "compliance_image": "/compliance-image.png",
        "about_page_hero_image": "/about-pilot.png",
        "about_page_equipment_image": "/about-equipment.jpeg",
        "certifications": ["Transport Canada Advanced Operations", "Liability Insurance", "Part 107 Equivalent"],
        "difference_items": [
            {"title": "Transport Canada Certified", "description": "All our pilots hold Transport Canada Advanced Operations certificates and maintain full liability insurance."},
            {"title": "Premium Equipment", "description": "We use only the latest DJI and FPV drones including the Mavic 3 Pro, Air 3, Avata 2, and Pavo 20 Pro for indoor flights."},
            {"title": "Local Expertise", "description": "Based in Central Alberta, we know the area intimately and understand what makes Alberta properties special."}
        ],
        "service_cities": ["Red Deer", "Lacombe", "Sylvan Lake", "Blackfalds", "Ponoka", "Innisfail", "Olds", "Penhold", "Edmonton (+$80)", "Calgary (+$80)", "Stettler", "Rocky Mountain House"]
    },
    "faq": [
        {"question": "What areas do you serve?", "answer": "We're based in Central Alberta (Red Deer area) with no travel fee. Edmonton and Calgary are available for an additional $80 CAD travel fee. Other locations can be arranged via booking request."},
        {"question": "How does the booking approval work?", "answer": "After you submit a request, we review availability and confirm details. Once approved, you'll receive a payment link via email."},
        {"question": "Do you offer indoor FPV fly-throughs?", "answer": "Yes! Our FPV Showcase package includes a full indoor fly-through using our BetaFPV Pavo 20 Pro drone. The Aerial Plus package also includes an optional simple indoor pass."},
        {"question": "What if the weather is bad?", "answer": "We monitor weather closely and will reschedule free of charge if conditions are unsafe for flying."},
        {"question": "How long are photos available?", "answer": "Photos are available for download for 30 days after your first download. Make sure to save them!"}
    ],
    "addons": [
        {"name": "Twilight Photography", "price": 149, "description": "Golden hour & sunset shots"},
        {"name": "Rush Delivery", "price": 99, "description": "Same-day turnaround"},
        {"name": "Social Media Package", "price": 79, "description": "Vertical reels & optimized content"},
        {"name": "Travel Fee (Edm/Cgy)", "price": 80, "description": "For Edmonton or Calgary area shoots"}
    ],
    "contact": {
        "phone": "(825) 962-3425",
        "email": "info@skylinemedia.ca",
        "address": "Central Alberta, Red Deer & Area",
        "hours": "Mon-Fri: 8am-6pm, Sat: 9am-4pm, Sun: By appointment",
        "response_time": "We typically respond within 2-4 hours during business hours."
    }
}


async def get_cms(collection_name: str, default_key: str):
    data = await db.cms.find_one({"id": collection_name}, {"_id": 0})
    if data and data.get("content"):
        return data["content"]
    return DEFAULTS.get(default_key, {})


async def set_cms(collection_name: str, content):
    await db.cms.update_one(
        {"id": collection_name},
        {"$set": {"id": collection_name, "content": content, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )


# ==================== PUBLIC CMS ENDPOINTS ====================

@router.get("/cms/hero")
async def get_hero():
    return await get_cms("hero", "hero")

@router.get("/cms/stats")
async def get_stats():
    return await get_cms("stats", "stats")

@router.get("/cms/about")
async def get_about():
    return await get_cms("about", "about")

@router.get("/cms/faq")
async def get_faq():
    return await get_cms("faq", "faq")

@router.get("/cms/addons")
async def get_addons():
    return await get_cms("addons", "addons")

@router.get("/cms/contact")
async def get_contact():
    return await get_cms("contact", "contact")


# ==================== ADMIN CMS ENDPOINTS ====================

@router.get("/admin/cms/{section}")
async def admin_get_cms(section: str, admin: dict = Depends(require_admin)):
    if section not in DEFAULTS:
        raise HTTPException(status_code=404, detail="Section not found")
    return await get_cms(section, section)

@router.put("/admin/cms/{section}")
async def admin_update_cms(section: str, request: Request, admin: dict = Depends(require_admin)):
    if section not in DEFAULTS:
        raise HTTPException(status_code=404, detail="Section not found")
    data = await request.json()
    content = data.get("content", data)
    await set_cms(section, content)
    return {"message": f"{section} content updated"}


# ==================== SITE CONTENT ====================

@router.get("/admin/site-content")
async def get_site_content(admin: dict = Depends(require_admin)):
    content = await db.site_content.find_one({"id": "site_content"}, {"_id": 0})
    if not content:
        content = {"id": "site_content", "phone": "", "email": "", "main_location": "", "service_areas": [], "travel_fee_note": "", "fleet": []}
    return content

@router.put("/admin/site-content")
async def update_site_content(request: Request, admin: dict = Depends(require_admin)):
    data = await request.json()
    data["id"] = "site_content"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.site_content.update_one({"id": "site_content"}, {"$set": data}, upsert=True)
    return {"message": "Site content updated"}

@router.get("/site-content")
async def get_public_site_content():
    content = await db.site_content.find_one({"id": "site_content"}, {"_id": 0})
    if not content:
        content = {
            "phone": "(825) 962-3425", "email": "info@skylinemedia.ca",
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


# ==================== PACKAGES ====================

@router.get("/admin/packages")
async def get_admin_packages(admin: dict = Depends(require_admin)):
    custom = await db.custom_packages.find_one({"id": "custom_packages"}, {"_id": 0})
    if custom and custom.get("packages"):
        return custom["packages"]
    return list(config.PACKAGES.values())

@router.put("/admin/packages")
async def update_admin_packages(request: Request, admin: dict = Depends(require_admin)):
    data = await request.json()
    packages_list = data.get("packages", [])
    new_packages = {}
    for pkg in packages_list:
        new_packages[pkg["id"]] = pkg
    config.PACKAGES = new_packages
    await db.custom_packages.update_one(
        {"id": "custom_packages"},
        {"$set": {"id": "custom_packages", "packages": packages_list, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Packages updated"}


# ==================== PORTFOLIO ====================

@router.get("/admin/portfolio")
async def get_admin_portfolio(admin: dict = Depends(require_admin)):
    items = await db.portfolio.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items

@router.post("/admin/portfolio")
async def create_portfolio_item(request: Request, admin: dict = Depends(require_admin)):
    data = await request.json()
    item = {
        "id": str(uuid.uuid4()),
        "title": data.get("title", ""), "description": data.get("description", ""),
        "category": data.get("category", "residential"), "image_url": data.get("image_url", ""),
        "before_image_url": data.get("before_image_url", ""),
        "after_image_url": data.get("after_image_url", ""),
        "location": data.get("location", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.portfolio.insert_one(item)
    item.pop("_id", None)
    return item

@router.put("/admin/portfolio/{item_id}")
async def update_portfolio_item(item_id: str, request: Request, admin: dict = Depends(require_admin)):
    data = await request.json()
    data.pop("_id", None)
    data.pop("id", None)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.portfolio.update_one({"id": item_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Portfolio item updated"}

@router.delete("/admin/portfolio/{item_id}")
async def delete_portfolio_item(item_id: str, admin: dict = Depends(require_admin)):
    result = await db.portfolio.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Portfolio item deleted"}


# ==================== HOME SERVICES ====================

DEFAULT_HOME_SERVICES = [
    {"title": "Residential", "description": "Showcase homes with stunning aerial perspectives", "image": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80", "span": "md:col-span-7"},
    {"title": "Commercial", "description": "Professional imagery for commercial properties", "image": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80", "span": "md:col-span-5"},
    {"title": "Land & Development", "description": "Aerial mapping and survey photography", "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80", "span": "md:col-span-5"},
    {"title": "Construction Progress", "description": "Document your build with regular aerial updates", "image": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80", "span": "md:col-span-7"}
]

@router.get("/admin/home-services")
async def get_admin_home_services(admin: dict = Depends(require_admin)):
    data = await db.home_services.find_one({"id": "home_services"}, {"_id": 0})
    if not data or not data.get("services"):
        return DEFAULT_HOME_SERVICES
    return data["services"]

@router.put("/admin/home-services")
async def update_home_services(request: Request, admin: dict = Depends(require_admin)):
    data = await request.json()
    services_list = data.get("services", [])
    await db.home_services.update_one(
        {"id": "home_services"},
        {"$set": {"id": "home_services", "services": services_list, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Home services updated"}

@router.get("/home-services")
async def get_public_home_services():
    data = await db.home_services.find_one({"id": "home_services"}, {"_id": 0})
    if not data or not data.get("services"):
        return DEFAULT_HOME_SERVICES
    return data["services"]
