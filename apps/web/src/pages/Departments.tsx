import { useState } from 'react';
import { Buildings, Plus, PencilSimple, Trash, Stethoscope } from '@phosphor-icons/react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDepartments, departmentMutations } from '@/hooks/useEntities';
import { useIsAdmin } from '@/store/useAppStore';
import type { Department } from '@/types';

export function Departments() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Department | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const [name, setName] = useState('');

  const isAdmin = useIsAdmin();
  const { data, isLoading } = useDepartments({ search, page, limit: 10 });
  const { useCreate, useUpdate, useRemove } = departmentMutations;
  const create = useCreate();
  const update = useUpdate();
  const remove = useRemove();

  const openCreate = () => {
    setName('');
    setCreating(true);
  };
  const openEdit = (d: Department) => {
    setName(d.department_name);
    setEditing(d);
  };
  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { department_name: name.trim() };
    if (editing) update.mutate({ id: editing.department_id, payload }, { onSuccess: closeForm });
    else create.mutate(payload, { onSuccess: closeForm });
  };

  const columns: Column<Department>[] = [
    { key: 'department_id', header: 'ID', sortable: true, className: 'w-16 text-ink-muted', render: (d) => `#${d.department_id}` },
    { key: 'department_name', header: 'Department', sortable: true, render: (d) => <span className="font-medium text-ink">{d.department_name}</span> },
    {
      key: 'doctor_count',
      header: 'Doctors',
      sortable: true,
      render: (d) => (
        <Badge tone="sky">
          <Stethoscope size={12} weight="fill" /> {d.doctor_count ?? 0}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (d) =>
        isAdmin && (
          <div className="flex justify-end gap-1.5">
            <button onClick={() => openEdit(d)} className="rounded-pill p-2 text-ink-secondary transition-colors hover:bg-gold-light/30 hover:text-gold-dark" aria-label="Edit">
              <PencilSimple size={16} />
            </button>
            <button onClick={() => setDeleting(d)} className="rounded-pill p-2 text-ink-secondary transition-colors hover:bg-status-error/10 hover:text-status-error" aria-label="Delete">
              <Trash size={16} />
            </button>
          </div>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Organization"
        title="Departments"
        description="Clinical departments and their staffing levels."
        actions={
          isAdmin && (
            <Button icon={<Plus size={16} weight="bold" />} onClick={openCreate}>
              New Department
            </Button>
          )
        }
      />

      <div className="mb-4 max-w-sm">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search departments…" />
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        loading={isLoading}
        rowKey={(d) => d.department_id}
        page={page}
        total={data?.meta.total ?? 0}
        limit={10}
        onPageChange={setPage}
        empty={<EmptyState icon={<Buildings size={28} />} title="No departments" message="Create your first department to start assigning doctors." />}
      />

      <Modal
        open={creating || !!editing}
        onClose={closeForm}
        title={editing ? 'Edit Department' : 'New Department'}
        subtitle={editing ? `#${editing.department_id}` : 'Add a clinical department'}
        footer={
          <>
            <Button variant="ghost" onClick={closeForm}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending || update.isPending}>
              {editing ? 'Save changes' : 'Create'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit}>
          <Input
            label="Department name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cardiology"
            autoFocus
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete department?"
        message={`“${deleting?.department_name}” will be permanently removed. This is blocked if doctors are still assigned.`}
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.department_id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
