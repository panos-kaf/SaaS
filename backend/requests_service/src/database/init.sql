-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
    request_id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    grade_id INTEGER NOT NULL,
    prof_id INTEGER NOT NULL,
    request_body TEXT NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('open', 'closed')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users_profile table to store user information from user_management_service
CREATE TABLE IF NOT EXISTS users_profile (
    user_profile_id SERIAL PRIMARY KEY,
    user_service_id INTEGER NOT NULL, -- ID from the User Management service
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

-- Create grades table with proper structure matching the grades service data
CREATE TABLE IF NOT EXISTS grades (
    grades_id SERIAL PRIMARY KEY,
    grades_service_id VARCHAR(255) UNIQUE NOT NULL, -- ID from the grades service (can be string composite)
    course_id INTEGER,                   -- Course ID from the grades service
    prof_id INTEGER,                     -- ID of the professor from another service (as INTEGER to match)
    student_academic_number VARCHAR(100) NOT NULL, -- Academic number of the student
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255),
    semester VARCHAR(50) NOT NULL,      -- e.g., "2024-Spring" or "1st Year"
    academic_year VARCHAR(10),          -- e.g., "2024-2025"
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    grade_scale VARCHAR(20) NOT NULL,   -- e.g., "0-10", "A-F"
    grade VARCHAR(10) NOT NULL,         -- The actual grade
    submission_id INTEGER,              -- Reference to submission in grades service
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_requests_owner_id ON requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_requests_prof_id ON requests(prof_id);
CREATE INDEX IF NOT EXISTS idx_requests_grade_id ON requests(grade_id);
CREATE INDEX IF NOT EXISTS idx_users_profile_service_id ON users_profile(user_service_id);
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON users_profile(role);
CREATE INDEX IF NOT EXISTS idx_users_profile_academic_id ON users_profile(academic_id);
CREATE INDEX IF NOT EXISTS idx_grades_service_id ON grades(grades_service_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_academic ON grades(student_academic_number);
CREATE INDEX IF NOT EXISTS idx_grades_course_id ON grades(course_id);
CREATE INDEX IF NOT EXISTS idx_grades_prof_id ON grades(prof_id);