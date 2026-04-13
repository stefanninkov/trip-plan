import { create } from 'zustand'
import type { ToastData, ToastType } from '@/components/shared/Toast'

interface UiStoreState {
  sidebarOpen: boolean
  toasts: ToastData[]
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  addToast: (type: ToastType, message: string) => void
  removeToast: (id: string) => void
}

export const useUiStore = create<UiStoreState>((set) => ({
  sidebarOpen: false,
  toasts: [],
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  addToast: (type, message) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
