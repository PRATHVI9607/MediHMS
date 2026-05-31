import { motion } from 'framer-motion';
import {
  Buildings,
  Stethoscope,
  Users,
  CalendarCheck,
  CurrencyInr,
  TrendUp,
  ChartPie,
  ClockCountdown,
} from '@phosphor-icons/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrendChart, RevenueChart, StatusDonut } from '@/components/charts/Charts';
import { useStats } from '@/hooks/useEntities';
import { currency, formatDate } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

const STATUS_DOT: Record<string, string> = {
  Scheduled: 'bg-sky-primary',
  Completed: 'bg-status-success',
  Cancelled: 'bg-status-error',
  'No-Show': 'bg-status-warning',
};

export function Dashboard() {
  const { data, isLoading } = useStats();
  const user = useAppStore((s) => s.user);
  const k = data?.kpis;

  return (
    <div>
      <PageHeader
        eyebrow={`Welcome back, ${user?.name?.split(' ')[0] ?? 'Admin'}`}
        title="Hospital Overview"
        description="A real-time pulse of departments, clinicians, patients and revenue."
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading || !k ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[140px]" />)
        ) : (
          <>
            <StatCard index={0} label="Departments" value={k.departments} icon={<Buildings size={22} weight="fill" />} accent="gold" />
            <StatCard index={1} label="Doctors" value={k.doctors} icon={<Stethoscope size={22} weight="fill" />} accent="sky" />
            <StatCard index={2} label="Patients" value={k.patients} icon={<Users size={22} weight="fill" />} accent="gold" />
            <StatCard index={3} label="Today's Appts" value={k.today} icon={<CalendarCheck size={22} weight="fill" />} accent="success" />
          </>
        )}
      </div>

      {/* Revenue + total appts highlight */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {!isLoading && k && (
          <>
            <div className="lg:col-span-2">
              <Card bodyClassName="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                      Revenue · Month to date
                    </p>
                    <p className="mt-2 font-display text-5xl font-bold text-ink">
                      {currency(k.revenueMtd)}
                    </p>
                    <p className="mt-1 text-sm text-ink-secondary">
                      Across {k.appointments} total appointments
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gradient-gold text-ink shadow-gold">
                    <CurrencyInr size={28} weight="bold" />
                  </div>
                </div>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card bodyClassName="p-0">
                <CardHeader
                  title="Status Distribution"
                  subtitle="All appointments by state"
                  icon={<ChartPie size={20} weight="fill" />}
                />
                <div className="flex flex-col items-center gap-4 px-5 pb-5 sm:flex-row sm:items-center">
                  <div className="w-full flex-1 space-y-2">
                    {data!.byStatus.map((s) => (
                      <div key={s.status} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-ink-secondary">
                          <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[s.status]}`} />
                          {s.status}
                        </span>
                        <span className="font-semibold text-ink">{s.count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="w-[180px] shrink-0">
                    <StatusDonut data={data!.byStatus} />
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card bodyClassName="p-5">
          <CardHeader title="Appointments Trend" subtitle="Last 14 days" icon={<TrendUp size={20} weight="fill" />} />
          {isLoading || !data ? <Skeleton className="h-[240px]" /> : <TrendChart data={data.trend} />}
        </Card>
        <Card bodyClassName="p-5">
          <CardHeader title="Revenue by Department" subtitle="Consultation fees" icon={<Buildings size={20} weight="fill" />} />
          {isLoading || !data ? <Skeleton className="h-[240px]" /> : <RevenueChart data={data.revenueByDept} />}
        </Card>
      </div>

      {/* Recent appointments */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mt-4"
      >
        <Card bodyClassName="p-0">
          <CardHeader title="Recent Appointments" subtitle="Latest 5 bookings" icon={<ClockCountdown size={20} weight="fill" />} />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-y border-line/60 bg-surface-overlay/40 text-left text-xs font-bold uppercase tracking-wider text-ink-muted">
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Doctor</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Fee</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recent ?? []).map((a) => (
                  <tr key={a.appointment_id} className="border-b border-line/40 last:border-0">
                    <td className="px-5 py-3.5 text-sm font-medium text-ink">{a.patient_name}</td>
                    <td className="px-5 py-3.5 text-sm text-ink-secondary">{a.doctor_name}</td>
                    <td className="px-5 py-3.5 text-sm text-ink-secondary">{a.department_name}</td>
                    <td className="px-5 py-3.5 text-sm text-ink-secondary">{formatDate(a.appointment_date)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-3.5 text-right text-sm font-semibold text-ink">{currency(a.total_fee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
