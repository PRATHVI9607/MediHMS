import { useQuery } from '@tanstack/react-query';
import { getData } from '@/api/client';
import { makeListHook, makeDetailHook, makeMutations } from './crud';
import type { Department, Doctor, Patient, Appointment, DashboardStats } from '@/types';

// ── Departments ──────────────────────────────────────────
export const useDepartments = makeListHook<Department>('departments');
export const useDepartment = makeDetailHook<Department>('departments');
export const departmentMutations = makeMutations<Department>('departments', 'Department');

// ── Doctors ──────────────────────────────────────────────
export const useDoctors = makeListHook<Doctor>('doctors');
export const useDoctor = makeDetailHook<Doctor & { appointments: Appointment[] }>('doctors');
export const doctorMutations = makeMutations<Doctor>('doctors', 'Doctor');

// ── Patients ─────────────────────────────────────────────
export const usePatients = makeListHook<Patient>('patients');
export const usePatient = makeDetailHook<Patient & { appointments: Appointment[] }>('patients');
export const patientMutations = makeMutations<Patient>('patients', 'Patient');

// ── Appointments ─────────────────────────────────────────
export const useAppointments = makeListHook<Appointment>('appointments');
export const useAppointment = makeDetailHook<Appointment>('appointments');
export const appointmentMutations = makeMutations<Appointment>('appointments', 'Appointment');

// ── Dashboard stats ──────────────────────────────────────
export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => getData<DashboardStats>('/appointments/stats'),
    staleTime: 15_000,
  });
}
