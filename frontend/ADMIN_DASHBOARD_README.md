# StudySync Admin Dashboard

## Overview
The Admin Dashboard provides comprehensive user management capabilities for StudySync administrators. Admins can view, monitor, and manage all users (students and mentors) on the platform.

## Features

### 📊 Dashboard Statistics
- **Total Users**: Overview of all registered users
- **Students**: Count of student accounts
- **Mentors**: Count of mentor accounts  
- **Premium Users**: Count of users with premium subscriptions

### 👥 User Management
- **User Table**: Comprehensive view of all users with:
  - User ID, Name, Email
  - User Type (Student/Mentor)
  - Status (Active/Inactive)
  - Premium membership status
  - Join date and last activity
  - Action buttons (View/Delete)

### 🔍 Search & Filter
- **Search**: Find users by name or email
- **Filter Options**:
  - All Users
  - Students only
  - Mentors only
  - Premium users only

### 📄 Pagination
- Navigate through large user lists
- Configurable users per page (default: 10)
- Page navigation with first/last/ellipsis

### 🗑️ User Management Actions
- **View User Details**: Complete user profile information
- **Delete User**: Remove user accounts with confirmation
- **Safety Features**: Confirmation modal before deletion

## Access Control

### Admin Authentication
- Only users with `admin` role can access the dashboard
- Automatic redirect for unauthorized users
- Session-based authentication

### Demo Access
For testing purposes, use the admin login page (`admin-login.html`):
- **Admin Credentials**: 
  - Email: `admin@studysync.com`
  - Password: `admin123`
- **Quick Demo Buttons**:
  - Login as Admin
  - Login as Regular User

## File Structure

```
├── admin-dashboard.html          # Main admin dashboard page
├── admin-login.html             # Admin authentication page
├── assets/
│   ├── css/
│   │   └── admin-dashboard.css  # Dashboard-specific styles
│   └── js/
│       ├── admin-dashboard.js   # Dashboard functionality
│       └── config.js           # Updated with admin role logic
```

## Navigation Integration

The admin dashboard link appears in the main navigation only for admin users:
- **Visible**: When `userRole === 'admin'`
- **Hidden**: For regular users and guests
- **Icon**: Dashboard icon with "Admin" label

## Technical Implementation

### JavaScript Functions
- `loadUsers()`: Fetch and display user data
- `filterUsers()`: Search and filter functionality
- `renderUsers()`: Display users in table format
- `updateStatistics()`: Calculate dashboard stats
- `deleteUser()`: Remove user with confirmation
- `viewUser()`: Show detailed user information

### CSS Features
- Responsive design for mobile/desktop
- Modern card-based layout
- Interactive hover effects
- Modal dialogs for confirmations
- Toast notifications for feedback

### Security Features
- Role-based access control
- Confirmation dialogs for destructive actions
- Input validation and sanitization
- Session management

## Usage Instructions

### For Administrators:
1. **Access Dashboard**: Navigate to `/admin-dashboard.html` or click "Admin" in navigation
2. **View Statistics**: Dashboard shows user counts at the top
3. **Search Users**: Use search box to find specific users
4. **Filter Users**: Select user type from dropdown
5. **View Details**: Click eye icon to see full user profile
6. **Delete Users**: Click trash icon and confirm deletion
7. **Navigate Pages**: Use pagination controls for large user lists

### For Testing:
1. **Admin Login**: Go to `/admin-login.html`
2. **Demo Access**: Use quick demo buttons
3. **Role Testing**: Switch between admin/user roles
4. **Feature Testing**: Test all dashboard features

## Future Enhancements

### Planned Features:
- **User Analytics**: Activity graphs and usage statistics
- **Bulk Actions**: Select multiple users for batch operations
- **User Export**: Download user data as CSV/Excel
- **Role Management**: Assign/modify user roles
- **Activity Logs**: Track admin actions and user activities
- **Email Integration**: Send notifications to users
- **Advanced Filters**: Date ranges, activity levels, etc.

### API Integration:
- **Backend Integration**: Connect to Django REST API
- **Real-time Updates**: WebSocket for live user status
- **Database Operations**: CRUD operations via API endpoints
- **Authentication**: JWT token-based admin auth

## Troubleshooting

### Common Issues:
1. **Admin Link Not Visible**: Check `localStorage.userRole` is set to 'admin'
2. **Access Denied**: Ensure admin authentication is complete
3. **Users Not Loading**: Check console for API errors
4. **Delete Not Working**: Verify user permissions and confirmations

### Debug Commands:
```javascript
// Check current role
localStorage.getItem('userRole')

// Set admin role for testing
localStorage.setItem('userRole', 'admin')

// Check admin authentication
console.log('Is Admin:', localStorage.getItem('userRole') === 'admin')
```

## Security Notes

⚠️ **Important Security Considerations:**
- This is a demo implementation with mock data
- In production, implement proper server-side authentication
- Use HTTPS for all admin operations
- Implement audit logging for admin actions
- Add rate limiting for admin endpoints
- Validate all user inputs server-side

## Support

For questions or issues with the admin dashboard:
1. Check browser console for errors
2. Verify user role and authentication
3. Test with demo credentials
4. Review file paths and dependencies

---

**Admin Dashboard Version**: 1.0.0  
**Last Updated**: December 2024  
**Compatibility**: Modern browsers with ES6+ support
