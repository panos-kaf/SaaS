CREATE TABLE IF NOT EXISTS users_credentials (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users_profile (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users_credentials(id) ON DELETE CASCADE,
  academic_id VARCHAR(50) UNIQUE,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  role VARCHAR(20) NOT NULL DEFAULT 'student', -- student, professor, admin, etc.
  institution_id INTEGER,
  department VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_id ON users_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_role ON users_profile(role);
CREATE INDEX IF NOT EXISTS idx_institution_id ON users_profile(institution_id);