-- DRIFT CAR RENTAL - revised schema
-- Target: MySQL 8.0.16+ (MySQL 8.4 recommended), InnoDB, utf8mb4.
-- Fresh installation ONLY; not an ALTER migration for an existing database.
-- Original input contained CREATE statements only, no records.
-- No DROP statements, credentials, fake accounts, bookings or payment seeds.
-- CREATE TABLE deliberately fails if a table already exists: do not use --force.
-- Import into an empty drift_car_rental schema, or change BOTH database names below.
-- DDL auto-commits in MySQL. This script does not modify the deployed application.

CREATE DATABASE IF NOT EXISTS drift_car_rental
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE drift_car_rental;
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE Province (
  province_id INT AUTO_INCREMENT PRIMARY KEY,
  province_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE City (
  city_id INT AUTO_INCREMENT PRIMARY KEY,
  city_name VARCHAR(80) NOT NULL,
  province_id INT NOT NULL,
  UNIQUE KEY uq_city_province (city_name, province_id),
  FOREIGN KEY (province_id) REFERENCES Province(province_id)
) ENGINE=InnoDB;

CREATE TABLE Branch (
  branch_id INT AUTO_INCREMENT PRIMARY KEY,
  branch_name VARCHAR(100) NOT NULL,
  city_id INT NOT NULL,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  postal_code VARCHAR(12),
  phone VARCHAR(25),
  email VARCHAR(254),
  opening_hours TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_branch_city (branch_name, city_id),
  CHECK (is_active IN (0,1)),
  FOREIGN KEY (city_id) REFERENCES City(city_id)
) ENGINE=InnoDB;

-- Category is body type (SUV, Sedan, etc.). Tier belongs to Vehicle, not category.
CREATE TABLE VehicleCategory (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE VehicleModel (
  model_id INT AUTO_INCREMENT PRIMARY KEY,
  brand VARCHAR(50) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  category_id INT NOT NULL,
  UNIQUE KEY uq_brand_model (brand, model_name),
  FOREIGN KEY (category_id) REFERENCES VehicleCategory(category_id)
) ENGINE=InnoDB;

CREATE TABLE Vehicle (
  vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
  model_id INT NOT NULL,
  branch_id INT NOT NULL,
  registration_no VARCHAR(20) NOT NULL UNIQUE,
  year SMALLINT NOT NULL,
  transmission ENUM('Manual','Automatic') NOT NULL,
  doors TINYINT NOT NULL DEFAULT 5,
  seats TINYINT NULL,
  colour VARCHAR(60),
  description TEXT,
  tier ENUM('Value','Comfort','Premium') NOT NULL,
  daily_rate DECIMAL(10,2) NOT NULL,
  status ENUM('Available','Reserved','Rented','Maintenance') NOT NULL DEFAULT 'Available',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (year BETWEEN 1886 AND 2155),
  CHECK (doors BETWEEN 2 AND 6),
  CHECK (seats IS NULL OR seats BETWEEN 1 AND 30),
  CHECK (daily_rate > 0),
  CHECK (is_active IN (0,1)),
  KEY ix_vehicle_browse (is_active, status, daily_rate),
  FOREIGN KEY (model_id) REFERENCES VehicleModel(model_id),
  FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)
) ENGINE=InnoDB;

CREATE TABLE VehicleImage (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  image_url VARCHAR(2048) NOT NULL,
  alt_text VARCHAR(255) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  source_url VARCHAR(2048),
  credit VARCHAR(500),
  license_name VARCHAR(120),
  license_url VARCHAR(2048),
  width_px INT,
  height_px INT,
  -- NULLs allow many secondary photos, but only one primary photo per vehicle.
  primary_vehicle_id INT GENERATED ALWAYS AS
    (CASE WHEN is_primary = 1 THEN vehicle_id ELSE NULL END) STORED,
  UNIQUE KEY uq_primary_vehicle_image (primary_vehicle_id),
  KEY ix_vehicle_image_order (vehicle_id, sort_order),
  CHECK (is_primary IN (0,1)),
  CHECK (sort_order >= 0),
  CHECK (width_px IS NULL OR width_px > 0),
  CHECK (height_px IS NULL OR height_px > 0),
  FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id)
) ENGINE=InnoDB;

CREATE TABLE Feature (
  feature_id INT AUTO_INCREMENT PRIMARY KEY,
  feature_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE VehicleFeature (
  vehicle_id INT NOT NULL,
  feature_id INT NOT NULL,
  PRIMARY KEY (vehicle_id, feature_id),
  FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id),
  FOREIGN KEY (feature_id) REFERENCES Feature(feature_id)
) ENGINE=InnoDB;

