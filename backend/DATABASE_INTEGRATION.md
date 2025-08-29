# StudySync Database Integration

This document explains how to set up and use the PostgreSQL database integration for StudySync platform.

## 🚀 Quick Setup

### Prerequisites
- PostgreSQL 12+ installed
- Python 3.8+ installed
- Git installed

### 1. Database Setup

#### Windows
```bash
cd backend
setup_database.bat
```

#### Linux/Mac
```bash
cd backend
chmod +x setup_database.sh
./setup_database.sh
```

### 2. Manual Setup (if scripts don't work)

1. **Create PostgreSQL Database**
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database and user
CREATE DATABASE studysync_db;
CREATE USER studysync_user WITH ENCRYPTED PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE studysync_db TO studysync_user;

-- Grant additional permissions
\c studysync_db
GRANT ALL ON SCHEMA public TO studysync_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO studysync_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO studysync_user;
```

2. **Set up Environment Variables**
Create/update `.env` file in the backend directory:
```
DB_NAME=studysync_db
DB_USER=studysync_user
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=your-secret-key-here
DEBUG=True
```

3. **Install Python Dependencies**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. **Run Migrations**
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

5. **Start the Server**
```bash
python manage.py runserver
```

## 📊 Database Schema

The database consists of the following main tables:

### Core Tables
- **users**: User authentication and basic info
- **students**: Student-specific profiles
- **mentors**: Mentor-specific profiles
- **posts**: Study session posts and requests
- **join_requests**: Requests to join study sessions
- **user_connections**: Mentor-student relationships
- **messages**: Direct messaging between users
- **reviews**: User ratings and feedback

### Key Features
- **UUID Primary Keys**: All tables use UUID for better security
- **Automatic Timestamps**: Created/updated timestamps are managed automatically
- **Data Validation**: Comprehensive constraints ensure data integrity
- **Indexing**: Optimized for common query patterns
- **Triggers**: Automatic updates for timestamps and data consistency

## 🔌 API Endpoints

### Study Sessions
- `GET /api/study-sessions/posts/` - List all posts
- `POST /api/study-sessions/posts/` - Create new post
- `GET /api/study-sessions/posts/{id}/` - Get specific post
- `PATCH /api/study-sessions/posts/{id}/` - Update post
- `DELETE /api/study-sessions/posts/{id}/` - Delete post
- `GET /api/study-sessions/my-posts/` - Get current user's posts

### Join Requests
- `GET /api/study-sessions/join-requests/` - List join requests
- `POST /api/study-sessions/join-requests/` - Create join request
- `PATCH /api/study-sessions/join-requests/{id}/respond/` - Accept/reject request

### Messages
- `GET /api/study-sessions/messages/` - List messages
- `POST /api/study-sessions/messages/` - Send message
- `PATCH /api/study-sessions/messages/{id}/read/` - Mark as read

## 🎨 Frontend Integration

### My Posts Page
The `my-posts.html` page is now fully integrated with the database:

1. **Real-time Data**: Posts are fetched from PostgreSQL
2. **Dynamic Updates**: Changes are immediately reflected in the database
3. **Interactive Buttons**: Edit, Delete, View Participants work with actual data
4. **Filtering**: Status and subject filters work with database queries

### JavaScript API Client
The `assets/js/my-posts.js` file provides:
- **fetchMyPosts()**: Load user's posts from database
- **createPost()**: Create new posts
- **updatePost()**: Edit existing posts
- **deletePost()**: Remove posts (soft delete)
- **respondToJoinRequest()**: Handle join requests

### Usage Example
```javascript
// Fetch and display user's posts
await MyPostsAPI.fetchMyPosts();

// Create a new post
await MyPostsAPI.createPost({
    title: "JavaScript Study Group",
    content: "Let's learn React together!",
    post_type: "study_group",
    subject_area: "JavaScript",
    difficulty_level: "intermediate"
});

