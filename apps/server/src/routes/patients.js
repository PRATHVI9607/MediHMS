import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { ok, created, notFound, asyncHandler, paginate } from '../utils/http.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

const patientSchema = z.object({
  name: z.string().trim().min(2).max(100),
  age: z.coerce.number().int().min(1).max(149),
  gender: z.enum(['Male', 'Female', 'Other']),
  phone: z.string().trim().regex(/^\d{10,15}$/, 'Phone must be 10–15 digits'),
  address: z.string().trim().max(500).optional().or(z.literal('')),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = paginate(req.query);
    const search = (req.query.search || '').trim();
    const gender = req.query.gender;
    const clauses = [];
    const args = [];
    if (search) {
      clauses.push('name LIKE ?');
      args.push(`%${search}%`);
    }
    if (gender) {
      clauses.push('gender = ?');
      args.push(gender);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = await db.all(
      `SELECT patient_id, name, age, gender, phone, address
       FROM PATIENT ${where} ORDER BY name LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );
    const total = await db.get(`SELECT COUNT(*) AS c FROM PATIENT ${where}`, args);
    ok(res, rows, { total: Number(total.c), page, limit });
  })
);

// GET /patients/:id — patient + appointment history (with consultation fee)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const patient = await db.get('SELECT * FROM PATIENT WHERE patient_id = ?', [req.params.id]);
    if (!patient) throw notFound('Patient');
    const appointments = await db.all(
      `SELECT a.appointment_id, a.appointment_date, a.status,
              doc.name AS doctor_name, dept.department_name,
              ad.consultation_fee, ad.remarks
       FROM APPOINTMENT a
       JOIN DOCTOR doc ON a.doctor_id = doc.doctor_id
       JOIN DEPARTMENT dept ON doc.department_id = dept.department_id
       LEFT JOIN APPOINTMENT_DETAIL ad ON a.appointment_id = ad.appointment_id
       WHERE a.patient_id = ? ORDER BY a.appointment_date DESC`,
      [req.params.id]
    );
    ok(res, { ...patient, appointments });
  })
);

router.post(
  '/',
  requireRole('Admin'),
  validate(patientSchema),
  asyncHandler(async (req, res) => {
    const { name, age, gender, phone, address } = req.body;
    const { insertId } = await db.run(
      'INSERT INTO PATIENT (name, age, gender, phone, address) VALUES (?,?,?,?,?)',
      [name, age, gender, phone, address || null]
    );
    const row = await db.get('SELECT * FROM PATIENT WHERE patient_id = ?', [insertId]);
    created(res, row);
  })
);

router.put(
  '/:id',
  requireRole('Admin'),
  validate(patientSchema),
  asyncHandler(async (req, res) => {
    const { name, age, gender, phone, address } = req.body;
    const { changes } = await db.run(
      'UPDATE PATIENT SET name=?, age=?, gender=?, phone=?, address=? WHERE patient_id=?',
      [name, age, gender, phone, address || null, req.params.id]
    );
    if (!changes) throw notFound('Patient');
    const row = await db.get('SELECT * FROM PATIENT WHERE patient_id = ?', [req.params.id]);
    ok(res, row);
  })
);

router.delete(
  '/:id',
  requireRole('Admin'),
  asyncHandler(async (req, res) => {
    const { changes } = await db.run('DELETE FROM PATIENT WHERE patient_id = ?', [req.params.id]);
    if (!changes) throw notFound('Patient');
    ok(res, { deleted: true });
  })
);

export default router;
