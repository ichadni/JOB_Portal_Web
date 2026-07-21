-- CREATE DATABASE IF NOT EXISTS job_portal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE job_portal_db;

-- CREATE TABLE IF NOT EXISTS users (
--       id INT AUTO_INCREMENT PRIMARY KEY,
--     username VARCHAR(100) NOT NULL,
--     email VARCHAR(100) NOT NULL UNIQUE,
--     mobile VARCHAR(20) NOT NULL,
--     password VARCHAR(255) NOT NULL,
--     role ENUM('student','recruiter','admin') DEFAULT 'student'

-- );

-- CREATE TABLE IF NOT EXISTS jobs (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   title VARCHAR(255) NOT NULL,
--   company VARCHAR(255) NOT NULL,
--   location VARCHAR(255),
--   type VARCHAR(100),
--   salary VARCHAR(100),
--   description TEXT,
--   posted_by INT,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
-- );

-- CREATE TABLE IF NOT EXISTS applications (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   job_id INT NOT NULL,
--   user_id INT NOT NULL,
--   cover_letter TEXT,
--   resume_path VARCHAR(500),
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- );

-- CREATE INDEX idx_jobs_title ON jobs(title);
-- CREATE INDEX idx_jobs_company ON jobs(company);
-- CREATE INDEX idx_jobs_location ON jobs(location);
-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS job_portal_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE job_portal_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    mobile VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student','recruiter','admin') DEFAULT 'student',
    full_name VARCHAR(255),
    skills TEXT,
    education VARCHAR(255),
    experience INT,
    isActive BOOLEAN DEFAULT TRUE,
    resetPasswordToken VARCHAR(255),
    resetPasswordExpires BIGINT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    type VARCHAR(100),
    salary VARCHAR(100),
    description TEXT,
    posted_by INT,
    status ENUM('pending', 'active', 'expired', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    user_id INT NOT NULL,
    cover_letter TEXT,
    resume_path VARCHAR(500),
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    education VARCHAR(255),
    experience INT,
    skills TEXT,
    payment_method VARCHAR(100),
    payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    payment_amount DECIMAL(10, 2),
    payment_transaction_id VARCHAR(255),
    payment_date DATE,
    payment_error TEXT,
    status ENUM('pending', 'reviewed', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for faster searches
CREATE INDEX idx_jobs_title ON jobs(title);
CREATE INDEX idx_jobs_company ON jobs(company);
CREATE INDEX idx_jobs_location ON jobs(location);