// Delete a post
await MyPostsAPI.deletePost(postId);
```

## 🔐 Authentication

The system uses JWT tokens for authentication:

1. **Login**: User receives JWT token
2. **Storage**: Token stored in localStorage
3. **API Calls**: Token included in Authorization header
4. **Validation**: Django validates token for each request

## 📱 Features Implemented

### ✅ Completed
- **Database Schema**: Complete PostgreSQL schema
- **Django Models**: All models with relationships
- **API Endpoints**: RESTful API for all operations
- **Frontend Integration**: my-posts.html connected to database
- **Real-time Updates**: Changes reflect immediately
- **Data Validation**: Client and server-side validation
- **Authentication**: JWT-based authentication
- **Filtering**: Dynamic filtering by status and subject

### 🔄 Data Flow
1. **Frontend**: User interacts with my-posts.html
2. **JavaScript**: API calls to Django backend
3. **Django**: Processes request, validates data
4. **PostgreSQL**: Data stored/retrieved from database
5. **Response**: Updated data sent back to frontend
6. **UI Update**: Page refreshes with new data

### 📊 Database Operations
- **Create**: New posts saved to database
- **Read**: Posts fetched from database with filters
- **Update**: Post modifications saved to database
- **Delete**: Soft delete (is_active = false)
- **Join Requests**: Tracked in join_requests table
- **Participants**: Managed through user_connections

## 🛠 Development Tools

### Django Admin
Access at `http://localhost:8000/admin/`
- Manage users, posts, and all data
- View database statistics
- Debug data issues

### Database Tools
- **pgAdmin**: GUI for PostgreSQL management
- **psql**: Command-line PostgreSQL client
- **Django Shell**: `python manage.py shell` for data manipulation

### API Testing
- **Django REST Framework**: Built-in API browser at `/api/`
- **Postman**: Test API endpoints
- **curl**: Command-line API testing

## 🚀 Production Deployment

### Environment Variables
```bash
# Production settings
DEBUG=False
SECRET_KEY=your-production-secret-key
DB_HOST=your-production-db-host
DB_PASSWORD=your-production-db-password
ALLOWED_HOSTS=your-domain.com
```

### Database Migration
```bash
# Backup current database
pg_dump studysync_db > backup.sql

# Apply migrations
python manage.py migrate

# Load production data
python manage.py loaddata production_data.json
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify credentials in .env file
   - Ensure database exists

2. **Migration Errors**
   - Delete migration files and recreate: `python manage.py makemigrations`
   - Reset database: `python manage.py flush`

3. **Frontend Not Loading Data**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Check authentication token

4. **CORS Issues**
   - Ensure django-cors-headers is installed
   - Check CORS settings in Django settings

### Debug Commands
```bash
# Check database connection
python manage.py dbshell

# Create test data
python manage.py shell
>>> from accounts.models import User
>>> User.objects.create_user(email='test@example.com', password='password', user_type='student')

# View logs
tail -f logs/django.log
```

## 📈 Performance Optimization

### Database Indexing
- Indexes created for common queries
- GIN indexes for array fields (tags, expertise)
- Composite indexes for frequent filter combinations

### Query Optimization
- `select_related()` for foreign keys
- `prefetch_related()` for many-to-many relationships
- Database-level aggregations for counts

### Caching
- Django cache framework for frequently accessed data
- Redis recommended for production
- Cache invalidation on data updates

## 🔒 Security Features

### Data Protection
- UUID primary keys prevent enumeration attacks
- Input validation and sanitization
- SQL injection protection through Django ORM
- XSS protection in templates

### Authentication Security
- JWT tokens with expiration
- Password hashing with Django's PBKDF2
- Rate limiting on API endpoints
- HTTPS enforcement in production

## 📚 Next Steps

1. **Add More Filters**: Date range, popularity, location
2. **Real-time Notifications**: WebSocket integration
3. **File Uploads**: Profile pictures, documents
4. **Advanced Search**: Full-text search with PostgreSQL
5. **Analytics Dashboard**: User engagement metrics
6. **Mobile API**: React Native or Flutter integration

---

**Happy coding! 🎉**

For questions or issues, please check the troubleshooting section or create an issue in the repository.
