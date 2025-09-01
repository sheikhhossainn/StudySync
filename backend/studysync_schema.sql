-- StudySync Database Schema
-- Created: September 1, 2025
-- Description: Complete database schema for StudySync platform

-- Drop existing database if it exists and create new one
DROP DATABASE IF EXISTS studysync;
CREATE DATABASE studysync
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    TEMPLATE = template0;

-- Connect to the StudySync database
\c studysync;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE USER MANAGEMENT TABLES
-- ============================================================================

-- Users table (Custom User Model)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(128) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_staff BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    date_joined TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Profiles table
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    profile_picture TEXT,
    bio TEXT,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    student_id VARCHAR(50),
    university VARCHAR(200),
    department VARCHAR(100),
    year_of_study INTEGER,
    gpa DECIMAL(3,2),
    skills TEXT[], -- Array of skills
    interests TEXT[], -- Array of interests
    location VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language_preference VARCHAR(10) DEFAULT 'en',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ACADEMIC STRUCTURE TABLES
-- ============================================================================

-- Subjects table
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    category VARCHAR(50),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    credits INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Subject relationship (what subjects users are studying/teaching)
CREATE TABLE user_subjects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('student', 'mentor', 'both')),
    proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, subject_id, role)
);

-- ============================================================================
-- STUDY SESSION MANAGEMENT
-- ============================================================================

-- Study Sessions table
CREATE TABLE study_sessions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    subject_id INTEGER REFERENCES subjects(id),
    host_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(20) CHECK (session_type IN ('group', 'one_on_one', 'workshop')) DEFAULT 'group',
    max_participants INTEGER DEFAULT 10,
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')) DEFAULT 'scheduled',
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    meeting_link TEXT,
    meeting_password VARCHAR(50),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50), -- daily, weekly, monthly
    tags TEXT[], -- Array of tags
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    is_paid BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session Participants table
CREATE TABLE session_participants (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES study_sessions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('host', 'participant', 'mentor')) DEFAULT 'participant',
    status VARCHAR(20) CHECK (status IN ('registered', 'attended', 'missed', 'cancelled')) DEFAULT 'registered',
    joined_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

-- ============================================================================
-- STUDY GROUPS
-- ============================================================================

-- Study Groups table
CREATE TABLE study_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    subject_id INTEGER REFERENCES subjects(id),
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    max_members INTEGER DEFAULT 20,
    current_members INTEGER DEFAULT 1,
    is_private BOOLEAN DEFAULT FALSE,
    invite_code VARCHAR(20) UNIQUE,
    group_image TEXT,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study Group Members table
CREATE TABLE study_group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('admin', 'moderator', 'member')) DEFAULT 'member',
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'banned')) DEFAULT 'active',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE,
    UNIQUE(group_id, user_id)
);

-- ============================================================================
-- MENTORSHIP SYSTEM
-- ============================================================================

-- Mentorships table
CREATE TABLE mentorships (
    id SERIAL PRIMARY KEY,
    mentor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    mentee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id),
    status VARCHAR(20) CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled')) DEFAULT 'pending',
    start_date DATE,
    end_date DATE,
    hourly_rate DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    goals TEXT,
    notes TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mentor_id, mentee_id, subject_id)
);

-- ============================================================================
-- MESSAGING SYSTEM
-- ============================================================================

-- Conversations table
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    conversation_type VARCHAR(20) CHECK (conversation_type IN ('direct', 'group', 'study_session')) DEFAULT 'direct',
    title VARCHAR(100),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Participants table
CREATE TABLE conversation_participants (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('admin', 'member')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT FALSE,
    UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) CHECK (message_type IN ('text', 'image', 'file', 'link', 'system')) DEFAULT 'text',
    content TEXT NOT NULL,
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    reply_to_id INTEGER REFERENCES messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FILE SHARING
-- ============================================================================

