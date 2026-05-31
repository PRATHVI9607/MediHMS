import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { ok, created, notFound, asyncHandler, paginate, ApiError } from '../utils/http.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

const STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No-Show'];

const apptSchema = z.object({
  patient_id: z.coerce.number().int().positive(),
  doctor_id: z.coerce.number().int().positive(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  status: z.enum(STATUSES).default('Scheduled'),
});

const apptUpdateSchema = apptSchema.partial().refine((d) => Object.keys(d).length > 0, {
  message: 'No fields to update',
});

const detailSchema = z.object({
  consultation_fee: z.coerce.number().min(0),
  remarks: z.string().trim().max(1000).optional().or(z.literal('')),
});

const FULL_SELECT = `
  SELECT a.appointment_id, a.appointment_date, a.status,
         a.patient_id, p.name AS patient_name,
         a.doctor_id, doc.name AS doctor_name,
         doc.department_id, dept.department_name,
         (SELECT COALESCE(SUM(consultation_fee),0) FROM APPOINTMENT_DETAIL ad
            WHERE ad.appointment_id = a.appointment_id) AS total_fee,
         (SELECT COUNT(*) FROM APPOINTMENT_DETAIL ad
            WHERE ad.appointment_id = a.appointment_id) AS detail_count
  FROM APPOINTMENT a
  JOIN PATIENT p   ON a.patient_id = p.patient_id
  JOIN DOCTOR doc  ON a.doctor_id  = doc.doctor_id
  JOIN DEPARTMENT dept ON doc.department_id = dept.department_id`;

// ── Dashboard stats (PRD §8.2 /appointments/stats) ───────
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7) + '-01';

    const [depts, doctors, patients, appts] = await Promise.all([
      db.get('SELECT COUNT(*) AS c FROM DEPARTMENT'),
      db.get('SELECT COUNT(*) AS c FROM DOCTOR'),
      db.get('SELECT COUNT(*) AS c FROM PATIENT'),
      db.get('SELECT COUNT(*) AS c FROM APPOINTMENT'),
    ]);

    const todayCount = await db.get(
      'SELECT COUNT(*) AS c FROM APPOINTMENT WHERE appointment_date = ?',
      [today]
    );

    const revenueMtd = await db.get(
      `SELECT COALESCE(SUM(ad.consultation_fee),0) AS total
       FROM APPOINTMENT_DETAIL ad
       JOIN APPOINTMENT a ON ad.appointment_id = a.appointment_id
       WHERE a.appointment_date >= ?`,
      [monthStart]
    );

    const byStatus = await db.all('SELECT status, COUNT(*) AS count FROM APPOINTMENT GROUP BY status');

    const revenueByDept = await db.all(
      `SELECT dept.department_name, COALESCE(SUM(ad.consultation_fee),0) AS total_revenue
       FROM DEPARTMENT dept
       LEFT JOIN DOCTOR doc ON doc.department_id = dept.department_id
       LEFT JOIN APPOINTMENT a ON a.doctor_id = doc.doctor_id
       LEFT JOIN APPOINTMENT_DETAIL ad ON ad.appointment_id = a.appointment_id
       GROUP BY dept.department_id, dept.department_name
       ORDER BY total_revenue DESC`
    );

    // 14-day trend (fill gaps in JS)
    const since = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);
    const trendRows = await db.all(
      `SELECT appointment_date AS date, COUNT(*) AS count
       FROM APPOINTMENT WHERE appointment_date >= ?
       GROUP BY appointment_date ORDER BY appointment_date`,
      [since]
    );
    const trendMap = Object.fromEntries(trendRows.map((r) => [r.date, Number(r.count)]));
    const trend = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      trend.push({ date: d, count: trendMap[d] || 0 });
    }

    const recent = await db.all(`${FULL_SELECT} ORDER BY a.appointment_date DESC, a.appointment_id DESC LIMIT 5`);

    ok(res, {
      kpis: {
        departments: Number(depts.c),
        doctors: Number(doctors.c),
        patients: Number(patients.c),
        appointments: Number(appts.c),
        today: Number(todayCount.c),
        revenueMtd: Number(revenueMtd.total),
      },
      byStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
      revenueByDept: revenueByDept.map((r) => ({
        department_name: r.department_name,
        total_revenue: Number(r.total_revenue),
      })),
      trend,
      recent,
    });
  })
);

