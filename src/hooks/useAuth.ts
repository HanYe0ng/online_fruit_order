import { useEffect, useMemo, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/auth'
import { supabase } from '../services/supabase'

let isInitialized = false // 전역 플래그로 중복 실행 방지
let initPromise: Promise<void> | null = null // 초기화 Promise 캐싱
let hookCallCount = 0 // 훅 호출 횟수 추적

export const useAuth = () => {
  const { user, isLoading, isAuthenticated } = useAuthStore()
  
  // 훅 호출 시마다 카운트 증가
  hookCallCount++
  const currentCallId = hookCallCount

  /**
   * 로그인
   */
  const login = useCallback(
    async (email: string, password: string) => {
      const store = useAuthStore.getState()
      store.setLoading(true)
      try {
        const { user, error } = await authService.login({ email, password })
        if (!error) store.setUser(user)
        return { user, error }
      } finally {
        store.setLoading(false)
      }
    },
    []
  )

  /**
   * 로그아웃
   */
  const logout = useCallback(
    async () => {
      const store = useAuthStore.getState()
      store.setLoading(true)
      try {
        const { error } = await authService.logout()
        store.setUser(null)
        return { error }
      } finally {
        store.setLoading(false)
      }
    },
    []
  )

  /**
   * 초기화 - 첫 번째 훅에서만 실행
   */
  useEffect(() => {
    // 첫 번째 훅에서만 로그 출력
    if (currentCallId === 1) {
      console.log('🔍 useAuth 첫 번째 호출 - 초기화 진행')
    } else {
      console.log(`🔍 useAuth ${currentCallId}번째 호출 - 초기화 스킵`)
    }
    
    if (isInitialized) {
      return
    }

    if (initPromise) {
      return
    }

    console.log('🚀 useAuth 초기화 시작')
    isInitialized = true

    initPromise = (async () => {
      const store = useAuthStore.getState()
      
      try {
        store.setLoading(true)
        console.log('세션 확인 중...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('세션 확인 오류:', error)
          store.setUser(null)
        } else if (session?.user) {
          console.log('세션 발견, 프로필 로드 중...')
          const { user: current, error: profileError } = await authService.getCurrentUser()
          
          if (profileError) {
            console.error('프로필 로드 실패:', profileError)
            store.setUser(null)
          } else {
            console.log('프로필 로드 성공:', current?.email)
            store.setUser(current)
          }
        } else {
          console.log('세션 없음')
          store.setUser(null)
        }
      } catch (error) {
        console.error('인증 초기화 오류:', error)
        store.setUser(null)
      } finally {
        console.log('✅ 인증 초기화 완료')
        store.setLoading(false)
      }
    })()

    return () => {
      if (currentCallId === 1) {
        console.log('🧹 useAuth 첫 번째 훅 정리됨')
      }
    }
  }, [currentCallId]) // currentCallId를 의존성에 추가하여 각 훅별로 추적

  // 렌더링 로그는 첫 번째 훅에서만 출력
  if (currentCallId === 1) {
    console.log('🔄 useAuth 첫 번째 훅 렌더링', { 
      hasUser: !!user, 
      isLoading, 
      isAuthenticated,
      timestamp: new Date().toISOString().split('T')[1] 
    })
  }

  return useMemo(
    () => ({ user, isLoading, isAuthenticated, login, logout }),
    [user, isLoading, isAuthenticated, login, logout]
  )
}
