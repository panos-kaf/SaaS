CREATE TABLE IF NOT EXISTS grades (
    grades_id SERIAL PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    exam_period VARCHAR(100) NOT NULL,
    exam_date DATE NOT NULL,
    professor VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL, -- This will store the path to the uploaded CSV file
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: You might want a function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON grades
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
