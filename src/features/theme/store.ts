import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ThemeState = {
  mode: 'light' | 'dark';
  accent: 'red' | 'blue' | 'yellow';
  setMode: (mode: 'light' | 'dark') => void;
  setAccent: (accent: 'red' | 'blue' | 'yellow') => void;
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => {
            return {
                mode: 'light', // start theme
                accent: 'red', // start accent
                setMode: (mode) => set({ mode }),
                setAccent: (accent) => set({ accent }),
            }
        },
        {
            name: "theme",
            storage: createJSONStorage(() => localStorage)
        }
    )
);