CREATE TABLE Customer (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  phone VARCHAR(25),
  -- Nullable while browsing/booking; verify the licence before handing over a car.
  license_no VARCHAR(50) UNIQUE,
  license_expiry DATE,
  license_verified_at DATETIME,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE AppUser (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  login_email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Customer','Admin') NOT NULL DEFAULT 'Customer',
  customer_id INT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified_at DATETIME,
  last_login_at DATETIME,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (role = 'Admin' OR customer_id IS NOT NULL),
  CHECK (is_active IN (0,1)),
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
) ENGINE=InnoDB;

-- Store hashes of cryptographically random tokens, never raw session/reset tokens.
CREATE TABLE UserSession (
  session_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_session_expiry (expires_at),
  FOREIGN KEY (user_id) REFERENCES AppUser(user_id)
) ENGINE=InnoDB;

CREATE TABLE PasswordResetToken (
  reset_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_reset_expiry (expires_at),
  FOREIGN KEY (user_id) REFERENCES AppUser(user_id)
) ENGINE=InnoDB;

-- Prices are snapshots; changing vehicle/extra prices never reprices a booking.
-- Date-only rentals: same-day rental = one day, otherwise DATEDIFF(end,start).
CREATE TABLE Booking (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_reference VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  idempotency_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  customer_id INT NULL,
  customer_name VARCHAR(180) NOT NULL,
  customer_email VARCHAR(254) NOT NULL,
  customer_phone VARCHAR(25),
  vehicle_id INT NOT NULL,
  vehicle_name_snapshot VARCHAR(180) NOT NULL,
  pickup_branch_id INT NOT NULL,
  return_branch_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rental_days INT GENERATED ALWAYS AS (GREATEST(1, DATEDIFF(end_date,start_date))) STORED,
  daily_rate_applied DECIMAL(10,2) NOT NULL,
  rental_subtotal DECIMAL(12,2) GENERATED ALWAYS AS
    (daily_rate_applied * GREATEST(1, DATEDIFF(end_date,start_date))) STORED,
  extras_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS
    (daily_rate_applied * GREATEST(1, DATEDIFF(end_date,start_date)) + extras_total) STORED,
  currency CHAR(3) CHARACTER SET ascii NOT NULL DEFAULT 'ZAR',
  status ENUM('Pending','Confirmed','Cancellation Requested','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (end_date >= start_date),
  CHECK (daily_rate_applied > 0),
  CHECK (extras_total >= 0),
  CHECK (is_demo IN (0,1)),
  KEY ix_booking_calendar (vehicle_id, status, start_date, end_date),
  KEY ix_booking_customer_email (customer_email, created_at),
  KEY ix_booking_customer (customer_id, created_at),
  KEY ix_booking_status (status, created_at),
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
  FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id),
  FOREIGN KEY (pickup_branch_id) REFERENCES Branch(branch_id),
  FOREIGN KEY (return_branch_id) REFERENCES Branch(branch_id)
) ENGINE=InnoDB;

CREATE TABLE RentalExtra (
  extra_id INT AUTO_INCREMENT PRIMARY KEY,
  extra_code VARCHAR(50) NOT NULL UNIQUE,
  extra_name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  price DECIMAL(10,2) NOT NULL,
  pricing_type ENUM('daily','once') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (price >= 0),
  CHECK (is_active IN (0,1))
) ENGINE=InnoDB;

CREATE TABLE BookingExtra (
  booking_extra_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  extra_id INT NOT NULL,
  extra_name_snapshot VARCHAR(100) NOT NULL,
  pricing_type ENUM('daily','once') NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  charged_days INT NOT NULL DEFAULT 1,
  line_total DECIMAL(12,2) GENERATED ALWAYS AS
    (unit_price * quantity * CASE WHEN pricing_type = 'daily' THEN charged_days ELSE 1 END) STORED,
  UNIQUE KEY uq_booking_extra (booking_id, extra_id),
  CHECK (unit_price >= 0),
  CHECK (quantity > 0),
  CHECK (charged_days > 0),
  CHECK (pricing_type = 'daily' OR charged_days = 1),
  FOREIGN KEY (booking_id) REFERENCES Booking(booking_id),
  FOREIGN KEY (extra_id) REFERENCES RentalExtra(extra_id)
) ENGINE=InnoDB;

-- One row per payment attempt; retries use the same idempotency key.
-- No card number, CVV or bank credentials belong in this table.
CREATE TABLE Payment (
  payment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  idempotency_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) CHARACTER SET ascii NOT NULL DEFAULT 'ZAR',
  method ENUM('Card','EFT','Demo') NOT NULL,
  status ENUM('Pending','Processing','Paid','Failed','Cancelled','Refunded','DemoApproved') NOT NULL DEFAULT 'Pending',
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  provider VARCHAR(80),
  provider_reference VARCHAR(191) CHARACTER SET ascii COLLATE ascii_bin,
  failure_reason VARCHAR(500),
  paid_at DATETIME NULL,
  refunded_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payment_provider_reference (provider, provider_reference),
  KEY ix_payment_booking_status (booking_id, status),
  CHECK (amount > 0),
  CHECK (is_demo IN (0,1)),
  CHECK ((is_demo = 1 AND method = 'Demo' AND status IN ('Pending','Processing','Failed','Cancelled','DemoApproved') AND paid_at IS NULL AND refunded_at IS NULL)
      OR (is_demo = 0 AND method <> 'Demo' AND status <> 'DemoApproved')),
  CHECK (status NOT IN ('Paid','Refunded') OR paid_at IS NOT NULL),
  CHECK (status <> 'Refunded' OR refunded_at IS NOT NULL),
  FOREIGN KEY (booking_id) REFERENCES Booking(booking_id)
) ENGINE=InnoDB;

