# 🚀 PRODUCTION DEPLOYMENT GUIDE

**Project:** Social Media Platform - Advanced Features  
**Version:** 1.0.0  
**Deployment Date:** January 2025  
**Status:** Production Ready

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ Code Readiness
- [x] All 7 features implemented and tested
- [x] 60+ components created and verified
- [x] Error handling implemented
- [x] Loading states added
- [x] Mobile responsiveness confirmed
- [x] Dark mode support complete
- [x] Security measures in place
- [x] Performance optimized

### ✅ Documentation
- [x] Technical documentation complete
- [x] API documentation available
- [x] Usage examples provided
- [x] Deployment guide created (this document)

### ✅ Testing
- [x] Manual testing completed
- [x] Cross-browser compatibility verified
- [x] Mobile device testing done
- [x] API endpoints tested
- [x] Real-time features validated

---

## 🏗️ INFRASTRUCTURE REQUIREMENTS

### Minimum Server Specifications:

#### Backend Server:
- **CPU:** 4 cores (8 recommended)
- **RAM:** 8GB (16GB recommended)
- **Storage:** 100GB SSD (500GB recommended)
- **Network:** 1Gbps connection
- **OS:** Ubuntu 20.04+ or CentOS 8+

#### Database Server:
- **CPU:** 4 cores
- **RAM:** 16GB (32GB recommended)
- **Storage:** 500GB SSD with backup
- **Network:** 1Gbps connection

#### CDN & File Storage:
- **CDN:** CloudFlare or AWS CloudFront
- **File Storage:** AWS S3 or equivalent
- **Image Processing:** ImageKit or Cloudinary

### Software Requirements:

#### Backend Dependencies:
```bash
# Node.js and npm
Node.js: v18.0.0 or higher
npm: v8.0.0 or higher

# Database
MongoDB: v6.0 or higher
Redis: v7.0 or higher

# Process Manager
PM2: Latest version

# Web Server
Nginx: v1.20 or higher
```

#### Frontend Dependencies:
```bash
# Node.js and npm
Node.js: v18.0.0 or higher
npm: v8.0.0 or higher

# Build Tools
Next.js: v13.0 or higher
React: v18.0 or higher
```

---

## 🔧 ENVIRONMENT SETUP

### 1. Server Preparation

#### Update System:
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git build-essential
```

#### Install Node.js:
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Install PM2:
```bash
npm install -g pm2
pm2 startup
```

### 2. Database Setup

#### MongoDB Installation:
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Redis Installation:
```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: supervised systemd
# Set: maxmemory 2gb
# Set: maxmemory-policy allkeys-lru

# Start and enable Redis
sudo systemctl restart redis
sudo systemctl enable redis
```

### 3. Nginx Installation:
```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 📦 APPLICATION DEPLOYMENT

### 1. Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/social-platform
sudo chown $USER:$USER /var/www/social-platform

# Clone repository
cd /var/www/social-platform
git clone <your-repository-url> .
```

### 2. Backend Deployment

#### Install Dependencies:
```bash
cd /var/www/social-platform/Website/Backend
npm install --production
```

#### Environment Configuration:
```bash
# Create production environment file
cp .env.example .env.production
nano .env.production
```

#### Production Environment Variables:
```env
# Server Configuration
NODE_ENV=production
PORT=8000
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/social_platform_prod
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret-here

# File Upload Configuration
UPLOAD_PATH=/var/www/social-platform/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,mp4,mov

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# CDN Configuration
CDN_URL=https://your-cdn-domain.com
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Feature Flags
FEATURE_FLAGS_ENABLED=true
DEFAULT_FEATURE_FLAGS=new-ui:false,beta-features:false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Socket.IO Configuration
SOCKET_IO_CORS_ORIGIN=https://your-domain.com

# Security
CORS_ORIGIN=https://your-domain.com
CSRF_SECRET=your-csrf-secret-here

# Monitoring
LOG_LEVEL=info
LOG_FILE=/var/log/social-platform/app.log
```

#### Create PM2 Ecosystem File:
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'social-platform-backend',
    script: './main.js',
    cwd: '/var/www/social-platform/Website/Backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    error_file: '/var/log/social-platform/backend-error.log',
    out_file: '/var/log/social-platform/backend-out.log',
    log_file: '/var/log/social-platform/backend-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=4096'
  }]
};
```

