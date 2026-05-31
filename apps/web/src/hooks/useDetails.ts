import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getData } from '@/api/client';
import { toast } from '@/components/ui/Toaster';
import type { AppointmentDetail } from '@/types';
import type { ApiErrorShape } from '@/api/client';

export function useDetails(appointmentId: number | null) {
  return useQuery({
    queryKey: ['details', appointmentId],
    queryFn: () => getData<AppointmentDetail[]>(`/appointments/${appointmentId}/details`),
    enabled: appointmentId != null,
  });
}

type DetailPayload = { consultation_fee: number; remarks?: string };

export function useDetailMutations(appointmentId: number) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['details', appointmentId] });
    qc.invalidateQueries({ queryKey: ['appointments'] });
    qc.invalidateQueries({ queryKey: ['stats'] });
  };

  const create = useMutation({
    mutationFn: (payload: DetailPayload) =>
      api.post(`/appointments/${appointmentId}/details`, payload).then((r) => r.data.data),
    onSuccess: () => {
      invalidate();
      toast.success('Detail added.');
    },
    onError: (e: ApiErrorShape) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: ({ detailId, payload }: { detailId: number; payload: DetailPayload }) =>
      api.put(`/appointments/${appointmentId}/details/${detailId}`, payload).then((r) => r.data.data),
    onSuccess: () => {
      invalidate();
      toast.success('Detail updated.');
    },
    onError: (e: ApiErrorShape) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (detailId: number) =>
      api.delete(`/appointments/${appointmentId}/details/${detailId}`).then((r) => r.data.data),
    onSuccess: () => {
      invalidate();
      toast.success('Detail removed.');
    },
    onError: (e: ApiErrorShape) => toast.error(e.message),
  });

  return { create, update, remove };
}
