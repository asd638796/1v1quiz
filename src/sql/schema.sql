-- Connect to the postgres database to create a new database
\connect postgres;


-- Connect to the quizapp database
\connect quizapp;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) REFERENCES users(username) ON DELETE CASCADE, -- Associates questions with a specific user
    country VARCHAR(255) NOT NULL,
    capital VARCHAR(255) NOT NULL
);
