import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { ok, created, notFound, asyncHandler, paginate } from '../utils/http.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

const deptSchema = z.object({
  department_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
});

// GET /departments — list + doctor count, searchable, paginated
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = paginate(req.query);
    const search = (req.query.search || '').trim();
    const where = search ? 'WHERE d.department_name LIKE ?' : '';
    const args = search ? [`%${search}%`] : [];

    const rows = await db.all(
      `SELECT d.department_id, d.department_name,
              (SELECT COUNT(*) FROM DOCTOR doc WHERE doc.department_id = d.department_id) AS doctor_count
       FROM DEPARTMENT d
       ${where}
       ORDER BY d.department_name
       LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );
    const total = await db.get(
      `SELECT COUNT(*) AS c FROM DEPARTMENT d ${where}`,
      args
    );
    ok(res, rows, { total: Number(total.c), page, limit });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const row = await db.get(
      `SELECT d.department_id, d.department_name,
              (SELECT COUNT(*) FROM DOCTOR doc WHERE doc.department_id = d.department_id) AS doctor_count
       FROM DEPARTMENT d WHERE d.department_id = ?`,
      [req.params.id]
    );
    if (!row) throw notFound('Department');
    ok(res, row);
  })
);

router.post(
  '/',
  requireRole('Admin'),
  validate(deptSchema),
  asyncHandler(async (req, res) => {
    const { insertId } = await db.run(
      'INSERT INTO DEPARTMENT (department_name) VALUES (?)',
      [req.body.department_name]
    );
    const row = await db.get('SELECT * FROM DEPARTMENT WHERE department_id = ?', [insertId]);
    created(res, row);
  })
);

router.put(
  '/:id',
  requireRole('Admin'),
  validate(deptSchema),
  asyncHandler(async (req, res) => {
    const { changes } = await db.run(
      'UPDATE DEPARTMENT SET department_name = ? WHERE department_id = ?',
      [req.body.department_name, req.params.id]
    );
    if (!changes) throw notFound('Department');
    const row = await db.get('SELECT * FROM DEPARTMENT WHERE department_id = ?', [req.params.id]);
    ok(res, row);
  })
);

router.delete(
  '/:id',
  requireRole('Admin'),
  asyncHandler(async (req, res) => {
    const { changes } = await db.run('DELETE FROM DEPARTMENT WHERE department_id = ?', [
      req.params.id,
    ]);
    if (!changes) throw notFound('Department');
    ok(res, { deleted: true });
  })
);

export default router;
