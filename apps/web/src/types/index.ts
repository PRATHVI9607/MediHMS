// Shared domain types (mirror the ER schema)

export type Role = 'Admin' | 'Doctor' | 'Viewer';
export type Gender = 'Male' | 'Female' | 'Other';
export type ApptStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'No-Show';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface Department {
  department_id: number;
  department_name: string;
  doctor_count?: number;
}

export interface Doctor {
  doctor_id: number;
  name: string;
  specialization: string;
  phone: string;
  department_id: number;
  department_name?: string;
  appointment_count?: number;
}

export interface Patient {
  patient_id: number;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  address?: string | null;
}

export interface Appointment {
  appointment_id: number;
  appointment_date: string;
  status: ApptStatus;
  patient_id: number;
  patient_name?: string;
  doctor_id: number;
  doctor_name?: string;
  department_id?: number;
  department_name?: string;
  total_fee?: number;
  detail_count?: number;
}

export interface AppointmentDetail {
  detail_id: number;
  appointment_id: number;
  consultation_fee: number;
  remarks?: string | null;
}

export interface DashboardStats {
  kpis: {
    departments: number;
    doctors: number;
    patients: number;
    appointments: number;
    today: number;
    revenueMtd: number;
  };
  byStatus: { status: ApptStatus; count: number }[];
  revenueByDept: { department_name: string; total_revenue: number }[];
  trend: { date: string; count: number }[];
  recent: Appointment[];
}

export interface ApiMeta {
  total: number;
  page: number;
  limit: number;
}

export interface QueryResult {
  rows: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
  affectedRows?: number;
  executionTime: number;
  type: 'read' | 'write';
}

export interface SchemaTable {
  table: string;
  columns: { name: string; type: string }[];
}
