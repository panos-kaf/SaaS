CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE enrollments (
  student_id INT REFERENCES students(id),
  course_id INT REFERENCES courses(id),
  grade INT,
  PRIMARY KEY (student_id, course_id)
);

-- Seed data
INSERT INTO students (name) VALUES ('Alice'), ('Bob');
INSERT INTO courses (name) VALUES ('Math'), ('History');
INSERT INTO enrollments (student_id, course_id, grade) VALUES (1, 1, 90), (1, 2, 85), (2, 1, 78);
