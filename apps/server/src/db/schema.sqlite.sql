-- ============================================================
--  MediVault HMS — SQLite Schema (dev mirror of MySQL schema)
--  ENUM → TEXT + CHECK · AUTO_INCREMENT → INTEGER PK AUTOINCREMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS DEPARTMENT (
    department_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    department_name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS DOCTOR (
    doctor_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    specialization  TEXT NOT NULL,
    phone           TEXT NOT NULL,
    department_id   INTEGER NOT NULL,
    FOREIGN KEY (department_id) REFERENCES DEPARTMENT(department_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS PATIENT (
    patient_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    age         INTEGER NOT NULL CHECK (age > 0 AND age < 150),
    gender      TEXT NOT NULL CHECK (gender IN ('Male','Female','Other')),
    phone       TEXT NOT NULL,
    address     TEXT
);

CREATE TABLE IF NOT EXISTS APPOINTMENT (
    appointment_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_date TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'Scheduled'
                     CHECK (status IN ('Scheduled','Completed','Cancelled','No-Show')),
    patient_id       INTEGER NOT NULL,
    doctor_id        INTEGER NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES PATIENT(patient_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES DOCTOR(doctor_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS APPOINTMENT_DETAIL (
    detail_id          INTEGER NOT NULL,
    appointment_id     INTEGER NOT NULL,
    consultation_fee   REAL NOT NULL CHECK (consultation_fee >= 0),
    remarks            TEXT,
    PRIMARY KEY (appointment_id, detail_id),
    FOREIGN KEY (appointment_id) REFERENCES APPOINTMENT(appointment_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS APP_USER (
    user_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    full_name     TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'Viewer'
                  CHECK (role IN ('Admin','Doctor','Viewer')),
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_doctor_dept   ON DOCTOR(department_id);
CREATE INDEX IF NOT EXISTS idx_appt_patient  ON APPOINTMENT(patient_id);
CREATE INDEX IF NOT EXISTS idx_appt_doctor   ON APPOINTMENT(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appt_date     ON APPOINTMENT(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appt_status   ON APPOINTMENT(status);
CREATE INDEX IF NOT EXISTS idx_patient_name  ON PATIENT(name);
CREATE INDEX IF NOT EXISTS idx_doctor_name   ON DOCTOR(name);
