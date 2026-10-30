import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem('insightflow-theme', theme)
  } catch {
    /* ignore */
  }
}

export const useTheme = create<ThemeState>((set) => ({
  theme: (() => {
    try {
      return (localStorage.getItem('insightflow-theme') as Theme) || 'dark'
    } catch {
      return 'dark'
    }
  })(),
  setTheme: (t) => {
    apply(t)
    set({ theme: t })
  },
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      apply(next)
      return { theme: next }
    }),
}))
