import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types';

interface AppState {
  token: string | null;
  user: AuthUser | null;
  sidebarCollapsed: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      sidebarCollapsed: false,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'medivault-auth',
      partialize: (s) => ({ token: s.token, user: s.user, sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
);

export const useIsAdmin = () => useAppStore((s) => s.user?.role === 'Admin');
export const useCanWrite = () =>
  useAppStore((s) => s.user?.role === 'Admin' || s.user?.role === 'Doctor');
