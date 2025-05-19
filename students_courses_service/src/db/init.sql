-- Create tables for students, courses, and student-course relationships

-- Users table (imported from user_management_service)
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,  -- 'student', 'professor', 'admin'
  academic_number VARCHAR(50) UNIQUE,  -- For students
  department VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id)
);

-- Grades table (imported from post_grades_service)
CREATE TABLE IF NOT EXISTS grades (
  grade_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  grade DECIMAL(5,2) NOT NULL,
  grade_scale VARCHAR(20),  -- e.g., '0-10', 'A-F'
  submission_id INTEGER,
  submitted_by INTEGER,  -- professor who submitted the grade
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id, submission_id)
);

-- Insert some sample data
INSERT INTO users (username, email, full_name, role, academic_number, department)
VALUES 
  ('student1', 'student1@example.com', 'Student One', 'student', 'ST12345', 'Computer Science'),
  ('student2', 'student2@example.com', 'Student Two', 'student', 'ST12346', 'Computer Science'),
  ('professor1', 'professor1@example.com', 'Professor One', 'professor', NULL, 'Computer Science');

INSERT INTO courses (course_code, course_name, department, semester)
VALUES 
  ('CS101', 'Introduction to Computer Science', 'Computer Science', '1st'),
  ('CS102', 'Data Structures', 'Computer Science', '1st'),
  ('CS201', 'Algorithms', 'Computer Science', '2nd'),
  ('CS202', 'Database Systems', 'Computer Science', '2nd');

-- Register students for courses
INSERT INTO student_courses (user_id, course_id)
VALUES 
  (1, 1),  -- Student One registered for CS101
  (1, 2),  -- Student One registered for CS102
  (2, 1),  -- Student Two registered for CS101
  (2, 3);  -- Student Two registered for CS201

-- Add some sample grades
INSERT INTO grades (user_id, course_id, grade, grade_scale, submission_id, submitted_by)
VALUES 
  (1, 1, 8.5, '0-10', 1, 3),  -- Student One's grade for CS101
  (1, 2, 7.0, '0-10', 2, 3),  -- Student One's grade for CS102
  (2, 1, 9.0, '0-10', 1, 3);  -- Student Two's grade for CS101
