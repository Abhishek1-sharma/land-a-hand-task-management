-- Run this once with a privileged MySQL/MariaDB account.
-- It resets only this application's DB user and forces password auth.
CREATE DATABASE IF NOT EXISTS employee_task_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP USER IF EXISTS 'etms_user'@'localhost';
DROP USER IF EXISTS 'etms_user'@'127.0.0.1';
DROP USER IF EXISTS 'etms_user'@'%';

-- MariaDB on Windows may default accounts to auth_gssapi_client.
-- mysql2 needs standard password authentication.
CREATE USER 'etms_user'@'localhost'
  IDENTIFIED VIA mysql_native_password USING PASSWORD('Etms@12345');
CREATE USER 'etms_user'@'127.0.0.1'
  IDENTIFIED VIA mysql_native_password USING PASSWORD('Etms@12345');
CREATE USER 'etms_user'@'%'
  IDENTIFIED VIA mysql_native_password USING PASSWORD('Etms@12345');

GRANT ALL PRIVILEGES ON employee_task_management.* TO 'etms_user'@'localhost';
GRANT ALL PRIVILEGES ON employee_task_management.* TO 'etms_user'@'127.0.0.1';
GRANT ALL PRIVILEGES ON employee_task_management.* TO 'etms_user'@'%';
FLUSH PRIVILEGES;
