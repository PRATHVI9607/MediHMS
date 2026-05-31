-- ============================================================
--  MediVault HMS — MySQL Schema (faithful to the PRD ER diagram)
-- ============================================================
CREATE DATABASE IF NOT EXISTS medivault_hms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE medivault_hms;

-- ── DEPARTMENT (Strong) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS DEPARTMENT (
    department_id   INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ── DOCTOR (Strong) · BELONGS_TO → DEPARTMENT (N:1, total) ─
CREATE TABLE IF NOT EXISTS DOCTOR (
    doctor_id       INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    specialization  VARCHAR(100) NOT NULL,
    phone           VARCHAR(15)  NOT NULL,
    department_id   INT NOT NULL,
    CONSTRAINT fk_doctor_department
        FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ── PATIENT (Strong) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS PATIENT (
    patient_id  INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    age         TINYINT UNSIGNED NOT NULL CHECK (age > 0 AND age < 150),
    gender      ENUM('Male', 'Female', 'Other') NOT NULL,
    phone       VARCHAR(15) NOT NULL,
    address     TEXT
) ENGINE=InnoDB;

-- ── APPOINTMENT (Strong) · BOOKS → PATIENT · HAS → DOCTOR ─
CREATE TABLE IF NOT EXISTS APPOINTMENT (
    appointment_id   INT AUTO_INCREMENT PRIMARY KEY,
    appointment_date DATE NOT NULL,
    status           ENUM('Scheduled','Completed','Cancelled','No-Show') NOT NULL DEFAULT 'Scheduled',
    patient_id       INT NOT NULL,
    doctor_id        INT NOT NULL,
    CONSTRAINT fk_appt_patient
        FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_appt_doctor
        FOREIGN KEY (doctor_id) REFERENCES DOCTOR(doctor_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ── APPOINTMENT_DETAIL (Weak) · identifying owner APPOINTMENT
CREATE TABLE IF NOT EXISTS APPOINTMENT_DETAIL (
    detail_id          INT NOT NULL,
    appointment_id     INT NOT NULL,
    consultation_fee   DECIMAL(10,2) NOT NULL CHECK (consultation_fee >= 0),
    remarks            TEXT,
    PRIMARY KEY (appointment_id, detail_id),
    CONSTRAINT fk_detail_appointment
        FOREIGN KEY (appointment_id) REFERENCES APPOINTMENT(appointment_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ── APP_USER (auth infrastructure — outside the domain ER) ─
CREATE TABLE IF NOT EXISTS APP_USER (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(120) NOT NULL UNIQUE,
    full_name     VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('Admin','Doctor','Viewer') NOT NULL DEFAULT 'Viewer',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Indexes ──────────────────────────────────────────────
CREATE INDEX idx_doctor_dept   ON DOCTOR(department_id);
CREATE INDEX idx_appt_patient  ON APPOINTMENT(patient_id);
CREATE INDEX idx_appt_doctor   ON APPOINTMENT(doctor_id);
CREATE INDEX idx_appt_date     ON APPOINTMENT(appointment_date);
CREATE INDEX idx_appt_status   ON APPOINTMENT(status);
CREATE INDEX idx_patient_name  ON PATIENT(name);
CREATE INDEX idx_doctor_name   ON DOCTOR(name);
