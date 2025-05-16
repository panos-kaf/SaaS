CREATE TABLE IF NOT EXISTS users_profile (
    user_profile_id SERIAL PRIMARY KEY,
    user_service_id VARCHAR(255) UNIQUE NOT NULL, -- ID from the User Management service
    user_academic_id VARCHAR(100) UNIQUE NOT NULL, -- Unique academic/staff ID
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL, -- e.g., 'student', 'professor', 'institution_manager'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grade_submissions (
    submission_id SERIAL PRIMARY KEY,
    owner_user_service_id VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    finalized BOOLEAN DEFAULT FALSE NOT NULL, -- Indicates if the submission and its grades are final
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_owner_user_service
        FOREIGN KEY(owner_user_service_id)
        REFERENCES users_profile(user_service_id)
        ON DELETE RESTRICT -- Or consider ON DELETE SET NULL if owner can be disassociated
);

CREATE TABLE IF NOT EXISTS grades (
    grades_id SERIAL PRIMARY KEY,
    course_id VARCHAR(255) NOT NULL,        -- ID of the course from another service
    prof_id VARCHAR(255) NOT NULL,          -- ID of the professor from another service
    student_academic_number VARCHAR(100) NOT NULL, -- Academic number of the student
    student_name VARCHAR(255) NOT NULL,
    student_email VARCHAR(255),
    semester VARCHAR(50) NOT NULL,          -- e.g., "2024-Spring" or "1st Year"
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    grade_scale VARCHAR(20) NOT NULL,       -- e.g., "0-10", "A-F"
    grade VARCHAR(10) NOT NULL,             -- The actual grade
    submission_id INTEGER NOT NULL,         -- Foreign key to grade_submissions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_submission
        FOREIGN KEY(submission_id)
        REFERENCES grade_submissions(submission_id)
        ON DELETE CASCADE -- If a submission is deleted, its associated grades are also deleted
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
