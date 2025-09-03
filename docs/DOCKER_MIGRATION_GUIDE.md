# Docker Migration Guide

## 🎯 Objective

This guide allows you to gradually migrate to Docker **without breaking** the current project functionality.

## 📋 Current Situation vs Docker

### **Current Functionality (Preserved)**
```
Frontend (Next.js) → Backend Python (python main.py) → MongoDB Atlas
                    ↓
                Thirdweb Engine (separate)
```

### **Functionality with Docker (Optional)**
```
Frontend (Container) → Backend Python (Container) → MongoDB (Container)
                     ↓
                Thirdweb Engine (Container)
```

## 🚀 Gradual Migration

### **Phase 1: Docker Testing (Recommended)**
```bash
# Test Docker without interfering with current functionality
chmod +x docker-test.sh
./docker-test.sh
```

**What it does:**
- ✅ Tests only Thirdweb Engine with Docker
- ✅ Keeps frontend and backend working normally
- ✅ Uses current MongoDB Atlas
- ✅ Doesn't interfere with anything

### **Phase 2: Partial Migration**
```bash
# Migrate only Thirdweb Engine to Docker
docker-compose -f docker-compose.dev.yml up engine postgres redis -d

# Stop current Thirdweb Engine (if running)
# Frontend and backend continue working normally
```

### **Phase 3: Complete Migration (Optional)**
```bash
# Migrate everything to Docker
docker-compose up --build -d
```

## 🔧 Configurations by Phase

### **Phase 1: Current Configuration (No Changes)**
```env
# Current .env (keeps working)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENGINE_URL=http://localhost:3005
MONGODB_URI=mongodb+srv://...  # MongoDB Atlas
```

### **Phase 2: Partial Docker**
```env
# Current .env (continues working)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENGINE_URL=http://localhost:3005  # Now it's Docker
MONGODB_URI=mongodb+srv://...  # MongoDB Atlas
```

### **Phase 3: Complete Docker**
```env
# .env.docker (new file)
NEXT_PUBLIC_API_URL=http://backend:8000
NEXT_PUBLIC_ENGINE_URL=http://engine:3005
MONGODB_URI=mongodb://mongodb:27017/chiliz_fan_nft
```

## ⚠️ Possible Conflicts and Solutions

### **Conflict 1: Port 3005 in Use**
```bash
# Problem: Current Thirdweb Engine using port 3005
# Solution: Stop current engine first
pkill -f "thirdweb"  # or stop manually
docker-compose -f docker-compose.dev.yml up engine -d
```

### **Conflict 2: Port 5432 in Use**
```bash
# Problem: Local PostgreSQL using port 5432
# Solution: Use different port
# Edit docker-compose.dev.yml:
# ports: - "5433:5432"  # Use port 5433
```

### **Conflict 3: Environment Variables**
```bash
# Problem: Different URLs between current and Docker
# Solution: Keep current configuration, use proxy
```

## 📊 Performance Comparison

| Aspect | Current | Docker |
|---------|---------|--------|
| **Setup** | Manual | Automated |
| **Consistency** | System dependent | Guaranteed |
| **Performance** | Native | Slight overhead |
| **Maintenance** | Manual | Automated |
| **Deploy** | Complex | Simple |

## 🔄 Rollback (Return to Current Functionality)

### **If something goes wrong:**
```bash
# Stop all Docker containers
docker-compose -f docker-compose.dev.yml down
docker-compose down

# Return to current functionality
npm run dev  # Frontend
python main.py  # Backend
# Thirdweb Engine (run separately)
```

## 📝 Migration Checklist

### **Before Starting:**
- [ ] Backup current project
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Free ports (3005, 5432, 6379)

### **Phase 1 - Testing:**
- [ ] Run `./docker-test.sh`
- [ ] Verify Thirdweb Engine works
- [ ] Confirm frontend/backend continue working

### **Phase 2 - Partial Migration:**
- [ ] Stop current Thirdweb Engine
- [ ] Start Thirdweb Engine with Docker
- [ ] Test minting functionalities
- [ ] Check logs and performance

### **Phase 3 - Complete Migration (Optional):**
- [ ] Create `.env.docker`
- [ ] Migrate frontend to Docker
- [ ] Migrate backend to Docker
- [ ] Migrate MongoDB to Docker
- [ ] Test all functionalities

## 🆘 Support

### **Common Problems:**

1. **"Port already in use"**
   ```bash
   # Check what's using the port
   lsof -i :3005
   lsof -i :5432
   
   # Stop conflicting process
   kill -9 <PID>
   ```

2. **"Container failed to start"**
   ```bash
   # Check logs
   docker-compose -f docker-compose.dev.yml logs
   
   # Check configuration
   docker-compose -f docker-compose.dev.yml config
   ```

3. **"Environment variables not found"**
   ```bash
   # Check if .env exists
   ls -la .env
   
   # Check variables
   cat .env | grep THIRDWEB
   ```

### **Useful Commands:**
```bash
# Container status
docker-compose -f docker-compose.dev.yml ps

# Real-time logs
docker-compose -f docker-compose.dev.yml logs -f

# Restart specific service
docker-compose -f docker-compose.dev.yml restart engine

# Clean everything
docker-compose -f docker-compose.dev.yml down -v
docker system prune -f
```

## ✅ Conclusion

Migration to Docker is **100% optional** and **doesn't interfere** with current functionality. You can:

1. **Continue using** the project as is
2. **Test Docker** gradually
3. **Migrate completely** when you feel comfortable

The current project **continues working perfectly** regardless of Docker changes.
