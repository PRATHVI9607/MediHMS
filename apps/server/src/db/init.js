// ============================================================
//  Schema bootstrap + first-run seeding (engine-aware)
// ============================================================
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { getDb, DB_CLIENT } from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ensureSchema(db) {
  const exists = await db.tableExists('DEPARTMENT');
  if (exists) return;
  const file = DB_CLIENT === 'mysql' ? 'schema.mysql.sql' : 'schema.sqlite.sql';
  const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
  await db.exec(sql);
  console.log(`  ↳ schema applied (${file})`);
}

const DEPARTMENTS = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology'];

const DOCTORS = [
  ['Dr. Arjun Mehta', 'Cardiologist', '9900112233', 1],
  ['Dr. Priya Sharma', 'Neurologist', '9900223344', 2],
  ['Dr. Rajan Pillai', 'Orthopedic Surgeon', '9900334455', 3],
  ['Dr. Sneha Nair', 'Pediatrician', '9900445566', 4],
  ['Dr. Kiran Reddy', 'Dermatologist', '9900556677', 5],
];

const PATIENTS = [
  ['Rohit Kumar', 34, 'Male', '8800112233', 'Koramangala, Bengaluru'],
  ['Ananya Singh', 28, 'Female', '8800223344', 'Indiranagar, Bengaluru'],
  ['Vikram Patel', 52, 'Male', '8800334455', 'Whitefield, Bengaluru'],
  ['Meera Iyer', 21, 'Female', '8800445566', 'BTM Layout, Bengaluru'],
  ['Sanjay Ghosh', 45, 'Male', '8800556677', 'HSR Layout, Bengaluru'],
];

const APPOINTMENTS = [
  ['2026-06-01', 'Scheduled', 1, 1],
  ['2026-06-02', 'Completed', 2, 2],
  ['2026-06-03', 'Scheduled', 3, 3],
  ['2026-05-28', 'Completed', 4, 4],
  ['2026-05-30', 'Cancelled', 5, 5],
];

const DETAILS = [
  [1, 2, 800.0, 'Patient presented with migraine. MRI recommended.'],
  [1, 4, 500.0, 'Routine check-up. All clear.'],
  [1, 5, 0.0, 'Patient did not arrive. Rescheduling advised.'],
];

async function seedIfEmpty(db) {
  const row = await db.get('SELECT COUNT(*) AS c FROM DEPARTMENT');
  if (row && Number(row.c) > 0) return;

  for (const name of DEPARTMENTS)
    await db.run('INSERT INTO DEPARTMENT (department_name) VALUES (?)', [name]);

  for (const d of DOCTORS)
    await db.run(
      'INSERT INTO DOCTOR (name, specialization, phone, department_id) VALUES (?,?,?,?)',
      d
    );

  for (const p of PATIENTS)
    await db.run(
      'INSERT INTO PATIENT (name, age, gender, phone, address) VALUES (?,?,?,?,?)',
      p
    );

  for (const a of APPOINTMENTS)
    await db.run(
      'INSERT INTO APPOINTMENT (appointment_date, status, patient_id, doctor_id) VALUES (?,?,?,?)',
      a
    );

  for (const det of DETAILS)
    await db.run(
      'INSERT INTO APPOINTMENT_DETAIL (detail_id, appointment_id, consultation_fee, remarks) VALUES (?,?,?,?)',
      det
    );

  // Auth users (admin from env, plus demo doctor & viewer)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@medivault.io';
  const adminPass = process.env.ADMIN_PASSWORD || 'medivault';
  const users = [
    [adminEmail, 'Loki Admin', adminPass, 'Admin'],
    ['doctor@medivault.io', 'Dr. Arjun Mehta', 'medivault', 'Doctor'],
    ['viewer@medivault.io', 'Front Desk', 'medivault', 'Viewer'],
  ];
  for (const [email, fullName, pass, role] of users) {
    const hash = await bcrypt.hash(pass, 10);
    await db.run(
      'INSERT INTO APP_USER (email, full_name, password_hash, role) VALUES (?,?,?,?)',
      [email, fullName, hash, role]
    );
  }

  console.log('  ↳ seed data inserted (5 depts · 5 doctors · 5 patients · 5 appts · 3 details · 3 users)');
}

export async function initDb() {
  const db = await getDb();
  console.log(`▸ Initializing database (engine: ${DB_CLIENT})`);
  await ensureSchema(db);
  await seedIfEmpty(db);
  console.log('▸ Database ready.');
  return db;
}
