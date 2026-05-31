// ============================================================
//  MediVault HMS — Express API entry
// ============================================================
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { initDb } from './db/init.js';
import { DB_CLIENT } from './db/connection.js';
import { requireAuth } from './middleware/auth.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

import authRoutes from './routes/auth.js';
import departmentRoutes from './routes/departments.js';
import doctorRoutes from './routes/doctors.js';
import patientRoutes from './routes/patients.js';
import appointmentRoutes from './routes/appointments.js';
import queryRoutes from './routes/query.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiLimiter);

// Health (public)
app.get('/api/health', (_req, res) =>
  res.json({ success: true, data: { status: 'ok', engine: DB_CLIENT, time: new Date().toISOString() } })
);

// Auth (login public; /me self-guards)
app.use('/api/auth', authRoutes);

// Everything below requires a valid token
app.use('/api', requireAuth);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/query', queryRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

(async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`\n  🏥  MediVault API ready → http://localhost:${PORT}/api`);
      console.log(`      DB engine: ${DB_CLIENT}\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
