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
    console.log('🚪 useAuth.logout() 호출됨')
    setLoading(true)
    try {
      // 1. Supabase 로그아웃 시도
      const { error } = await authService.logout()
      console.log('Supabase 로그아웃 결과:', { error })
      
      // 2. 에러 여부와 상관없이 사용자 상태 클리어
      console.log('사용자 상태 강제 클리어')
      setUser(null)
      
      return { error: error || null }
    } catch (exception) {
      console.error('💥 useAuth.logout() 예외:', exception)
      // 예외 발생 시도 사용자 상태 클리어
      console.log('예외 발생 - 사용자 상태 강제 클리어')
      setUser(null)
      return { error: null } // 로그아웃은 성공으로 처리
    } finally {
      setLoading(false)
    }
  }, [setUser, setLoading])

  return useMemo(() => ({
    user, isLoading, isAuthenticated, login, logout,
  }), [user, isLoading, isAuthenticated, login, logout])
}