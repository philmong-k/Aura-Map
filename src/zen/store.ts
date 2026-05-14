import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ZenSession {
  id: string;
  timestamp: number;
  score: number; // 평온도 지수 (1-10)
}

interface ZenState {
  history: ZenSession[];
  addSessionLog: (score: number) => void;
  clearHistory: () => void;
}

export const useZenStore = create<ZenState>()(
  persist(
    (set) => ({
      history: [],
      addSessionLog: (score) => {
        const newSession: ZenSession = {
          id: `zen-${Date.now()}`,
          timestamp: Date.now(),
          score,
        };
        set((state) => ({ history: [newSession, ...state.history] }));
      },
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'zen-serenity-storage',
    }
  )
);
