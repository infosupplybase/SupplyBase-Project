CREATE DATABASE IF NOT EXISTS supplybase
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'supplybase'@'localhost' IDENTIFIED BY 'supplybase';
GRANT ALL PRIVILEGES ON supplybase.* TO 'supplybase'@'localhost';
FLUSH PRIVILEGES;
