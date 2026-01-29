# CodeSync Deployment Guide

## Prerequisites

- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- PostgreSQL 16+ running
- Domain with HTTPS (or reverse proxy)

## Quick Setup

### 1. Clone and Install

```bash
git clone https://github.com/your-org/codesync.git
cd codesync
bun install
```

### 2. Configure Environment

```bash
# Copy and edit production config
cp .env.production.example .env.production

# Generate secrets
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "PASSWORD_SALT=$(openssl rand -base64 16)"

# Edit .env.production with your values
nano .env.production
```

### 3. Setup Database

```bash
# Create database
sudo -u postgres createdb codesync
sudo -u postgres createuser codesync -P

# Run migrations
cd packages/api && bun run db:migrate
```

### 4. Build Client

```bash
cd packages/client && bun run build
```

### 5. Install Systemd Services

```bash
# Copy service files
sudo cp codesync-api.service /etc/systemd/system/
sudo cp codesync-client.service /etc/systemd/system/

# Reload and enable
sudo systemctl daemon-reload
sudo systemctl enable codesync-api codesync-client

# Start services
sudo systemctl start codesync-api
sudo systemctl start codesync-client
```

### 6. Check Status

```bash
sudo systemctl status codesync-api
sudo systemctl status codesync-client

# View logs
journalctl -u codesync-api -f
journalctl -u codesync-client -f
```

## Service Management

```bash
# Restart after code changes
sudo systemctl restart codesync-api
sudo systemctl restart codesync-client

# Stop services
sudo systemctl stop codesync-api codesync-client

# Disable auto-start
sudo systemctl disable codesync-api codesync-client
```

## Reverse Proxy (Nginx)

Example nginx config for HTTPS:

```nginx
server {
    listen 443 ssl http2;
    server_name codesync.example.com;

    ssl_certificate /etc/letsencrypt/live/codesync.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/codesync.example.com/privkey.pem;

    # Client (static files)
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

## Static File Serving (Alternative)

For production, you can serve the built client as static files:

```bash
# Build creates dist/ folder
cd packages/client && bun run build

# Serve with any static server
npx serve dist -l 5173

# Or configure nginx to serve directly
location / {
    root /home/exedev/codesync/packages/client/dist;
    try_files $uri $uri/ /index.html;
}
```

## Troubleshooting

### API won't start

```bash
# Check logs
journalctl -u codesync-api -n 50

# Test manually
cd /home/exedev/codesync/packages/api
source /home/exedev/codesync/.env.production
bun src/index.ts
```

### Database connection failed

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check PostgreSQL is running
sudo systemctl status postgresql
```

### WebSocket not connecting

- Ensure nginx has WebSocket upgrade headers
- Check CORS_ORIGIN matches your domain
- Verify firewall allows the ports
