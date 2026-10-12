-- ========================================================================
-- AUTOMATED ADMISSION MANAGEMENT SYSTEM (AAMS) DATABASE SCHEMA
-- Target RDBMS: MySQL 8.0+
-- Encoding: UTF8MB4
-- ========================================================================

CREATE DATABASE IF NOT EXISTS `aams_portal_db` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `aams_portal_db`;

-- ------------------------------------------------------------------------
-- Table: users (Authentication & RBAC accounts)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_uid` VARCHAR(64) NOT NULL UNIQUE,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `phone` VARCHAR(25) NOT NULL UNIQUE,
  `role` ENUM('applicant', 'admin', 'system_evaluator') NOT NULL DEFAULT 'applicant',
  `password_hash` VARCHAR(255) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_role` (`role`),
  INDEX `idx_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------
-- Table: faculties (Academic divisions)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `faculties` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `dean_name` VARCHAR(120) NOT NULL,
  `contact_email` VARCHAR(120) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------
-- Table: admission_units (Test Units A, B, C, D)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admission_units` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(10) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `faculty_id` INT UNSIGNED NOT NULL,
  `min_ssc_gpa` DECIMAL(3,2) NOT NULL DEFAULT 3.50,
  `min_hsc_gpa` DECIMAL(3,2) NOT NULL DEFAULT 3.50,
  `min_total_gpa` DECIMAL(4,2) NOT NULL DEFAULT 7.50,
  `seats_capacity` INT UNSIGNED NOT NULL DEFAULT 500,
  `exam_fee` DECIMAL(8,2) NOT NULL DEFAULT 1000.00,
  `exam_datetime` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_unit_faculty` FOREIGN KEY (`faculty_id`) REFERENCES `faculties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------
