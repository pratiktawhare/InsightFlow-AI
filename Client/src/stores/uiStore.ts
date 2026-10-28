import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  darkMode: false,
  toggleDarkMode: () => set(state => {
    const newDarkMode = !state.darkMode;
    // Apply dark mode to document
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { darkMode: newDarkMode };
  }),
  toasts: [],
  addToast: (message, type) =>
    set(state => ({
      toasts: [...state.toasts, { id: Date.now().toString(), message, type }],
    })),
  removeToast: (id) =>
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    })),
}));
