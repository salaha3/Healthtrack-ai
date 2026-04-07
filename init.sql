CREATE DATABASE IF NOT EXISTS healthtrack_ai;
USE healthtrack_ai;

CREATE TABLE IF NOT EXISTS health_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    record_date DATE NOT NULL,
    steps INT NOT NULL,
    sleep_hours DECIMAL(4,2) NOT NULL,
    calories INT NOT NULL
);

INSERT INTO health_metrics (record_date, steps, sleep_hours, calories) VALUES
('2026-01-20', 7000, 6.5, 2100),
('2026-01-21', 8200, 7.0, 2200),
('2026-01-22', 6500, 5.8, 2050),
('2026-01-23', 9100, 7.4, 2300),
('2026-01-24', 7800, 6.9, 2150);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    sex VARCHAR(10) NOT NULL,
    height_cm INT NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    activity_level VARCHAR(50) NOT NULL,
    goal VARCHAR(20) NOT NULL,
    target_calories INT,
    target_protein INT,
    target_carbs INT,
    target_fats INT
);