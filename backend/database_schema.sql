-- StudySync Database Schema for PostgreSQL
-- This file contains the complete database schema for the StudySync platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types for better data integrity
CREATE TYPE user_type_enum AS ENUM ('student', 'mentor');
CREATE TYPE post_type_enum AS ENUM ('help_request', 'study_group', 'mentorship', 'discussion');
CREATE TYPE difficulty_level_enum AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE request_status_enum AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE connection_status_enum AS ENUM ('pending', 'active', 'inactive');
CREATE TYPE subscription_type_enum AS ENUM ('free', 'premium');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method_enum AS ENUM ('bkash', 'nagad', 'rocket', 'bank_transfer', 'card');

-- Users table - Core authentication and user management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type user_type_enum NOT NULL,
    subscription_type subscription_type_enum DEFAULT 'free',
    premium_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    email_verification_expires_at TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_premium_check CHECK (
        (subscription_type = 'free' AND premium_expires_at IS NULL) OR
        (subscription_type = 'premium' AND premium_expires_at IS NOT NULL)
    )
);

-- Students table - Student-specific information
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id_card_image_url VARCHAR(500),
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    age INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM AGE(date_of_birth))) STORED,
    institution_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(100),
    field_of_study VARCHAR(255) NOT NULL,
    academic_year INTEGER CHECK (academic_year BETWEEN 1 AND 10),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT students_name_check CHECK (LENGTH(TRIM(name)) >= 2),
    CONSTRAINT students_dob_check CHECK (date_of_birth <= CURRENT_DATE AND date_of_birth >= (CURRENT_DATE - INTERVAL '100 years')),
    CONSTRAINT students_bio_length CHECK (LENGTH(bio) <= 1000)
);

-- Mentors table - Mentor-specific information
CREATE TABLE IF NOT EXISTS mentors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nid_card_image_url VARCHAR(500),
    organization_id_card_image_url VARCHAR(500),
    name VARCHAR(255) NOT NULL,
    age INTEGER CHECK (age BETWEEN 18 AND 100),
    expertise TEXT[] NOT NULL, -- Array of expertise areas
    years_of_experience INTEGER CHECK (years_of_experience >= 0),
    job_role VARCHAR(255) NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    bio TEXT,
    linkedin_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT mentors_name_check CHECK (LENGTH(TRIM(name)) >= 2),
    CONSTRAINT mentors_linkedin_check CHECK (linkedin_url IS NULL OR linkedin_url ~* '^https?://(www\.)?linkedin\.com/'),
    CONSTRAINT mentors_bio_length CHECK (LENGTH(bio) <= 1500),
    CONSTRAINT mentors_expertise_check CHECK (array_length(expertise, 1) > 0)
);

-- Posts table - User-generated content
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    post_type post_type_enum NOT NULL,
    subject_area VARCHAR(255) NOT NULL,
    difficulty_level difficulty_level_enum,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    tags TEXT[], -- Array of tags for better searchability
    expires_at TIMESTAMP WITH TIME ZONE, -- For time-sensitive posts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT posts_title_check CHECK (LENGTH(TRIM(title)) BETWEEN 5 AND 255),
    CONSTRAINT posts_content_check CHECK (LENGTH(TRIM(content)) >= 10),
    CONSTRAINT posts_expires_check CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Join requests table - Requests to join posts/activities
CREATE TABLE IF NOT EXISTS join_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status request_status_enum DEFAULT 'pending',
    message TEXT,
    response_message TEXT, -- Message from post owner when accepting/rejecting
    responded_by UUID REFERENCES users(id), -- Who responded to the request
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT join_requests_unique_request UNIQUE (post_id, requester_user_id),
    CONSTRAINT join_requests_message_length CHECK (LENGTH(message) <= 500),
    CONSTRAINT join_requests_response_message_length CHECK (LENGTH(response_message) <= 500),
    CONSTRAINT join_requests_response_logic CHECK (
        (status = 'pending' AND responded_by IS NULL AND responded_at IS NULL) OR
        (status IN ('accepted', 'rejected') AND responded_by IS NOT NULL AND responded_at IS NOT NULL)
    )
);

