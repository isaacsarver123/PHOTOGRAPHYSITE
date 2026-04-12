# ============================================================
# SkyLine Media — Complete Server Deployment Guide
# Your Server: Ubuntu 24, MongoDB running, Nginx running
# Other apps on: 8001 (uvicorn), 3000 (node), 18789 (openclaw)
# SkyLine will use: 8002 (backend), static files (frontend)
# ============================================================

# ============================================================
# STEP 1: GET YOUR PUBLIC IP & SET UP PORT FORWARDING
# ============================================================

# Find your public IP:
curl ifconfig.me
# Write this down — you'll need it for GoDaddy

# Your server is at local IP 10.0.0.190 behind a router.
# You MUST set up port forwarding on your router:
#
# 1. Open your router admin page (usually http://10.0.0.1 or http://192.168.1.1)
# 2. Find "Port Forwarding" (sometimes under Advanced or NAT)
# 3. Add these 2 rules:
#    - External Port 80  → Internal IP 10.0.0.190, Internal Port 80  (TCP)
#    - External Port 443 → Internal IP 10.0.0.190, Internal Port 443 (TCP)
# 4. Save
#
# If your IP is dynamic (changes when router restarts), set up free DDNS:
#   - Go to https://www.noip.com (free)
#   - Create a hostname like skyline.ddns.net
#   - Install their update client: sudo apt install ddclient
#   - Then in GoDaddy, use a CNAME instead of A record

# ============================================================
# STEP 2: POINT GODADDY DOMAIN TO YOUR SERVER
# ============================================================

# In GoDaddy DNS for skylinemedia.net:
# 1. Find the A record for @ (currently points to "WebsiteBuilder Site")
# 2. Edit it: change the value to YOUR PUBLIC IP from Step 1
# 3. Add/edit another A record: Name = www, Value = same public IP
# 4. TTL: 1/2 Hour
# 5. Save and wait 5-30 minutes for DNS propagation
#
# Test with: dig skylinemedia.net (should show your IP)

# ============================================================
# STEP 3: CLONE & SET UP THE APP
# ============================================================

# You already have the code at /opt/PHOTOGRAPHYSITE
# If not, clone from GitHub:
# cd /opt && sudo git clone <your-github-url> skylinemedia
# sudo chown -R $USER:$USER skylinemedia

# --- BACKEND SETUP ---
cd /opt/PHOTOGRAPHYSITE/backend

# Create virtual environment (if not already done)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your production .env file:
cat > .env << 'ENVFILE'
MONGO_URL=mongodb://localhost:27017
DB_NAME=skyline_media
CORS_ORIGINS=https://skylinemedia.net,https://www.skylinemedia.net
ANTHROPIC_API_KEY=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
STRIPE_API_KEY=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
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
ADMIN_EMAIL=isaacsarver100@gmail.com
ADMIN_PASSWORD=Isabella0116!
RESEND_API_KEY=re_KgW3abYN_HmNc9kjsn6xHmTMpBSecZYVY
SENDER_EMAIL=noreply@skylinemedia.net
PHOTO_STORAGE_PATH=/opt/PHOTOGRAPHYSITE/photos
PHOTO_RETENTION_DAYS=30
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
ENVFILE

# Create photo storage directory
sudo mkdir -p /opt/PHOTOGRAPHYSITE/photos
sudo chown -R $USER:$USER /opt/PHOTOGRAPHYSITE/photos

# Test backend starts on port 8002 (8001 is taken by your other app!)
source venv/bin/activate
uvicorn server:app --host 127.0.0.1 --port 8002
# If you see "Startup complete" — press Ctrl+C and continue

# --- FRONTEND SETUP ---
cd /opt/PHOTOGRAPHYSITE/frontend

# Set the production URL BEFORE building
cat > .env << 'ENVFILE'
REACT_APP_BACKEND_URL=https://skylinemedia.net
ENVFILE

# Install dependencies and build
yarn install
yarn build
# This creates a /opt/PHOTOGRAPHYSITE/frontend/build/ folder with static files

# ============================================================
# STEP 4: CREATE SYSTEMD SERVICE (auto-start on boot)
# ============================================================

# Create the service file
sudo tee /etc/systemd/system/skyline-backend.service << 'SERVICE'
[Unit]
Description=SkyLine Media Backend API
After=network.target mongod.service