// ── List (full join) with filters (PRD §8.4) ─────────────
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = paginate(req.query);
    const { search, status, department_id, doctor_id, patient_id, date_from, date_to } = req.query;
    const sort = ['appointment_date', 'appointment_id', 'status'].includes(req.query.sort)
      ? req.query.sort
      : 'appointment_date';
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

    const clauses = [];
    const args = [];
    if (status && STATUSES.includes(status)) {
      clauses.push('a.status = ?');
      args.push(status);
    }
    if (department_id) {
      clauses.push('doc.department_id = ?');
      args.push(department_id);
    }
    if (doctor_id) {
      clauses.push('a.doctor_id = ?');
      args.push(doctor_id);
    }
    if (patient_id) {
      clauses.push('a.patient_id = ?');
      args.push(patient_id);
    }
    if (date_from) {
      clauses.push('a.appointment_date >= ?');
      args.push(date_from);
    }
    if (date_to) {
      clauses.push('a.appointment_date <= ?');
      args.push(date_to);
    }
    if (search) {
      clauses.push('(p.name LIKE ? OR doc.name LIKE ?)');
      args.push(`%${search}%`, `%${search}%`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = await db.all(
      `${FULL_SELECT} ${where} ORDER BY a.${sort} ${order}, a.appointment_id DESC LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );
    const total = await db.get(
      `SELECT COUNT(*) AS c FROM APPOINTMENT a
       JOIN PATIENT p ON a.patient_id = p.patient_id
       JOIN DOCTOR doc ON a.doctor_id = doc.doctor_id ${where}`,
      args
    );
    ok(res, rows, { total: Number(total.c), page, limit });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const appt = await db.get(`${FULL_SELECT} WHERE a.appointment_id = ?`, [req.params.id]);
    if (!appt) throw notFound('Appointment');
    const details = await db.all(
      'SELECT detail_id, appointment_id, consultation_fee, remarks FROM APPOINTMENT_DETAIL WHERE appointment_id = ? ORDER BY detail_id',
      [req.params.id]
    );
    ok(res, { ...appt, details });
  })
);

router.post(
  '/',
  requireRole('Admin'),
  validate(apptSchema),
  asyncHandler(async (req, res) => {
    const { patient_id, doctor_id, appointment_date, status } = req.body;
    const { insertId } = await db.run(
      'INSERT INTO APPOINTMENT (appointment_date, status, patient_id, doctor_id) VALUES (?,?,?,?)',
      [appointment_date, status, patient_id, doctor_id]
    );
    const row = await db.get(`${FULL_SELECT} WHERE a.appointment_id = ?`, [insertId]);
    created(res, row);
  })
);

// Admin full edit; Doctor may reschedule/update status.
router.put(
  '/:id',
  requireRole('Admin', 'Doctor'),
  validate(apptUpdateSchema),
  asyncHandler(async (req, res) => {
    const fields = [];
    const args = [];
    for (const key of ['patient_id', 'doctor_id', 'appointment_date', 'status']) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        args.push(req.body[key]);
      }
    }
    if (!fields.length) throw new ApiError(422, 'VALIDATION', 'No fields to update.');
    args.push(req.params.id);
    const { changes } = await db.run(
      `UPDATE APPOINTMENT SET ${fields.join(', ')} WHERE appointment_id = ?`,
      args
    );
    if (!changes) throw notFound('Appointment');
    const row = await db.get(`${FULL_SELECT} WHERE a.appointment_id = ?`, [req.params.id]);
    ok(res, row);
  })
);

router.delete(
  '/:id',
  requireRole('Admin'),
  asyncHandler(async (req, res) => {
    const { changes } = await db.run('DELETE FROM APPOINTMENT WHERE appointment_id = ?', [
      req.params.id,
    ]);
    if (!changes) throw notFound('Appointment');
    ok(res, { deleted: true }); // details cascade automatically
  })
);

// ─────────────────────────────────────────────────────────
//  APPOINTMENT_DETAIL (weak entity) — nested under appointment
//  detail_id is generated per-appointment (partial-key behavior)
// ─────────────────────────────────────────────────────────
router.get(
  '/:id/details',
  asyncHandler(async (req, res) => {
    const appt = await db.get('SELECT appointment_id FROM APPOINTMENT WHERE appointment_id = ?', [
      req.params.id,
    ]);
    if (!appt) throw notFound('Appointment');
    const rows = await db.all(
      'SELECT detail_id, appointment_id, consultation_fee, remarks FROM APPOINTMENT_DETAIL WHERE appointment_id = ? ORDER BY detail_id',
      [req.params.id]
    );
    ok(res, rows);
  })
);

router.post(
  '/:id/details',
  requireRole('Admin', 'Doctor'),
  validate(detailSchema),
  asyncHandler(async (req, res) => {
    const appt = await db.get('SELECT appointment_id FROM APPOINTMENT WHERE appointment_id = ?', [
      req.params.id,
    ]);
    if (!appt) throw notFound('Appointment');
    const next = await db.get(
      'SELECT COALESCE(MAX(detail_id),0)+1 AS next_id FROM APPOINTMENT_DETAIL WHERE appointment_id = ?',
      [req.params.id]
    );
    const detailId = Number(next.next_id);
    await db.run(
      'INSERT INTO APPOINTMENT_DETAIL (detail_id, appointment_id, consultation_fee, remarks) VALUES (?,?,?,?)',
      [detailId, req.params.id, req.body.consultation_fee, req.body.remarks || null]
    );
    const row = await db.get(
      'SELECT * FROM APPOINTMENT_DETAIL WHERE appointment_id = ? AND detail_id = ?',
      [req.params.id, detailId]
    );
    created(res, row);
  })
);

router.put(
  '/:id/details/:detailId',
  requireRole('Admin', 'Doctor'),
  validate(detailSchema),
  asyncHandler(async (req, res) => {
    const { changes } = await db.run(
      'UPDATE APPOINTMENT_DETAIL SET consultation_fee = ?, remarks = ? WHERE appointment_id = ? AND detail_id = ?',
      [req.body.consultation_fee, req.body.remarks || null, req.params.id, req.params.detailId]
    );
    if (!changes) throw notFound('Detail');
    const row = await db.get(
      'SELECT * FROM APPOINTMENT_DETAIL WHERE appointment_id = ? AND detail_id = ?',
      [req.params.id, req.params.detailId]
    );
    ok(res, row);
  })
);

router.delete(
  '/:id/details/:detailId',
  requireRole('Admin', 'Doctor'),
  asyncHandler(async (req, res) => {
    const { changes } = await db.run(
      'DELETE FROM APPOINTMENT_DETAIL WHERE appointment_id = ? AND detail_id = ?',
      [req.params.id, req.params.detailId]
    );
    if (!changes) throw notFound('Detail');
    ok(res, { deleted: true });
  })
);

export default router;
