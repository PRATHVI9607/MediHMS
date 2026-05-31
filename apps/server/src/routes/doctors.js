import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { ok, created, notFound, asyncHandler, paginate } from '../utils/http.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

const doctorSchema = z.object({
  name: z.string().trim().min(2).max(100),
  specialization: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^\d{10,15}$/, 'Phone must be 10–15 digits'),
  department_id: z.coerce.number().int().positive(),
});

const SELECT_DOCTOR = `
  SELECT doc.doctor_id, doc.name, doc.specialization, doc.phone,
         doc.department_id, dept.department_name,
         (SELECT COUNT(*) FROM APPOINTMENT a WHERE a.doctor_id = doc.doctor_id) AS appointment_count
  FROM DOCTOR doc
  JOIN DEPARTMENT dept ON doc.department_id = dept.department_id`;

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = paginate(req.query);
    const search = (req.query.search || '').trim();
    const deptId = req.query.department_id;
    const clauses = [];
    const args = [];
    if (search) {
      clauses.push('(doc.name LIKE ? OR doc.specialization LIKE ?)');
      args.push(`%${search}%`, `%${search}%`);
    }
    if (deptId) {
      clauses.push('doc.department_id = ?');
      args.push(deptId);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const rows = await db.all(
      `${SELECT_DOCTOR} ${where} ORDER BY doc.name LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );
    const total = await db.get(
      `SELECT COUNT(*) AS c FROM DOCTOR doc ${where}`,
      args
    );
    ok(res, rows, { total: Number(total.c), page, limit });
  })
);

// GET /doctors/:id — doctor + appointment history
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const doctor = await db.get(`${SELECT_DOCTOR} WHERE doc.doctor_id = ?`, [req.params.id]);
    if (!doctor) throw notFound('Doctor');
    const appointments = await db.all(
      `SELECT a.appointment_id, a.appointment_date, a.status, p.name AS patient_name
       FROM APPOINTMENT a JOIN PATIENT p ON a.patient_id = p.patient_id
       WHERE a.doctor_id = ? ORDER BY a.appointment_date DESC`,
      [req.params.id]
    );
    ok(res, { ...doctor, appointments });
  })
);

router.post(
  '/',
  requireRole('Admin'),
  validate(doctorSchema),
  asyncHandler(async (req, res) => {
    const { name, specialization, phone, department_id } = req.body;
    const { insertId } = await db.run(
      'INSERT INTO DOCTOR (name, specialization, phone, department_id) VALUES (?,?,?,?)',
      [name, specialization, phone, department_id]
    );
    const row = await db.get(`${SELECT_DOCTOR} WHERE doc.doctor_id = ?`, [insertId]);
    created(res, row);
  })
);

router.put(
  '/:id',
  requireRole('Admin'),
  validate(doctorSchema),
  asyncHandler(async (req, res) => {
    const { name, specialization, phone, department_id } = req.body;
    const { changes } = await db.run(
      'UPDATE DOCTOR SET name=?, specialization=?, phone=?, department_id=? WHERE doctor_id=?',
      [name, specialization, phone, department_id, req.params.id]
    );
    if (!changes) throw notFound('Doctor');
    const row = await db.get(`${SELECT_DOCTOR} WHERE doc.doctor_id = ?`, [req.params.id]);
    ok(res, row);
  })
);

// Guarded hard-delete (keeps schema faithful to ER — no soft-delete column).
router.delete(
  '/:id',
  requireRole('Admin'),
  asyncHandler(async (req, res) => {
    const { changes } = await db.run('DELETE FROM DOCTOR WHERE doctor_id = ?', [req.params.id]);
    if (!changes) throw notFound('Doctor');
    ok(res, { deleted: true });
  })
);

export default router;