[Service]
Type=simple
User=deal
Group=deal
WorkingDirectory=/opt/PHOTOGRAPHYSITE/backend
Environment=PATH=/opt/PHOTOGRAPHYSITE/backend/venv/bin:/usr/bin
ExecStart=/opt/PHOTOGRAPHYSITE/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8002
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable skyline-backend
sudo systemctl start skyline-backend

# Check it's running:
sudo systemctl status skyline-backend
# Should say "active (running)"

# Check the logs if something's wrong:
sudo journalctl -u skyline-backend -f

# ============================================================
# STEP 5: CONFIGURE NGINX (add skylinemedia.net site)
# ============================================================

# Create the Nginx config for SkyLine Media
sudo tee /etc/nginx/sites-available/skylinemedia << 'NGINX'
# HTTP → redirect to HTTPS (certbot will handle this later)
server {
    listen 80;
    listen [::]:80;
    server_name skylinemedia.net www.skylinemedia.net;

    # For certbot verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect everything else to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS — main site
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name skylinemedia.net www.skylinemedia.net;

    # SSL certs will be added by certbot below
    # ssl_certificate /etc/letsencrypt/live/skylinemedia.net/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/skylinemedia.net/privkey.pem;

    # Frontend (static files from React build)
    root /opt/PHOTOGRAPHYSITE/frontend/build;
    index index.html;

    # Handle React Router (all frontend routes → index.html)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API — proxy to port 8002
    location /api/ {
        proxy_pass http://127.0.0.1:8002/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Allow large file uploads (photos)
        client_max_body_size 50M;

        # Timeouts for slow AI chat responses
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

# Enable the site
sudo ln -sf /etc/nginx/sites-available/skylinemedia /etc/nginx/sites-enabled/skylinemedia

# Test config
sudo nginx -t
# Should say "syntax is ok" and "test is successful"

# Reload Nginx
sudo systemctl reload nginx

# ============================================================
# STEP 6: GET FREE SSL CERTIFICATE (HTTPS)
# ============================================================

# Install certbot if not already installed
sudo apt install certbot python3-certbot-nginx -y

# Get the certificate (make sure domain points to your IP first!)
sudo certbot --nginx -d skylinemedia.net -d www.skylinemedia.net

# Certbot will:
# 1. Ask for your email (for renewal notices)
# 2. Ask you to agree to terms (Y)
# 3. Automatically update your Nginx config with SSL certs
# 4. Set up auto-renewal (certs renew every 90 days automatically)

# Test auto-renewal works:
sudo certbot renew --dry-run

# ============================================================
# STEP 7: VERIFY EVERYTHING WORKS
# ============================================================

# Check backend is running:
curl http://127.0.0.1:8002/api/health
# Should return: {"status":"healthy"}

# Check Nginx is serving the site:
curl -I https://skylinemedia.net
# Should return: HTTP/2 200

# Check API through Nginx:
curl https://skylinemedia.net/api/health
# Should return: {"status":"healthy"}

# ============================================================
# STEP 8: FIREWALL (if enabled)
# ============================================================

# If you have UFW enabled, make sure ports 80 and 443 are open:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw reload

# ============================================================
# USEFUL COMMANDS
# ============================================================

# View backend logs:
sudo journalctl -u skyline-backend -f

# Restart backend (after code changes):
sudo systemctl restart skyline-backend

# Rebuild frontend (after code changes):
cd /opt/PHOTOGRAPHYSITE/frontend && yarn build && sudo systemctl reload nginx

# Check what's running:
sudo ss -tulpn | grep -E "8002|nginx|mongo"

# Check SSL certificate expiry:
sudo certbot certificates

# MongoDB shell:
mongosh skyline_media

# ============================================================
# DYNAMIC IP? SET UP FREE DDNS
# ============================================================

# If your public IP changes (most home internet), use No-IP:
# 1. Go to https://www.noip.com → sign up (free)
# 2. Create a hostname (e.g., skyline.ddns.net)
# 3. Install the update client:
sudo apt install ddclient -y
# 4. Configure /etc/ddclient.conf with your No-IP credentials
# 5. In GoDaddy, instead of an A record, use:
#    Type: CNAME, Name: @, Value: skyline.ddns.net
#    Type: CNAME, Name: www, Value: skyline.ddns.net
#
# OR just update the A record manually when your IP changes.
# Check your IP anytime with: curl ifconfig.me