-- User connections table - Mentor-Student relationships
CREATE TABLE IF NOT EXISTS user_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_status connection_status_enum DEFAULT 'pending',
    initiated_by UUID NOT NULL REFERENCES users(id), -- Who initiated the connection
    notes TEXT, -- Private notes about the connection
    started_at TIMESTAMP WITH TIME ZONE, -- When connection became active
    ended_at TIMESTAMP WITH TIME ZONE, -- When connection ended
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT user_connections_unique_pair UNIQUE (mentor_user_id, student_user_id),
    CONSTRAINT user_connections_different_users CHECK (mentor_user_id != student_user_id),
    CONSTRAINT user_connections_notes_length CHECK (LENGTH(notes) <= 1000),
    CONSTRAINT user_connections_dates_logic CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- Messages table - For direct communication between users
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT messages_different_users CHECK (sender_id != receiver_id),
    CONSTRAINT messages_content_check CHECK (LENGTH(TRIM(content)) > 0 AND LENGTH(content) <= 2000)
);

-- Reviews table - For rating mentors/students
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_id UUID REFERENCES user_connections(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT reviews_unique_review UNIQUE (reviewer_id, reviewee_id, connection_id),
    CONSTRAINT reviews_different_users CHECK (reviewer_id != reviewee_id),
    CONSTRAINT reviews_comment_length CHECK (LENGTH(comment) <= 1000)
);

-- Subscription plans table - Define available subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    currency VARCHAR(3) DEFAULT 'BDT',
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    features JSONB NOT NULL DEFAULT '{}', -- Features included in this plan
    is_active BOOLEAN DEFAULT true,
    max_posts_per_month INTEGER,
    can_use_mentorship BOOLEAN DEFAULT false,
    has_ads BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User subscriptions table - Track user's subscription history
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT user_subscriptions_dates_check CHECK (expires_at > started_at)
);

-- Payments table - Track all payment transactions
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'BDT',
    payment_method payment_method_enum NOT NULL,
    payment_status payment_status_enum DEFAULT 'pending',
    transaction_id VARCHAR(255), -- External payment gateway transaction ID
    payment_gateway_response JSONB, -- Full response from payment gateway
    payment_intent_id VARCHAR(255), -- For tracking payment intent
    failure_reason TEXT, -- Reason for payment failure
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT payments_status_logic CHECK (
        (payment_status = 'completed' AND paid_at IS NOT NULL) OR
        (payment_status != 'completed' AND paid_at IS NULL)
    )
);

-- Payment methods table - Store user's saved payment methods
CREATE TABLE IF NOT EXISTS user_payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method_type payment_method_enum NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20), -- For mobile banking
    account_number VARCHAR(50), -- For bank accounts
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Advertisement table - Manage ads for free users
CREATE TABLE IF NOT EXISTS advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    image_url VARCHAR(500),
    click_url VARCHAR(500),
    target_audience JSONB DEFAULT '{}', -- JSON with targeting criteria
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 10),
    impressions_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT ads_dates_check CHECK (end_date IS NULL OR end_date > start_date)
);

-- Ad impressions table - Track ad views
CREATE TABLE IF NOT EXISTS ad_impressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    clicked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_institution ON students(institution_name);
CREATE INDEX IF NOT EXISTS idx_students_field_of_study ON students(field_of_study);

