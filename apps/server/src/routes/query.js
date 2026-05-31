import { Router } from 'express';
import { z } from 'zod';
import { db, DB_CLIENT } from '../db/connection.js';
import { ok, asyncHandler, ApiError } from '../utils/http.js';
import { validate } from '../middleware/validate.js';
import { queryLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const sqlSchema = z.object({ sql: z.string().trim().min(1, 'Query is empty').max(10000) });

// Statements that are blocked for everyone (PRD §9.2)
const HARD_BLOCK = /\b(DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|ATTACH|DETACH|PRAGMA|REPLACE)\b/i;
const DML = /^(INSERT|UPDATE|DELETE)\b/i;
const SELECTISH = /^(SELECT|WITH|EXPLAIN|SHOW|DESCRIBE|DESC)\b/i;

function classify(sql) {
  // strip trailing semicolon + comments, take first keyword
  const cleaned = sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()
    .replace(/;+\s*$/, '');
  // reject multiple statements
  if (cleaned.includes(';')) {
    throw new ApiError(400, 'MULTI_STATEMENT', 'Only one statement may be executed at a time.');
  }
  if (HARD_BLOCK.test(cleaned)) {
    throw new ApiError(403, 'BLOCKED', 'DDL (DROP/ALTER/CREATE/TRUNCATE…) is disabled in the console.');
  }
  if (SELECTISH.test(cleaned)) return { type: 'read', sql: cleaned };
  if (DML.test(cleaned)) return { type: 'write', sql: cleaned };
  throw new ApiError(400, 'UNSUPPORTED', 'Unsupported statement type.');
}

// Lightweight schema map for the console explorer
router.get(
  '/schema',
  asyncHandler(async (_req, res) => {
    const tables = ['DEPARTMENT', 'DOCTOR', 'PATIENT', 'APPOINTMENT', 'APPOINTMENT_DETAIL'];
    const out = [];
    for (const t of tables) {
      let columns = [];
      if (DB_CLIENT === 'mysql') {
        const rows = await db.all(
          `SELECT column_name AS name, data_type AS type FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = ? ORDER BY ordinal_position`,
          [t]
        );
        columns = rows.map((r) => ({ name: r.name, type: r.type }));
      } else {
        const rows = await db.all(`PRAGMA table_info(${t})`);
        columns = rows.map((r) => ({ name: r.name, type: r.type }));
      }
      out.push({ table: t, columns });
    }
    ok(res, out);
  })
);

router.post(
  '/execute',
  queryLimiter,
  validate(sqlSchema),
  asyncHandler(async (req, res) => {
    const { type, sql } = classify(req.body.sql);
    if (type === 'write' && req.user.role !== 'Admin') {
      throw new ApiError(403, 'READONLY', 'Your role is read-only. Only Admins may run DML here.');
    }
    const started = performance.now();
    let result;
    try {
      result = await db.raw(sql);
    } catch (err) {
      throw new ApiError(400, 'SQL_ERROR', err.message);
    }
    const executionTime = Math.round((performance.now() - started) * 1000) / 1000;
    ok(res, {
      rows: result.rows,
      columns: result.columns,
      rowCount: result.rowCount,
      affectedRows: result.affectedRows,
      executionTime,
      type,
    });
  })
);

export default router;
