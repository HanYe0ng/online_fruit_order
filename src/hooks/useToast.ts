import { useToastStore } from '../stores/toastStore'
import { Toast } from '../types/toast'

export const useToast = () => {
  const { addToast } = useToastStore()

  const toast = {
    success: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => {
      addToast({ type: 'success', title, message, ...options })
    },

    error: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => {
      addToast({ type: 'error', title, message, ...options })
    },

    warning: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => {
      addToast({ type: 'warning', title, message, ...options })
    },

    info: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => {
      addToast({ type: 'info', title, message, ...options })
    }
  }

  return toast
}