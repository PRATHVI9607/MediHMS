import { useState } from 'react';
import { CalendarCheck, Plus, PencilSimple, Trash, Receipt } from '@phosphor-icons/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { DetailsDrawer } from '@/components/shared/DetailsDrawer';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Field';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  useAppointments,
  useDoctors,
  usePatients,
  appointmentMutations,
} from '@/hooks/useEntities';
import { useIsAdmin, useCanWrite } from '@/store/useAppStore';
import { currency, formatDate, todayISO } from '@/lib/utils';
import type { Appointment, ApptStatus } from '@/types';

const STATUSES: ApptStatus[] = ['Scheduled', 'Completed', 'Cancelled', 'No-Show'];
const emptyForm = { patient_id: 0, doctor_id: 0, appointment_date: todayISO(), status: 'Scheduled' as ApptStatus };

export function Appointments() {
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState<Appointment | null>(null);
  const [detailsFor, setDetailsFor] = useState<Appointment | null>(null);
  const [form, setForm] = useState(emptyForm);

  const isAdmin = useIsAdmin();
  const canWrite = useCanWrite();
  const { data, isLoading } = useAppointments({
    status: status || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    limit: 10,
  });
  const { data: doctors } = useDoctors({ limit: 200 });
  const { data: patients } = usePatients({ limit: 200 });
  const { useCreate, useUpdate, useRemove } = appointmentMutations;
  const create = useCreate();
  const update = useUpdate();
  const remove = useRemove();

  const openCreate = () => {
    setForm({ ...emptyForm, patient_id: patients?.data[0]?.patient_id ?? 0, doctor_id: doctors?.data[0]?.doctor_id ?? 0 });
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (a: Appointment) => {
    setForm({ patient_id: a.patient_id, doctor_id: a.doctor_id, appointment_date: a.appointment_date, status: a.status });
    setEditing(a);
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, patient_id: Number(form.patient_id), doctor_id: Number(form.doctor_id) };
    const done = () => setOpen(false);
    if (editing) update.mutate({ id: editing.appointment_id, payload }, { onSuccess: done });
    else create.mutate(payload, { onSuccess: done });
  };

  const columns: Column<Appointment>[] = [
    { key: 'appointment_id', header: 'ID', sortable: true, className: 'w-14 text-ink-muted', render: (a) => `#${a.appointment_id}` },
    { key: 'patient_name', header: 'Patient', sortable: true, render: (a) => <span className="font-medium text-ink">{a.patient_name}</span> },
    { key: 'doctor_name', header: 'Doctor', render: (a) => (
      <div><p className="text-ink-secondary">{a.doctor_name}</p><p className="text-xs text-ink-muted">{a.department_name}</p></div>
    ) },
    { key: 'appointment_date', header: 'Date', sortable: true, render: (a) => <span className="text-ink-secondary">{formatDate(a.appointment_date)}</span> },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    { key: 'total_fee', header: 'Fee', align: 'right', render: (a) => (
      <span className="font-semibold text-ink">{Number(a.total_fee) > 0 ? currency(a.total_fee) : <span className="text-ink-muted">—</span>}</span>
    ) },
    {
      key: 'actions', header: '', align: 'right',
      render: (a) => (
        <div className="flex justify-end gap-1.5">
          <button onClick={() => setDetailsFor(a)} className="relative rounded-pill p-2 text-ink-secondary transition-colors hover:bg-sky-light/40 hover:text-sky-dark" title="Consultation details">
            <Receipt size={16} />
            {Number(a.detail_count) > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-primary px-1 text-[9px] font-bold text-white">{a.detail_count}</span>}
          </button>
          {canWrite && <button aria-label="Edit appointment" onClick={() => openEdit(a)} className="rounded-pill p-2 text-ink-secondary transition-colors hover:bg-gold-light/30 hover:text-gold-dark"><PencilSimple size={16} /></button>}
          {isAdmin && <button aria-label="Delete appointment" onClick={() => setDeleting(a)} className="rounded-pill p-2 text-ink-secondary transition-colors hover:bg-status-error/10 hover:text-status-error"><Trash size={16} /></button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Scheduling"
        title="Appointments"
        description="Bookings across every department, with consultation billing."
        actions={isAdmin && <Button icon={<Plus size={16} weight="bold" />} onClick={openCreate}>Book Appointment</Button>}
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-pill border border-line bg-surface-elevated p-1">
          {['', ...STATUSES].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`rounded-pill px-3.5 py-1.5 text-xs font-semibold transition-colors ${status === s ? 'bg-gradient-gold text-ink' : 'text-ink-muted hover:text-ink'}`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input aria-label="From date" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="h-11 rounded-sm border border-line bg-surface-elevated px-3 text-sm text-ink-secondary focus-gold" />
          <span className="text-ink-muted">→</span>
          <input aria-label="To date" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="h-11 rounded-sm border border-line bg-surface-elevated px-3 text-sm text-ink-secondary focus-gold" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs font-semibold text-gold-dark hover:underline">Clear</button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        loading={isLoading}
        rowKey={(a) => a.appointment_id}
        page={page}
        total={data?.meta.total ?? 0}
        limit={10}
        onPageChange={setPage}
        empty={<EmptyState icon={<CalendarCheck size={28} />} title="No appointments" message="Book an appointment or adjust your filters." />}
      />

      {/* Create / edit modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Appointment' : 'Book Appointment'}
        subtitle={editing ? `#${editing.appointment_id}` : 'Schedule a new visit'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending || update.isPending}>{editing ? 'Save changes' : 'Book'}</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <Select label="Patient" required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: Number(e.target.value) })} disabled={!!editing && !isAdmin}>
            <option value={0} disabled>Select patient</option>
            {patients?.data.map((p) => <option key={p.patient_id} value={p.patient_id}>{p.name}</option>)}
          </Select>
          <Select label="Doctor" required value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: Number(e.target.value) })}>
            <option value={0} disabled>Select doctor</option>
            {doctors?.data.map((d) => <option key={d.doctor_id} value={d.doctor_id}>{d.name} · {d.department_name}</option>)}
          </Select>
          {form.doctor_id > 0 && (
            <Badge tone="sky">Department: {doctors?.data.find((d) => d.doctor_id === Number(form.doctor_id))?.department_name ?? '—'}</Badge>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" required value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ApptStatus })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </form>
      </Modal>

      <DetailsDrawer appointment={detailsFor} onClose={() => setDetailsFor(null)} />

      <ConfirmDialog
        open={!!deleting}
        title="Delete appointment?"
        message={`Appointment #${deleting?.appointment_id} and all its consultation details will be permanently removed.`}
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.appointment_id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
