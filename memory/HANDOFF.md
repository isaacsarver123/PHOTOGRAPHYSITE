# ================================================================================
# SKYLINE MEDIA — COMPLETE AI HANDOFF DOCUMENT
# ================================================================================
# Paste this ENTIRE document into ChatGPT, Claude, or any AI to continue working
# on this project. It contains everything: architecture, every file, every API
# endpoint, every database collection, credentials, server setup, and known issues.
# ================================================================================

# ================================================================================
# SECTION 1: WHAT THIS IS
# ================================================================================

SkyLine Media is a full-stack web application for a drone aerial photography
business specializing in DJI drones for real estate. It is a LIVE production
site running at https://skylinemedia.net

The business is based in Central Alberta (Red Deer & Area), Canada. All prices
are in CAD. The phone number is (825) 962-3425. The email is info@skylinemedia.net.
The brand name is "SkyLine Media" with the domain skylinemedia.net (hosted on GoDaddy,
DNS proxied through Cloudflare for free SSL).

There are three pricing packages:
- Quick Aerial: $199 CAD — 8-12 aerial photos, basic color correction, 48hr delivery
- Aerial Plus: $299 CAD (most popular) — 15-20 photos, 1 video, enhanced grading, 24-48hr
- FPV Showcase: $649 CAD — 15 photos, video, indoor FPV fly-through, social media cut, 24hr

The drone fleet is:
- DJI Mavic 3 Pro (flagship, 5.1K video)
- DJI Air 3 (dual-camera, 48MP)
- DJI Avata 2 (FPV, 4K/60fps)
- BetaFPV Pavo 20 Pro with DJI O4 Pro (indoor FPV fly-throughs)

Travel fees: No fee for Central Alberta (Red Deer area). +$80 CAD for Edmonton or Calgary.

# ================================================================================
# SECTION 2: TECH STACK
# ================================================================================

