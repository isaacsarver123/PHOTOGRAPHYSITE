# SkyLine Media — Full Handoff Document for Another AI

## What This Is
A full-stack drone aerial photography website for "SkyLine Media" — a real estate drone photography business in Central Alberta, Canada. Built with React + FastAPI + MongoDB.

---

## Tech Stack
- **Frontend**: React 18, Tailwind CSS, Framer Motion, React Router, Shadcn/UI components, Phosphor Icons
- **Backend**: FastAPI (Python), Motor (async MongoDB driver), Pydantic
- **Database**: MongoDB (local via `mongodb://localhost:27017`, DB name: `test_database`)
- **Payments**: Stripe (live key in backend/.env)
- **AI Chat**: Claude Sonnet 4.5 via Emergent LLM Key
- **Auth**: Custom JWT (bcrypt password hashing) — NO Google OAuth

---

## Project Structure
```
/app/
  frontend/
    src/
      pages/
        Home.js, Services.js, Portfolio.js, Pricing.js, About.js, Contact.js
        Booking.js          — Multi-step booking form (package → details → review)
        AdminDashboard.js   — All admin CMS tabs (1700+ lines, needs refactoring)
        ClientDashboard.js  — Client portal (view bookings, download photos, profile)
        Login.js            — Client login page
      context/
        AuthContext.js      — JWT auth context (admin + client)
      components/
        ui/                 — Shadcn components (button, calendar, input, etc.)
        Navbar.js, Footer.js, AIChat.js
      App.js                — React Router setup
    .env                    — REACT_APP_BACKEND_URL=https://drone-home-showcase.preview.emergentagent.com
  backend/
    server.py               — ALL routes, models, background tasks (2000+ lines)
    .env                    — MONGO_URL, STRIPE_API_KEY, JWT_SECRET, ADMIN credentials, etc.
    uploads/                — Default photo storage directory
  memory/
    PRD.md                  — Product requirements
    test_credentials.md     — Login credentials for testing
```

---

## Credentials
- **Admin**: `isaacsarver100@gmail.com` / `Isabella0116!` — Login at `/admin`
- **Test Client**: `testclient@example.com` / `NewPass456` — Login at `/login`
- Client accounts are auto-created when someone submits a booking (random password generated, logged to console since SMTP is mocked)

---

## Key Features

### 1. Marketing Website (Public Pages)
All content is fetched from MongoDB via CMS APIs (`GET /api/content/{section}`, `GET /api/packages`).
- **Home**: Hero section, stats, services overview, portfolio preview, FAQ
- **Services**: Detailed service cards
- **Portfolio**: Before/after gallery with category filters
- **Pricing**: 3 tiers — Quick Aerial ($199), Aerial Plus ($299), FPV Showcase ($649)
- **About**: Company story, team, equipment
- **Contact**: Contact form → stored in DB

### 2. Booking System
- `/booking` — 3-step form: Select Package → Enter Details → Review & Submit
- Package cards show full features, descriptions, notes, "Best for" text
- On submit: booking saved to DB, client account auto-created if new email
- Admin reviews → approves → Stripe payment link sent → client pays → shoot scheduled

### 3. Admin Dashboard (`/admin`)
- **Overview**: Stats (bookings, revenue, clients, contacts)
- **Bookings**: List with filters, detail panel, approve/status update, photo upload, **DELETE**
- **Clients**: List of all client accounts
- **Contacts**: Contact form submissions
- **Website Editor**: Edit Hero, Stats, About, FAQ, Add-ons content
- **Home Services**: Edit "What We Offer" cards
- **Portfolio**: CRUD for portfolio items (before/after images)
- **Packages**: Edit pricing tiers (name, price, features, description, notes, recommended_for)
- **Site Content**: Edit phone, email, locations, fleet, service areas
- **Settings**: Photo storage path (any absolute path), retention days, SMTP config

### 4. Client Portal (`/dashboard` after login)
- View bookings and status
- Download photos uploaded by admin
- Edit profile (name, password)

### 5. Photo Storage
- Photos stored locally in `{storage_path}/{client_name}_{email}/{booking_id}/`
- Storage path configurable in Admin Settings (accepts absolute paths like `D:/Photos`)
- 30-day auto-deletion scheduler runs every 6 hours

### 6. AI Chat Widget
- Floating chat bubble on all pages
- Uses Claude Sonnet 4.5 via Emergent LLM Key
- Answers questions about SkyLine Media services

