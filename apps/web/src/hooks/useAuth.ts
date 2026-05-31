import { useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useAppStore } from '@/store/useAppStore';
import type { AuthUser } from '@/types';

export function useLogin() {
  const setAuth = useAppStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (creds: { email: string; password: string }) => {
      const res = await api.post('/auth/login', creds);
      return res.data.data as { token: string; user: AuthUser };
    },
    onSuccess: ({ token, user }) => setAuth(token, user),
  });
}
