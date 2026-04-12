# SkyLine Media - PRD

## Original Problem Statement
Build a website for a drone aerial photography business specializing in DJI drones for real estate in Central Alberta.

## Key Details
- Brand: **SkyLine Media** | Domain: skylinemedia.ca
- Currency: **CAD** | Location: **Central Alberta (Red Deer & Area)**
- Phone: **(825) 962-3425** | Email: info@skylinemedia.ca
- Travel fee: +$80 CAD for Edmonton/Calgary

## Pricing Tiers
- Quick Aerial ($199), Aerial Plus ($299 - popular), FPV Showcase ($649)

## Fleet
- Mavic 3 Pro, Air 3, Avata 2, BetaFPV Pavo 20 Pro (DJI O4 Pro)

## Features Implemented
- [x] Full CMS (Admin Dashboard — ALL website content editable)
- [x] Booking system with admin approval workflow
- [x] Booking deletion from Admin Dashboard
- [x] Client deletion from Admin Dashboard (with all associated data)
- [x] Configurable absolute photo storage path
- [x] Detailed booking page package cards with features
- [x] Client Auth (Email/Password, auto-account on booking)
- [x] Photo storage with 30-day auto-deletion
- [x] Stripe LIVE payments (CAD)
- [x] Claude AI chat widget
- [x] SMTP email infrastructure (awaiting user config)

## Architecture (Refactored April 11, 2026)

### Backend (FastAPI) — Modularized
- `server.py` — App setup, middleware, startup, router inclusion (~130 lines)
- `config.py` — All environment variables and mutable state
- `database.py` — MongoDB connection
- `models.py` — All Pydantic models
- `auth.py` — JWT/password helpers, auth dependencies
- `email_service.py` — Email sending (SMTP/Resend/mock)
- `routes/admin_auth.py` — Admin login, settings, stats, clients, contacts
- `routes/admin_bookings.py` — Booking CRUD, photo upload/serve/download
- `routes/admin_cms.py` — CMS, portfolio, packages, home services, site content
- `routes/client.py` — Client auth, profile, photos, stats
- `routes/public.py` — Public endpoints, packages, portfolio, bookings, contact, chat
- `routes/payments.py` — Stripe checkout, webhook

### Frontend (React) — Modularized
- `AdminDashboard.js` — Layout shell + Portfolio, HomeServices, Content, Packages, Settings (~650 lines)
- `admin/helpers.js` — Shared API, auth headers, StatusBadge component
- `admin/AdminOverview.js` — Dashboard stats + recent bookings
- `admin/AdminBookings.js` — Booking list + details + delete
- `admin/AdminClients.js` — Client table
- `admin/AdminContacts.js` — Contact requests
- `admin/AdminCMSEditor.js` — Full CMS editor (hero, stats, about, FAQ, addons, contact)

## Credentials
- Admin: isaacsarver100@gmail.com / Isabella0116! at /admin
- Test client: testclient@example.com / NewPass456 at /login

## Tech Stack
React + Tailwind + Framer Motion | FastAPI + MongoDB | Stripe | Claude AI | JWT Auth

## What's Mocked
- Email notifications (logged to console until real SMTP configured)

## Completed (April 11, 2026 — Session 2)
- Added client deletion (DELETE /api/admin/clients/{user_id}) — removes client + all bookings + photos
- Created comprehensive README.md with full deployment instructions (Windows, Linux, Docker)

## Next Steps
1. Email domain setup (noreply@skylinemedia.ca) — configure SMTP in Admin > Settings
2. Deploy to local server (see README.md for instructions)
3. Update AI chat system message with correct pricing ($199/$299/$649 instead of outdated amounts)
