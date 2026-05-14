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

-- 초기 미분류 폴더 예시 (필요시 제거 가능)
-- INSERT INTO tactical_maps (user_id, folder_name, title, data) VALUES ('guest', 'Unclassified', 'Initial Setup', '{"nodes":[], "edges":[]}');
