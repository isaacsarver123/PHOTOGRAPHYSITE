# SkyLine Media - PRD

## Original Problem Statement
Build a website for a drone aerial photography business specializing in DJI high-quality drones for real estate photography in Central Alberta, Canada.

## Key Details
- Brand: **SkyLine Media**
- Currency: **CAD (Canadian Dollars)**
- Main Location: **Central Alberta (Red Deer & Area)**
- Service Areas: Central Alberta (free), Edmonton (+$80), Calgary (+$80), Others by arrangement
- Phone: **(825) 962-3425**
- Email: info@skylinemedia.ca
- Compliance: **Transport Canada** certified

## Pricing Packages (CAD)
- **Quick Aerial**: $199 - 8-12 photos, 1 short video, 48hr delivery
- **Aerial Plus**: $299 - 15-20 photos, cinematic video, optional FPV, 24-48hr (POPULAR)
- **FPV Showcase**: $649 - 15 photos, full FPV fly-through, highlight video, social media cut, 24hr

## Drone Fleet
- DJI Mavic 3 Pro (flagship tri-camera, 5.1K, 46min)
- DJI Air 3 (dual-cam, 48MP, 4K/100fps)
- DJI Avata 2 (FPV, 155° FOV, 4K/60fps)
- BetaFPV Pavo 20 Pro (indoor FPV, 4K camera)

## Booking Flow
1. Client submits booking REQUEST
2. Admin reviews and approves
3. Client receives payment link → Stripe checkout (CAD)
4. Payment confirmed → Booking confirmed
5. Shoot completed → Admin uploads photos
6. Client downloads (30-day retention)

## Features Implemented

### Marketing Website
- [x] Home page with gold-themed branding, hero, stats (white text)
- [x] Services page (Residential, Commercial, Land, Construction)
- [x] Portfolio gallery with Central Alberta locations
- [x] Pricing page with 3 tiers + travel fees + FAQ + add-ons
- [x] Contact page with correct phone/email/location
- [x] About page (Central Alberta, Transport Canada)
- [x] AI Chat Widget (Claude Sonnet 4.5)
- [x] Custom drone images (Air 3, Avata 2, equipment graphic)
- [x] Updated fleet with Pavo 20 Pro

### Client Features
- [x] Booking request with 4 service areas (Central AB, Edmonton, Calgary, Other)
- [x] Google OAuth login
- [x] View bookings and download photos
- [x] 30-day download retention warning

### Admin Features
- [x] JWT admin login
- [x] Dashboard with stats
- [x] Approve/reject bookings
- [x] Upload photos for delivery
- [x] View clients and contact requests
- [x] **CMS: Editable site content** (phone, email, location, service areas, fleet)
- [x] **CMS: Editable pricing packages** (name, price, features, notes)
- [x] **SMTP Email Settings** (host, port, user, password, test email)
- [x] **Photo storage settings** (path, retention days)

### Integrations
- [x] Stripe LIVE payments (CAD)
- [x] Claude Sonnet 4.5 AI chat (Emergent LLM Key)
- [x] Emergent Google OAuth
- [x] SMTP Email infrastructure (awaiting user credentials)
- [x] 30-day auto-deletion scheduler (runs every 6 hours)

## Admin Credentials
- Email: isaacsarver100@gmail.com
- Password: Isabella0116!
- URL: /admin

## Technical Stack
- Frontend: React, Tailwind CSS, Framer Motion, Shadcn UI
- Backend: FastAPI, MongoDB (motor)
- Auth: JWT (admin), Emergent OAuth (clients)
- Payments: Stripe (CAD, LIVE key)
- AI: Claude Sonnet 4.5 (Emergent LLM Key)
- Email: SMTP (configurable) / Resend (fallback) / Mock (default)

## Next Steps
1. User to provide SMTP credentials via Admin Dashboard > Settings
2. Custom domain setup
3. Configure local storage path for production
