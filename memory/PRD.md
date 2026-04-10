# SkyLine Media - PRD

## Original Problem Statement
Build a website for a drone aerial photography business specializing in DJI high-quality drones for real estate photography in Calgary and Edmonton, Alberta.

## Key Updates (Latest)
- Rebranded from SkyView to **SkyLine Media**
- Changed currency from USD to **CAD (Canadian Dollars)**
- Service areas: **Calgary & Edmonton, Alberta**
- New booking flow: **Request → Admin Approve → Client Pays**
- **30-day photo retention** after first download
- Using **Stripe LIVE key** for real payments
- Configurable photo storage path

## User Personas
1. **Real Estate Agents** - Need professional aerial photos for listings
2. **Property Owners** - Want aerial views of their property
3. **Commercial Developers** - Construction documentation and marketing
4. **Admin (You)** - Manages bookings, uploads photos, handles clients

## Pricing (CAD)
- **Starter**: $399 CAD - 15 photos, 1 video, 24-48hr delivery
- **Professional**: $799 CAD - 30 photos, 2 videos, virtual tour (POPULAR)
- **Premium**: $1,299 CAD - Unlimited photos, 4K video, twilight, 3D mapping

## Booking Flow
1. Client submits booking REQUEST (selects package, date, time, area)
2. Admin reviews request in dashboard
3. Admin **Approves** booking → System sends payment email to client
4. Client clicks payment link → Stripe checkout (CAD)
5. Payment confirmed → Booking status changes to "confirmed"
6. Shoot completed → Admin uploads photos
7. Client notified → Can download for 30 days

## Features Implemented

### Marketing Website
- [x] Home page with SkyLine Media branding (gold theme)
- [x] Services page (Residential, Commercial, Land, Construction)
- [x] Portfolio gallery with before/after slider
- [x] Pricing page with CAD prices
- [x] Contact page with quote form
- [x] About page (Calgary & Edmonton focus)
- [x] AI Chat Widget (Claude Sonnet 4.5)

### Client Features
- [x] Booking request submission (not instant payment)
- [x] Service area selection (Calgary/Edmonton)
- [x] Google OAuth login for dashboard
- [x] View bookings and download photos
- [x] 30-day download warning

### Admin Features
- [x] JWT email/password login
- [x] Dashboard with stats (bookings, revenue in CAD, clients)
- [x] **Approve** pending bookings (sends payment link)
- [x] Update booking status
- [x] Upload photos for client delivery
- [x] View clients and contact requests
- [x] Configurable photo storage path

### Integrations
- [x] Stripe LIVE payments (CAD currency)
- [x] Claude Sonnet 4.5 AI chat
- [x] Emergent Google OAuth
- [x] Email notifications (MOCKED)

## Admin Credentials
- **Email**: isaacsarver100@gmail.com
- **Password**: Isabella0116!
- **URL**: /admin

## Configuration
- Photo storage: Configurable via PHOTO_STORAGE_PATH env or admin settings
- Retention: 30 days (configurable via PHOTO_RETENTION_DAYS)
- Stripe: LIVE key configured

## Technical Stack
- Frontend: React, Tailwind CSS, Framer Motion
- Backend: FastAPI, MongoDB
- Auth: JWT (admin), Emergent OAuth (clients)
- Payments: Stripe (CAD)
- AI: Claude Sonnet 4.5

## For Local Server Setup
To run locally:
1. Set PHOTO_STORAGE_PATH to your preferred drive location
2. Configure MongoDB connection
3. Update domain/URLs as needed
4. Consider setting up Resend for real emails

## Next Steps
1. Add Resend API key for real email notifications
2. Set up custom domain when ready
3. Configure local storage path for production
