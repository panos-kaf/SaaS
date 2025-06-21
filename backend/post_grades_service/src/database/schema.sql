-- Post Grades Service Schema
-- 
-- CSV FORMAT REQUIREMENTS:
-- CSV files should contain the following columns (no course_id column needed):
-- prof_id, student_academic_number, student_name, student_email, semester, 
-- course_name, course_code, grade_scale, grade, academic_year
-- 
-- The course_id will be automatically looked up using course_code + academic_year 
-- from the institution_courses table.
--
-- XLSX FORMAT REQUIREMENTS:
-- Similar to CSV but in Excel format with the same column structure.

-- Create users_profile table to store user information from user_management_service
CREATE TABLE IF NOT EXISTS users_profile (
    user_profile_id SERIAL PRIMARY KEY,
    user_service_id VARCHAR(255) UNIQUE NOT NULL, -- ID from the User Management service
    academic_id VARCHAR(100),
    first_name VARCHAR(50),
    last_name VARCHAR(50),    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'student', 'instructor', 'admin', etc.
    institution_id INTEGER,
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Institution courses cache table (from institution_service)
CREATE TABLE IF NOT EXISTS institution_courses (
    course_id INTEGER PRIMARY KEY, -- ID from institution service
    institution_id INTEGER NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    semester VARCHAR(20),
    academic_year VARCHAR(10),
    professor_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS grade_submissions (
    submission_id SERIAL PRIMARY KEY,
    owner_user_service_id VARCHAR(255) NOT NULL,
    course_id INTEGER NOT NULL,        -- Course ID to track which course this submission belongs to (references institution_courses)
    file_path VARCHAR(255) NOT NULL,
    finalized BOOLEAN DEFAULT FALSE NOT NULL, -- Indicates if the submission and its grades are final
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_owner_user_service
        FOREIGN KEY(owner_user_service_id)
        REFERENCES users_profile(user_service_id)
        ON DELETE RESTRICT, -- Or consider ON DELETE SET NULL if owner can be disassociated
    CONSTRAINT fk_course_submission
        FOREIGN KEY(course_id)
        REFERENCES institution_courses(course_id)
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS grades (
    grades_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,        -- Course ID for better organization and statistics (references institution_courses)
    prof_id VARCHAR(255) NOT NULL,          -- ID of the professor from another service
    student_academic_number VARCHAR(100) NOT NULL, -- Academic number of the student
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255),
    semester VARCHAR(50) NOT NULL,          -- e.g., "2024-Spring" or "1st Year"
    academic_year VARCHAR(10) NOT NULL,     -- e.g., "2024-2025" (cached from institution_courses)
    course_name VARCHAR(255) NOT NULL,      -- Name of the course (cached from institution_courses)
    course_code VARCHAR(50) NOT NULL,       -- Course code (cached from institution_courses)
    grade_scale VARCHAR(20) NOT NULL,       -- e.g., "0-10", "A-F"
    grade VARCHAR(10) NOT NULL,             -- The actual grade
    submission_id INTEGER NOT NULL,         -- Foreign key to grade_submissions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_submission
        FOREIGN KEY(submission_id)
        REFERENCES grade_submissions(submission_id)
        ON DELETE CASCADE, -- If a submission is deleted, its associated grades are also deleted
    CONSTRAINT fk_course_grade
        FOREIGN KEY(course_id)
        REFERENCES institution_courses(course_id)
        ON DELETE RESTRICT
);

-- Optional: You might want a function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_grades
BEFORE UPDATE ON grades
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_users_profile
BEFORE UPDATE ON users_profile
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_grade_submissions
BEFORE UPDATE ON grade_submissions
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
