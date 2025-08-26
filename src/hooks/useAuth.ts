import { useEffect, useMemo } from 'react'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/auth'

export const useAuth = () => {
  const { user, isLoading, isAuthenticated, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    let mounted = true // cleanup을 위한 플래그

    const initAuth = async () => {
      if (!mounted) return
      
      const store = useAuthStore.getState()
      store.setLoading(true)
      
      try {
        const { user, error } = await authService.getCurrentUser()
        if (mounted) {
          store.setUser(user)
        }
      } catch (error) {
        if (mounted) {
          store.setUser(null)
        }
      } finally {
        if (mounted) {
          store.setLoading(false)
        }
      }
    }

    initAuth()

    // cleanup 함수
    return () => {
      mounted = false
    }
  }, [])

  // 반환값을 메모화
  return useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    login: async (email: string, password: string) => {
      return { user: null, error: '임시로 비활성화된 로그인입니다.' }
    },
    logout: async () => {
      return { error: null }
    }
  }), [user, isLoading, isAuthenticated])
}