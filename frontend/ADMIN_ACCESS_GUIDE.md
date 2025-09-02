# StudySync Admin Access Configuration

## 🔐 Special Admin Access Methods

### Method 1: Admin Portal Page
**URL**: `http://localhost:3000/admin-portal.html`
**Access Codes**:
- `ADMIN2024SS` - Super Admin Access
- `MANAGER2024` - Manager Level Access  
- `DEVTEST123` - Developer Admin Access
- `STUDYSYNC24` - Standard Admin Access

### Method 2: Special Port Configuration
**Admin Port**: `8080`
**URL**: `http://localhost:8080/admin-dashboard.html`
**Setup**: Configure web server to serve admin files on port 8080

### Method 3: Secure Subdomain
**URL**: `https://admin.studysync.localhost:3000/dashboard`
**Setup**: Configure DNS/hosts file for admin subdomain

### Method 4: Hidden URL Path
**URL**: `http://localhost:3000/admin-panel/secure-access`
**Setup**: Configure URL rewriting to admin dashboard

---

## 🚀 Server Configuration Instructions

### For Development (Live Server / VS Code)

#### Option 1: Multiple Ports Setup
```bash
# Terminal 1 - Main site (Port 3000)
npx live-server --port=3000 --host=localhost

# Terminal 2 - Admin site (Port 8080)  
npx live-server --port=8080 --host=localhost --open=admin-dashboard.html
```

#### Option 2: Apache/Nginx Configuration
```apache
# Apache Virtual Host for Admin
<VirtualHost admin.studysync.localhost:3000>
    DocumentRoot "C:/Users/Usha_Personal_Laptop/Desktop/Vs all Code/StudySync/frontend"
    ServerName admin.studysync.localhost
    
    # Redirect all requests to admin dashboard
    RewriteEngine On
    RewriteRule ^/dashboard$ /admin-dashboard.html [L]
    RewriteRule ^/login$ /admin-portal.html [L]
</VirtualHost>
```

#### Option 3: Node.js Express Server
```javascript
const express = require('express');
const path = require('path');

// Main app (Port 3000)
const app = express();
app.use(express.static('frontend'));

// Admin app (Port 8080)
const adminApp = express();
adminApp.use(express.static('frontend'));
adminApp.use('/admin-panel/secure-access', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/admin-dashboard.html'));
});

app.listen(3000, () => console.log('Main site: http://localhost:3000'));
adminApp.listen(8080, () => console.log('Admin site: http://localhost:8080'));
```

---

## 🔧 Quick Setup Commands

### Windows (PowerShell)
```powershell
# Install live-server globally
npm install -g live-server

# Start main site
Start-Process powershell -ArgumentList "cd 'C:\Users\Usha_Personal_Laptop\Desktop\Vs all Code\StudySync\frontend'; live-server --port=3000"

# Start admin site  
Start-Process powershell -ArgumentList "cd 'C:\Users\Usha_Personal_Laptop\Desktop\Vs all Code\StudySync\frontend'; live-server --port=8080 --open=admin-portal.html"
```

### Hosts File Configuration (Windows)
```bash
# Add to C:\Windows\System32\drivers\etc\hosts
127.0.0.1    admin.studysync.localhost
127.0.0.1    studysync.localhost
```

---

## 🎯 Access URLs Summary

| Method | URL | Port | Security |
|--------|-----|------|----------|
| **Admin Portal** | `localhost:3000/admin-portal.html` | 3000 | Access Code Required |
| **Direct Admin** | `localhost:8080/admin-dashboard.html` | 8080 | Role Verification |
| **Secure Path** | `localhost:3000/admin-panel/secure-access` | 3000 | URL Rewriting |
| **Subdomain** | `admin.studysync.localhost:3000` | 3000 | DNS/Hosts Setup |

---

## 🔐 Security Features

### Access Control
- **Multi-level Access Codes**: Different codes for different admin levels
- **Session Management**: Temporary access tokens
- **Role Verification**: Backend role checking
- **Activity Logging**: All admin actions logged

### Authentication Flow
1. **Access Code Entry**: User enters special code
2. **Code Verification**: System validates against database
3. **Session Creation**: Temporary admin session established  
4. **Dashboard Access**: Redirect to admin interface
5. **Activity Monitoring**: All actions tracked

---

## 🚨 Production Security Notes

### For Live Deployment:
- Use HTTPS for all admin access
- Implement 2FA for admin accounts
- Set up VPN access for admin panel
- Enable IP whitelisting
- Use strong encryption for access codes
- Implement rate limiting
- Set up audit logging
- Regular security audits

### Environment Variables:
```bash
ADMIN_ACCESS_CODE=your_secure_code_here
ADMIN_PORT=8080
ADMIN_SUBDOMAIN=admin.yourdomain.com
SSL_CERT_PATH=/path/to/ssl/cert
JWT_SECRET=your_jwt_secret_here
```

---

## 📞 Quick Access Guide

### For Immediate Testing:
1. **Simple Access**: Open `admin-portal.html` in browser
2. **Enter Code**: Use `ADMIN2024SS` or `STUDYSYNC24`
3. **Dashboard**: Automatically redirected to admin panel
4. **Full Access**: Manage users, view statistics, delete accounts

### For Production Setup:
1. **Configure Server**: Set up dedicated admin port/subdomain
2. **Security Setup**: Implement proper authentication
3. **SSL Certificate**: Enable HTTPS for admin access
4. **Monitoring**: Set up logging and alerting
5. **Backup Access**: Configure emergency access methods

---

**🔗 Primary Access URL**: `http://localhost:3000/admin-portal.html`
**🔑 Access Code**: `ADMIN2024SS`
**📱 Mobile Friendly**: Yes, responsive design
**🛡️ Security Level**: High (with access codes and role verification)
