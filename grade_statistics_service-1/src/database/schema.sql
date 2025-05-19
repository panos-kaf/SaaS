-- First create the grade_submissions table
CREATE TABLE IF NOT EXISTS grade_submissions (
    submission_id INTEGER PRIMARY KEY,      -- ID of the submission from the post_grades_service
    course_id VARCHAR(255) NOT NULL,        -- ID of the course
    prof_id VARCHAR(255) NOT NULL,          -- ID of the professor
    semester VARCHAR(50) NOT NULL,          -- e.g., "2024-Spring" or "1st Year"
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_finalized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Then create the grades table that references grade_submissions
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

-- Create the grade_statistics table to store calculated statistics
CREATE TABLE IF NOT EXISTS grade_statistics (
    stats_id SERIAL PRIMARY KEY,
    course_id VARCHAR(255) NOT NULL UNIQUE, -- Unique constraint to ensure one stats record per course
    count INTEGER NOT NULL,                 -- Number of grades
    average DECIMAL(5,2) NOT NULL,          -- Average grade
    minimum DECIMAL(5,2) NOT NULL,          -- Minimum grade
    maximum DECIMAL(5,2) NOT NULL,          -- Maximum grade
    std_deviation DECIMAL(5,2) NOT NULL,    -- Standard deviation
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
