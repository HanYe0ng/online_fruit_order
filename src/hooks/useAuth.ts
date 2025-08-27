import { useEffect, useMemo, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/auth'
import { supabase } from '../services/supabase'

export const useAuth = () => {
  const { user, isLoading, isAuthenticated, setUser, setLoading } = useAuthStore()

  // 프로필 로더
  const loadProfile = useCallback(async (uid: string) => {
    try {
      const { user: current, error } = await authService.getCurrentUser()
      if (error) {
        setUser(null)
      } else {
        setUser(current)
      }
    } catch {
      setUser(null)
    }
  }, [setUser])

  useEffect(() => {
    let alive = true
    setLoading(true)

    // 1) 현재 세션 한 번 확인
    supabase.auth.getUser()
      .then(({ data }) => {
        if (!alive) return
        if (data?.user?.id) return loadProfile(data.user.id)
        setUser(null)
      })
      .finally(() => { if (alive) setLoading(false) })

    // 2) 이후 변화는 이벤트로 수신
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!alive) return
      setLoading(true)
      try {
        if (session?.user?.id) {
          await loadProfile(session.user.id)
        } else {
          setUser(null)
        }
      } finally {
        if (alive) setLoading(false)
      }
    })

    return () => {
      alive = false
      sub?.subscription?.unsubscribe?.()
    }
  }, [setLoading, setUser, loadProfile])

  // 실제 로그인/로그아웃도 스토어에 반영
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const { user, error } = await authService.login({ email, password })
      if (!error) setUser(user)
      return { user, error }
    } finally {
      setLoading(false)
    }
  }, [setUser, setLoading])

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      const { error } = await authService.logout()
      if (!error) setUser(null)
      return { error }
    } finally {
      setLoading(false)
    }
  }, [setUser, setLoading])

  return useMemo(() => ({
    user, isLoading, isAuthenticated, login, logout,
  }), [user, isLoading, isAuthenticated, login, logout])
}