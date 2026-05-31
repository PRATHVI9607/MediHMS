import { useState } from 'react';
import { Users, Plus, PencilSimple, Trash, DownloadSimple } from '@phosphor-icons/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { usePatients, patientMutations } from '@/hooks/useEntities';
import { useIsAdmin } from '@/store/useAppStore';
import { downloadCsv } from '@/lib/utils';
import type { Gender, Patient } from '@/types';

const empty = { name: '', age: 18, gender: 'Male' as Gender, phone: '', address: '' };
const GENDERS: Gender[] = ['Male', 'Female', 'Other'];

export function Patients() {
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);
  const [form, setForm] = useState(empty);

  const isAdmin = useIsAdmin();
  const { data, isLoading } = usePatients({ search, page, limit: 10, gender: gender || undefined });
  const { useCreate, useUpdate, useRemove } = patientMutations;
  const create = useCreate();
  const update = useUpdate();
  const remove = useRemove();

  const openCreate = () => { setForm(empty); setEditing(null); setOpen(true); };
  const openEdit = (p: Patient) => {
    setForm({ name: p.name, age: p.age, gender: p.gender, phone: p.phone, address: p.address ?? '' });
    setEditing(p);
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, age: Number(form.age) };
    const done = () => setOpen(false);
    if (editing) update.mutate({ id: editing.patient_id, payload }, { onSuccess: done });
    else create.mutate(payload, { onSuccess: done });
  };

  const genderTone = (g: Gender): 'sky' | 'gold' | 'neutral' =>
    g === 'Male' ? 'sky' : g === 'Female' ? 'gold' : 'neutral';

  const columns: Column<Patient>[] = [
    { key: 'patient_id', header: 'ID', sortable: true, className: 'w-16 text-ink-muted', render: (p) => `#${p.patient_id}` },
    { key: 'name', header: 'Patient', sortable: true, render: (p) => <span className="font-medium text-ink">{p.name}</span> },
    { key: 'age', header: 'Age', sortable: true, align: 'center' },
    { key: 'gender', header: 'Gender', render: (p) => <Badge tone={genderTone(p.gender)}>{p.gender}</Badge> },
    { key: 'phone', header: 'Phone', render: (p) => <span className="text-ink-secondary">{p.phone}</span> },
    { key: 'address', header: 'Address', render: (p) => <span className="block max-w-[220px] truncate text-ink-muted">{p.address || '—'}</span> },
    {
      key: 'actions', header: '', align: 'right',
      render: (p) => isAdmin && (
        <div className="flex justify-end gap-1.5">
          <button aria-label="Edit patient" onClick={() => openEdit(p)} className="rounded-pill p-2 text-ink-secondary transition-colors hover:bg-gold-light/30 hover:text-gold-dark"><PencilSimple size={16} /></button>
          <button aria-label="Delete patient" onClick={() => setDeleting(p)} className="rounded-pill p-2 text-ink-secondary transition-colors hover:bg-status-error/10 hover:text-status-error"><Trash size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Records"
        title="Patients"
        description="Patient demographics and contact records."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={<DownloadSimple size={16} weight="bold" />} onClick={() => downloadCsv('patients.csv', data?.data ?? [])}>
              Export CSV
            </Button>
            {isAdmin && <Button icon={<Plus size={16} weight="bold" />} onClick={openCreate}>New Patient</Button>}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search patients by name…" className="max-w-sm flex-1" />
        <div className="flex gap-1 rounded-pill border border-line bg-surface-elevated p-1">
          {['', ...GENDERS].map((g) => (
            <button
              key={g || 'all'}
              onClick={() => { setGender(g); setPage(1); }}
              className={`rounded-pill px-3.5 py-1.5 text-xs font-semibold transition-colors ${gender === g ? 'bg-gradient-gold text-ink' : 'text-ink-muted hover:text-ink'}`}
            >
              {g || 'All'}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        loading={isLoading}
        rowKey={(p) => p.patient_id}
        page={page}
        total={data?.meta.total ?? 0}
        limit={10}
        onPageChange={setPage}
        empty={<EmptyState icon={<Users size={28} />} title="No patients found" message="Register a patient or adjust your filters." />}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Patient' : 'New Patient'}
        subtitle={editing ? `#${editing.patient_id}` : 'Register a patient'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending || update.isPending}>{editing ? 'Save changes' : 'Create'}</Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rohit Kumar" autoFocus />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Age" type="number" min={1} max={149} required value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} />
            <Input label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="8800112233" />
          </div>
          <div>
            <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-secondary">Gender <span className="text-gold-dark">*</span></span>
            <div className="flex gap-2">
              {GENDERS.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setForm({ ...form, gender: g })}
                  className={`flex-1 rounded-sm border px-3 py-2.5 text-sm font-semibold transition-all ${form.gender === g ? 'border-gold bg-gold-light/30 text-gold-dark' : 'border-line bg-surface-base text-ink-muted hover:border-gold/50'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <Textarea label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Area, City" />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete patient?"
        message={`“${deleting?.name}” will be removed. This is blocked if the patient has appointments on record.`}
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.patient_id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
