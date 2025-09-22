import { create } from 'zustand';

export type SessionSlot = {
  id: string;
  title: string;
  minSec: number;
  maxSec: number;
  script: string;
};

type SessionStatus = 'idle' | 'running' | 'completed' | 'stopped';

export type SessionStore = {
  slots: SessionSlot[];
  currentIndex: number;
  status: SessionStatus;
  skipCounter: number; // increment to signal a skip
  setSlots: (slots: SessionSlot[]) => void;
  start: () => void;
  stop: () => void;
  next: () => void;
  markCompleted: () => void;
  requestSkip: () => void;
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  slots: [],
  currentIndex: 0,
  status: 'idle',
  skipCounter: 0,
  setSlots: (slots) => set({ slots, currentIndex: 0, status: 'idle' }),
  start: () => set({ status: 'running', currentIndex: 0 }),
  stop: () => set({ status: 'stopped' }),
  next: () => {
    const { currentIndex, slots } = get();
    const nextIndex = currentIndex + 1;
    if (nextIndex >= slots.length) {
      set({ status: 'completed', currentIndex: nextIndex });
    } else {
      set({ currentIndex: nextIndex });
    }
  },
  markCompleted: () => set({ status: 'completed' }),
  requestSkip: () => set((s) => ({ skipCounter: s.skipCounter + 1 })),
}));


