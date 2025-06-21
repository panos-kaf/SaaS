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

-- Create grades table to store grade information from post_grades_service
CREATE TABLE IF NOT EXISTS grades (
    grade_id SERIAL PRIMARY KEY,
    grades_service_id INTEGER UNIQUE NOT NULL, -- ID from the Post Grades service
    prof_id VARCHAR(255) NOT NULL,
    student_academic_number VARCHAR(100) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255),
    semester VARCHAR(50) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    grade_scale VARCHAR(20) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    submission_id INTEGER NOT NULL,
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