CREATE TABLE CancellationRequest (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('Pending','Approved','Rejected','Withdrawn') NOT NULL DEFAULT 'Pending',
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  admin_note TEXT,
  -- Keep history, while preventing multiple simultaneous pending requests.
  pending_booking_id INT GENERATED ALWAYS AS
    (CASE WHEN status = 'Pending' THEN booking_id ELSE NULL END) STORED,
  UNIQUE KEY uq_pending_cancellation (pending_booking_id),
  KEY ix_cancellation_queue (status, requested_at),
  CHECK (status NOT IN ('Approved','Rejected') OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
  FOREIGN KEY (booking_id) REFERENCES Booking(booking_id),
  FOREIGN KEY (reviewed_by) REFERENCES AppUser(user_id)
) ENGINE=InnoDB;

CREATE TABLE BookingStatusHistory (
  history_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  old_status ENUM('Pending','Confirmed','Cancellation Requested','Completed','Cancelled') NULL,
  new_status ENUM('Pending','Confirmed','Cancellation Requested','Completed','Cancelled') NOT NULL,
  changed_by INT NULL,
  reason VARCHAR(500),
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_booking_history (booking_id, changed_at),
  FOREIGN KEY (booking_id) REFERENCES Booking(booking_id),
  FOREIGN KEY (changed_by) REFERENCES AppUser(user_id)
) ENGINE=InnoDB;

CREATE TABLE BookingEmail (
  email_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  recipient VARCHAR(254) NOT NULL,
  email_type ENUM('Confirmation','Cancellation','Reminder') NOT NULL,
  status ENUM('Pending','Sent','Failed') NOT NULL DEFAULT 'Pending',
  provider_message_id VARCHAR(191),
  attempts INT NOT NULL DEFAULT 0,
  last_error VARCHAR(1000),
  sent_at DATETIME,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (attempts >= 0),
  CHECK (status <> 'Sent' OR sent_at IS NOT NULL),
  KEY ix_email_queue (status, created_at),
  FOREIGN KEY (booking_id) REFERENCES Booking(booking_id)
) ENGINE=InnoDB;

-- Actual reviews only: one review per booking, no fabricated ratings.
-- Vehicle/customer are derived by joining Booking; do not duplicate these keys.
CREATE TABLE VehicleReview (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  rating TINYINT NOT NULL,
  review_text TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (rating BETWEEN 1 AND 5),
  CHECK (is_published IN (0,1)),
  FOREIGN KEY (booking_id) REFERENCES Booking(booking_id)
) ENGINE=InnoDB;

-- APPLICATION TRANSACTION REQUIREMENTS (not enforced by row CHECK constraints):
-- 1. Lock the Vehicle row with SELECT ... FOR UPDATE before testing date overlap
--    and inserting or rescheduling a non-cancelled/non-completed booking.
--    Every booking writer must use the same lock. Same-day dates reserve a day.
--    Treat dates as inclusive for availability, matching the current Drift app.
-- 2. Write Booking and BookingExtra rows and set extras_total = SUM(line_total)
--    in one transaction. Daily extras charged_days must equal rental_days.
-- 3. Authorize roles and ownership on the SERVER, never from a browser role flag.
--    Reviewers must be admins. A review must belong to a completed booking.
-- 4. Approving cancellation updates Booking, CancellationRequest and history
--    atomically. A cancellation request alone does not release the vehicle.
-- 5. Real payment success requires provider verification. DemoApproved must not
--    be counted as revenue. Currency must agree with the booking. Payment alone can be simulated.
-- 6. Use salted scrypt/Argon2id/bcrypt password hashing, parameterized queries and expiring,
--    server-validated sessions. No Google or social-login identity tables.
-- 7. Archive referenced records rather than deleting rental/payment history.
-- 8. Configure MYSQL_DATABASE=drift_car_rental. The local Node app reads these server-side settings.

SHOW TABLES;
