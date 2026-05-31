import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, PencilSimple, Trash, Receipt, FileText } from '@phosphor-icons/react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDetails, useDetailMutations } from '@/hooks/useDetails';
import { useCanWrite } from '@/store/useAppStore';
import { currency } from '@/lib/utils';
import type { Appointment, AppointmentDetail } from '@/types';

export function DetailsDrawer({ appointment, onClose }: { appointment: Appointment | null; onClose: () => void }) {
  const id = appointment?.appointment_id ?? null;
  const { data: details, isLoading } = useDetails(id);
  const m = useDetailMutations(id ?? 0);
  const canWrite = useCanWrite();

  const [editing, setEditing] = useState<AppointmentDetail | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<AppointmentDetail | null>(null);
  const [fee, setFee] = useState('0');
  const [remarks, setRemarks] = useState('');

  const openAdd = () => { setFee('0'); setRemarks(''); setEditing(null); setAdding(true); };
  const openEdit = (d: AppointmentDetail) => {
    setFee(String(d.consultation_fee));
    setRemarks(d.remarks ?? '');
    setEditing(d);
    setAdding(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { consultation_fee: Number(fee), remarks };
    const done = () => setAdding(false);
    if (editing) m.update.mutate({ detailId: editing.detail_id, payload }, { onSuccess: done });
    else m.create.mutate(payload, { onSuccess: done });
  };

  const total = (details ?? []).reduce((s, d) => s + Number(d.consultation_fee), 0);

  return (
    <>
      <Modal
        open={!!appointment}
        onClose={onClose}
        width="max-w-xl"
        title="Consultation Details"
        subtitle={appointment ? `Appointment #${appointment.appointment_id} · ${appointment.patient_name} → ${appointment.doctor_name}` : ''}
        footer={
          <div className="flex w-full items-center justify-between">
            <span className="text-sm text-ink-secondary">
              Total billed: <span className="font-display text-xl font-bold text-ink">{currency(total)}</span>
            </span>
            {canWrite && <Button icon={<Plus size={16} weight="bold" />} onClick={openAdd}>Add detail</Button>}
          </div>
        }
      >
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : (details?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-md bg-surface-overlay text-gold shadow-bezel"><Receipt size={26} /></div>
            <p className="font-display text-xl text-ink">No consultation details</p>
            <p className="text-sm text-ink-muted">Add a fee and remarks for this appointment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {details!.map((d, i) => (
              <motion.div
                key={d.detail_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-md border border-line bg-surface-base p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-pill bg-gold-light/30 px-2.5 py-0.5 text-xs font-bold text-gold-dark">
                      Detail #{d.detail_id}
                    </span>
                    <span className="font-display text-lg font-bold text-ink">{currency(d.consultation_fee)}</span>
                  </div>
                  {canWrite && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(d)} className="rounded-pill p-1.5 text-ink-secondary hover:bg-gold-light/30 hover:text-gold-dark"><PencilSimple size={15} /></button>
                      <button onClick={() => setDeleting(d)} className="rounded-pill p-1.5 text-ink-secondary hover:bg-status-error/10 hover:text-status-error"><Trash size={15} /></button>
                    </div>
                  )}
                </div>
                {d.remarks && (
                  <p className="mt-2 flex gap-2 text-sm text-ink-secondary">
                    <FileText size={16} className="mt-0.5 shrink-0 text-ink-muted" />
                    {d.remarks}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        width="max-w-md"
        title={editing ? `Edit Detail #${editing.detail_id}` : 'Add Detail'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
            <Button onClick={save} loading={m.create.isPending || m.update.isPending}>{editing ? 'Save' : 'Add'}</Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4">
          <Input label="Consultation fee" type="number" min={0} step="0.01" required value={fee} onChange={(e) => setFee(e.target.value)} autoFocus />
          <Textarea label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Clinical notes, recommendations…" />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Remove detail?"
        message={`Detail #${deleting?.detail_id} will be permanently removed from this appointment.`}
        confirmLabel="Remove"
        loading={m.remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && m.remove.mutate(deleting.detail_id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}
