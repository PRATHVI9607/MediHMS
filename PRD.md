# 🏥 Hospital Data Management System — Product Requirements Document (PRD)

**Version:** 1.0.0  
**Author:** Loki (God of Mischief, RVCE CSE '27)  
**Date:** May 31, 2026  
**Status:** Ready for Implementation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [ER Schema Reference (Source of Truth)](#2-er-schema-reference)
3. [MySQL Database Design](#3-mysql-database-design)
4. [Tech Stack](#4-tech-stack)
5. [System Architecture](#5-system-architecture)
6. [UI / UX Design Specification](#6-ui--ux-design-specification)
7. [Frontend — Module Breakdown](#7-frontend--module-breakdown)
8. [Backend — API Specification](#8-backend--api-specification)
9. [Database Query Interface](#9-database-query-interface)
10. [Feature Requirements](#10-feature-requirements)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Project File Structure](#12-project-file-structure)
13. [Implementation Roadmap](#13-implementation-roadmap)
14. [Open Questions for Stack Confirmation](#14-open-questions-for-stack-confirmation)

---

## 1. Project Overview

**Product Name:** MediVault HMS  
**Tagline:** *Precision Care. Zero Chaos.*

MediVault is a full-stack Hospital Data Management System built on top of the ER schema provided. It provides a premium, queryable dashboard interface for hospital administrators to manage departments, doctors, patients, appointments, and appointment details — with a rich SQL query interface for power users.

### Goals
- Faithfully implement the ER schema in MySQL (no deviation from the diagram)
- Provide CRUD operations for all entities
- Deliver a premium Cream × Gold × Sky-Blue UI dashboard using the taste-skill design system
- Include an interactive SQL query console for direct DB access
- Support real-time filtering, pagination, and record lookups

---

## 2. ER Schema Reference

> This is the **canonical schema** — everything downstream (MySQL DDL, API, UI) must conform exactly to this.

### Entities & Attributes

| Entity | Type | Primary Key | Attributes |
|---|---|---|---|
| DEPARTMENT | Strong | `department_id` | `department_name` |
| DOCTOR | Strong | `doctor_id` | `name`, `specialization`, `phone` |
| PATIENT | Strong | `patient_id` | `name`, `age`, `gender`, `phone`, `address` |
| APPOINTMENT | Strong | `appointment_id` | `appointment_date`, `status` |
| APPOINTMENT_DETAIL | **Weak** | `detail_id` (partial key) | `consultation_fee`, `remarks` |

### Relationships

| Relationship | Type | Entities | Cardinality | Participation |
|---|---|---|---|---|
| BELONGS_TO | Regular | DEPARTMENT → DOCTOR | 1 : N | DOCTOR: Total |
| HAS (Doctor ↔ Appointment) | Regular | DOCTOR → APPOINTMENT | 1 : N | APPOINTMENT: Total |
| BOOKS | Regular | PATIENT → APPOINTMENT | 1 : N | APPOINTMENT: Total |
| HAS (Appointment ↔ Detail) | **Weak** | APPOINTMENT → APPOINTMENT_DETAIL | 1 : N | DETAIL: Total |

### Key Constraints (from ER notes)
- `department_id`, `doctor_id`, `patient_id`, `appointment_id` are **primary keys**
- `detail_id` is the **partial key** of the weak entity `APPOINTMENT_DETAIL`
- `appointment_id` inside `APPOINTMENT_DETAIL` is a **foreign key** acting as the **identifying owner key**
- Double lines = **total participation**
- Dashed ovals = **derived attributes** (none explicitly derived here, but `(appointment_id)` inside DETAIL is a foreign key indicator)

---

## 3. MySQL Database Design

### 3.1 DDL — Full Schema

```sql
-- ============================================================
--  MediVault HMS — MySQL Schema
--  Faithful implementation of the provided ER Diagram
-- ============================================================

CREATE DATABASE IF NOT EXISTS medivault_hms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE medivault_hms;

-- ─────────────────────────────────────────
--  Table: DEPARTMENT  (Strong Entity)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS DEPARTMENT (
    department_id   INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────
--  Table: DOCTOR  (Strong Entity)
--  BELONGS_TO → DEPARTMENT  (N:1)
--  Total Participation (DOCTOR must belong to a DEPARTMENT)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS DOCTOR (
    doctor_id       INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    specialization  VARCHAR(100) NOT NULL,
    phone           VARCHAR(15)  NOT NULL,
    department_id   INT NOT NULL,
    CONSTRAINT fk_doctor_department
        FOREIGN KEY (department_id)
        REFERENCES DEPARTMENT(department_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────
--  Table: PATIENT  (Strong Entity)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS PATIENT (
    patient_id  INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    age         TINYINT UNSIGNED NOT NULL CHECK (age > 0 AND age < 150),
    gender      ENUM('Male', 'Female', 'Other') NOT NULL,
    phone       VARCHAR(15) NOT NULL,
    address     TEXT
) ENGINE=InnoDB;

-- ─────────────────────────────────────────
--  Table: APPOINTMENT  (Strong Entity)
--  BOOKS → PATIENT       (N:1)   Total participation
--  HAS   → DOCTOR        (N:1)   Total participation
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS APPOINTMENT (
    appointment_id   INT AUTO_INCREMENT PRIMARY KEY,
    appointment_date DATE NOT NULL,
    status           ENUM('Scheduled', 'Completed', 'Cancelled', 'No-Show') NOT NULL DEFAULT 'Scheduled',
    patient_id       INT NOT NULL,
    doctor_id        INT NOT NULL,
    CONSTRAINT fk_appt_patient
        FOREIGN KEY (patient_id)
        REFERENCES PATIENT(patient_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_appt_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES DOCTOR(doctor_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────
--  Table: APPOINTMENT_DETAIL  (Weak Entity)
--  Identifying owner: APPOINTMENT
--  Partial key: detail_id
--  Composite PK: (appointment_id, detail_id)
--  Total participation in HAS relationship
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS APPOINTMENT_DETAIL (
    detail_id          INT NOT NULL,
    appointment_id     INT NOT NULL,
    consultation_fee   DECIMAL(10, 2) NOT NULL CHECK (consultation_fee >= 0),
    remarks            TEXT,
    PRIMARY KEY (appointment_id, detail_id),          -- composite PK (weak entity pattern)
    CONSTRAINT fk_detail_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES APPOINTMENT(appointment_id)
        ON DELETE CASCADE                              -- detail dies with appointment
        ON UPDATE CASCADE
) ENGINE=InnoDB;
```

### 3.2 Indexes for Query Performance

```sql
-- Frequently queried fields
CREATE INDEX idx_doctor_dept     ON DOCTOR(department_id);
CREATE INDEX idx_appt_patient    ON APPOINTMENT(patient_id);
CREATE INDEX idx_appt_doctor     ON APPOINTMENT(doctor_id);
CREATE INDEX idx_appt_date       ON APPOINTMENT(appointment_date);
CREATE INDEX idx_appt_status     ON APPOINTMENT(status);
CREATE INDEX idx_patient_name    ON PATIENT(name);
CREATE INDEX idx_doctor_name     ON DOCTOR(name);
```

### 3.3 Seed Data

```sql
-- Departments
INSERT INTO DEPARTMENT (department_name) VALUES
  ('Cardiology'), ('Neurology'), ('Orthopedics'), ('Pediatrics'), ('Dermatology');

-- Doctors
INSERT INTO DOCTOR (name, specialization, phone, department_id) VALUES
  ('Dr. Arjun Mehta',   'Cardiologist',      '9900112233', 1),
  ('Dr. Priya Sharma',  'Neurologist',        '9900223344', 2),
  ('Dr. Rajan Pillai',  'Orthopedic Surgeon', '9900334455', 3),
  ('Dr. Sneha Nair',    'Pediatrician',       '9900445566', 4),
  ('Dr. Kiran Reddy',   'Dermatologist',      '9900556677', 5);

-- Patients
INSERT INTO PATIENT (name, age, gender, phone, address) VALUES
  ('Rohit Kumar',    34, 'Male',   '8800112233', 'Koramangala, Bengaluru'),
  ('Ananya Singh',   28, 'Female', '8800223344', 'Indiranagar, Bengaluru'),
  ('Vikram Patel',   52, 'Male',   '8800334455', 'Whitefield, Bengaluru'),
  ('Meera Iyer',     21, 'Female', '8800445566', 'BTM Layout, Bengaluru'),
  ('Sanjay Ghosh',   45, 'Male',   '8800556677', 'HSR Layout, Bengaluru');

-- Appointments
INSERT INTO APPOINTMENT (appointment_date, status, patient_id, doctor_id) VALUES
  ('2026-06-01', 'Scheduled',  1, 1),
  ('2026-06-02', 'Completed',  2, 2),
  ('2026-06-03', 'Scheduled',  3, 3),
  ('2026-05-28', 'Completed',  4, 4),
  ('2026-05-30', 'Cancelled',  5, 5);

-- Appointment Details
INSERT INTO APPOINTMENT_DETAIL (detail_id, appointment_id, consultation_fee, remarks) VALUES
  (1, 2, 800.00, 'Patient presented with migraine. MRI recommended.'),
  (1, 4, 500.00, 'Routine check-up. All clear.'),
  (1, 5, 0.00,   'Patient did not arrive. Rescheduling advised.');
```

### 3.4 Common Query Reference

```sql
-- Q1: All doctors in a department
SELECT d.name, d.specialization, d.phone
FROM DOCTOR d
JOIN DEPARTMENT dept ON d.department_id = dept.department_id
WHERE dept.department_name = 'Cardiology';

-- Q2: All appointments for a specific patient
SELECT a.appointment_id, a.appointment_date, a.status, doc.name AS doctor
FROM APPOINTMENT a
JOIN DOCTOR doc ON a.doctor_id = doc.doctor_id
WHERE a.patient_id = 1;

-- Q3: Full appointment detail with all joins
SELECT
    a.appointment_id,
    p.name AS patient_name,
    doc.name AS doctor_name,
    dept.department_name,
    a.appointment_date,
    a.status,
    ad.detail_id,
    ad.consultation_fee,
    ad.remarks
FROM APPOINTMENT a
JOIN PATIENT p   ON a.patient_id   = p.patient_id
JOIN DOCTOR doc  ON a.doctor_id    = doc.doctor_id
JOIN DEPARTMENT dept ON doc.department_id = dept.department_id
LEFT JOIN APPOINTMENT_DETAIL ad ON a.appointment_id = ad.appointment_id
ORDER BY a.appointment_date DESC;

-- Q4: Revenue by department
SELECT dept.department_name, SUM(ad.consultation_fee) AS total_revenue
FROM APPOINTMENT_DETAIL ad
JOIN APPOINTMENT a ON ad.appointment_id = a.appointment_id
JOIN DOCTOR doc ON a.doctor_id = doc.doctor_id
JOIN DEPARTMENT dept ON doc.department_id = dept.department_id
GROUP BY dept.department_name
ORDER BY total_revenue DESC;

-- Q5: Appointment count per status
SELECT status, COUNT(*) AS count
FROM APPOINTMENT
GROUP BY status;

-- Q6: Most active doctors
SELECT doc.name, doc.specialization, COUNT(a.appointment_id) AS total_appointments
FROM DOCTOR doc
LEFT JOIN APPOINTMENT a ON doc.doctor_id = a.doctor_id
GROUP BY doc.doctor_id
ORDER BY total_appointments DESC
LIMIT 5;
```

---

## 4. Tech Stack

> **Stack to be confirmed by user** (see Section 14 for options). Below is the **recommended default** stack:

### 4.1 Recommended Stack (Full-Stack JS Monorepo)

| Layer | Technology | Rationale |
|---|---|---|
| **Database** | MySQL 8.x | As specified in requirements |
| **Backend** | Node.js + Express.js | Lightweight, fast, familiar for students |
| **ORM / Query** | mysql2 (raw SQL) + Knex.js (query builder) | Direct SQL control; mirrors DB course learning |
| **Frontend** | React 18 + Vite | Fast DX, great ecosystem |
| **Styling** | Tailwind CSS v4 | Utility-first, taste-skill compatible |
| **UI Components** | shadcn/ui (Radix primitives) | Accessible, customizable, premium feel |
| **State** | Zustand | Lightweight global state |
| **Data Fetching** | TanStack Query (React Query) | Cache, loading/error states, pagination |
| **Charts** | Recharts | Good TS support, Tailwind-friendly |
| **Animations** | Motion (motion/react) | Tasteskill-standard |
| **Icons** | @phosphor-icons/react | Tasteskill-specified |
| **Auth** | JWT + bcrypt | Simple role-based access (Admin, Doctor, Viewer) |
| **API Client** | Axios | REST calls |
| **Dev Tooling** | ESLint, Prettier, Vitest | DX hygiene |
| **Package Manager** | pnpm | Speed |

### 4.2 Alternate Stack (Python Backend)

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| ORM | SQLAlchemy (async) |
| DB Driver | aiomysql |
| Frontend | Same as above (React + Vite) |

### 4.3 Monorepo Layout

```
medivault-hms/
├── apps/
│   ├── server/       → Express.js backend
│   └── web/          → React frontend
├── packages/
│   └── shared/       → Shared TS types, constants, utils
├── docker-compose.yml
└── pnpm-workspace.yaml
```

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (React SPA)                  │
│  Dashboard │ Tables │ Query Console │ Charts │ Forms    │
└────────────────────────┬────────────────────────────────┘
                         │ REST / JSON  (Axios + React Query)
┌────────────────────────▼────────────────────────────────┐
│               EXPRESS.JS REST API  (Node.js)            │
│  /api/departments  /api/doctors  /api/patients          │
│  /api/appointments  /api/details  /api/query (SQL)      │
│  Auth Middleware │ Rate Limiting │ Input Validation     │
└────────────────────────┬────────────────────────────────┘
                         │ mysql2 connection pool
┌────────────────────────▼────────────────────────────────┐
│                    MySQL 8.x Database                   │
│  medivault_hms → DEPARTMENT, DOCTOR, PATIENT,           │
│                  APPOINTMENT, APPOINTMENT_DETAIL        │
└─────────────────────────────────────────────────────────┘
```

### Data Flow
1. User interacts with React UI
2. React Query fires Axios request to Express API
3. Express validates, applies auth middleware, builds SQL via Knex or raw `mysql2`
4. MySQL returns result set
5. Express serializes JSON response
6. React Query caches and hydrates UI components

---

## 6. UI / UX Design Specification

### 6.1 Design System — taste-skill Parameters

```
DESIGN_VARIANCE:  7   (premium consumer / refined — not chaotic, not sterile)
MOTION_INTENSITY: 6   (subtle entrances, hover states, skeleton loaders)
VISUAL_DENSITY:   5   (data-rich dashboard — packed but not cockpit)
```

**Design Read:**  
*"Reading this as: premium hospital admin dashboard for power users, with a refined luxury-data language, leaning toward shadcn/ui + Tailwind v4 + Motion, Cream × Gold × Sky-Blue palette."*

---

### 6.2 Color Palette

> Cream × Gold × Sky-Blue gradient system — enforced globally.

```css
:root {
  /* ── Base Surfaces ─────────────────────────────── */
  --surface-base:      #FDFAF4;   /* warm cream — page background */
  --surface-elevated:  #FFFDF7;   /* lighter cream — cards */
  --surface-overlay:   #F5EFD8;   /* deeper cream — sidebar, headers */

  /* ── Gold Accent System ────────────────────────── */
  --gold-primary:      #C9A84C;   /* primary gold CTA, borders */
  --gold-light:        #E8D080;   /* hover states, highlights */
  --gold-muted:        #D4B96A;   /* secondary gold */
  --gold-dark:         #9A7A2E;   /* active states, pressed */

  /* ── Sky-Blue Accent System ────────────────────── */
  --sky-primary:       #5DB8D4;   /* info, links, badges */
  --sky-light:         #A8DFF0;   /* background tints */
  --sky-muted:         #7BCCE0;   /* secondary info */
  --sky-dark:          #3A8FA8;   /* hover on sky elements */

  /* ── Gradients ─────────────────────────────────── */
  --gradient-hero:     linear-gradient(135deg, #FDFAF4 0%, #E8D080 40%, #A8DFF0 100%);
  --gradient-card:     linear-gradient(145deg, #FFFDF7 0%, #F5EFD8 100%);
  --gradient-gold:     linear-gradient(90deg, #C9A84C 0%, #E8D080 50%, #C9A84C 100%);
  --gradient-sidebar:  linear-gradient(180deg, #F5EFD8 0%, #EDE3C8 100%);

  /* ── Text ───────────────────────────────────────── */
  --text-primary:      #2C2410;   /* warm near-black (not espresso — warmer) */
  --text-secondary:    #6B5E3E;   /* medium warm brown */
  --text-muted:        #A08C6E;   /* muted labels */
  --text-inverse:      #FDFAF4;   /* on dark/gold backgrounds */

  /* ── Borders & Dividers ─────────────────────────── */
  --border-default:    #E2D8BE;   /* soft warm border */
  --border-gold:       #C9A84C40; /* translucent gold border */
  --border-sky:        #5DB8D440; /* translucent sky border */

  /* ── Status Colors ──────────────────────────────── */
  --status-success:    #4CAF6E;   /* green */
  --status-warning:    #E8A23C;   /* warm amber */
  --status-error:      #D64C4C;   /* red */
  --status-info:       #5DB8D4;   /* sky blue */

  /* ── Shadows ─────────────────────────────────────── */
  --shadow-sm:         0 2px 8px  rgba(180, 150, 80, 0.12);
  --shadow-md:         0 4px 20px rgba(180, 150, 80, 0.18);
  --shadow-gold:       0 0 24px   rgba(201, 168, 76, 0.30);
  --shadow-sky:        0 0 24px   rgba(93, 184, 212, 0.25);
}
```

---

### 6.3 Typography

```css
/* Display Font: Cormorant Garamond — refined, medical authority */
/* Body Font: Cabinet Grotesk — modern, clean, data-friendly */
/* Mono Font: JetBrains Mono — SQL query console */

@font-face {
  font-family: 'Cabinet Grotesk';
  src: url('/fonts/CabinetGrotesk-Variable.woff2') format('woff2');
  font-display: swap;
}

:root {
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body:    'Cabinet Grotesk', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;
}

/* Headline scale */
h1 { font: 700 2.8rem/1.1 var(--font-display); letter-spacing: -0.02em; }
h2 { font: 600 1.8rem/1.2 var(--font-display); letter-spacing: -0.01em; }
h3 { font: 600 1.1rem/1.4 var(--font-body); }
```

> **Rationale for Cormorant Garamond:** Healthcare requires an air of authority and trust. The ER diagram context (a hospital system) justifies a heritage serif for headings — this is one of the rare valid serif cases per taste-skill rules. All body/data text uses Cabinet Grotesk for readability.

---

### 6.4 Component Radius System

```
--radius-sm:   6px    (inputs, tags, chips)
--radius-md:   12px   (cards, panels)
--radius-lg:   18px   (modals, drawers)
--radius-pill: 9999px (status badges, buttons)
```

**Rule:** cards are 12px, buttons are pill, inputs are 6px. No mixing.

---

## 7. Frontend — Module Breakdown

### 7.1 Application Shell

```
src/
├── App.tsx                → Router root
├── main.tsx               → React entry point
├── layouts/
│   ├── DashboardLayout.tsx  → Sidebar + topbar + content area
│   └── AuthLayout.tsx       → Login page wrapper
├── components/
│   ├── ui/                  → shadcn/ui customized components
│   ├── shared/              → Shared: DataTable, StatCard, Badge, Modal
│   └── charts/              → Recharts wrappers
├── pages/
│   ├── Dashboard.tsx        → Overview with KPI cards + charts
│   ├── Departments.tsx      → Department CRUD table
│   ├── Doctors.tsx          → Doctor management
│   ├── Patients.tsx         → Patient records
│   ├── Appointments.tsx     → Appointment scheduler + list
│   ├── AppointmentDetail.tsx → Weak entity management
│   └── QueryConsole.tsx     → SQL query interface
├── hooks/
│   ├── useAppointments.ts
│   ├── useDoctors.ts
│   ├── usePatients.ts
│   └── useQuery.ts          → SQL console hook
├── store/
│   └── useAppStore.ts       → Zustand global state
├── api/
│   └── client.ts            → Axios instance + interceptors
└── types/
    └── index.ts             → All shared TypeScript types
```

---

### 7.2 Page Specifications

#### 7.2.1 Dashboard (Overview)

**URL:** `/`  
**Purpose:** KPI overview + charts at a glance

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  TOPBAR: MediVault Logo + Search + User Avatar               │
├────────────┬─────────────────────────────────────────────────┤
│            │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  SIDEBAR   │  │Total │ │Total │ │Today's│ │Revenue│          │
│            │  │Depts │ │Docs  │ │Appts  │ │(MTD)  │          │
│  Dashboard │  └──────┘ └──────┘ └──────┘ └──────┘          │
│  ─────     │                                                 │
│  Depts     │  ┌─────────────────────┐ ┌───────────────────┐ │
│  Doctors   │  │ Appointments Trend  │ │ Dept Revenue Bar  │ │
│  Patients  │  │ (Line Chart)        │ │ (Bar Chart)       │ │
│  Appts     │  └─────────────────────┘ └───────────────────┘ │
│  Details   │                                                 │
│  ─────     │  ┌──────────────────────────────────────────┐  │
│  SQL Query │  │ Recent Appointments Table (last 5)       │  │
│            │  │ patient | doctor | date | status | fee   │  │
│            │  └──────────────────────────────────────────┘  │
└────────────┴─────────────────────────────────────────────────┘
```

**KPI Cards:** Total Departments, Total Doctors, Total Patients, Today's Appointments, Monthly Revenue  
**Charts:** Appointment trend (Line), Revenue by Department (Bar), Status Distribution (Donut)

---

#### 7.2.2 Departments Module

**URL:** `/departments`

**Features:**
- DataTable: `department_id`, `department_name`, Doctor Count (computed), Actions
- Add Department (modal form)
- Edit Department name (inline or modal)
- Delete (with FK guard: cannot delete if doctors exist)
- Search/filter by name

**Form fields:**
```
department_name  [text input, required, unique]
```

---

#### 7.2.3 Doctors Module

**URL:** `/doctors`

**Features:**
- DataTable: `doctor_id`, `name`, `specialization`, `phone`, `department_name`, Appointment Count
- Filters: Department dropdown, Specialization search
- Add/Edit Doctor (modal)
- Soft-delete (mark inactive instead of hard delete for FK integrity)
- View Doctor Profile → shows appointment history

**Form fields:**
```
name             [text, required]
specialization   [text, required]
phone            [text, 10-digit validation]
department_id    [select from DEPARTMENT, required]
```

---

#### 7.2.4 Patients Module

**URL:** `/patients`

**Features:**
- DataTable: `patient_id`, `name`, `age`, `gender`, `phone`, `address` (truncated)
- Search by name, filter by gender/age range
- Add/Edit Patient
- View Patient → shows appointment history + consultation details
- Export patient list as CSV

**Form fields:**
```
name     [text, required]
age      [number, 1-149]
gender   [radio: Male / Female / Other]
phone    [text, required]
address  [textarea, optional]
```

---

#### 7.2.5 Appointments Module

**URL:** `/appointments`

**Features:**
- DataTable (full join): appointment_id, patient, doctor, department, date, status, fee
- Status filter chips: All | Scheduled | Completed | Cancelled | No-Show
- Date range picker
- Add Appointment (picks patient, doctor → auto-pulls department)
- Edit status of existing appointment
- Delete (cascades to APPOINTMENT_DETAIL)
- Calendar view toggle (month grid with appointments)

**Form fields:**
```
patient_id        [searchable select]
doctor_id         [searchable select, filters by department]
appointment_date  [date picker]
status            [select: Scheduled / Completed / Cancelled / No-Show]
```

---

#### 7.2.6 Appointment Detail Module

**URL:** `/appointments/:id/detail` or inline in appointments table

**Purpose:** Manage APPOINTMENT_DETAIL weak entity records per appointment

**Features:**
- List details for a given appointment_id (compound PK: appointment_id + detail_id)
- Add detail to an appointment
- Edit fee and remarks
- Delete detail record

**Form fields:**
```
consultation_fee  [decimal, min 0, required]
remarks           [textarea, optional]
```

> Note: `detail_id` is auto-incremented server-side per appointment (not globally unique — partial key behavior preserved).

---

#### 7.2.7 SQL Query Console

**URL:** `/query`

**Purpose:** Power-user SQL interface for direct database queries

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  SQL QUERY CONSOLE                              [Run] [Clear]│
├──────────────────────────────────────────────────────────┤
│  Quick Queries: [All Appointments] [Revenue Report] [...]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│   SELECT * FROM APPOINTMENT                              │
│   JOIN PATIENT p ON ...                                  │
│   WHERE status = 'Completed';                            │
│                                           (Monaco Editor)│
├──────────────────────────────────────────────────────────┤
│  RESULTS  (128 rows • 0.023s)    [Export CSV] [Copy JSON]│
├──────────────────────────────────────────────────────────┤
│  appointment_id │ patient_name │ doctor_name │ status   │
│  ─────────────────────────────────────────────────────── │
│  1              │ Rohit Kumar  │ Dr. Mehta   │ Completed│
│  ...                                                     │
└──────────────────────────────────────────────────────────┘
```

**Features:**
- Monaco Editor (VS Code editor) embedded for SQL syntax highlighting
- Quick query presets (dropdowns / chips)
- Read-only mode (only SELECT allowed by default; admin can unlock DML)
- Results table with sortable columns
- Export results as CSV or JSON
- Query history (last 10 queries stored in localStorage)
- Execution time display
- Row count display
- Error display (MySQL error message inline, styled red)

---

### 7.3 Sidebar Navigation

```
🏥 MediVault
─────────────────
📊 Dashboard
🏢 Departments
👨‍⚕️ Doctors
🧑‍💼 Patients
📅 Appointments
📋 Appt. Details
─────────────────
💻 SQL Console
─────────────────
⚙️  Settings
🚪 Logout
```

Sidebar is collapsible. Active link shows gold left border + cream text highlight.

---

### 7.4 Global UI Components

| Component | Behavior |
|---|---|
| `<StatCard>` | KPI box — icon + value + label + delta % |
| `<DataTable>` | Sortable, paginated, searchable, selectable rows |
| `<StatusBadge>` | Pill badge: Scheduled (sky), Completed (green), Cancelled (red), No-Show (amber) |
| `<ConfirmModal>` | Destructive action confirmation dialog |
| `<FormModal>` | Slide-in drawer or centered modal for Add/Edit |
| `<SearchInput>` | Debounced search with clear button |
| `<Skeleton>` | Shimmer loader matching each component's layout |
| `<Toast>` | Bottom-right success/error notifications (3s auto-dismiss) |

---

## 8. Backend — API Specification

### 8.1 Base URL

```
http://localhost:3001/api
```

### 8.2 Endpoints

#### DEPARTMENT

| Method | Endpoint | Description |
|---|---|---|
| GET | `/departments` | List all departments (+ doctor count) |
| GET | `/departments/:id` | Single department |
| POST | `/departments` | Create department |
| PUT | `/departments/:id` | Update name |
| DELETE | `/departments/:id` | Delete (rejects if doctors exist) |

#### DOCTOR

| Method | Endpoint | Description |
|---|---|---|
| GET | `/doctors` | List all doctors (+ department name) |
| GET | `/doctors/:id` | Single doctor + appointment history |
| POST | `/doctors` | Create doctor |
| PUT | `/doctors/:id` | Update doctor |
| DELETE | `/doctors/:id` | Soft-delete |

#### PATIENT

| Method | Endpoint | Description |
|---|---|---|
| GET | `/patients` | List all patients (paginated) |
| GET | `/patients/:id` | Patient + appointment history |
| POST | `/patients` | Create patient |
| PUT | `/patients/:id` | Update patient |
| DELETE | `/patients/:id` | Delete (guards FK) |

#### APPOINTMENT

| Method | Endpoint | Description |
|---|---|---|
| GET | `/appointments` | List all (full join: patient, doctor, dept, detail) |
| GET | `/appointments/:id` | Single appointment |
| POST | `/appointments` | Book appointment |
| PUT | `/appointments/:id` | Update status / reschedule |
| DELETE | `/appointments/:id` | Delete (cascades to details) |
| GET | `/appointments/stats` | Dashboard KPIs: count by status, revenue |

#### APPOINTMENT_DETAIL

| Method | Endpoint | Description |
|---|---|---|
| GET | `/appointments/:id/details` | All details for appointment |
| POST | `/appointments/:id/details` | Add detail (server generates detail_id) |
| PUT | `/appointments/:id/details/:detailId` | Edit fee/remarks |
| DELETE | `/appointments/:id/details/:detailId` | Remove detail |

#### SQL QUERY CONSOLE

| Method | Endpoint | Description |
|---|---|---|
| POST | `/query/execute` | Execute raw SQL (SELECT only unless admin) |

```json
// Request
{ "sql": "SELECT * FROM PATIENT WHERE age > 30 LIMIT 10;" }

// Response
{
  "rows": [...],
  "columns": ["patient_id", "name", "age", ...],
  "rowCount": 3,
  "executionTime": 12
}
```

---

### 8.3 Standard Response Envelope

```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "total": 50, "page": 1, "limit": 20 }
}

// Error
{
  "success": false,
  "error": {
    "code": "FK_CONSTRAINT",
    "message": "Cannot delete department: 3 doctors still assigned.",
    "detail": "..."
  }
}
```

### 8.4 Query Params (GET lists)

```
?page=1&limit=20
?search=Rohit
?status=Scheduled
?department_id=2
?date_from=2026-05-01&date_to=2026-05-31
?sort=appointment_date&order=desc
```

---

## 9. Database Query Interface

### 9.1 Query Security Model

```
Role: VIEWER   → SELECT only (all tables)
Role: DOCTOR   → SELECT + UPDATE (own appointments)
Role: ADMIN    → Full DML (SELECT / INSERT / UPDATE / DELETE)
```

### 9.2 Query Sanitization

- Use `mysql2`'s prepared statements for parameterized CRUD queries
- SQL console: parse AST to extract statement type before execution
- Block `DROP`, `TRUNCATE`, `ALTER`, `CREATE` in console (even for admin)
- Rate-limit `/query/execute` to 30 req/min per user

### 9.3 Quick Query Presets (built into console UI)

| Label | SQL |
|---|---|
| All Appointments (Full Join) | Q3 from Section 3.4 |
| Revenue by Department | Q4 from Section 3.4 |
| Appointment Status Distribution | Q5 from Section 3.4 |
| Top 5 Busiest Doctors | Q6 from Section 3.4 |
| Patients with No Appointments | `SELECT * FROM PATIENT WHERE patient_id NOT IN (SELECT patient_id FROM APPOINTMENT)` |
| Today's Schedule | `SELECT ... WHERE appointment_date = CURDATE()` |

---

## 10. Feature Requirements

### 10.1 Functional Requirements

| ID | Feature | Priority |
|---|---|---|
| FR-01 | Full CRUD for DEPARTMENT | P0 |
| FR-02 | Full CRUD for DOCTOR | P0 |
| FR-03 | Full CRUD for PATIENT | P0 |
| FR-04 | Full CRUD for APPOINTMENT | P0 |
| FR-05 | Full CRUD for APPOINTMENT_DETAIL (weak entity) | P0 |
| FR-06 | SQL Query Console (SELECT) | P0 |
| FR-07 | Dashboard KPIs + Charts | P1 |
| FR-08 | Appointment Status Filter + Date Range | P1 |
| FR-09 | Patient Appointment History View | P1 |
| FR-10 | Doctor Profile + Schedule View | P1 |
| FR-11 | Export to CSV (patients, appointments) | P2 |
| FR-12 | Calendar View for Appointments | P2 |
| FR-13 | JWT Auth (Login + Role) | P1 |
| FR-14 | SQL Console Quick Presets | P2 |
| FR-15 | Query History (localStorage) | P2 |

### 10.2 Non-Functional Requirements

| Req | Target |
|---|---|
| Page load (FCP) | < 1.5s on LAN |
| API response time (CRUD) | < 200ms p95 |
| API response time (SQL console) | < 2s for complex joins |
| DB connection pool | Min 5, Max 20 |
| Input validation | Zod on both frontend + backend |
| Accessibility | WCAG 2.1 AA (keyboard nav, ARIA labels) |
| Mobile responsiveness | Tablet (768px+) optimized; mobile sidebar collapses |

---

## 11. Non-Functional Requirements

### Security
- All inputs sanitized via `express-validator` + Zod
- SQL console: whitelist `SELECT`; DML gated behind admin role
- JWT expiry: 8 hours; refresh via cookie
- CORS restricted to frontend origin

### Error Handling
- FK constraint violations → user-friendly messages (not MySQL error codes)
- Network errors → Toast notifications
- 404 pages → styled with inline quick-links
- Query console errors → inline red panel with MySQL error message

---

## 12. Project File Structure

```
medivault-hms/
├── apps/
│   ├── server/
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── departments.js
│   │   │   │   ├── doctors.js
│   │   │   │   ├── patients.js
│   │   │   │   ├── appointments.js
│   │   │   │   ├── details.js
│   │   │   │   └── query.js
│   │   │   ├── middleware/
│   │   │   │   ├── auth.js
│   │   │   │   ├── validate.js
│   │   │   │   └── rateLimiter.js
│   │   │   ├── db/
│   │   │   │   ├── connection.js    → mysql2 pool setup
│   │   │   │   ├── schema.sql       → DDL
│   │   │   │   └── seed.sql         → Sample data
│   │   │   ├── controllers/         → Business logic
│   │   │   └── index.js             → Express app entry
│   │   ├── .env.example
│   │   └── package.json
│   └── web/
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── api/
│       │   ├── store/
│       │   └── types/
│       ├── public/fonts/
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
├── docker-compose.yml               → MySQL + adminer + app containers
├── pnpm-workspace.yaml
└── README.md
```

---

## 13. Implementation Roadmap

### Phase 1 — Foundation (Week 1)
- [ ] Project scaffold (monorepo, pnpm, Vite, Express)
- [ ] MySQL schema creation (DDL from Section 3.1)
- [ ] Seed data insertion
- [ ] Express server + DB connection pool
- [ ] Departments + Doctors CRUD API

### Phase 2 — Core Modules (Week 2)
- [ ] Patients + Appointments CRUD API
- [ ] Appointment Detail API (weak entity handling)
- [ ] JWT auth (login, middleware)
- [ ] Full join queries (dashboard stats endpoint)

### Phase 3 — Frontend Shell (Week 3)
- [ ] React + Vite + Tailwind + shadcn/ui setup
- [ ] Sidebar layout + routing
- [ ] Cream × Gold × Sky-Blue theme applied via CSS vars
- [ ] Dashboard page (KPI cards + Recharts)
- [ ] DataTable component

### Phase 4 — CRUD UI (Week 4)
- [ ] All CRUD pages (Dept, Doctors, Patients, Appointments, Details)
- [ ] Form modals + validation (Zod + react-hook-form)
- [ ] Status badges + filters
- [ ] Toast notifications

### Phase 5 — Power Features (Week 5)
- [ ] SQL Query Console (Monaco Editor)
- [ ] Quick query presets
- [ ] Export to CSV
- [ ] Calendar view
- [ ] Polish animations (Motion)

### Phase 6 — QA & Docs (Week 6)
- [ ] Unit tests (Vitest)
- [ ] API integration tests
- [ ] README + deployment guide
- [ ] Docker Compose finalization

---

## 14. Open Questions for Stack Confirmation

> **Before building, please confirm your preferences:**

### Q1 — Backend Language
```
A) Node.js + Express (recommended — matches your JS stack)
B) Python + FastAPI (you know Python well from TAHNSW project)
```

### Q2 — Frontend Framework
```
A) React + Vite (recommended)
B) Next.js (SSR if needed later)
```

### Q3 — Auth Requirement
```
A) Yes, include JWT login (Admin / Doctor / Viewer roles)
B) No auth — single-user local tool, skip auth entirely
```

### Q4 — SQL Console Access Level
```
A) SELECT only (safe default)
B) Full DML for admin role (INSERT/UPDATE/DELETE via console too)
```

### Q5 — Deployment Target
```
A) Local dev only (localhost)
B) Oracle Cloud Free Tier (Ampere A1 — the one you used for the trading bot)
C) Railway / Render (easy free cloud deploy)
```

### Q6 — Monaco Editor (SQL Console)
```
A) Yes, full Monaco editor (VS Code-in-browser SQL experience)
B) Simple textarea is fine
```

---

**Once you confirm the above 6 questions, the full codebase will be generated in one shot — backend, frontend, DB schema, seed data, and Docker Compose.**

---

*MediVault HMS — Built with Precision. Designed with Taste.*  
*PRD v1.0 | RVCE CSE | May 2026*
