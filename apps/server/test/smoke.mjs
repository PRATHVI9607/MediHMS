// ============================================================
//  MediVault HMS — End-to-end API smoke test
//  Spawns the server against a throwaway SQLite DB, exercises
//  every route, role, and guard, then prints a PASS/FAIL report.
//  Run:  npm test   (from repo root or apps/server)
// ============================================================
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.resolve(__dirname, '../src/index.js');
const PORT = 3999;
const BASE = `http://localhost:${PORT}/api`;
const TEST_DB = path.resolve(__dirname, '../data/test.sqlite');

// Fresh DB each run
for (const ext of ['', '-wal', '-shm']) {
  try { fs.rmSync(TEST_DB + ext); } catch {}
}

let pass = 0;
let fail = 0;
const failures = [];

function check(name, cond, extra = '') {
  if (cond) {
    pass++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    fail++;
    failures.push(name + (extra ? ` — ${extra}` : ''));
    console.log(`  \x1b[31m✗ ${name}\x1b[0m ${extra}`);
  }
}

async function req(method, url, { token, body } = {}) {
  const res = await fetch(BASE + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

async function waitForHealth(tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(BASE + '/health');
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

const server = spawn(process.execPath, [SERVER], {
  env: {
    ...process.env,
    PORT: String(PORT),
    DB_CLIENT: 'sqlite',
    SQLITE_FILE: './data/test.sqlite',
    JWT_SECRET: 'test-secret',
    NODE_ENV: 'test',
  },
  stdio: ['ignore', 'ignore', 'inherit'],
});

let exitCode = 0;
try {
  const up = await waitForHealth();
  if (!up) throw new Error('Server did not become healthy');
  console.log('\n\x1b[1m▸ Server up — running suite\x1b[0m\n');

  // ── Auth ────────────────────────────────────────────────
  console.log('\x1b[1mAuth\x1b[0m');
  const bad = await req('POST', '/auth/login', { body: { email: 'admin@medivault.io', password: 'wrong' } });
  check('rejects bad credentials (401)', bad.status === 401, `got ${bad.status}`);

  const adminLogin = await req('POST', '/auth/login', { body: { email: 'admin@medivault.io', password: 'medivault' } });
  check('admin login (200) returns token', adminLogin.status === 200 && !!adminLogin.json?.data?.token);
  const admin = adminLogin.json.data.token;

  const viewerLogin = await req('POST', '/auth/login', { body: { email: 'viewer@medivault.io', password: 'medivault' } });
  const viewer = viewerLogin.json?.data?.token;
  check('viewer login', viewerLogin.status === 200 && !!viewer);

  const doctorLogin = await req('POST', '/auth/login', { body: { email: 'doctor@medivault.io', password: 'medivault' } });
  const doctor = doctorLogin.json?.data?.token;
  check('doctor login', doctorLogin.status === 200 && !!doctor);

  const me = await req('GET', '/auth/me', { token: admin });
  check('/auth/me returns Admin role', me.json?.data?.user?.role === 'Admin');

  const noAuth = await req('GET', '/departments');
  check('protected route blocks anonymous (401)', noAuth.status === 401, `got ${noAuth.status}`);

  // ── Departments ─────────────────────────────────────────
  console.log('\n\x1b[1mDepartments\x1b[0m');
  const deptList = await req('GET', '/departments', { token: admin });
  check('list seeded departments (5)', deptList.json?.data?.length === 5, `got ${deptList.json?.data?.length}`);
  check('list includes doctor_count', typeof deptList.json?.data?.[0]?.doctor_count === 'number');
  check('list returns pagination meta', typeof deptList.json?.meta?.total === 'number');

  const viewerCreate = await req('POST', '/departments', { token: viewer, body: { department_name: 'Nope' } });
  check('viewer cannot create dept (403)', viewerCreate.status === 403, `got ${viewerCreate.status}`);

  const badCreate = await req('POST', '/departments', { token: admin, body: { department_name: 'A' } });
  check('rejects too-short name (422)', badCreate.status === 422, `got ${badCreate.status}`);

  const createDept = await req('POST', '/departments', { token: admin, body: { department_name: 'Oncology' } });
  check('admin creates dept (201)', createDept.status === 201 && createDept.json?.data?.department_id > 0);
  const newDeptId = createDept.json.data.department_id;

  const dupDept = await req('POST', '/departments', { token: admin, body: { department_name: 'Oncology' } });
  check('rejects duplicate dept name (409)', dupDept.status === 409, `got ${dupDept.status}`);

  const updateDept = await req('PUT', `/departments/${newDeptId}`, { token: admin, body: { department_name: 'Oncology & Hematology' } });
  check('updates dept', updateDept.status === 200 && updateDept.json?.data?.department_name === 'Oncology & Hematology');

  const fkDelete = await req('DELETE', '/departments/1', { token: admin });
  check('FK guard blocks dept with doctors (409)', fkDelete.status === 409 && fkDelete.json?.error?.code === 'FK_CONSTRAINT', `got ${fkDelete.status}`);

  const cleanDelete = await req('DELETE', `/departments/${newDeptId}`, { token: admin });
  check('deletes empty dept', cleanDelete.status === 200);

  // ── Doctors ─────────────────────────────────────────────
  console.log('\n\x1b[1mDoctors\x1b[0m');
  const docList = await req('GET', '/doctors', { token: admin });
  check('list doctors (5) with dept name + appt count', docList.json?.data?.length === 5 && !!docList.json.data[0].department_name);

  const docFilter = await req('GET', '/doctors?department_id=1', { token: admin });
  check('filters doctors by department', docFilter.json?.data?.every((d) => d.department_id === 1));

  const badPhone = await req('POST', '/doctors', { token: admin, body: { name: 'Dr. Test', specialization: 'GP', phone: 'abc', department_id: 1 } });
  check('rejects invalid phone (422)', badPhone.status === 422, `got ${badPhone.status}`);

  const createDoc = await req('POST', '/doctors', { token: admin, body: { name: 'Dr. Test House', specialization: 'Diagnostics', phone: '9012345678', department_id: 2 } });
  check('creates doctor (201)', createDoc.status === 201);
  const newDocId = createDoc.json.data.doctor_id;

  const getDoc = await req('GET', `/doctors/${newDocId}`, { token: admin });
  check('doctor detail includes appointments array', Array.isArray(getDoc.json?.data?.appointments));

  // ── Patients ────────────────────────────────────────────
  console.log('\n\x1b[1mPatients\x1b[0m');
  const patList = await req('GET', '/patients', { token: viewer });
  check('viewer can read patients', patList.status === 200 && patList.json?.data?.length === 5);

  const patFilter = await req('GET', '/patients?gender=Female', { token: admin });
  check('filters patients by gender', patFilter.json?.data?.every((p) => p.gender === 'Female'));

  const badAge = await req('POST', '/patients', { token: admin, body: { name: 'Old Man', age: 200, gender: 'Male', phone: '9999999999' } });
  check('rejects age out of range (422)', badAge.status === 422, `got ${badAge.status}`);

  const createPat = await req('POST', '/patients', { token: admin, body: { name: 'Test Patient', age: 30, gender: 'Other', phone: '9123456780', address: 'Test City' } });
  check('creates patient (201)', createPat.status === 201);
  const newPatId = createPat.json.data.patient_id;

  // ── Appointments + stats ────────────────────────────────
  console.log('\n\x1b[1mAppointments\x1b[0m');
  const stats = await req('GET', '/appointments/stats', { token: admin });
  check('stats: kpis present', stats.json?.data?.kpis?.departments === 5);
  check('stats: 14-day trend array', Array.isArray(stats.json?.data?.trend) && stats.json.data.trend.length === 14);
  check('stats: revenueByDept array', Array.isArray(stats.json?.data?.revenueByDept));
  check('stats: recent appointments', Array.isArray(stats.json?.data?.recent));

  const apptList = await req('GET', '/appointments', { token: admin });
  check('appointments full-join has patient+doctor+dept', !!apptList.json?.data?.[0]?.patient_name && !!apptList.json.data[0].doctor_name && !!apptList.json.data[0].department_name);

  const apptStatusFilter = await req('GET', '/appointments?status=Completed', { token: admin });
  check('filters appointments by status', apptStatusFilter.json?.data?.every((a) => a.status === 'Completed'));

  const createAppt = await req('POST', '/appointments', { token: admin, body: { patient_id: newPatId, doctor_id: newDocId, appointment_date: '2026-06-15', status: 'Scheduled' } });
  check('creates appointment (201)', createAppt.status === 201);
  const newApptId = createAppt.json.data.appointment_id;

  const doctorUpdate = await req('PUT', `/appointments/${newApptId}`, { token: doctor, body: { status: 'Completed' } });
  check('doctor can update appointment status', doctorUpdate.status === 200 && doctorUpdate.json?.data?.status === 'Completed');

  const viewerUpdate = await req('PUT', `/appointments/${newApptId}`, { token: viewer, body: { status: 'Cancelled' } });
  check('viewer cannot update appointment (403)', viewerUpdate.status === 403, `got ${viewerUpdate.status}`);

  // ── Appointment details (weak entity) ───────────────────
  console.log('\n\x1b[1mAppointment Details (weak entity)\x1b[0m');
  const d1 = await req('POST', `/appointments/${newApptId}/details`, { token: admin, body: { consultation_fee: 750, remarks: 'First consult' } });
  check('adds detail #1 (server-generated id)', d1.status === 201 && d1.json?.data?.detail_id === 1);

  const d2 = await req('POST', `/appointments/${newApptId}/details`, { token: doctor, body: { consultation_fee: 250, remarks: 'Follow-up' } });
  check('detail_id increments per appointment (#2)', d2.status === 201 && d2.json?.data?.detail_id === 2);

  const detList = await req('GET', `/appointments/${newApptId}/details`, { token: viewer });
  check('lists 2 details for appointment', detList.json?.data?.length === 2);

  const updDet = await req('PUT', `/appointments/${newApptId}/details/1`, { token: admin, body: { consultation_fee: 800, remarks: 'Updated' } });
  check('updates a detail', updDet.status === 200 && Number(updDet.json?.data?.consultation_fee) === 800);

  const delDet = await req('DELETE', `/appointments/${newApptId}/details/2`, { token: admin });
  check('deletes a detail', delDet.status === 200);

  // Cascade: deleting appointment removes its details
  const delAppt = await req('DELETE', `/appointments/${newApptId}`, { token: admin });
  check('deletes appointment (cascades details)', delAppt.status === 200);
  const afterCascade = await req('GET', `/appointments/${newApptId}/details`, { token: admin });
  check('appointment gone after delete (404)', afterCascade.status === 404, `got ${afterCascade.status}`);

  // ── SQL Console ─────────────────────────────────────────
  console.log('\n\x1b[1mSQL Console\x1b[0m');
  const schema = await req('GET', '/query/schema', { token: viewer });
  check('schema endpoint lists 5 tables', schema.json?.data?.length === 5);

  const sel = await req('POST', '/query/execute', { token: viewer, body: { sql: 'SELECT COUNT(*) AS n FROM PATIENT' } });
  check('viewer can run SELECT', sel.status === 200 && Number(sel.json?.data?.rows?.[0]?.n) === 6);
  check('SELECT returns columns + timing', Array.isArray(sel.json?.data?.columns) && typeof sel.json.data.executionTime === 'number');

  const join = await req('POST', '/query/execute', { token: admin, body: { sql: 'SELECT dept.department_name, COUNT(*) c FROM DOCTOR doc JOIN DEPARTMENT dept ON doc.department_id=dept.department_id GROUP BY dept.department_name' } });
  check('admin can run JOIN query', join.status === 200 && join.json?.data?.rows?.length > 0);

  const viewerDml = await req('POST', '/query/execute', { token: viewer, body: { sql: "UPDATE PATIENT SET name='x' WHERE patient_id=1" } });
  check('viewer DML blocked (403 READONLY)', viewerDml.status === 403 && viewerDml.json?.error?.code === 'READONLY', `got ${viewerDml.status}`);

  const adminDml = await req('POST', '/query/execute', { token: admin, body: { sql: `UPDATE PATIENT SET phone='8888888888' WHERE patient_id=${newPatId}` } });
  check('admin DML allowed (affected rows)', adminDml.status === 200 && adminDml.json?.data?.affectedRows === 1);

  const ddl = await req('POST', '/query/execute', { token: admin, body: { sql: 'DROP TABLE PATIENT' } });
  check('DDL blocked even for admin (403 BLOCKED)', ddl.status === 403 && ddl.json?.error?.code === 'BLOCKED', `got ${ddl.status}`);

  const multi = await req('POST', '/query/execute', { token: admin, body: { sql: 'SELECT 1; SELECT 2;' } });
  check('multi-statement blocked (400)', multi.status === 400, `got ${multi.status}`);

  const sqlErr = await req('POST', '/query/execute', { token: admin, body: { sql: 'SELECT * FROM NO_SUCH_TABLE' } });
  check('SQL error surfaced (400 SQL_ERROR)', sqlErr.status === 400 && sqlErr.json?.error?.code === 'SQL_ERROR', `got ${sqlErr.status}`);

  // ── 404 ─────────────────────────────────────────────────
  console.log('\n\x1b[1mMisc\x1b[0m');
  const notFound = await req('GET', '/departments/99999', { token: admin });
  check('missing record returns 404', notFound.status === 404, `got ${notFound.status}`);
  const badRoute = await req('GET', '/nonexistent', { token: admin });
  check('unknown route returns 404', badRoute.status === 404, `got ${badRoute.status}`);
} catch (err) {
  console.error('\n\x1b[31mSuite crashed:\x1b[0m', err.message);
  exitCode = 1;
} finally {
  server.kill();
  await new Promise((r) => setTimeout(r, 300));
  for (const ext of ['', '-wal', '-shm']) {
    try { fs.rmSync(TEST_DB + ext); } catch {}
  }
}

console.log(`\n\x1b[1m──────────────────────────────────────\x1b[0m`);
console.log(`  \x1b[32m${pass} passed\x1b[0m, ${fail ? `\x1b[31m${fail} failed\x1b[0m` : '0 failed'}  (${pass + fail} checks)`);
if (failures.length) {
  console.log('\n  Failures:');
  failures.forEach((f) => console.log(`   - ${f}`));
}
console.log('');
process.exit(fail > 0 || exitCode ? 1 : 0);
