import { create } from 'zustand';

interface AppState {
  isLoading: boolean;
  setLoading: (val: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: false,
  setLoading: (val) => set({ isLoading: val }),
}));