Frontend: React 18, Tailwind CSS, Framer Motion, Shadcn/UI, React Router, Phosphor Icons
Backend: FastAPI (Python 3.12), Motor (async MongoDB driver), Pydantic v2
Database: MongoDB (local, mongodb://localhost:27017, database: skyline_media)
Payments: Stripe (Prebuilt Checkout via emergentintegrations library)
AI Chat: Claude Sonnet 4.5 (via emergentintegrations library with Anthropic key)
Email: Resend (transactional email service, domain verified: skylinemedia.net)
Auth: Custom JWT with bcrypt — NO Google OAuth (explicitly removed by owner)
Server: Ubuntu 24 LTS, Nginx reverse proxy, systemd service, Cloudflare DNS/SSL

# ================================================================================
# SECTION 3: SERVER SETUP & DEPLOYMENT
# ================================================================================

Server: Ubuntu 24 LTS at local IP 10.0.0.190, public IP 162.157.219.183
User: deal
Other apps running: OpenClaw on port 18789, another uvicorn app on port 8001, node app on port 3000
SkyLine uses: port 8002 (backend), Nginx serves static frontend build

File locations on server:
- App root: /opt/PHOTOGRAPHYSITE/
- Backend: /opt/PHOTOGRAPHYSITE/backend/
- Frontend: /opt/PHOTOGRAPHYSITE/frontend/
- Frontend build: /opt/PHOTOGRAPHYSITE/frontend/build/
- Photo storage: /mnt/photos/ (external 931GB drive mounted)
- Backend venv: /opt/PHOTOGRAPHYSITE/backend/venv/
- Backend .env: /opt/PHOTOGRAPHYSITE/backend/.env
- Nginx config: /etc/nginx/sites-available/skylinemedia
- Systemd service: /etc/systemd/system/skyline-backend.service
- SSL: Managed by Cloudflare (no local certs needed)

Node version management: nvm installed for user 'deal'
- Node 22 is default (needed for OpenClaw)
- Node 20+ needed for SkyLine frontend build (react-router-dom requires it)
- Node 18 was the original, but too old for react-router-dom v7

Key server commands:
- Restart backend: sudo systemctl restart skyline-backend
- View backend logs: sudo journalctl -u skyline-backend -f
- Rebuild frontend: cd /opt/PHOTOGRAPHYSITE/frontend && nvm use 22 && yarn build
- Test backend: curl http://127.0.0.1:8002/api/health
- Reload nginx: sudo systemctl reload nginx
- Check running services: sudo ss -tulpn | grep -E "8002|8001|3000|nginx|mongo"

Nginx config serves:
- / → static files from /opt/PHOTOGRAPHYSITE/frontend/build/ (React SPA with try_files fallback)
- /api/ → proxy_pass to http://127.0.0.1:8002/api/
- client_max_body_size 50M for photo uploads
- proxy_read_timeout 120s for AI chat responses

Systemd service (/etc/systemd/system/skyline-backend.service):
- Runs as user 'deal'
- WorkingDirectory: /opt/PHOTOGRAPHYSITE/backend
- EnvironmentFile: /opt/PHOTOGRAPHYSITE/backend/.env
- ExecStart: /opt/PHOTOGRAPHYSITE/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8002
- Restart=always, RestartSec=5

DNS: GoDaddy domain → Cloudflare nameservers → Cloudflare proxies to server IP
SSL: Cloudflare "Full" mode provides free HTTPS

# ================================================================================
# SECTION 4: CREDENTIALS & ENVIRONMENT VARIABLES
# ================================================================================

Admin login: isaacsarver100@gmail.com / Isabella0116!
Admin URL: https://skylinemedia.net/admin

Client login: clients get auto-created accounts when they submit bookings
Client URL: https://skylinemedia.net/login
Test client: testclient@example.com / NewPass456

Backend .env file (/opt/PHOTOGRAPHYSITE/backend/.env):
  MONGO_URL=mongodb://localhost:27017
  DB_NAME=skyline_media
  CORS_ORIGINS=https://skylinemedia.net,https://www.skylinemedia.net
  ANTHROPIC_API_KEY=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
  STRIPE_API_KEY=<EXPIRED — NEEDS NEW KEY FROM dashboard.stripe.com/apikeys>
  JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
  ADMIN_EMAIL=isaacsarver100@gmail.com
  ADMIN_PASSWORD=Isabella0116!
  RESEND_API_KEY=re_KgW3abYN_HmNc9kjsn6xHmTMpBSecZYVY
  SENDER_EMAIL=noreply@skylinemedia.net
  PHOTO_STORAGE_PATH=/mnt/photos
  PHOTO_RETENTION_DAYS=30
  SMTP_HOST=
  SMTP_PORT=587
  SMTP_USER=
  SMTP_PASSWORD=

Frontend .env (/opt/PHOTOGRAPHYSITE/frontend/.env):
  REACT_APP_BACKEND_URL=https://skylinemedia.net

IMPORTANT: The Stripe API key is EXPIRED. User needs to generate a new one at
https://dashboard.stripe.com/apikeys and update it in the .env file, then
restart the backend service.

# ================================================================================
# SECTION 5: COMPLETE PROJECT STRUCTURE
# ================================================================================

/opt/PHOTOGRAPHYSITE/
├── README.md                    # Full deployment guide (Windows/Linux/Docker)
├── DEPLOY_GUIDE.sh              # Step-by-step server setup commands
│
├── backend/                     # FastAPI backend (Python 3.12)
│   ├── .env                     # Environment variables (NEVER commit to git)
│   ├── .env.example             # Template with all vars documented
│   ├── requirements.txt         # Python dependencies (pip freeze output)
│   ├── server.py                # Main app: FastAPI setup, startup, middleware (136 lines)
│   ├── config.py                # All env vars, package defaults, mutable state (88 lines)
│   ├── database.py              # MongoDB connection via Motor (5 lines)
│   ├── models.py                # All Pydantic models: DB + request/response (190 lines)
│   ├── auth.py                  # JWT, bcrypt, auth dependencies, helpers (116 lines)
│   ├── email_service.py         # Email via SMTP, Resend, or mock fallback (125 lines)
│   ├── uploads/                 # Default photo storage (or /mnt/photos on server)
│   ├── venv/                    # Python virtual environment
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── admin_auth.py        # Admin login/logout, settings, stats, clients, contacts, favicon (248 lines)
│   │   ├── admin_bookings.py    # Booking CRUD, approve, photos upload/serve/download/delete (218 lines)
│   │   ├── admin_cms.py         # CMS sections, portfolio CRUD, packages, home services, site content (261 lines)
│   │   ├── client.py            # Client auth, profile, password change, photos, stats (115 lines)
│   │   ├── public.py            # Public endpoints: bookings, packages, portfolio, contact, AI chat, health (308 lines)
│   │   └── payments.py          # Stripe checkout status, webhook (52 lines)
│   └── tests/                   # Test files from development iterations
│
├── frontend/                    # React 18 frontend
│   ├── .env                     # REACT_APP_BACKEND_URL
│   ├── package.json             # Dependencies
│   ├── yarn.lock
│   ├── craco.config.js          # Build config
│   ├── tailwind.config.js       # Tailwind CSS config
│   ├── public/
│   │   ├── index.html           # HTML template: title, favicon, meta tags (NO Emergent badge)
│   │   ├── favicon.ico          # Site favicon (uploadable from admin)
│   │   ├── favicon-32x32.png
│   │   ├── apple-touch-icon.png
│   │   ├── favicon.png          # Source favicon image
│   │   ├── logo.png             # SkyLine Media logo
│   │   ├── about-pilot.png      # About page hero image
│   │   ├── about-equipment.jpeg # About page equipment image
│   │   ├── compliance-image.png # Mavic 3 Pro image
│   │   ├── air3-image.png       # DJI Air 3 image
│   │   ├── avata2-image.png     # DJI Avata 2 image
│   │   └── equipment-image.png  # Equipment section image
│   ├── build/                   # Production build (served by Nginx)
│   └── src/
│       ├── index.js             # React entry point
│       ├── App.js               # React Router configuration (61 lines)
│       ├── lib/
│       │   └── utils.js         # Tailwind merge utility
│       ├── context/
│       │   └── AuthContext.js    # JWT auth context for admin + client (65 lines)
│       ├── components/
│       │   ├── Header.js        # Navbar with logo, nav links, login button (140 lines)
│       │   ├── Footer.js        # Footer with contact info, links (83 lines)
│       │   ├── ChatWidget.js    # AI chat floating widget - Claude Sonnet 4.5 (156 lines)
│       │   ├── BeforeAfterSlider.js # Portfolio before/after comparison
│       │   └── ui/              # Shadcn/UI components (accordion, button, calendar, etc.)
│       └── pages/
│           ├── Home.js          # Landing page: hero, stats, services, portfolio, FAQ (363 lines)
│           ├── Services.js      # Services page with detailed cards (265 lines)
│           ├── Portfolio.js     # Gallery with category filters + before/after (292 lines)
│           ├── Pricing.js       # 3 pricing tiers + add-ons (293 lines)
│           ├── About.js         # Company story, team, fleet, certifications (274 lines)
│           ├── Contact.js       # Contact form + info (264 lines)
│           ├── Booking.js       # Multi-step booking: package→details→review (646 lines)
│           ├── BookingSuccess.js # Payment success page with status polling (157 lines)
│           ├── AdminLogin.js    # Admin login page at /admin (104 lines)
│           ├── ClientLogin.js   # Client login page at /login (104 lines)
│           ├── Dashboard.js     # Client dashboard: bookings, photos, profile (570 lines)
│           ├── AdminDashboard.js # Admin layout shell + Portfolio, HomeServices, Content, Packages, Settings (300 lines)
│           └── admin/           # Extracted admin sub-components
│               ├── helpers.js   # Shared: API URL, auth headers, StatusBadge (31 lines)
│               ├── index.js     # Barrel exports
│               ├── AdminOverview.js   # Dashboard stats + recent bookings table (105 lines)
│               ├── AdminBookings.js   # Booking list, filters, detail panel, approve, delete (196 lines)
│               ├── AdminClients.js    # Client table with delete (76 lines)
│               ├── AdminContacts.js   # Contact requests with status management (62 lines)
│               └── AdminCMSEditor.js  # Tabbed CMS: Hero, Stats, About, FAQ, Addons, Contact (137 lines)

# ================================================================================
# SECTION 6: ALL API ENDPOINTS (every single one)
# ================================================================================

All routes are prefixed with /api/ by the FastAPI router.
Admin routes require Bearer token in Authorization header.
Client routes require client JWT token.

--- PUBLIC ENDPOINTS (no auth) ---

GET  /api/                          → API info
GET  /api/health                    → {"status": "healthy"}
GET  /api/packages                  → List all 3 pricing packages
GET  /api/packages/{id}             → Single package details
GET  /api/portfolio                 → List portfolio items (optional ?category=)
GET  /api/portfolio/{id}            → Single portfolio item
GET  /api/cms/hero                  → Hero section CMS content
GET  /api/cms/stats                 → Stats bar CMS content
GET  /api/cms/about                 → About section CMS content
GET  /api/cms/faq                   → FAQ CMS content
GET  /api/cms/addons                → Add-ons CMS content
GET  /api/cms/contact               → Contact info CMS content
GET  /api/home-services             → "What We Offer" cards
GET  /api/site-content              → Phone, email, service areas, fleet
POST /api/bookings                  → Create booking (auto-creates client account)
GET  /api/bookings/{id}             → Get booking details
GET  /api/bookings/{id}/payment     → Get payment info for approved booking
POST /api/contact                   → Submit contact form
POST /api/chat                      → AI chat message {session_id, message}
GET  /api/chat/{session_id}         → Chat history
POST /api/seed-portfolio            → Seed sample portfolio items
GET  /api/photos/{booking_id}/{filename}          → Serve photo file
GET  /api/photos/{booking_id}/{filename}/download  → Download photo (starts 30-day timer)

--- ADMIN ENDPOINTS (require admin JWT) ---

POST   /api/admin/login              → Admin login → returns JWT token
GET    /api/admin/me                 → Current admin info
POST   /api/admin/logout             → Clear admin cookie
GET    /api/admin/stats              → Dashboard stats (bookings, revenue, clients, contacts)
GET    /api/admin/settings           → Get app settings
PUT    /api/admin/settings           → Update settings (storage path, SMTP, retention)
POST   /api/admin/test-email         → Send test email to admin
POST   /api/admin/favicon            → Upload new favicon (PNG/JPG/ICO/SVG)
GET    /api/admin/favicon/preview    → Get current favicon file
GET    /api/admin/bookings           → List bookings (optional ?status=pending)
GET    /api/admin/bookings/{id}      → Booking details + photos
POST   /api/admin/bookings/{id}/approve → Approve booking → creates Stripe checkout → emails client
PUT    /api/admin/bookings/{id}/status  → Update booking status
DELETE /api/admin/bookings/{id}      → Delete booking + associated photos
POST   /api/admin/bookings/{id}/photos → Upload photo for client
DELETE /api/admin/photos/{id}        → Delete a photo
POST   /api/admin/cleanup-photos     → Manually trigger expired photo cleanup
GET    /api/admin/clients            → List all clients with booking counts
DELETE /api/admin/clients/{user_id}  → Delete client + all their bookings + photos
GET    /api/admin/contacts           → List contact submissions (optional ?status=)
PUT    /api/admin/contacts/{id}/status?status=X → Update contact status
GET    /api/admin/cms/{section}      → Get CMS section for editing
PUT    /api/admin/cms/{section}      → Update CMS section
GET    /api/admin/site-content       → Get site content for editing
PUT    /api/admin/site-content       → Update site content
GET    /api/admin/packages           → Get packages for editing
PUT    /api/admin/packages           → Update all packages
GET    /api/admin/portfolio          → List portfolio for admin
POST   /api/admin/portfolio          → Create portfolio item
PUT    /api/admin/portfolio/{id}     → Update portfolio item
DELETE /api/admin/portfolio/{id}     → Delete portfolio item
GET    /api/admin/home-services      → Get home service cards for editing
PUT    /api/admin/home-services      → Update home service cards

--- CLIENT ENDPOINTS (require client JWT) ---

POST /api/auth/login                → Client login → returns JWT
GET  /api/auth/me                   → Current client info
POST /api/auth/logout               → Clear client cookie
POST /api/auth/change-password      → Change password {current_password, new_password}
PUT  /api/auth/profile              → Update profile {name}
GET  /api/bookings                  → Client's bookings (requires auth)
GET  /api/client/photos             → Client's photos with deletion countdown
GET  /api/client/stats              → Client stats (bookings, photos count)

--- PAYMENT ENDPOINTS ---

GET  /api/payments/status/{session_id} → Check Stripe payment status
POST /api/webhook/stripe               → Stripe webhook for payment confirmation

# ================================================================================
# SECTION 7: DATABASE SCHEMA (MongoDB Collections)
# ================================================================================

Database: skyline_media (production) or test_database (development)

Collection: admins
{
  id: string (uuid),
  email: string (unique, indexed),
  name: string,
  role: "admin",
  password_hash: string (bcrypt),
  created_at: string (ISO datetime)
}

Collection: users (clients)
{
  user_id: string ("user_" + 12 hex chars, unique, indexed),
  email: string (unique, indexed),
  name: string,
  password_hash: string (bcrypt),
  picture: string (optional),
  created_at: string (ISO datetime)
}

Collection: bookings
{
  id: string (uuid),
  user_id: string (references users.user_id),
  name: string,
  email: string,
  phone: string,
  property_address: string,
  property_type: string,
  service_area: string ("calgary", "edmonton", "central_alberta"),
  package_id: string ("quick_aerial", "aerial_plus", "fpv_showcase"),
  scheduled_date: string,
  scheduled_time: string,
  notes: string (optional),
  status: string ("pending" | "approved" | "confirmed" | "completed" | "cancelled"),
  payment_status: string ("pending" | "awaiting_payment" | "paid"),
  payment_session_id: string (Stripe session ID, optional),
  payment_url: string (Stripe checkout URL, optional),
  total_amount: float,
  admin_notes: string (optional),
  approved_at: string (ISO datetime, optional),
  created_at: string (ISO datetime)
}

Collection: client_photos
{
  id: string (uuid),
  user_id: string,
  booking_id: string,
  title: string,
  filename: string,
  url: string ("/api/photos/{booking_id}/{filename}"),
  thumbnail_url: string,
  download_url: string ("/api/photos/{booking_id}/{filename}/download"),
  folder_name: string ("{client_name}_{email}"),
  file_size: int,
  first_downloaded_at: string (ISO datetime, null until first download),
  delete_after: string (ISO datetime, set to 30 days after first download),
  download_count: int,
  created_at: string (ISO datetime)
}

Collection: contacts
{
  id: string (uuid),
  name: string,
  email: string,
  phone: string (optional),
  property_address: string (optional),
  service_type: string,
  service_area: string,
  message: string,
  status: string ("new" | "contacted" | "closed"),
  created_at: string (ISO datetime)
}

Collection: portfolio
{
  id: string (uuid),
  title: string,
  description: string,
  category: string ("residential" | "commercial" | "land" | "construction"),
  image_url: string,
  before_image_url: string (optional),
  after_image_url: string (optional),
  location: string,
  created_at: string (ISO datetime)
}

Collection: cms
{
  id: string (section name: "hero", "stats", "about", "faq", "addons", "contact"),
  content: object (varies by section),
  updated_at: string (ISO datetime)
}

Collection: site_content
{
  id: "site_content",
  phone: string,
  email: string,
  main_location: string,
  service_areas: [{name: string, fee: int}],
  travel_fee_note: string,
  fleet: [{name: string, description: string, image: string}],
  created_at: string,
  updated_at: string
}

Collection: custom_packages
{
  id: "custom_packages",
  packages: [{ id, name, price, description, features[], notes, recommended_for, popular, currency }],
  updated_at: string
}

Collection: home_services
{
  id: "home_services",
  services: [{ title, description, image, span }],
  updated_at: string
}

Collection: settings
{
  id: "app_settings",
  photo_storage_path: string,
  photo_retention_days: int,
  smtp_host: string,
  smtp_port: int,
  smtp_user: string,
  smtp_password: string,
  sender_email: string,
  updated_at: string
}

Collection: chat_messages
{
  id: string (uuid),
  session_id: string,
  role: string ("user" | "assistant"),
  content: string,
  created_at: string (ISO datetime)
}

Collection: payment_transactions
{
  id: string (uuid),
  session_id: string (Stripe session ID),
  booking_id: string,
  user_email: string,
  amount: float,
  currency: "cad",
  status: string,
  payment_status: string,
  metadata: object,
  created_at: string (ISO datetime)
}

# ================================================================================
# SECTION 8: KEY BUSINESS FLOWS
# ================================================================================

BOOKING FLOW:
1. Client visits /booking → selects package (cards show full features/descriptions)
2. Fills in: name, email, phone, property address, type, service area, date, time, notes
3. Reviews and submits
4. Backend creates booking (status: "pending"), auto-creates client account if new email
5. Client gets "Booking Request Received" email
6. Admin gets "New Booking: [Name]" email with all details
7. Client gets "Welcome to SkyLine Media" email with login credentials (if new account)
8. Admin reviews in dashboard → clicks "Approve & Send Payment Link"
9. Stripe Checkout session created → payment URL saved on booking
10. Client gets "Booking Approved" email with payment button
11. Client clicks payment link → pays on Stripe's hosted page
12. Stripe webhook fires → booking updated to status:"confirmed", payment_status:"paid"
13. Admin does the shoot → uploads photos in admin dashboard
14. Admin sets status to "completed" → client gets "Photos Ready" email
15. Client logs in → downloads photos from dashboard
16. 30-day countdown starts on first download → auto-deleted after

PHOTO STORAGE:
- Photos stored at: {PHOTO_STORAGE_PATH}/{client_name}_{email}/{booking_id}/{photo_uuid}.ext
- Storage path configurable from Admin → Settings (any absolute path like /mnt/photos)
- Folders auto-created
- If client changes their name, folder auto-renames
- Background scheduler runs every 6 hours to delete expired photos
- Manual cleanup available via POST /api/admin/cleanup-photos

CLIENT AUTHENTICATION:
- Clients do NOT sign up manually
- Account auto-created when booking is submitted with a new email
- Random 10-char password generated and emailed to client
- Client logs in at /login with email + password
- Can change password and name from /dashboard profile tab
- JWT token with 7-day expiry, stored as httpOnly cookie + localStorage

ADMIN CMS:
- Every piece of website content is editable from the admin dashboard
- Changes take effect immediately (content fetched from MongoDB on each page load)
- Sections: Hero, Stats, About (with service cities, difference items), FAQ, Add-ons, Contact
- Also editable: Home service cards, portfolio items, pricing packages, site content (phone/email/fleet/areas)
- Favicon uploadable from Admin → Settings

# ================================================================================
# SECTION 9: THIRD-PARTY INTEGRATIONS
# ================================================================================

STRIPE (Payments):
- Library: emergentintegrations.payments.stripe.checkout
- Uses Prebuilt Checkout (redirect to Stripe-hosted page)
- Key: STRIPE_API_KEY in .env (CURRENTLY EXPIRED — needs new key)
- Webhook: POST /api/webhook/stripe
- Stripe Dashboard webhook URL: https://skylinemedia.net/api/webhook/stripe
- Events listened to: checkout.session.completed
- All amounts in CAD
- To get new key: dashboard.stripe.com/apikeys → Create secret key

RESEND (Email):
- Library: resend (pip package)
- Key: RESEND_API_KEY in .env
- Sender: noreply@skylinemedia.net
- Domain verified in Resend dashboard
- Falls back to SMTP if configured, then to mock (console log) if neither works
- Emails sent: booking confirmation, admin notification, approval + payment link, 
  account credentials, photos ready, contact form admin notification, test email

CLAUDE AI (Chat Widget):
- Library: emergentintegrations.llm.chat (LlmChat, UserMessage)
- Model: anthropic/claude-sonnet-4-5-20250929
- Key: ANTHROPIC_API_KEY in .env
- System message contains full business info: pricing, fleet, service areas, booking process
- Chat sessions stored in MongoDB with session IDs
- Floating widget appears on all pages

EMERGENTINTEGRATIONS LIBRARY:
- Private Python package for Stripe + Claude integrations
- Install: pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
- Used for: StripeCheckout, LlmChat

# ================================================================================
# SECTION 10: FRONTEND ROUTING (App.js)
# ================================================================================

PUBLIC ROUTES:
/                     → Home.js (landing page)
/services             → Services.js
/portfolio            → Portfolio.js
/pricing              → Pricing.js
/about                → About.js
/contact              → Contact.js
/booking              → Booking.js (multi-step form)
/booking/success      → BookingSuccess.js
/booking/payment/:id  → Booking.js (payment view)

AUTH ROUTES:
/admin                → AdminLogin.js
/login                → ClientLogin.js

PROTECTED ROUTES:
/admin/dashboard/*    → AdminDashboard.js (nested routes below)
/dashboard            → Dashboard.js (client portal)

ADMIN DASHBOARD SUB-ROUTES (inside AdminDashboard.js):
/admin/dashboard              → AdminOverview (stats + recent bookings)
/admin/dashboard/bookings     → AdminBookings (list + detail + approve + delete)
/admin/dashboard/clients      → AdminClients (table + delete)
/admin/dashboard/contacts     → AdminContacts (list + status management)
/admin/dashboard/cms          → AdminCMSEditor (hero, stats, about, FAQ, addons, contact)
/admin/dashboard/portfolio    → AdminPortfolio (CRUD)
/admin/dashboard/home-services → AdminHomeServices (edit cards)
/admin/dashboard/content      → AdminContent (phone, email, areas, fleet)
/admin/dashboard/packages     → AdminPackages (edit pricing tiers)
/admin/dashboard/settings     → AdminSettings (storage, SMTP, favicon)

# ================================================================================
# SECTION 11: KNOWN ISSUES & CURRENT STATUS
# ================================================================================

CRITICAL:
1. Stripe API key is EXPIRED. Booking approval fails with "Expired API Key".
   Fix: Get new key from dashboard.stripe.com/apikeys → update .env → restart backend.

WORKING:
- Website fully live at https://skylinemedia.net ✅
- All CMS editing ✅
- Booking submission ✅
- Client auto-account creation ✅
- Email notifications via Resend ✅ (booking confirmation, admin notification, credentials)
- AI chat widget ✅
- Photo upload/download/deletion ✅
- Admin: delete bookings, delete clients ✅
- Favicon upload from admin ✅

NOT YET BUILT:
- In-app messaging between admin and clients (currently use email/phone)
- Calendar showing booked dates as unavailable
- MongoDB backup strategy
- Docker setup (templates in README but files not created)

DESIGN:
- Dark theme (#0A0A0A background)
- Gold accent color: #d4af37
- Tailwind CSS with Framer Motion animations
- All pages use Shadcn/UI components from /frontend/src/components/ui/
- Phosphor Icons for all icons
- Title: "SkyLine Media — Drone Aerial Photography"
- No emoji in the UI
- No Emergent branding/badge (removed)

# ================================================================================
# SECTION 12: HOW TO MAKE CHANGES
# ================================================================================

TO EDIT WEBSITE CONTENT: Use the admin dashboard at /admin → no code needed.

TO CHANGE CODE:
1. Edit files in the repo
2. Push to GitHub
3. On server: cd /opt/PHOTOGRAPHYSITE && git pull
4. If backend changed: sudo systemctl restart skyline-backend
5. If frontend changed: cd frontend && nvm use 22 && yarn build

TO ADD A NEW API ENDPOINT:
1. Pick the appropriate route file in backend/routes/
2. Add your @router.get/post/put/delete decorator + async function
3. Import any needed models from models.py
4. Use 'from auth import require_admin' for admin-only routes
5. Use 'from database import db' for MongoDB access
6. Always exclude _id from MongoDB responses: find({}, {"_id": 0})

TO ADD A NEW FRONTEND PAGE:
1. Create the page in frontend/src/pages/
2. Add the route in frontend/src/App.js
3. Add nav link in Header.js if needed

MONGODB NOTES:
- Always exclude _id: db.collection.find({}, {"_id": 0})
- ObjectId is not JSON serializable — never return it
- Use datetime.now(timezone.utc) not datetime.utcnow()
- Store datetimes as ISO strings: .isoformat()

# ================================================================================
# SECTION 13: QUICK REFERENCE — COMMON TASKS
# ================================================================================

Fix Stripe (booking approval):
  1. Go to dashboard.stripe.com/apikeys
  2. Create new secret key
  3. On server: nano /opt/PHOTOGRAPHYSITE/backend/.env
  4. Replace STRIPE_API_KEY value
  5. sudo systemctl restart skyline-backend

Add a new portfolio item:
  Admin dashboard → Portfolio → + Add Item

Change pricing:
  Admin dashboard → Packages → edit prices/features → Save

Edit any website text:
  Admin dashboard → Website Editor → select section → edit → Save

Upload client photos:
  Admin dashboard → Bookings → click booking → Upload photo

Check server health:
  curl https://skylinemedia.net/api/health

View server logs:
  sudo journalctl -u skyline-backend -f

# ================================================================================
# END OF HANDOFF DOCUMENT
# ================================================================================