CREATE INDEX IF NOT EXISTS idx_mentors_user_id ON mentors(user_id);
CREATE INDEX IF NOT EXISTS idx_mentors_is_verified ON mentors(is_verified);
CREATE INDEX IF NOT EXISTS idx_mentors_expertise ON mentors USING GIN(expertise);
CREATE INDEX IF NOT EXISTS idx_mentors_organization ON mentors(organization_name);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_subject_area ON posts(subject_area);
CREATE INDEX IF NOT EXISTS idx_posts_is_active ON posts(is_active);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_join_requests_post_id ON join_requests(post_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_requester_user_id ON join_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON join_requests(status);

CREATE INDEX IF NOT EXISTS idx_user_connections_mentor_user_id ON user_connections(mentor_user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_student_user_id ON user_connections(student_user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections(connection_status);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_connection_id ON reviews(connection_id);

-- Subscription and payment indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id ON user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_is_active ON advertisements(is_active);
CREATE INDEX IF NOT EXISTS idx_advertisements_priority ON advertisements(priority DESC);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_ad_id ON ad_impressions(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user_id ON ad_impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_created_at ON ad_impressions(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mentors_updated_at ON mentors;
CREATE TRIGGER update_mentors_updated_at BEFORE UPDATE ON mentors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_join_requests_updated_at ON join_requests;
CREATE TRIGGER update_join_requests_updated_at BEFORE UPDATE ON join_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_connections_updated_at ON user_connections;
CREATE TRIGGER update_user_connections_updated_at BEFORE UPDATE ON user_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_payment_methods_updated_at ON user_payment_methods;
CREATE TRIGGER update_user_payment_methods_updated_at BEFORE UPDATE ON user_payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_advertisements_updated_at ON advertisements;
CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON advertisements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data insertion (optional)
INSERT INTO users (email, password_hash, user_type) VALUES 
('student1@example.com', 'hashed_password', 'student'),
('mentor1@example.com', 'hashed_password', 'mentor')
ON CONFLICT (email) DO NOTHING;

INSERT INTO students (user_id, name, institution_name, field_of_study) 
SELECT id, 'John Doe', 'University of Example', 'Computer Science' 
FROM users WHERE email = 'student1@example.com' AND NOT EXISTS (
    SELECT 1 FROM students WHERE user_id = users.id
);

INSERT INTO mentors (user_id, name, expertise, years_of_experience, job_role, organization_name) 
SELECT id, 'Jane Smith', ARRAY['JavaScript', 'React'], 5, 'Senior Developer', 'Tech Corp' 
FROM users WHERE email = 'mentor1@example.com' AND NOT EXISTS (
    SELECT 1 FROM mentors WHERE user_id = users.id
);

-- Insert subscription plans
INSERT INTO subscription_plans (name, description, price, duration_days, features, max_posts_per_month, can_use_mentorship, has_ads) VALUES
('Free Plan', 'Basic access with ads and limited features', 0.00, 30, 
 '{"group_study": true, "basic_messaging": true, "limited_posts": true}', 
 5, false, true),
('Premium Plan', 'Full access without ads and unlimited features', 300.00, 30, 
 '{"group_study": true, "mentorship": true, "unlimited_messaging": true, "unlimited_posts": true, "priority_support": true}', 
 -1, true, false)
ON CONFLICT (name) DO NOTHING;

-- Sample advertisements for free users
INSERT INTO advertisements (title, content, click_url, is_active, priority) VALUES
('Upgrade to Premium', 'Get unlimited access and remove ads!', '/upgrade', true, 10),
('Study Better with Premium', 'Access mentorship and unlimited study groups', '/premium', true, 9),
('New Course Available', 'Learn advanced programming concepts', '/courses', true, 5)
ON CONFLICT DO NOTHING;

-- Function to check if user has premium subscription
CREATE OR REPLACE FUNCTION is_user_premium(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND subscription_type = 'premium' 
        AND (premium_expires_at IS NULL OR premium_expires_at > CURRENT_TIMESTAMP)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get user's current subscription
CREATE OR REPLACE FUNCTION get_user_subscription(user_id UUID)
RETURNS TABLE(
    subscription_type VARCHAR,
    expires_at TIMESTAMP WITH TIME ZONE,
    plan_name VARCHAR,
    features JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.subscription_type::VARCHAR,
        u.premium_expires_at,
        sp.name::VARCHAR,
        sp.features
    FROM users u
    LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
    LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE u.id = get_user_subscription.user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to upgrade user to premium
CREATE OR REPLACE FUNCTION upgrade_user_to_premium(user_id UUID, months INTEGER DEFAULT 1)
RETURNS VOID AS $$
DECLARE
    premium_plan_id UUID;
    new_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get premium plan ID
    SELECT id INTO premium_plan_id 
    FROM subscription_plans 
    WHERE name = 'Premium Plan' AND is_active = true;
    
    -- Calculate new expiry date
    new_expiry := CURRENT_TIMESTAMP + (months || ' months')::INTERVAL;
    
    -- Update user subscription type
    UPDATE users 
    SET subscription_type = 'premium', 
        premium_expires_at = new_expiry,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = user_id;
    
    -- Insert or update user subscription record
    INSERT INTO user_subscriptions (user_id, plan_id, expires_at)
    VALUES (user_id, premium_plan_id, new_expiry)
    ON CONFLICT (user_id) DO UPDATE SET
        plan_id = premium_plan_id,
        expires_at = new_expiry,
        status = 'active',
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can post (based on subscription limits)
CREATE OR REPLACE FUNCTION can_user_post(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_subscription_type VARCHAR;
    max_posts INTEGER;
    current_month_posts INTEGER;
BEGIN
    -- Get user subscription info
    SELECT u.subscription_type, sp.max_posts_per_month
    INTO user_subscription_type, max_posts
    FROM users u
    LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
    LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
    WHERE u.id = can_user_post.user_id;
    
    -- If premium or unlimited posts, allow
    IF user_subscription_type = 'premium' OR max_posts = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Count posts in current month
    SELECT COUNT(*)
    INTO current_month_posts
    FROM posts p
    WHERE p.user_id = can_user_post.user_id
    AND p.created_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
    AND p.is_active = true;
    
    -- Check if under limit
    RETURN current_month_posts < COALESCE(max_posts, 5);
END;
$$ LANGUAGE plpgsql;
