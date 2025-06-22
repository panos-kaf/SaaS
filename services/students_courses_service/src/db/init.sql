-- Create tables for students, courses, and student-course relationships

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

-- Institution courses cache table (from institution_service)
CREATE TABLE IF NOT EXISTS institution_courses (
  course_id INTEGER PRIMARY KEY, -- ID from institution service
  institution_id INTEGER NOT NULL,
  course_code VARCHAR(50) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  semester VARCHAR(50),
  academic_year VARCHAR(10),
  professor_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -- Create indexes
-- CREATE INDEX IF NOT EXISTS idx_user_credential_id ON users_profile(user_credential_id);
-- CREATE INDEX IF NOT EXISTS idx_role ON users_profile(role);
-- CREATE INDEX IF NOT EXISTS idx_academic_id ON users_profile(academic_id);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  course_id SERIAL PRIMARY KEY,
  course_code VARCHAR(50) NOT NULL UNIQUE,
  course_name VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  semester VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Student-Course registrations
CREATE TABLE IF NOT EXISTS student_courses (
  registration_id SERIAL PRIMARY KEY,
  user_profile_id INTEGER NOT NULL REFERENCES users_profile(user_profile_id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_profile_id, course_id)
);

-- Grades table (imported from post_grades_service)
CREATE TABLE IF NOT EXISTS grades (
  grade_id SERIAL PRIMARY KEY,
  user_profile_id INTEGER NOT NULL REFERENCES users_profile(user_profile_id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  grade DECIMAL(5,2) NOT NULL,
  grade_scale VARCHAR(20),  -- e.g., '0-10', 'A-F'
  submission_id INTEGER,
  submitted_by INTEGER,  -- professor who submitted the grade
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_profile_id, course_id, submission_id)
);

