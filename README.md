# SkyLine Media — Drone Aerial Photography Platform

Professional drone photography booking and management platform built for real estate. Includes a full marketing website, client booking system, admin CMS, Stripe payments, and photo delivery — all in one.

![SkyLine Media](https://customer-assets.emergentagent.com/job_drone-home-showcase/artifacts/t1ak4xlw_Skyline%20Media%20logo%20with%20golden%20peaks%20%281%29.png)

---

## Features

- **Marketing Website** — Home, Services, Portfolio, Pricing, About, Contact pages with all content editable from admin
- **Booking System** — Multi-step booking form with package selection, date/time picker, and automatic client account creation
- **Admin Dashboard** — Full CMS to edit every piece of website content, manage bookings, clients, contacts, packages, portfolio, and settings
- **Stripe Payments** — Booking approval → Stripe Checkout payment link → automatic confirmation
- **Photo Delivery** — Upload photos per booking, organized by client folders, with 30-day auto-deletion after first download
- **AI Chat Widget** — Claude-powered chat assistant for visitor questions
- **Client Portal** — Clients can log in to view bookings, download photos, and manage their profile

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Framer Motion, Shadcn/UI |
| Backend | FastAPI (Python), Motor (async MongoDB) |
| Database | MongoDB |
| Payments | Stripe (Prebuilt Checkout) |
| AI Chat | Claude Sonnet 4.5 (via Emergent LLM Key) |
| Auth | Custom JWT with bcrypt |

---

## Project Structure

```
├── backend/
│   ├── server.py              # App setup, middleware, startup
│   ├── config.py              # Environment variables & config
│   ├── database.py            # MongoDB connection
│   ├── models.py              # All Pydantic models
│   ├── auth.py                # JWT, password, auth dependencies
│   ├── email_service.py       # Email sending (SMTP/mock)
│   ├── routes/
│   │   ├── admin_auth.py      # Admin login, settings, stats, clients, contacts
│   │   ├── admin_bookings.py  # Booking CRUD, photo upload/serve
│   │   ├── admin_cms.py       # CMS, portfolio, packages, home services
│   │   ├── client.py          # Client auth, profile, photos
│   │   ├── public.py          # Public endpoints, bookings, contact, chat
│   │   └── payments.py        # Stripe checkout & webhook
│   ├── uploads/               # Default photo storage
│   ├── requirements.txt
│   └── .env                   # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.js, Services.js, Portfolio.js, Pricing.js, About.js, Contact.js
│   │   │   ├── Booking.js          # Multi-step booking form
│   │   │   ├── Login.js            # Client login
│   │   │   ├── AdminDashboard.js   # Admin layout + CMS components
│   │   │   ├── ClientDashboard.js  # Client portal
│   │   │   └── admin/              # Extracted admin components
│   │   │       ├── helpers.js, AdminOverview.js, AdminBookings.js
│   │   │       ├── AdminClients.js, AdminContacts.js, AdminCMSEditor.js
│   │   ├── components/
│   │   │   ├── ui/            # Shadcn components
│   │   │   ├── Navbar.js, Footer.js, AIChat.js
│   │   └── context/
│   │       └── AuthContext.js
│   ├── public/
│   ├── package.json
│   └── .env                   # Frontend environment variables
│
└── README.md
```

---

## Quick Start (Development)

### Prerequisites
- Python 3.11+
- Node.js 18+ & Yarn
- MongoDB 6+ (running on localhost:27017)

### 1. Clone & Configure

```bash
git clone <your-repo-url>
cd skyline-media
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env  # Then edit .env with your values (see below)

# Start backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Configure environment
# Edit .env and set REACT_APP_BACKEND_URL to your backend URL

# Start frontend
yarn start
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

```env
# MongoDB
MONGO_URL=mongodb://localhost:27017
DB_NAME=skyline_media

# Security
JWT_SECRET=your-secure-random-string-here-64-chars-minimum

# Admin Account (auto-seeded on first startup)
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password

# Stripe (get from https://dashboard.stripe.com/apikeys)
STRIPE_API_KEY=sk_live_your_stripe_secret_key

# AI Chat (optional — get from Emergent or use your own Anthropic key)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Email — leave blank to use mock mode (logs to console)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SENDER_EMAIL=noreply@yourdomain.com

# Photo Storage
PHOTO_STORAGE_PATH=/path/to/photo/storage
PHOTO_RETENTION_DAYS=30

# Email service (optional, set to mock if not using Resend)
RESEND_API_KEY=re_mock_key

# CORS
CORS_ORIGINS=*
```

### Frontend (`frontend/.env`)

```env
REACT_APP_BACKEND_URL=https://yourdomain.com
```

> **Important**: Set `REACT_APP_BACKEND_URL` to the PUBLIC URL where your app will be accessed. This is baked into the frontend at build time.

---

## Production Deployment

### Option A: Windows Server (Self-Hosted)

#### 1. Install Prerequisites

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- [Nginx for Windows](https://nginx.org/en/download.html) or [Caddy](https://caddyserver.com/)

#### 2. Setup MongoDB

Install and start MongoDB as a Windows service:
```powershell
# After installing MongoDB, it runs as a service automatically
# Verify it's running:
mongosh --eval "db.runCommand({ping:1})"
```

#### 3. Setup Backend

```powershell
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Edit .env with your production values
notepad .env

# Test it runs
uvicorn server:app --host 0.0.0.0 --port 8001
```

To run as a Windows service, use [NSSM](https://nssm.cc/):
```powershell
nssm install SkylineBackend "C:\path\to\backend\venv\Scripts\uvicorn.exe" "server:app --host 0.0.0.0 --port 8001"
nssm set SkylineBackend AppDirectory "C:\path\to\backend"
nssm start SkylineBackend
```

#### 4. Build Frontend

```powershell
cd frontend

# Set your production URL BEFORE building
# Edit .env:
#   REACT_APP_BACKEND_URL=https://skylinemedia.ca

yarn install
yarn build
```

This creates a `build/` folder with static files.

#### 5. Configure Nginx (Reverse Proxy)

Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name skylinemedia.ca www.skylinemedia.ca;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name skylinemedia.ca www.skylinemedia.ca;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    # Frontend (static files)
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # For file uploads
        client_max_body_size 50M;
    }
}
```

#### 6. SSL Certificate (HTTPS)

Use [win-acme](https://www.win-acme.com/) for free Let's Encrypt certificates on Windows:
```powershell
# Download win-acme, then:
wacs.exe --target manual --host skylinemedia.ca,www.skylinemedia.ca
```

---

### Option B: Linux Server (Ubuntu/Debian)

#### 1. Install Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python, Node, and MongoDB
sudo apt install python3.11 python3.11-venv python3-pip nodejs npm nginx certbot python3-certbot-nginx -y
npm install -g yarn

# Install MongoDB
# Follow: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/
```

#### 2. Clone & Configure

```bash
cd /opt
sudo git clone <your-repo-url> skyline-media
sudo chown -R $USER:$USER skyline-media
cd skyline-media
```

#### 3. Setup Backend

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure .env
nano .env
```

Create a systemd service (`/etc/systemd/system/skyline-backend.service`):
```ini
[Unit]
Description=SkyLine Media Backend
After=network.target mongod.service

[Service]
User=www-data
WorkingDirectory=/opt/skyline-media/backend
ExecStart=/opt/skyline-media/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=3
Environment=PATH=/opt/skyline-media/backend/venv/bin

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable skyline-backend
sudo systemctl start skyline-backend
```

#### 4. Build Frontend

```bash
cd /opt/skyline-media/frontend
# Edit .env with production URL first
yarn install
yarn build
```

#### 5. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/skyline-media
```

```nginx
server {
    server_name skylinemedia.ca www.skylinemedia.ca;

    location / {
        root /opt/skyline-media/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/skyline-media /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d skylinemedia.ca -d www.skylinemedia.ca
```

---

### Option C: Docker (Recommended for Easy Deployment)

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    restart: always
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    restart: always
    ports:
      - "8001:8001"
    env_file: ./backend/.env
    depends_on:
      - mongodb
    volumes:
      - photo_storage:/app/uploads

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mongo_data:
  photo_storage:
```

Create `backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Create `frontend/nginx.conf`:
```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://backend:8001/api/;
        client_max_body_size 50M;
    }
}
```

Then run:
```bash
docker-compose up -d
```

---

## Email Setup

Email notifications are **mocked by default** (logged to console). To enable real emails:

### Gmail / Google Workspace
1. Go to [myaccount.google.com](https://myaccount.google.com) → Security → 2-Step Verification
2. Scroll down to "App passwords" → Generate one for "Mail"
3. In Admin Dashboard → Settings, enter:
   - SMTP Host: `smtp.gmail.com`
   - SMTP Port: `587`
   - SMTP User: `your-email@gmail.com`
   - SMTP Password: the 16-character app password
   - Sender Email: `noreply@skylinemedia.ca`
4. Click "Send Test Email" to verify

### Other Providers
Any SMTP service works: SendGrid, Mailgun, Amazon SES, Zoho Mail, etc. Enter their SMTP credentials in Admin → Settings.

---

## Stripe Setup

1. Create an account at [stripe.com](https://stripe.com)
2. Go to [Developers → API Keys](https://dashboard.stripe.com/apikeys)
3. Copy your **Secret Key** (starts with `sk_live_` or `sk_test_`)
4. Set it as `STRIPE_API_KEY` in `backend/.env`
5. For production, configure a webhook endpoint in Stripe Dashboard:
   - URL: `https://yourdomain.com/api/webhook/stripe`
   - Events: `checkout.session.completed`

---

## Photo Storage

- Default path: `backend/uploads/`
- Change it from Admin Dashboard → Settings → Storage Path
- Accepts any absolute path (e.g., `D:\Photos`, `/mnt/storage`)
- Photos are organized: `{storage_path}/{client_name}_{email}/{booking_id}/`
- Auto-deleted 30 days after client's first download

---

## Admin Credentials

On first startup, an admin account is auto-created from the `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`.

- Login at: `/admin`
- Default: `isaacsarver100@gmail.com` / `Isabella0116!` (change these!)

---

## License

Private — All rights reserved.
