-- Create university_db database for Course Service
CREATE DATABASE IF NOT EXISTS university_db;
USE university_db;

-- Create the courses table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    credits INT,
    professor VARCHAR(100),
    semester VARCHAR(50),
    max_students INT,
    enrolled_students INT,
    room VARCHAR(50),
    schedule VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS timetable_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    day VARCHAR(20) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    room VARCHAR(50) NOT NULL
);

