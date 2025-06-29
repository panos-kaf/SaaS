-- Database schema for replies_service

-- Drop tables if they exist
DROP TABLE IF EXISTS replies;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS users_profile;

-- Create users_profile table to store user information from user_management_service
CREATE TABLE IF NOT EXISTS users_profile (
    user_profile_id SERIAL PRIMARY KEY,
    user_service_id VARCHAR(255) UNIQUE NOT NULL, -- ID from the User Management service
    academic_id VARCHAR(100),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'student', 'professor', 'admin', etc.
    institution_id INTEGER,
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Create requests table (to cache data from requests_service)
CREATE TABLE requests (
    request_id VARCHAR(255) PRIMARY KEY,
    owner_id VARCHAR(255) NOT NULL,
    grade_id VARCHAR(255) NOT NULL,
    prof_id VARCHAR(255) NOT NULL,
    request_body TEXT,
    status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create replies table
CREATE TABLE replies (
    reply_id SERIAL PRIMARY KEY,
    request_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    reply_body TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(request_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users_profile(user_service_id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_replies_request_id ON replies(request_id);
CREATE INDEX idx_replies_user_id ON replies(user_id);
CREATE INDEX idx_requests_owner_id ON requests(owner_id);
CREATE INDEX idx_requests_prof_id ON requests(prof_id);
CREATE INDEX idx_users_profile_user_service_id ON users_profile(user_service_id);