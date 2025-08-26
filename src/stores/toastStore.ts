import { create } from 'zustand'
import { ToastState, Toast } from '../types/toast'

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toastData) => {
    const id = Math.random().toString(36).substring(2, 9)
    const toast: Toast = {
      id,
      duration: 5000, // 기본 5초
      ...toastData
    }

    set(state => ({
      toasts: [...state.toasts, toast]
    }))

    // 자동 제거
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, toast.duration)
    }
  },

  removeToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }))
  },

  clearToasts: () => set({ toasts: [] })
}))