DROP DATABASE IF EXISTS employee_task_management;
CREATE DATABASE employee_task_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE employee_task_management;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'Employee') NOT NULL DEFAULT 'Employee',
  employee_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  department VARCHAR(80) NOT NULL,
  designation VARCHAR(80) NOT NULL,
  phone VARCHAR(20),
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_employees_department (department),
  INDEX idx_employees_status (status)
);

CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  employee_id INT NOT NULL,
  priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
  status ENUM('Pending', 'In Progress', 'Completed') NOT NULL DEFAULT 'Pending',
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  attachment_name VARCHAR(255),
  attachment_type VARCHAR(80),
  attachment_size INT,
  attachment_data LONGTEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON DELETE CASCADE,
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_priority (priority),
  INDEX idx_tasks_due_date (due_date),
  INDEX idx_tasks_employee (employee_id)
);

ALTER TABLE users
  ADD CONSTRAINT fk_users_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id)
  ON DELETE SET NULL;

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  employee_id INT NULL,
  task_id INT NULL,
  type ENUM('Assigned', 'Due Soon', 'Completed') NOT NULL,
  message VARCHAR(255) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_notifications_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_notifications_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE CASCADE,
  INDEX idx_notifications_employee (employee_id),
  INDEX idx_notifications_type (type)
);

CREATE TABLE email_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_email VARCHAR(120) NOT NULL,
  subject VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  status ENUM('Queued', 'Sent', 'Failed') NOT NULL DEFAULT 'Queued',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_logs_status (status)
);

INSERT INTO employees (name, email, department, designation, phone, status) VALUES
('Aarav Mehta', 'aarav.mehta@example.com', 'Program Operations', 'Field Coordinator', '9876543210', 'Active'),
('Neha Sharma', 'neha.sharma@example.com', 'Training', 'Training Associate', '9876501234', 'Active'),
('Rohan Das', 'rohan.das@example.com', 'Technology', 'MIS Executive', '9876512345', 'Active'),
('Priya Iyer', 'priya.iyer@example.com', 'Partnerships', 'Partnership Manager', '9876523456', 'Inactive');

-- Default logins:
-- Admin: admin@lendahand.org / Admin@123
-- Employee: aarav.mehta@example.com / Employee@123
INSERT INTO users (name, email, password_hash, role, employee_id) VALUES
('Admin User', 'admin@lendahand.org', CONCAT('sha256:', SHA2('Admin@123', 256)), 'Admin', NULL),
('Aarav Mehta', 'aarav.mehta@example.com', CONCAT('sha256:', SHA2('Employee@123', 256)), 'Employee', 1);

INSERT INTO tasks (title, description, employee_id, priority, status, start_date, due_date) VALUES
('Prepare monthly field report', 'Compile task completion numbers and school visit notes.', 1, 'High', 'In Progress', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 4 DAY)),
('Update training attendance', 'Upload attendance data for the latest vocational training batch.', 2, 'Medium', 'Pending', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 2 DAY)),
('Clean employee task data', 'Review duplicates and normalize department labels in task records.', 3, 'Critical', 'Pending', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY)),
('Partner follow-up tracker', 'Close pending action items from partner review meeting.', 4, 'Low', 'Completed', DATE_SUB(CURDATE(), INTERVAL 6 DAY), DATE_SUB(CURDATE(), INTERVAL 3 DAY));

INSERT INTO notifications (employee_id, task_id, type, message) VALUES
(1, 1, 'Assigned', 'New task assigned: Prepare monthly field report'),
(2, 2, 'Due Soon', 'Task is due within one day: Update training attendance'),
(4, 4, 'Completed', 'Task marked complete: Partner follow-up tracker');

INSERT INTO email_logs (recipient_email, subject, body, status) VALUES
('aarav.mehta@example.com', 'Task Assigned: Employee Task Management', 'New task assigned: Prepare monthly field report', 'Queued'),
('neha.sharma@example.com', 'Task Due Soon: Employee Task Management', 'Task is due within one day: Update training attendance', 'Queued'),
('priya.iyer@example.com', 'Task Completed: Employee Task Management', 'Task marked complete: Partner follow-up tracker', 'Queued');
