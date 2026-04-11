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
- DJI Mavic 3 Pro, DJI Air 3, DJI Avata 2, BetaFPV Pavo 20 Pro (indoor FPV)

## Features Implemented

### Marketing Website
- [x] Home page with gold-themed branding, scroll animations (replay on scroll up/down)
- [x] Dynamic "What We Offer" services section (fetches from API, admin-editable)
- [x] Services, Portfolio, Pricing, Contact, About pages
- [x] AI Chat Widget (Claude Sonnet 4.5)
- [x] All content Central Alberta / Transport Canada

### Admin CMS (Dashboard)
- [x] **Portfolio CRUD** — Create, edit, delete portfolio items
- [x] **Home Services Editor** — Edit "What We Offer" cards (title, desc, image, layout)
- [x] **Site Content** — Phone, email, locations, fleet, service areas
- [x] **Pricing Packages** — Edit all 3 tiers
- [x] **SMTP Settings** — Email config with test button
- [x] **Photo Storage** — Path and retention settings
- [x] Bookings, Clients, Contacts management

### Client Features
- [x] Booking request, Google OAuth login, photo download (30-day retention)

### Integrations
- [x] Stripe LIVE (CAD), Claude AI chat, Google OAuth, SMTP infrastructure, 30-day auto-deletion

## Admin Credentials
- Email: isaacsarver100@gmail.com | Password: Isabella0116! | URL: /admin

## Technical Stack
React + Tailwind + Framer Motion | FastAPI + MongoDB | Stripe | Claude AI | Google OAuth

## Next Steps
1. SMTP credentials via Admin > Settings
2. Custom domain setup
3. Local storage path for production
