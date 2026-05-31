<div align="center">

# 🏥 MediVault HMS

### *Precision Care. Zero Chaos.*

A premium, full-stack **Hospital Data Management System** — Cream × Gold × Sky-Blue design language, a power-user SQL console, and a database layer that runs on **SQLite in dev** and **MySQL in production** from the *same* codebase.

![React](https://img.shields.io/badge/React-18-5DB8D4?style=for-the-badge&logo=react&logoColor=white)
![Node](https://img.shields.io/badge/Node-Express-C9A84C?style=for-the-badge&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.x-3A8FA8?style=for-the-badge&logo=mysql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v3-E8D080?style=for-the-badge&logo=tailwindcss&logoColor=2C2410)
![License](https://img.shields.io/badge/license-MIT-9A7A2E?style=for-the-badge)

</div>

---

## ✨ Highlights

| | |
|---|---|
| 🎨 **Premium UI** | Double-bezel cards, spring-physics motion, Cormorant Garamond display type, editorial film-grain texture |
| 🗄️ **Dual database** | Zero-config **SQLite** for instant local dev · **MySQL 8** for production — one query layer, two engines |
| 🔐 **JWT auth + roles** | Admin · Doctor · Viewer, with role-gated writes and a read-only SQL console for non-admins |
| 💻 **SQL Console** | CodeMirror editor, schema explorer, quick-query presets, CSV/JSON export, query history, statement guarding |
| 📊 **Live dashboard** | KPI cards, 14-day trend, revenue-by-department, status donut, recent bookings |
| 🧱 **Faithful ER schema** | Strong + **weak entity** (`APPOINTMENT_DETAIL`) modeled exactly per the PRD, with composite partial-key behavior |

---

## 🗺️ System Architecture

```mermaid
%%{init: {'theme':'base','themeVariables':{
  'primaryColor':'#FFFDF7','primaryTextColor':'#2C2410','primaryBorderColor':'#C9A84C',
  'lineColor':'#9A7A2E','secondaryColor':'#A8DFF0','tertiaryColor':'#F5EFD8','fontFamily':'Plus Jakarta Sans'}}}%%
flowchart TB
    subgraph CLIENT["🖥️ Browser — React SPA"]
        UI["Dashboard · Tables · Forms"]
        CON["SQL Console · Charts"]
    end

    subgraph API["⚙️ Express REST API · Node.js"]
        MW["Auth · Rate-limit · Zod validation"]
        RT["/departments /doctors /patients<br/>/appointments /query"]
    end

    subgraph DATA["🗄️ Database Layer"]
        ABS["Unified async adapter"]
        SQLITE[("SQLite — dev")]
        MYSQL[("MySQL 8 — prod")]
    end

    UI -->|"Axios + React Query"| MW
    CON -->|"POST /query/execute"| MW
    MW --> RT
    RT -->|"? placeholders"| ABS
    ABS --> SQLITE
    ABS --> MYSQL

    classDef client fill:#A8DFF0,stroke:#3A8FA8,stroke-width:2px,color:#2C2410;
    classDef api fill:#E8D080,stroke:#9A7A2E,stroke-width:2px,color:#2C2410;
    classDef data fill:#F5EFD8,stroke:#C9A84C,stroke-width:2px,color:#2C2410;
    classDef db fill:#FFFDF7,stroke:#3A8FA8,stroke-width:2px,color:#2C2410;

    class UI,CON client;
    class MW,RT api;
    class ABS data;
    class SQLITE,MYSQL db;
```

---

## 🧬 Entity-Relationship Diagram

> The canonical schema — `APPOINTMENT_DETAIL` is a **weak entity** identified by `APPOINTMENT` with a composite primary key `(appointment_id, detail_id)`.

```mermaid
%%{init: {'theme':'base','themeVariables':{
  'primaryColor':'#FFFDF7','primaryTextColor':'#2C2410','primaryBorderColor':'#C9A84C',
  'lineColor':'#3A8FA8','fontFamily':'Plus Jakarta Sans'}}}%%
erDiagram
    DEPARTMENT ||--o{ DOCTOR : "BELONGS_TO"
    DOCTOR ||--o{ APPOINTMENT : "HAS"
    PATIENT ||--o{ APPOINTMENT : "BOOKS"
    APPOINTMENT ||--o{ APPOINTMENT_DETAIL : "HAS (weak)"

    DEPARTMENT {
        int department_id PK
        varchar department_name UK
    }
    DOCTOR {
        int doctor_id PK
        varchar name
        varchar specialization
        varchar phone
        int department_id FK
    }
    PATIENT {
        int patient_id PK
        varchar name
        tinyint age
        enum gender
        varchar phone
        text address
    }
    APPOINTMENT {
        int appointment_id PK
        date appointment_date
        enum status
        int patient_id FK
        int doctor_id FK
    }
    APPOINTMENT_DETAIL {
        int detail_id PK "partial key"
        int appointment_id PK "FK identifying owner"
        decimal consultation_fee
        text remarks
    }
```

### Relationship cardinality

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#E8D080','primaryTextColor':'#2C2410','primaryBorderColor':'#9A7A2E','lineColor':'#3A8FA8','fontFamily':'Plus Jakarta Sans'}}}%%
flowchart LR
    DEPT["🏢 DEPARTMENT"] -->|"1 : N · total"| DOC["🩺 DOCTOR"]
    DOC -->|"1 : N · total"| APPT["📅 APPOINTMENT"]
    PAT["🧑 PATIENT"] -->|"1 : N · total"| APPT
    APPT -->|"1 : N · weak · cascade"| DET["🧾 APPOINTMENT_DETAIL"]

    classDef strong fill:#FFFDF7,stroke:#C9A84C,stroke-width:2px,color:#2C2410;
    classDef weak fill:#A8DFF0,stroke:#3A8FA8,stroke-width:2px,color:#2C2410;
    class DEPT,DOC,PAT,APPT strong;
    class DET weak;
```

---

## 🔐 Authentication & Role Flow

```mermaid
%%{init: {'theme':'base','themeVariables':{
  'primaryColor':'#FFFDF7','primaryTextColor':'#2C2410','primaryBorderColor':'#C9A84C',
  'actorBkg':'#E8D080','actorBorder':'#9A7A2E','signalColor':'#3A8FA8','fontFamily':'Plus Jakarta Sans'}}}%%
sequenceDiagram
    actor U as User
    participant W as React App
    participant A as Express API
    participant D as Database

    U->>W: Enter credentials
    W->>A: POST /auth/login
    A->>D: lookup APP_USER · bcrypt.compare
    D-->>A: user + role
    A-->>W: JWT (8h) + profile
    W->>W: Persist token (zustand)
    Note over W,A: Every request → Authorization: Bearer <token>
    W->>A: GET /appointments
    A->>A: requireAuth → requireRole
    A-->>W: 200 data  ·  403 if role too low
```

### Role → permission matrix

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#F5EFD8','primaryTextColor':'#2C2410','primaryBorderColor':'#C9A84C','lineColor':'#9A7A2E','fontFamily':'Plus Jakarta Sans'}}}%%
flowchart TD
    R{Role?}
    R -->|Admin| AD["✅ Full CRUD<br/>✅ SQL DML"]
    R -->|Doctor| DR["✏️ Edit appts + details<br/>👁️ Read all · SELECT only"]
    R -->|Viewer| VW["👁️ Read-only<br/>SELECT only"]

    classDef admin fill:#4CAF6E,stroke:#2C2410,color:#FDFAF4,stroke-width:2px;
    classDef doctor fill:#5DB8D4,stroke:#2C2410,color:#FDFAF4,stroke-width:2px;
    classDef viewer fill:#E8D080,stroke:#9A7A2E,color:#2C2410,stroke-width:2px;
    classDef q fill:#FFFDF7,stroke:#C9A84C,color:#2C2410,stroke-width:2px;
    class R q; class AD admin; class DR doctor; class VW viewer;
```

---

## 🧭 SQL Console Request Lifecycle

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#FFFDF7','primaryTextColor':'#2C2410','primaryBorderColor':'#C9A84C','lineColor':'#3A8FA8','fontFamily':'Plus Jakarta Sans'}}}%%
flowchart LR
    Q["⌨️ SQL in CodeMirror"] --> EX["POST /query/execute"]
    EX --> CL{Classify}
    CL -->|DDL: DROP/ALTER/CREATE| BL["⛔ Blocked for everyone"]
    CL -->|"INSERT/UPDATE/DELETE"| DM{Admin?}
    CL -->|"SELECT / WITH / SHOW"| RUN["▶️ Execute"]
    DM -->|yes| RUN
    DM -->|no| RO["⛔ 403 Read-only"]
    RUN --> RES["📊 rows · columns · time"]
    RES --> OUT["Table · CSV · JSON · History"]

    classDef ok fill:#4CAF6E,stroke:#2C2410,color:#FDFAF4;
    classDef block fill:#D64C4C,stroke:#2C2410,color:#FDFAF4;
    classDef step fill:#FFFDF7,stroke:#C9A84C,color:#2C2410;
    classDef gate fill:#E8D080,stroke:#9A7A2E,color:#2C2410;
    class Q,EX,RUN,RES,OUT step; class CL,DM gate; class BL,RO block;
```

---

## 🚀 Quick Start

> **Prerequisites:** Node 18+ (works out-of-the-box on Node 24). No database install needed for dev — SQLite is bundled.

```bash
# 1) Install all workspaces
npm install

# 2) Configure the server (defaults are dev-ready)
cp apps/server/.env.example apps/server/.env

# 3) Run API + Web together (hot-reload both)
npm run dev
```

| Service | URL |
|---|---|
| 🌐 Web app | http://localhost:5173 |
| 🔌 API | http://localhost:3001/api |
| ❤️ Health | http://localhost:3001/api/health |

The database auto-creates and seeds on first launch.

### 🔑 Demo accounts (password: `medivault`)

| Role | Email | Can do |
|---|---|---|
| **Admin** | `admin@medivault.io` | Everything + SQL DML |
| **Doctor** | `doctor@medivault.io` | Edit appointments/details, read all |
| **Viewer** | `viewer@medivault.io` | Read-only |

---

## 🐬 Switching to MySQL (production parity)

```bash
# Spin up MySQL 8 + Adminer (schema auto-loads)
docker compose up -d

# Point the server at MySQL
#   apps/server/.env →  DB_CLIENT=mysql
npm run dev
```

Adminer (DB GUI) → http://localhost:8080 · server `mysql` · db `medivault_hms`.

The unified adapter in [`apps/server/src/db/connection.js`](apps/server/src/db/connection.js) speaks a single async API (`all` / `get` / `run` / `raw`) over both engines — route code never changes.

---

## 🧱 Project Structure

```text
medivault-hms/
├── apps/
│   ├── server/                 # Express REST API
│   │   └── src/
│   │       ├── db/             # connection.js · schema.*.sql · init · seed
│   │       ├── middleware/     # auth · validate · rateLimiter · error
│   │       ├── routes/         # departments · doctors · patients · appointments · query · auth
│   │       ├── utils/          # http envelope helpers
│   │       └── index.js        # app entry
│   └── web/                    # React + Vite + Tailwind SPA
│       └── src/
│           ├── components/     # ui/ · shared/ · charts/
│           ├── hooks/          # React Query data hooks
│           ├── layouts/        # Sidebar · Topbar · DashboardLayout
│           ├── pages/          # Dashboard · CRUD · QueryConsole · Login
│           ├── store/          # zustand (auth + ui)
│           └── types/          # shared TS types
├── docker-compose.yml          # MySQL 8 + Adminer
└── package.json                # npm workspaces
```

---

## 🛠️ Tech Stack

**Frontend:** React 18 · Vite · TypeScript · Tailwind CSS · TanStack Query · Zustand · Framer Motion · Recharts · Phosphor Icons · CodeMirror
**Backend:** Node.js · Express · Zod · JWT · bcryptjs · express-rate-limit
**Database:** better-sqlite3 (dev) · mysql2 (prod)

---

## 📡 API Reference

All responses use a standard envelope: `{ success, data, meta? }` or `{ success: false, error }`.

| Resource | Endpoints |
|---|---|
| **Auth** | `POST /auth/login` · `GET /auth/me` |
| **Departments** | `GET/POST /departments` · `GET/PUT/DELETE /departments/:id` |
| **Doctors** | `GET/POST /doctors` · `GET/PUT/DELETE /doctors/:id` |
| **Patients** | `GET/POST /patients` · `GET/PUT/DELETE /patients/:id` |
| **Appointments** | `GET/POST /appointments` · `GET/PUT/DELETE /appointments/:id` · `GET /appointments/stats` |
| **Details (weak)** | `GET/POST /appointments/:id/details` · `PUT/DELETE /appointments/:id/details/:detailId` |
| **SQL Console** | `POST /query/execute` · `GET /query/schema` |

List endpoints accept `?page`, `?limit`, `?search`, `?status`, `?department_id`, `?date_from`, `?date_to`, `?sort`, `?order`.

---

## 🎨 Design System

The Cream × Gold × Sky-Blue palette is enforced via CSS variables in [`apps/web/src/index.css`](apps/web/src/index.css).

| Token | Hex | Use |
|---|---|---|
| `--surface-base` | `#FDFAF4` | Page background |
| `--gold-primary` | `#C9A84C` | Primary CTA / borders |
| `--sky-primary` | `#5DB8D4` | Info / links / badges |
| `--text-primary` | `#2C2410` | Headings & body |

Cards use a **double-bezel** (machined outer shell + inner core), buttons are pills with nested trailing-icon physics, and every list animates in with a staggered blur-fade.

---

<div align="center">

*MediVault HMS — Built with Precision. Designed with Taste.*
**RVCE CSE · 2026**

</div>
