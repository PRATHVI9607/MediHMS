import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Departments } from '@/pages/Departments';
import { Doctors } from '@/pages/Doctors';
import { Patients } from '@/pages/Patients';
import { Appointments } from '@/pages/Appointments';
import { QueryConsole } from '@/pages/QueryConsole';
import { NotFound } from '@/pages/NotFound';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAppStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const token = useAppStore((s) => s.token);

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/query" element={<QueryConsole />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
