import { useState } from 'react';
import { Stethoscope, Plus, PencilSimple, Trash, CalendarCheck } from '@phosphor-icons/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDoctors, useDepartments, doctorMutations } from '@/hooks/useEntities';
import { useIsAdmin } from '@/store/useAppStore';
import type { Doctor } from '@/types';

const empty = { name: '', specialization: '', phone: '', department_id: 0 };

export function Doctors() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [deleting, setDeleting] = useState<Doctor | null>(null);
  const [form, setForm] = useState(empty);

  const isAdmin = useIsAdmin();
  const { data, isLoading } = useDoctors({
    search,
    page,
    limit: 10,
    department_id: deptFilter || undefined,
  });
  const { data: depts } = useDepartments({ limit: 100 });
  const { useCreate, useUpdate, useRemove } = doctorMutations;
  const create = useCreate();
  const update = useUpdate();
  const remove = useRemove();

  const openCreate = () => {
    setForm({ ...empty, department_id: depts?.data[0]?.department_id ?? 0 });
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (d: Doctor) => {
    setForm({ name: d.name, specialization: d.specialization, phone: d.phone, department_id: d.department_id });
    setEditing(d);
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, department_id: Number(form.department_id) };
    const done = () => setOpen(false);
    if (editing) update.mutate({ id: editing.doctor_id, payload }, { onSuccess: done });
    else create.mutate(payload, { onSuccess: done });
  };

  const columns: Column<Doctor>[] = [
    { key: 'name', header: 'Doctor', sortable: true, render: (d) => (
      <div>
        <p className="font-medium text-ink">{d.name}</p>
        <p className="text-xs text-ink-muted">{d.phone}</p>
      </div>
    ) },
    { key: 'specialization', header: 'Specialization', sortable: true, render: (d) => <span className="text-ink-secondary">{d.specialization}</span> },
    { key: 'department_name', header: 'Department', sortable: true, render: (d) => <Badge tone="gold">{d.department_name}</Badge> },
    { key: 'appointment_count', header: 'Appts', sortable: true, align: 'center', render: (d) => (
      <Badge tone="sky"><CalendarCheck size={12} weight="fill" /> {d.appointment_count ?? 0}</Badge>
    ) },
    {
      key: 'actions', header: '', align: 'right',
      render: (d) => isAdmin && (
        <div className="flex justify-end gap-1.5">
          <button aria-label="Edit doctor" onClick={() => openEdit(d)} className="rounded-pill p-2 text-ink-secondary transition-colors hover:bg-gold-light/30 hover:text-gold-dark"><PencilSimple size={16} /></button>
          <button aria-label="Delete doctor" onClick={() => setDeleting(d)} className="rounded-pill p-2 text-ink-secondary transition-colors hover:bg-status-error/10 hover:text-status-error"><Trash size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Clinical Staff"
        title="Doctors"
        description="Manage clinicians, their specializations and department assignments."
        actions={isAdmin && <Button icon={<Plus size={16} weight="bold" />} onClick={openCreate}>New Doctor</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name or specialization…" className="max-w-sm flex-1" />
        <select
          aria-label="Filter by department"
          value={deptFilter}
          onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
          className="h-11 rounded-pill border border-line bg-surface-elevated px-4 text-sm font-medium text-ink-secondary focus-gold"
        >
          <option value="">All Departments</option>
          {depts?.data.map((d) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        loading={isLoading}
        rowKey={(d) => d.doctor_id}
        page={page}
        total={data?.meta.total ?? 0}
        limit={10}
        onPageChange={setPage}
        empty={<EmptyState icon={<Stethoscope size={28} />} title="No doctors found" message="Add a doctor or adjust your filters." />}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Doctor' : 'New Doctor'}
        subtitle={editing ? `#${editing.doctor_id}` : 'Register a clinician'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending || update.isPending}>{editing ? 'Save changes' : 'Create'}</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Jane Doe" autoFocus />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Specialization" required value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="Cardiologist" />
            <Input label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9900112233" hint="10–15 digits" />
          </div>
          <Select label="Department" required value={form.department_id} onChange={(e) => setForm({ ...form, department_id: Number(e.target.value) })}>
            <option value={0} disabled>Select a department</option>
            {depts?.data.map((d) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
          </Select>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete doctor?"
        message={`“${deleting?.name}” will be removed. This is blocked if the doctor still has appointments.`}
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.doctor_id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
