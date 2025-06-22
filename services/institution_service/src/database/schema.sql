-- Institution Service Database Schema

-- Institutions table
CREATE TABLE IF NOT EXISTS institutions (
    institution_id SERIAL PRIMARY KEY,
    institution_name VARCHAR(255) NOT NULL UNIQUE,
    institution_email VARCHAR(255) NOT NULL UNIQUE,
    institution_address TEXT,
    contact_person VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    manager_user_id INTEGER NOT NULL, -- Reference to user management service
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Institution credits table
CREATE TABLE IF NOT EXISTS institution_credits (
    credit_id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(institution_id) ON DELETE CASCADE,
    total_credits INTEGER DEFAULT 0 CHECK (total_credits >= 0),
    used_credits INTEGER DEFAULT 0 CHECK (used_credits >= 0),
    available_credits INTEGER DEFAULT 0 CHECK (available_credits >= 0),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institution_id)
);

-- Credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
    transaction_id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(institution_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'usage')),
    purchase_id VARCHAR(100), -- UUID for purchase tracking
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Institution courses table
CREATE TABLE IF NOT EXISTS institution_courses (
    course_id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(institution_id) ON DELETE CASCADE,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    semester VARCHAR(20),
    academic_year VARCHAR(10),
    professor_id INTEGER, -- Reference to user management service
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institution_id, course_code, academic_year, semester)
);

-- Users profile cache table (for messaging system)
CREATE TABLE IF NOT EXISTS users_profile (
    user_profile_id SERIAL PRIMARY KEY,
    user_service_id INTEGER NOT NULL UNIQUE, -- ID from the User Management service
    academic_id VARCHAR(50),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(255),
    role VARCHAR(50),
    institution_id INTEGER,
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_institutions_manager_user ON institutions(manager_user_id);
CREATE INDEX IF NOT EXISTS idx_institution_credits_institution ON institution_credits(institution_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_institution ON credit_transactions(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_courses_institution ON institution_courses(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_courses_professor ON institution_courses(professor_id);
CREATE INDEX IF NOT EXISTS idx_users_profile_service_id ON users_profile(user_service_id);

-- -- Trigger to automatically update available_credits when total_credits or used_credits change
-- CREATE OR REPLACE FUNCTION update_available_credits()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.available_credits = NEW.total_credits - NEW.used_credits;
--     NEW.last_updated = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER update_available_credits_trigger
--     BEFORE UPDATE ON institution_credits
--     FOR EACH ROW
--     EXECUTE FUNCTION update_available_credits();

-- -- Trigger to update the updated_at timestamp for institutions
-- CREATE OR REPLACE FUNCTION update_institution_timestamp()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER update_institution_timestamp_trigger
--     BEFORE UPDATE ON institutions
--     FOR EACH ROW
--     EXECUTE FUNCTION update_institution_timestamp();