---

## Key API Endpoints

### Auth
- `POST /api/admin/login` — Admin login (returns JWT)
- `POST /api/auth/login` — Client login (returns JWT)

### Public
- `GET /api/packages` — List all pricing packages
- `GET /api/content/{section}` — Get CMS content (hero, stats, about, faq, addons, services, site_content)
- `GET /api/portfolio` — List portfolio items
- `POST /api/bookings` — Submit booking request (auto-creates client account)
- `POST /api/contact` — Submit contact form

### Admin (requires Bearer token)
- `GET /api/admin/bookings` — List bookings (optional `?status=pending`)
- `GET /api/admin/bookings/{id}` — Get booking details + photos
- `POST /api/admin/bookings/{id}/approve` — Approve & generate Stripe payment link
- `PUT /api/admin/bookings/{id}/status` — Update booking status
- `DELETE /api/admin/bookings/{id}` — Delete booking and associated photos
- `POST /api/admin/bookings/{id}/photos` — Upload photo for client
- `GET /api/admin/settings` — Get settings
- `PUT /api/admin/settings` — Update settings (storage path, SMTP, etc.)
- `POST /api/admin/content/{section}` — Update CMS content
- `GET/POST/PUT/DELETE /api/admin/portfolio/{id}` — Portfolio CRUD
- `GET/POST /api/admin/packages` — Package management

### Client (requires Bearer token)
- `GET /api/client/bookings` — Client's bookings
- `GET /api/client/photos/{booking_id}` — Client's photos for a booking

---

## Database Collections (MongoDB)
- `users` — {id, email, name, role, hashed_password, created_at}
- `bookings` — {id, client_id, user_id, package_id, name, email, phone, property_address, property_type, service_area, scheduled_date, scheduled_time, status, payment_status, total_amount, notes, created_at}
- `packages` — {id, name, price, description, features[], notes, recommended_for, popular, order}
- `portfolio` — {id, title, description, before_image, after_image, category}
- `site_content` — {id, section, data{}} — CMS content for each page section
- `settings` — {id: "app_settings", photo_storage_path, photo_retention_days, smtp_host/port/user/password, sender_email}
- `client_photos` — {id, booking_id, filename, title, url, folder_name, uploaded_at, expires_at}
- `contacts` — {id, name, email, phone, message, status, created_at}
- `chat_sessions` — {session_id, messages[], created_at, updated_at}

---

## Environment Variables

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://drone-home-showcase.preview.emergentagent.com
```

### Backend (.env)
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
ANTHROPIC_API_KEY=sk-ant-api03-...
STRIPE_API_KEY=sk_live_51TKl3K...
JWT_SECRET=a1b2c3d4e5f6g7h8...
ADMIN_EMAIL=isaacsarver100@gmail.com
ADMIN_PASSWORD=Isabella0116!
RESEND_API_KEY=re_mock_key
SENDER_EMAIL=noreply@skylinemedia.ca
PHOTO_STORAGE_PATH=/app/backend/uploads
PHOTO_RETENTION_DAYS=30
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
```

---

## What's Mocked
- **Email notifications**: All emails (booking confirmation, approval, password delivery) are logged to console. Will work when real SMTP credentials are configured in Admin Settings.

---

## Known Issues / TODO
1. **Stripe advice**: User asked about Shareable links vs Prebuilt checkout vs Embedded components — hasn't been addressed yet
2. **Email setup**: User wants `noreply@skylinemedia.ca` — needs real SMTP credentials
3. **Refactoring needed**: `server.py` is 2000+ lines, `AdminDashboard.js` is 1700+ lines — should be split into modules
4. **Local deployment**: User wants to self-host — may need Docker setup or deployment guide

---

## How to Run Locally
```bash
# Backend
cd /app/backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001

# Frontend
cd /app/frontend
yarn install
yarn start  # runs on port 3000
```

MongoDB must be running on localhost:27017. Admin account is auto-seeded on first startup.

---

## Important Notes
- All backend API routes must be prefixed with `/api` (handled by the FastAPI router)
- Frontend uses `REACT_APP_BACKEND_URL` for all API calls
- DO NOT use Google OAuth — it was explicitly removed by the user
- Photo storage path now accepts any absolute path (Windows or Linux)
- Booking deletion also removes associated photos from disk and DB