-- Shared Files table
CREATE TABLE shared_files (
    id SERIAL PRIMARY KEY,
    uploader_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES study_sessions(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES study_groups(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    description TEXT,
    download_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CALENDAR AND EVENTS
-- ============================================================================

-- Calendar Events table
CREATE TABLE calendar_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES study_sessions(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(20) CHECK (event_type IN ('study_session', 'exam', 'assignment', 'personal', 'deadline')) DEFAULT 'personal',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    location VARCHAR(200),
    reminder_time INTEGER, -- minutes before event
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50),
    color VARCHAR(7) DEFAULT '#3498db', -- hex color code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PAYMENT AND SUBSCRIPTION SYSTEM
-- ============================================================================

-- Subscription Plans table
CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_period VARCHAR(20) CHECK (billing_period IN ('monthly', 'yearly', 'lifetime')) DEFAULT 'monthly',
    features TEXT[], -- Array of features
    max_sessions_per_month INTEGER,
    max_group_memberships INTEGER,
    priority_support BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Subscriptions table
CREATE TABLE user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES subscription_plans(id),
    status VARCHAR(20) CHECK (status IN ('active', 'cancelled', 'expired', 'pending')) DEFAULT 'pending',
    start_date DATE NOT NULL,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT TRUE,
    payment_method_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES user_subscriptions(id),
    session_id INTEGER REFERENCES study_sessions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_type VARCHAR(20) CHECK (payment_type IN ('subscription', 'session', 'tip')) DEFAULT 'subscription',
    payment_method VARCHAR(20) CHECK (payment_method IN ('card', 'paypal', 'bank_transfer')) DEFAULT 'card',
    payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    transaction_id VARCHAR(100) UNIQUE,
    gateway_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Methods table
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    method_type VARCHAR(20) CHECK (method_type IN ('card', 'paypal', 'bank_account')) DEFAULT 'card',
    last_four VARCHAR(4),
    brand VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    gateway_customer_id VARCHAR(100),
    gateway_payment_method_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS SYSTEM
-- ============================================================================

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data as JSON
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- REVIEWS AND RATINGS
-- ============================================================================

-- Reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    reviewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reviewed_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES study_sessions(id) ON DELETE CASCADE,
    mentorship_id INTEGER REFERENCES mentorships(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    review_text TEXT,
    review_type VARCHAR(20) CHECK (review_type IN ('session', 'mentorship', 'general')) DEFAULT 'session',
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DJANGO REQUIRED TABLES
-- ============================================================================

-- Django Sessions table
CREATE TABLE django_session (
    session_key VARCHAR(40) PRIMARY KEY,
    session_data TEXT NOT NULL,
    expire_date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Django Migrations table
CREATE TABLE django_migrations (
    id SERIAL PRIMARY KEY,
    app VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    applied TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Django Content Types table
CREATE TABLE django_content_type (
    id SERIAL PRIMARY KEY,
    app_label VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    UNIQUE(app_label, model)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Study Sessions indexes
CREATE INDEX idx_study_sessions_host_id ON study_sessions(host_id);
CREATE INDEX idx_study_sessions_subject_id ON study_sessions(subject_id);
CREATE INDEX idx_study_sessions_status ON study_sessions(status);
CREATE INDEX idx_study_sessions_scheduled_start ON study_sessions(scheduled_start);

-- Messages indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_study_sessions_updated_at BEFORE UPDATE ON study_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_study_groups_updated_at BEFORE UPDATE ON study_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentorships_updated_at BEFORE UPDATE ON mentorships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update participant count in study sessions
CREATE OR REPLACE FUNCTION update_session_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE study_sessions 
        SET current_participants = (
            SELECT COUNT(*) 
            FROM session_participants 
            WHERE session_id = NEW.session_id 
            AND status = 'registered'
        )
        WHERE id = NEW.session_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE study_sessions 
        SET current_participants = (
            SELECT COUNT(*) 
            FROM session_participants 
            WHERE session_id = OLD.session_id 
            AND status = 'registered'
        )
        WHERE id = OLD.session_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE study_sessions 
        SET current_participants = (
            SELECT COUNT(*) 
            FROM session_participants 
            WHERE session_id = NEW.session_id 
            AND status = 'registered'
        )
        WHERE id = NEW.session_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for participant count
CREATE TRIGGER update_session_participants_trigger
    AFTER INSERT OR UPDATE OR DELETE ON session_participants
    FOR EACH ROW EXECUTE FUNCTION update_session_participant_count();

-- ============================================================================
-- SAMPLE DATA (OPTIONAL)
-- ============================================================================

-- Insert sample subjects
INSERT INTO subjects (name, code, description, category, difficulty_level, credits) VALUES
('Mathematics', 'MATH101', 'Basic Mathematics', 'STEM', 3, 3),
('Physics', 'PHYS101', 'Introduction to Physics', 'STEM', 4, 4),
('Computer Science', 'CS101', 'Programming Fundamentals', 'STEM', 3, 3),
('Chemistry', 'CHEM101', 'General Chemistry', 'STEM', 4, 4),
('Biology', 'BIO101', 'Introduction to Biology', 'STEM', 3, 3),
('English Literature', 'ENG101', 'Literature Analysis', 'Humanities', 2, 3),
('History', 'HIST101', 'World History', 'Humanities', 2, 3),
('Psychology', 'PSYC101', 'Introduction to Psychology', 'Social Sciences', 3, 3);

-- Insert sample subscription plans
INSERT INTO subscription_plans (name, description, price, billing_period, features, max_sessions_per_month, max_group_memberships) VALUES
('Free', 'Basic features for students', 0.00, 'monthly', ARRAY['5 sessions per month', 'Join 3 study groups', 'Basic messaging'], 5, 3),
('Student', 'Enhanced features for serious students', 9.99, 'monthly', ARRAY['20 sessions per month', 'Join 10 study groups', 'Priority support', 'File sharing'], 20, 10),
('Mentor', 'Full features for mentors and tutors', 29.99, 'monthly', ARRAY['Unlimited sessions', 'Create study groups', 'Advanced analytics', 'Payment processing'], NULL, NULL),
('Premium', 'All features unlocked', 49.99, 'monthly', ARRAY['Everything included', 'White-label options', 'API access', '24/7 support'], NULL, NULL);

-- Success message
SELECT 'StudySync database schema created successfully!' as status;
