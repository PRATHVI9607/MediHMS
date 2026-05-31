// ============================================================
//  MediVault HMS — Unified Database Layer
//  One async interface over two engines:
//    • better-sqlite3 (DB_CLIENT=sqlite)  → zero-config dev
//    • mysql2/promise  (DB_CLIENT=mysql)  → production parity
//  Both speak `?` positional placeholders, so route SQL is shared.
// ============================================================
import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DB_CLIENT = (process.env.DB_CLIENT || 'sqlite').toLowerCase();

let impl;

// ─────────────────────────────────────────────────────────
//  SQLite implementation
// ─────────────────────────────────────────────────────────
async function initSqlite() {
  const { default: Database } = await import('better-sqlite3');
  const file = process.env.SQLITE_FILE
    ? path.resolve(__dirname, '../../', process.env.SQLITE_FILE)
    : path.resolve(__dirname, '../../data/medivault.sqlite');

  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const normalize = (params = []) =>
    params.map((p) => (typeof p === 'boolean' ? (p ? 1 : 0) : p));

  return {
    engine: 'sqlite',
    async all(sql, params = []) {
      return sqlite.prepare(sql).all(...normalize(params));
    },
    async get(sql, params = []) {
      return sqlite.prepare(sql).get(...normalize(params));
    },
    async run(sql, params = []) {
      const info = sqlite.prepare(sql).run(...normalize(params));
      return {
        insertId: Number(info.lastInsertRowid),
        changes: info.changes,
      };
    },
    async exec(script) {
      sqlite.exec(script);
    },
    // Raw execution for the SQL console — returns rows + column order.
    async raw(sql) {
      const stmt = sqlite.prepare(sql);
      if (stmt.reader) {
        const rows = stmt.all();
        const columns = stmt.columns().map((c) => c.name);
        return { rows, columns, rowCount: rows.length };
      }
      const info = stmt.run();
      return {
        rows: [],
        columns: [],
        rowCount: info.changes,
        affectedRows: info.changes,
      };
    },
    async tableExists(name) {
      const row = sqlite
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND lower(name)=lower(?)`)
        .get(name);
      return Boolean(row);
    },
    async close() {
      sqlite.close();
    },
  };
}

// ─────────────────────────────────────────────────────────
//  MySQL implementation
// ─────────────────────────────────────────────────────────
async function initMysql() {
  const mysql = await import('mysql2/promise');
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'medivault',
    password: process.env.MYSQL_PASSWORD || 'medivault_pass',
    database: process.env.MYSQL_DATABASE || 'medivault_hms',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_MAX || 20),
    queueLimit: 0,
    multipleStatements: true,
    dateStrings: true,
  });

  return {
    engine: 'mysql',
    async all(sql, params = []) {
      const [rows] = await pool.query(sql, params);
      return rows;
    },
    async get(sql, params = []) {
      const [rows] = await pool.query(sql, params);
      return rows[0];
    },
    async run(sql, params = []) {
      const [result] = await pool.query(sql, params);
      return { insertId: result.insertId, changes: result.affectedRows };
    },
    async exec(script) {
      await pool.query(script);
    },
    async raw(sql) {
      const [result, fields] = await pool.query(sql);
      if (Array.isArray(result)) {
        const columns = fields ? fields.map((f) => f.name) : Object.keys(result[0] || {});
        return { rows: result, columns, rowCount: result.length };
      }
      return {
        rows: [],
        columns: [],
        rowCount: result.affectedRows ?? 0,
        affectedRows: result.affectedRows ?? 0,
      };
    },
    async tableExists(name) {
      const [rows] = await pool.query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = DATABASE() AND lower(table_name) = lower(?)`,
        [name]
      );
      return rows.length > 0;
    },
    async close() {
      await pool.end();
    },
  };
}

export async function getDb() {
  if (!impl) {
    impl = DB_CLIENT === 'mysql' ? await initMysql() : await initSqlite();
  }
  return impl;
}

// Convenience proxies so routes can `import { db }` once initialized.
export const db = {
  all: (...a) => getDb().then((d) => d.all(...a)),
  get: (...a) => getDb().then((d) => d.get(...a)),
  run: (...a) => getDb().then((d) => d.run(...a)),
  exec: (...a) => getDb().then((d) => d.exec(...a)),
  raw: (...a) => getDb().then((d) => d.raw(...a)),
  tableExists: (...a) => getDb().then((d) => d.tableExists(...a)),
  get engine() {
    return DB_CLIENT;
  },
};