#### Start Backend:
```bash
# Create log directory
sudo mkdir -p /var/log/social-platform
sudo chown $USER:$USER /var/log/social-platform

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
```

### 3. Frontend Deployment

#### Install Dependencies:
```bash
cd /var/www/social-platform/Website/Frontend
npm install
```

#### Environment Configuration:
```bash
# Create production environment file
nano .env.production
```

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_SOCKET_URL=https://api.your-domain.com

# CDN Configuration
NEXT_PUBLIC_CDN_URL=https://cdn.your-domain.com

# Feature Flags
NEXT_PUBLIC_FEATURE_FLAGS_ENABLED=true

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Social Login (optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id

# App Configuration
NEXT_PUBLIC_APP_NAME=Social Platform
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### Build Application:
```bash
# Build for production
npm run build

# Test build locally (optional)
npm start
```

#### PM2 Configuration for Frontend:
```bash
nano ecosystem.frontend.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'social-platform-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/social-platform/Website/Frontend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/social-platform/frontend-error.log',
    out_file: '/var/log/social-platform/frontend-out.log',
    log_file: '/var/log/social-platform/frontend-combined.log',
    time: true
  }]
};
```

#### Start Frontend:
```bash
pm2 start ecosystem.frontend.config.js
pm2 save
```

---

## 🌐 NGINX CONFIGURATION

### 1. SSL Certificate Setup

#### Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### Obtain SSL Certificate:
```bash
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

### 2. Nginx Configuration

#### Main Configuration:
```bash
sudo nano /etc/nginx/sites-available/social-platform
```

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Upstream servers
upstream backend {
    least_conn;
    server 127.0.0.1:8000;
    keepalive 32;
}

upstream frontend {
    least_conn;
    server 127.0.0.1:3000;
    keepalive 32;
}

# Frontend (Main Domain)
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    
    # Client Max Body Size
    client_max_body_size 50M;
    
    # Proxy to Next.js Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```nginx
# Backend API (Subdomain)
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # CORS Headers
    add_header Access-Control-Allow-Origin "https://your-domain.com" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    
    # API Routes
    location / {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

#### Enable Configuration:
```bash
sudo ln -s /etc/nginx/sites-available/social-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 SECURITY HARDENING

### 1. Firewall Configuration:
```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### 2. MongoDB Security:
```bash
# Create admin user
mongo
use admin
db.createUser({
  user: "admin",
  pwd: "strong-password",
  roles: ["root"]
})
exit

# Enable authentication
sudo nano /etc/mongod.conf
# Add: security.authorization: enabled
sudo systemctl restart mongod
```

### 3. Redis Security:
```bash
# Set password
sudo nano /etc/redis/redis.conf
# Add: requirepass your-strong-password
sudo systemctl restart redis
```

---

## 📊 MONITORING & LOGGING

### 1. PM2 Monitoring:
```bash
# View logs
pm2 logs

# Monitor processes
pm2 monit

# View status
pm2 status
```

### 2. Log Rotation:
```bash
# Create logrotate config
sudo nano /etc/logrotate.d/social-platform
```

```
/var/log/social-platform/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. Health Checks:
```bash
# Backend health check
curl https://api.your-domain.com/health

# Frontend health check
curl https://your-domain.com
```

---

## 🔄 DEPLOYMENT WORKFLOW

### 1. Initial Deployment:
```bash
# Clone repository
git clone <repo-url>

# Install dependencies
cd Website/Backend && npm install
cd ../Frontend && npm install

# Build frontend
npm run build

# Start services
pm2 start ecosystem.config.js
pm2 start ecosystem.frontend.config.js
pm2 save
```

### 2. Updates & Rollbacks:
```bash
# Pull latest changes
git pull origin main

# Backend update
cd Website/Backend
npm install
pm2 restart social-platform-backend

# Frontend update
cd Website/Frontend
npm install
npm run build
pm2 restart social-platform-frontend
```

### 3. Rollback:
```bash
# Revert to previous commit
git revert HEAD
git push

# Rebuild and restart
npm run build
pm2 restart all
```

---

## 🧪 POST-DEPLOYMENT TESTING

### 1. Smoke Tests:
```bash
# Test backend API
curl https://api.your-domain.com/health

# Test GraphQL
curl -X POST https://api.your-domain.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'

# Test frontend
curl https://your-domain.com
```

### 2. Feature Testing:
- ✅ Test user registration/login
- ✅ Test feature flags dashboard
- ✅ Test follow request system
- ✅ Test notifications
- ✅ Test trending pages
- ✅ Test story highlights
- ✅ Test message templates
- ✅ Test scheduled messages

### 3. Performance Testing:
```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 https://your-domain.com/

# Monitor response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/
```

---

## 🚨 TROUBLESHOOTING

### Common Issues:

#### 1. Backend Not Starting:
```bash
# Check logs
pm2 logs social-platform-backend

# Check port availability
sudo netstat -tulpn | grep 8000

# Restart service
pm2 restart social-platform-backend
```

#### 2. Frontend Build Errors:
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

#### 3. Database Connection Issues:
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection
mongo --eval "db.adminCommand('ping')"
```

#### 4. Nginx Errors:
```bash
# Check configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

---

## 📈 SCALING CONSIDERATIONS

### Horizontal Scaling:
- Add more backend instances with PM2 cluster mode
- Use load balancer (Nginx, HAProxy, AWS ELB)
- Implement Redis for session storage
- Use MongoDB replica sets

### Vertical Scaling:
- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching strategies
- Use CDN for static assets

### Database Optimization:
- Create proper indexes
- Implement query optimization
- Use MongoDB sharding for large datasets
- Regular database maintenance

---

## 🔄 BACKUP & RECOVERY

### 1. Database Backup:
```bash
# Create backup script
nano /usr/local/bin/backup-mongodb.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mongodump --out $BACKUP_DIR/backup_$DATE
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/backup_$DATE
rm -rf $BACKUP_DIR/backup_$DATE
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# Make executable
chmod +x /usr/local/bin/backup-mongodb.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /usr/local/bin/backup-mongodb.sh
```

### 2. Application Backup:
```bash
# Backup uploads directory
tar -czf /var/backups/uploads_$(date +%Y%m%d).tar.gz /var/www/social-platform/uploads

# Backup configuration
tar -czf /var/backups/config_$(date +%Y%m%d).tar.gz /var/www/social-platform/Website/Backend/.env.production
```

### 3. Recovery:
```bash
# Restore MongoDB
tar -xzf backup_20250101_020000.tar.gz
mongorestore --drop backup_20250101_020000/

# Restore uploads
tar -xzf uploads_20250101.tar.gz -C /
```

---

## 📊 MONITORING DASHBOARD

### 1. PM2 Plus (Optional):
```bash
# Link to PM2 Plus
pm2 link <secret-key> <public-key>

# Monitor at: https://app.pm2.io
```

### 2. Custom Monitoring:
- Set up Grafana + Prometheus
- Monitor CPU, RAM, Disk usage
- Track API response times
- Monitor error rates
- Set up alerts

---

## ✅ DEPLOYMENT CHECKLIST

### Pre-Deployment:
- [ ] Code reviewed and tested
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Database backups created
- [ ] DNS records configured

### Deployment:
- [ ] Server provisioned
- [ ] Dependencies installed
- [ ] Application deployed
- [ ] Nginx configured
- [ ] PM2 processes started
- [ ] SSL enabled

### Post-Deployment:
- [ ] Smoke tests passed
- [ ] Feature tests passed
- [ ] Performance tests passed
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Documentation updated

---

## 🎯 FINAL NOTES

### Best Practices:
- Always test in staging before production
- Keep dependencies updated
- Monitor logs regularly
- Implement proper error tracking
- Use environment variables for secrets
- Regular security audits
- Automated backups
- Load testing before major releases

### Support:
- Monitor error logs daily
- Set up alerts for critical issues
- Keep documentation updated
- Regular performance reviews
- Security patches applied promptly

---

**Deployment Guide Version:** 1.0.0  
**Last Updated:** January 2025  
**Status:** ✅ Production Ready

---

**🚀 Your application is now ready for production deployment! 🚀**