-- Table: applicants (Academic records & core submission state)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `applicants` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `application_id` VARCHAR(30) NOT NULL UNIQUE,
  `father_name` VARCHAR(150) NOT NULL,
  `mother_name` VARCHAR(150) NOT NULL,
  `dob` DATE NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
  
  -- SSC Education Board Data
  `ssc_roll` VARCHAR(20) NOT NULL,
  `ssc_reg` VARCHAR(25) NOT NULL,
  `ssc_board` VARCHAR(50) NOT NULL,
  `ssc_passing_year` YEAR NOT NULL,
  `ssc_gpa` DECIMAL(3,2) NOT NULL,
  `ssc_group` VARCHAR(40) NOT NULL,

  -- HSC Education Board Data
  `hsc_roll` VARCHAR(20) NOT NULL,
  `hsc_reg` VARCHAR(25) NOT NULL,
  `hsc_board` VARCHAR(50) NOT NULL,
  `hsc_passing_year` YEAR NOT NULL,
  `hsc_gpa` DECIMAL(3,2) NOT NULL,
  `hsc_group` VARCHAR(40) NOT NULL,

  -- Quota & Files
  `quota_type` ENUM('general', 'freedom_fighter', 'tribal', 'physically_challenged', 'ward') NOT NULL DEFAULT 'general',
  `quota_cert_path` VARCHAR(255) NULL,
  `passport_photo_path` VARCHAR(255) NOT NULL,
  `selfie_photo_path` VARCHAR(255) NULL,
  `signature_path` VARCHAR(255) NULL,

  -- AI Face Verification Status
  `ai_face_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `ai_confidence_score` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  
  -- Application Status
  `status` ENUM('draft', 'submitted', 'under_review', 'accepted', 'rejected') NOT NULL DEFAULT 'draft',
  `payment_status` ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
  `transaction_id` VARCHAR(60) NULL,
  `language_medium` ENUM('English', 'Bengali') NOT NULL DEFAULT 'English',
  `submission_date` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_applicant_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_app_status` (`status`),
  INDEX `idx_app_hsc_roll` (`hsc_roll`, `hsc_board`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------
-- Table: applicant_unit_choices (Mapping of applied units)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `applicant_unit_choices` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `applicant_id` INT UNSIGNED NOT NULL,
  `unit_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_applicant_unit` (`applicant_id`, `unit_id`),
  CONSTRAINT `fk_choice_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_choice_unit` FOREIGN KEY (`unit_id`) REFERENCES `admission_units` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------
-- Table: department_preferences (Priority rank order)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `department_preferences` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `applicant_id` INT UNSIGNED NOT NULL,
  `department_name` VARCHAR(150) NOT NULL,
  `priority_rank` TINYINT UNSIGNED NOT NULL,
  CONSTRAINT `fk_pref_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------
-- Table: ai_verification_logs (Biometric and photo screening telemetry)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_verification_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `applicant_id` INT UNSIGNED NOT NULL,
  `single_face_detected` TINYINT(1) NOT NULL DEFAULT 1,
  `lighting_compliant` TINYINT(1) NOT NULL DEFAULT 1,
  `background_neutral` TINYINT(1) NOT NULL DEFAULT 1,
  `pose_degrees_yaw` DECIMAL(4,2) NOT NULL DEFAULT 1.20,
  `resolution_width` INT UNSIGNED NOT NULL DEFAULT 600,
  `resolution_height` INT UNSIGNED NOT NULL DEFAULT 600,
  `confidence_score` DECIMAL(5,2) NOT NULL DEFAULT 98.70,
  `verification_status` ENUM('passed', 'flagged', 'rejected') NOT NULL DEFAULT 'passed',
  `model_version` VARCHAR(50) NOT NULL DEFAULT 'AAMS-FaceNet-v2.4',
  `verified_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_log_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------
-- Table: admit_cards (Official digital exam credentials)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admit_cards` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `applicant_id` INT UNSIGNED NOT NULL UNIQUE,
  `exam_roll_number` VARCHAR(30) NOT NULL UNIQUE,
  `exam_center` VARCHAR(200) NOT NULL,
  `room_number` VARCHAR(50) NOT NULL,
  `barcode_hash` VARCHAR(64) NOT NULL,
  `is_downloaded` TINYINT(1) NOT NULL DEFAULT 0,
  `issued_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_admit_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------
-- Table: notices (Admin-published circulars and announcements)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notices` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` ENUM('Admission', 'Examination', 'Merit List', 'Quota', 'General') NOT NULL DEFAULT 'Admission',
  `content` TEXT NOT NULL,
  `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
  `author_id` INT UNSIGNED NOT NULL,
  `circular_pdf_path` VARCHAR(255) NULL,
  `published_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notice_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_notice_cat` (`category`),
  INDEX `idx_notice_pinned` (`is_pinned`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------
-- Table: support_tickets (Helpline queries & reconciliation)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ticket_code` VARCHAR(30) NOT NULL UNIQUE,
  `applicant_name` VARCHAR(150) NOT NULL,
  `contact_email` VARCHAR(120) NOT NULL,
  `topic` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================================
-- SEED DATA INSERTIONS
-- ========================================================================

-- Seed Admin and Applicant Users
INSERT INTO `users` (`user_uid`, `full_name`, `email`, `phone`, `role`, `password_hash`) VALUES
('USR-ADMIN-01', 'Prof. Dr. M. Alam', 'convenor@aams-portal.edu', '+880 2-9876543', 'admin', '$2y$10$e8w4G7Z1Y2X3W4V5U6T7S8R9Q0P1O2N3M4L5K6J7I8H9G0F1E2D3C'),
('USR-APP-88412', 'Sarah Rahman', 'sarah.rahman@example.com', '+880 1712-345678', 'applicant', '$2y$10$a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a');

-- Seed Faculties
INSERT INTO `faculties` (`code`, `name`, `dean_name`, `contact_email`) VALUES
('ENG', 'Faculty of Engineering & Physical Sciences', 'Prof. Dr. S. K. Roy', 'dean.eng@aams-portal.edu'),
('ARTS', 'Faculty of Arts & Humanities', 'Prof. Dr. Farhana Begum', 'dean.arts@aams-portal.edu'),
('BUS', 'Faculty of Business Studies', 'Prof. Dr. A. T. M. Quddus', 'dean.bus@aams-portal.edu'),
('EARTH', 'Faculty of Earth & Environmental Sciences', 'Prof. Dr. K. M. Hossain', 'dean.earth@aams-portal.edu');

-- Seed Admission Units
INSERT INTO `admission_units` (`code`, `name`, `faculty_id`, `min_ssc_gpa`, `min_hsc_gpa`, `min_total_gpa`, `seats_capacity`, `exam_datetime`) VALUES
('Unit A', 'Faculty of Science & Engineering', 1, 4.00, 4.00, 8.50, 1250, '2026-11-28 10:00:00'),
('Unit B', 'Faculty of Arts & Humanities', 2, 3.50, 3.50, 7.50, 850, '2026-12-05 10:00:00'),
('Unit C', 'Faculty of Business Studies', 3, 3.75, 3.75, 8.00, 650, '2026-12-12 10:00:00'),
('Unit D', 'Faculty of Earth & Environmental Sciences', 4, 3.75, 3.75, 8.00, 500, '2026-12-19 10:00:00');

-- Seed Sample Applicant
INSERT INTO `applicants` (
  `user_id`, `application_id`, `father_name`, `mother_name`, `dob`, `gender`,
  `ssc_roll`, `ssc_reg`, `ssc_board`, `ssc_passing_year`, `ssc_gpa`, `ssc_group`,
  `hsc_roll`, `hsc_reg`, `hsc_board`, `hsc_passing_year`, `hsc_gpa`, `hsc_group`,
  `quota_type`, `passport_photo_path`, `selfie_photo_path`, `ai_face_verified`, `ai_confidence_score`,
  `status`, `payment_status`, `transaction_id`, `language_medium`, `submission_date`
) VALUES (
  2, 'AAMS-2026-88412', 'Mustafizur Rahman', 'Nasrin Sultana', '2006-04-18', 'Female',
  '214589', '1812940251', 'Dhaka', 2024, 5.00, 'Science',
  '518423', '1812940251', 'Dhaka', 2026, 5.00, 'Science',
  'general', '/uploads/photos/photo_88412.jpg', '/uploads/selfies/selfie_88412.jpg', 1, 98.70,
  'accepted', 'paid', 'TXN-AAMS-9938217', 'English', '2026-10-06 14:22:10'
);

-- Seed Applicant Unit Choices & Preferences
INSERT INTO `applicant_unit_choices` (`applicant_id`, `unit_id`) VALUES (1, 1), (1, 4);

INSERT INTO `department_preferences` (`applicant_id`, `department_name`, `priority_rank`) VALUES
(1, 'Computer Science & Engineering (CSE)', 1),
(1, 'Software Engineering (SWE)', 2),
(1, 'Statistics & Data Science', 3),
(1, 'Electrical & Electronic Engineering (EEE)', 4);

-- Seed AI Verification Log
INSERT INTO `ai_verification_logs` (
  `applicant_id`, `single_face_detected`, `lighting_compliant`, `background_neutral`, `confidence_score`, `verification_status`
) VALUES (1, 1, 1, 1, 98.70, 'passed');

-- Seed Admit Card
INSERT INTO `admit_cards` (
  `applicant_id`, `exam_roll_number`, `exam_center`, `room_number`, `barcode_hash`
) VALUES (
  1, 'A-26-88412', 'Faculty of Engineering, Academic Complex Building 3', 'Room 402', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
);

-- Seed Initial Notices
INSERT INTO `notices` (`title`, `category`, `content`, `is_pinned`, `author_id`, `published_date`, `circular_pdf_path`) VALUES
('Undergraduate Admission Circular for Academic Session 2026-2027', 'Admission', 'Online applications are hereby invited from eligible candidates for admission into first-year undergraduate programs across all faculties. The central portal will remain active from October 15 to November 15, 2026.', 1, 1, '2026-10-01', 'AAMS_Admission_Circular_2026_27.pdf'),
('Admit Card Generation & AI Photo Screening Rules for Unit A & B', 'Examination', 'All candidates with cleared registration fees and automated biometric photo screening can now download their digital Admit Card directly from the student dashboard.', 1, 1, '2026-10-05', 'Admit_Card_Instructions_2026.pdf'),
('Special Guidelines for Freedom Fighter and Tribal Quota Verification', 'Quota', 'Candidates applying under Freedom Fighter (children/grandchildren) or Ethnic Tribal quotas must upload verifiable government certificates issued by the Ministry of Liberation War Affairs.', 0, 1, '2026-10-03', 'Quota_Verification_Schedule.pdf');