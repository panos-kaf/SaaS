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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_requests_owner_id ON requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_requests_prof_id ON requests(prof_id);
CREATE INDEX IF NOT EXISTS idx_requests_grade_id ON requests(grade_id);