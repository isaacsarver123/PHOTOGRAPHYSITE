# SkyLine Media - PRD

## Original Problem Statement
Build a website for a drone aerial photography business specializing in DJI drones for real estate in Central Alberta.

## Key Details
- Brand: **SkyLine Media** | Domain: skylinemedia.ca (to be set up)
- Currency: **CAD** | Location: **Central Alberta (Red Deer & Area)**
- Phone: **(825) 962-3425** | Email: info@skylinemedia.ca
- Travel fee: +$80 CAD for Edmonton/Calgary

## Pricing: Quick Aerial ($199), Aerial Plus ($299 - popular), FPV Showcase ($649)
## Fleet: Mavic 3 Pro, Air 3, Avata 2, BetaFPV Pavo 20 Pro (DJI O4 Pro)

## Features Implemented

### Full CMS (Admin Dashboard — ALL website content editable)
- [x] **Website Editor** — Hero section, stats, about text, FAQ, add-ons, contact info
- [x] **Home Services** — "What We Offer" cards
- [x] **Portfolio** — CRUD for portfolio items
- [x] **Packages** — Edit all pricing tiers
- [x] **Site Content** — Phone, email, locations, fleet, service areas
- [x] **Settings** — SMTP email config, photo storage path, retention days

### Client Auth (Email/Password)
- [x] Auto-account creation on first booking (random password emailed)
- [x] Client login at /login
- [x] Password change & name editing from dashboard profile
- [x] Photo folder auto-renames when client changes name

### Photo Storage
- [x] Photos stored in `/uploads/{client-name}_{email}/{booking_id}/`
- [x] Folder renames on client profile changes
- [x] Storage path configurable from admin settings
- [x] 30-day auto-deletion scheduler (every 6 hours)

### Marketing Website
- [x] All pages (Home, Services, Portfolio, Pricing, Contact, About)
- [x] AI Chat Widget (Claude Sonnet 4.5)
- [x] All content fetched from CMS APIs

### Integrations
- [x] Stripe LIVE payments (CAD) — Prebuilt Checkout
- [x] Claude AI chat (Emergent LLM Key)
- [x] SMTP email infrastructure (awaiting user config)

## Credentials
- Admin: isaacsarver100@gmail.com / Isabella0116! at /admin
- Test client: testclient@example.com / NewPass456 at /login

## Tech Stack
React + Tailwind + Framer Motion | FastAPI + MongoDB | Stripe | Claude AI | JWT Auth

## Next Steps
1. Set up skylinemedia.ca domain + noreply@skylinemedia.ca email
2. Configure SMTP in Admin > Settings
3. Deploy to local server
