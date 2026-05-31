import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { api, getData, getList } from '@/api/client';
import { toast } from '@/components/ui/Toaster';
import type { ApiErrorShape } from '@/api/client';

/** Paginated/filtered list hook factory. */
export function makeListHook<T>(resource: string) {
  return (params: Record<string, unknown> = {}) =>
    useQuery({
      queryKey: [resource, params],
      queryFn: () => getList<T>(`/${resource}`, params),
      placeholderData: keepPreviousData,
    });
}

/** Single-record hook factory. */
export function makeDetailHook<T>(resource: string) {
  return (id: number | string | null | undefined) =>
    useQuery({
      queryKey: [resource, 'detail', id],
      queryFn: () => getData<T>(`/${resource}/${id}`),
      enabled: id != null,
    });
}

/** Create / update / delete with cache invalidation + toasts. */
export function makeMutations<T>(resource: string, label: string) {
  const useCreate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (payload: Partial<T>) => api.post(`/${resource}`, payload).then((r) => r.data.data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [resource] });
        qc.invalidateQueries({ queryKey: ['stats'] });
        toast.success(`${label} created.`);
      },
      onError: (e: ApiErrorShape) => toast.error(e.message),
    });
  };

  const useUpdate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }: { id: number | string; payload: Partial<T> }) =>
        api.put(`/${resource}/${id}`, payload).then((r) => r.data.data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [resource] });
        qc.invalidateQueries({ queryKey: ['stats'] });
        toast.success(`${label} updated.`);
      },
      onError: (e: ApiErrorShape) => toast.error(e.message),
    });
  };

  const useRemove = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: number | string) => api.delete(`/${resource}/${id}`).then((r) => r.data.data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [resource] });
        qc.invalidateQueries({ queryKey: ['stats'] });
        toast.success(`${label} deleted.`);
      },
      onError: (e: ApiErrorShape) => toast.error(e.message),
    });
  };

  return { useCreate, useUpdate, useRemove };
}
