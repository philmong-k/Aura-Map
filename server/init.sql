-- MariaDB 전술 데이터 저장용 테이블 생성 스크립트 (폴더 체계 v3)
CREATE DATABASE IF NOT EXISTS `horizon-db`;
USE `horizon-db`;

-- 낡은 테이블이 있다면 제거하여 충돌 방지
DROP TABLE IF EXISTS `tactical_maps`;

CREATE TABLE `tactical_maps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(100) DEFAULT 'guest',
  `folder_name` VARCHAR(100) DEFAULT 'Unclassified', -- 폴더(카테고리) 필드 추가
  `title` VARCHAR(255) DEFAULT 'Untitled Tactical Map',
  `data` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`user_id`),
  INDEX (`folder_name`)
);

-- 👥 사용자 계정 테이블 (ID/PW 체계)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) DEFAULT 'Operator',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 초기 관리자 계정 생성 (패스워드 간소화: commander)
INSERT INTO `users` (username, password_hash, role) VALUES ('commander', 'commander', 'admin') 
ON DUPLICATE KEY UPDATE password_hash='commander';
