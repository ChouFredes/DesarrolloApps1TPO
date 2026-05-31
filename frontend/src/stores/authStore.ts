import { create } from 'zustand';

interface User {
  id: number;
  nombre: string;
  apellido: string;
  categoria: string;
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

// DEV: cambia DEV_MODE a false cuando tengas el backend + DB levantados
const DEV_MODE = true;

export const useAuthStore = create<AuthState>((set) => ({
  token: DEV_MODE ? 'dev-token' : null,
  refreshToken: DEV_MODE ? 'dev-refresh' : null,
  user: DEV_MODE ? { id: 1, nombre: 'Test', apellido: 'User', categoria: 'comun' } : null,
  isAuthenticated: DEV_MODE,
  login: (token, refreshToken, user) =>
    set({ token, refreshToken, user, isAuthenticated: true }),
  logout: () =>
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false }),
  setUser: (user) => set({ user }),
}));
