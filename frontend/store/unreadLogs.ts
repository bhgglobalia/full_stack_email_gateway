import { create } from 'zustand';

interface UnreadLogsState {
  unreadCount: number;
  increment: () => void;
  reset: () => void;
}

export const useUnreadLogsStore = create<UnreadLogsState>((set) => ({
  unreadCount: 0,
  increment: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  reset: () => set({ unreadCount: 0 }),
}));
