# SkyLine Media - PRD

## Original Problem Statement
Build a website for a drone aerial photography business specializing in DJI high-quality drones for real estate photography in Central Alberta, Canada.

## Key Details
- Brand: **SkyLine Media**
- Currency: **CAD (Canadian Dollars)**
- Main Location: **Central Alberta (Red Deer & Area)**
- Service Areas: Central Alberta (free), Edmonton (+$80), Calgary (+$80), Others by arrangement
- Phone: **(825) 962-3425**
- Compliance: **Transport Canada** certified

## Pricing Packages (CAD)
- **Quick Aerial**: $199 - 8-12 photos, basic color correction, 48hr delivery, MLS-ready
- **Aerial Plus**: $299 - 15-20 photos, 1 cinematic video (60s), enhanced color grading, 24-48hr (POPULAR)
- **FPV Showcase**: $649 - 15 photos, cinematic video, full indoor FPV fly-through, highlight video, social reel, 24hr

## Drone Fleet
- DJI Mavic 3 Pro, DJI Air 3, DJI Avata 2, BetaFPV Pavo 20 Pro (DJI O4 Pro)

## Client Auth
- **Email/password** — no Google OAuth
- Account auto-created on first booking with random password emailed
- Client can change password and name from Dashboard > Profile
- JWT stored in httpOnly cookies

## Features Implemented
- [x] Full marketing site (Home, Services, Portfolio, Pricing, Contact, About)
- [x] AI Chat Widget (Claude Sonnet 4.5)
- [x] Client email/password auth with auto-account creation
- [x] Client dashboard (overview, photos, bookings, profile with password change)
- [x] Admin dashboard with full CMS (portfolio, home services, site content, packages, settings)
- [x] Stripe LIVE payments (CAD)
- [x] SMTP email infrastructure (configurable, currently mocked)
- [x] 30-day auto-deletion scheduler for photos
- [x] Booking approval workflow

## Admin: isaacsarver100@gmail.com / Isabella0116! at /admin
## Client login at /login

## Next Steps
1. Configure SMTP via Admin > Settings
2. Custom domain
3. Local storage path for production
