# StudySync Mentorship Feature

## Overview
The mentorship feature allows students to post their mentorship requests and connect with potential mentors. This feature includes a comprehensive form for creating detailed mentorship requests and a database-ready backend API.

## Features

### Frontend Features
- **Mentorship Request Modal**: A comprehensive form for students to create detailed mentorship requests
- **Dynamic Loading**: Automatically loads and displays mentorship requests from the database
- **Responsive Design**: Mobile-friendly interface with modern styling
- **User Authentication**: Integrated with the existing authentication system
- **Real-time Notifications**: Success/error feedback for user actions

### Backend Features
- **RESTful API**: Complete CRUD operations for mentorship requests
- **User Connections**: System for managing mentor-student relationships
- **Review System**: Ability for users to review their mentoring experience
- **Advanced Filtering**: Filter requests by field, budget, experience level, etc.
- **Database Optimization**: Proper indexing and relationships

## Database Models

### MentorshipRequest
- **Fields**: title, description, target_role, field, topics, experience_level, preferred_time, session_frequency, budget, duration, additional_info, status
- **Relationships**: Belongs to User (author)
- **Features**: UUID primary key, timestamps, soft deletes, status tracking

### UserConnection
- **Purpose**: Manages mentor-student relationships
- **Status Tracking**: pending, active, inactive
- **Features**: Tracks who initiated the connection, start/end dates

### Review
- **Purpose**: User feedback and rating system
- **Features**: 1-5 star rating, comments, connection tracking

## API Endpoints

### Mentorship Requests
- `GET /api/mentorship/requests/` - List all active mentorship requests
- `POST /api/mentorship/requests/` - Create a new mentorship request
- `GET /api/mentorship/requests/{id}/` - Get specific mentorship request
- `PUT /api/mentorship/requests/{id}/` - Update mentorship request (author only)
- `DELETE /api/mentorship/requests/{id}/` - Delete mentorship request (author only)
- `GET /api/mentorship/requests/my/` - Get current user's mentorship requests
- `POST /api/mentorship/requests/{id}/respond/` - Respond to a mentorship request

### User Connections
- `GET /api/mentorship/connections/` - List user's connections
- `POST /api/mentorship/connections/` - Create new connection
- `GET /api/mentorship/connections/{id}/` - Get specific connection
- `POST /api/mentorship/connections/{id}/accept/` - Accept connection request

### Reviews
- `GET /api/mentorship/reviews/` - List reviews
- `POST /api/mentorship/reviews/` - Create new review

## Setup Instructions

### Database Migration
1. Run the migration to create the mentorship tables:
   ```bash
   python manage.py migrate mentorship
   ```

### Dependencies
- Django REST Framework
- PostgreSQL (configured in settings)
- UUID support for primary keys

## Frontend Usage

### Creating a Mentorship Request
1. User clicks "Post a Mentorship Request" button
2. Modal opens with comprehensive form
3. User fills in required fields:
   - Title and description
   - Target role and field
   - Topics/skills needed
   - Experience level and budget
   - Optional preferences (time, frequency, duration)
4. Form submits to API endpoint
5. Success notification and page refresh

### Viewing Mentorship Requests
- Requests are automatically loaded on page visit
- Each request displays in a card format with:
  - Author information
  - Target role and topics
  - Budget and time preferences
  - Experience level and field
  - "Offer Mentorship" button

## Customization

### Form Fields
The mentorship form includes predefined choices for:
- **Fields**: Software Engineering, Data Science, ML, Product Management, etc.
- **Experience Levels**: Student to Senior (5+ years)
- **Budget Ranges**: Free to $5000+
- **Time Preferences**: Morning, Afternoon, Evening, Weekend, Flexible
- **Session Frequency**: Weekly, Bi-weekly, Monthly, As needed
- **Duration**: 1 month to Ongoing

### Styling
- Uses existing StudySync design system
- Additional CSS in `mentorship.css`
- Responsive grid layout
- Modal styling with backdrop blur
- Loading indicators and error states

## Security Features
- JWT token authentication required for creating requests
- Users can only modify their own requests
- Input validation and sanitization
- CORS protection
- SQL injection prevention through Django ORM

## Future Enhancements
- Real-time messaging between mentors and students
- Advanced matching algorithm
- Payment integration for paid mentorship
- Calendar integration for scheduling
- Video call integration
- Mentorship program templates
- Advanced analytics and reporting

## File Structure
```
backend/mentorship/
├── models.py          # Database models
├── serializers.py     # API serializers
├── views.py          # API views
├── urls.py           # URL routing
├── admin.py          # Django admin configuration
└── migrations/       # Database migrations

frontend/
├── mentorship.html   # Main mentorship page
└── assets/
    └── css/
        └── mentorship.css  # Mentorship-specific styles
```

## Testing
- All API endpoints should be tested with proper authentication
- Form validation should be tested with various input combinations
- Responsive design should be tested on different screen sizes
- Database relationships should be tested for integrity

This mentorship feature provides a solid foundation for connecting students with mentors and can be extended with additional functionality as needed.
