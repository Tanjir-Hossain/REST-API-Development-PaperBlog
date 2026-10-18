-- ---------------------------------------------------------------------------
-- Blog Management API — database schema
-- MySQL 8.x
-- ---------------------------------------------------------------------------
-- The application also runs `sequelize.sync()` on boot, so these tables are
-- created automatically. This script is provided for a manual / reviewed setup
-- and documents the exact structure the API expects.
-- ---------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS blogdb
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE blogdb;

-- Users -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    firstname  VARCHAR(100) NOT NULL,
    lastname   VARCHAR(100) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password            VARCHAR(255) NOT NULL,
    profileImage        VARCHAR(255) DEFAULT NULL,
    resetTokenHash      VARCHAR(255) DEFAULT NULL,
    resetTokenExpiresAt DATETIME     DEFAULT NULL,
    isActive            BOOLEAN NOT NULL DEFAULT TRUE,
    role                ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    createAt            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updateAt            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Blogs -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blogs (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    userId     INT NOT NULL,
    blogTitle  VARCHAR(255) NOT NULL,
    blog       TEXT NOT NULL,
    category   VARCHAR(100) NOT NULL,
    createAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updateAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_blogs_user
        FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Promote an existing account to admin (run after registering that user):
-- UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
