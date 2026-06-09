import { create } from 'zustand';

interface User {
  id: number;
  nombre: string;
  apellido: string;
  categoria: string;
  admitido?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  login: (token, refreshToken, user) =>
    set({ token, refreshToken, user, isAuthenticated: true }),
  logout: () =>
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false }),
  setUser: (user) => set({ user }),
}));
