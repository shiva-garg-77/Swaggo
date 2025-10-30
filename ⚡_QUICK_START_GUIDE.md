# ⚡ QUICK START GUIDE

**Project:** Social Media Platform - Advanced Features  
**Version:** 1.0.0  
**Status:** Production Ready

---

## 🚀 QUICK DEPLOYMENT (5 Minutes)

### Prerequisites:
- Node.js 18+
- MongoDB 6.0+
- Redis 7.0+
- PM2 installed globally

### 1. Clone & Install (2 min):
```bash
git clone <your-repo-url>
cd social-platform

# Backend
cd Website/Backend
npm install

# Frontend
cd ../Frontend
npm install
```

### 2. Configure Environment (1 min):
```bash
# Backend .env
cd Website/Backend
cp .env.example .env
# Edit: MONGODB_URI, JWT_SECRET, etc.

# Frontend .env
cd ../Frontend
cp .env.example .env.local
# Edit: NEXT_PUBLIC_API_URL, etc.
```

### 3. Build & Start (2 min):
```bash
# Build Frontend
cd Website/Frontend
npm run build

# Start Backend
cd ../Backend
pm2 start main.js --name backend

# Start Frontend
cd ../Frontend
pm2 start npm --name frontend -- start
```

### 4. Verify:
```bash
# Check services
pm2 status

# Test backend
curl http://localhost:8000/health

# Test frontend
curl http://localhost:3000
```

---

## 📚 DOCUMENTATION INDEX

### Essential Docs:
1. **📚 FINAL_PROJECT_SUMMARY.md** - Complete feature overview
2. **🚀 PRODUCTION_DEPLOYMENT_GUIDE.md** - Full deployment guide
3. **✅ WEEK_4_COMPLETE_VERIFICATION.md** - Week 4 verification
4. **🎊 FINAL_COMPLETION_SUMMARY.md** - Project completion summary

### Feature Docs:
- `FEATURE_FLAGS_COMPLETE.md` - Feature flags system
- `FOLLOW_REQUESTS_COMPLETE.md` - Follow request system
- `NOTIFICATIONS_COMPLETE.md` - Notifications system
- `TRENDING_HASHTAGS_COMPLETE.md` - Trending & hashtags
- `STORY_HIGHLIGHTS_COMPLETE.md` - Story highlights

---

## 🎯 FEATURE QUICK REFERENCE

### 1. Feature Flags
**Location:** `/admin/feature-flags`  
**Usage:**
```javascript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
const isEnabled = useFeatureFlag('feature-name');
```

### 2. Follow Requests
**Component:** `FollowRequestButton`  
**Usage:**
```javascript
import FollowRequestButton from '@/Components/MainComponents/Profile/FollowRequestButton';
<FollowRequestButton targetProfile={profile} />
```

### 3. Notifications
**Component:** `NotificationBell`  
**Usage:**
```javascript
import NotificationBell from '@/Components/MainComponents/Notification/NotificationBell';
<NotificationBell theme={theme} />
```

### 4. Trending/Hashtags
**Pages:** `/explore/trending`, `/explore/hashtag/[tag]`  
**Usage:** Navigate to explore pages

### 5. Story Highlights
**Component:** `HighlightViewer`  
**Usage:**
```javascript
import HighlightViewer from '@/Components/MainComponents/Story/HighlightViewer';
<HighlightViewer theme={theme} />
```

### 6. Message Templates
**Component:** `TemplatePickerButton`  
**Usage:**
```javascript
import TemplatePickerButton from '@/Components/Chat/Messaging/TemplatePickerButton';
<TemplatePickerButton onTemplateSelect={handleSelect} />
```

### 7. Scheduled Messages
**Component:** `ScheduleMessageModal`  
**Usage:**
```javascript
import ScheduleMessageModal from '@/Components/Chat/Messaging/ScheduleMessageModal';
<ScheduleMessageModal chatid={chatid} isOpen={isOpen} onClose={onClose} />
```

---

## 🔧 COMMON COMMANDS

### Development:
```bash
# Start backend dev
cd Website/Backend
npm run dev

# Start frontend dev
cd Website/Frontend
npm run dev
```

### Production:
```bash
# Build frontend
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save

# View logs
pm2 logs

# Restart
pm2 restart all
```

### Database:
```bash
# Backup MongoDB
mongodump --out /backup/$(date +%Y%m%d)

# Restore MongoDB
mongorestore /backup/20250101

# Check MongoDB status
sudo systemctl status mongod
```

---

## 🐛 TROUBLESHOOTING

### Backend Issues:
```bash
# Check logs
pm2 logs backend

# Restart
pm2 restart backend

# Check port
netstat -tulpn | grep 8000
```

### Frontend Issues:
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build

# Restart
pm2 restart frontend
```

### Database Issues:
```bash
# Check MongoDB
sudo systemctl status mongod

# Check Redis
redis-cli ping

# Restart services
sudo systemctl restart mongod redis
```

---

## 📊 MONITORING

### PM2 Monitoring:
```bash
# Real-time monitoring
pm2 monit

# Process status
pm2 status

# View logs
pm2 logs
```

### Health Checks:
```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000

# Database health
mongo --eval "db.adminCommand('ping')"
```

---

## 🔐 SECURITY CHECKLIST

- [ ] Change default JWT_SECRET
- [ ] Set strong MongoDB password
- [ ] Configure Redis password
- [ ] Enable firewall (UFW)
- [ ] Set up SSL certificates
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up monitoring

---

## 📞 SUPPORT

### Documentation:
- Full docs in project root
- API docs in `/docs` folder
- Component examples in each file

### Common Issues:
- Check PM2 logs first
- Verify environment variables
- Ensure services are running
- Check firewall rules

---

## ✅ DEPLOYMENT CHECKLIST

### Pre-Deployment:
- [ ] Environment variables set
- [ ] Database configured
- [ ] Redis configured
- [ ] SSL certificates ready
- [ ] DNS configured

### Deployment:
- [ ] Code deployed
- [ ] Dependencies installed
- [ ] Frontend built
- [ ] Services started
- [ ] Nginx configured

### Post-Deployment:
- [ ] Health checks passed
- [ ] Features tested
- [ ] Monitoring active
- [ ] Backups scheduled

---

## 🎯 QUICK LINKS

### Admin Dashboards:
- Feature Flags: `/admin/feature-flags`
- Analytics: `/admin/analytics`

### User Pages:
- Trending: `/explore/trending`
- Notifications: `/notifications`
- Follow Requests: `/follow-requests`

### API Endpoints:
- Health: `/health`
- GraphQL: `/graphql`
- REST API: `/api/v1/*`

---

**🚀 You're ready to go! Check the full documentation for detailed information. 🚀**

---

**Quick Start Guide Version:** 1.0.0  
**Last Updated:** January 2025  
**Status:** ✅ Ready to Use
