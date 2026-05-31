import { useMutation, useQuery } from '@tanstack/react-query';
import { api, getData } from '@/api/client';
import type { QueryResult, SchemaTable } from '@/types';
import type { ApiErrorShape } from '@/api/client';

export function useSchema() {
  return useQuery({
    queryKey: ['query-schema'],
    queryFn: () => getData<SchemaTable[]>('/query/schema'),
    staleTime: Infinity,
  });
}

export function useRunQuery() {
  return useMutation<QueryResult, ApiErrorShape, string>({
    mutationFn: async (sql: string) => {
      const res = await api.post('/query/execute', { sql });
      return res.data.data as QueryResult;
    },
  });
}
