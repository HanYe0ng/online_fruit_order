import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

export const useConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true)
  const [lastConnectedAt, setLastConnectedAt] = useState<Date>(new Date())

  useEffect(() => {
    let connectionCheckInterval: NodeJS.Timeout

    const checkConnection = async () => {
      try {
        // 간단한 연결 테스트
        const { error } = await supabase
          .from('stores')
          .select('id')
          .limit(1)

        if (error) {
          console.warn('🚨 Supabase 연결 실패:', error)
          setIsConnected(false)
        } else {
          if (!isConnected) {
            console.log('✅ Supabase 연결 복구됨')
          }
          setIsConnected(true)
          setLastConnectedAt(new Date())
        }
      } catch (error) {
        console.warn('🚨 연결 체크 오류:', error)
        setIsConnected(false)
      }
    }

    // 페이지가 다시 포커스될 때 연결 상태 확인
    const handleFocus = () => {
      console.log('🔍 페이지 포커스 - 연결 상태 확인')
      checkConnection()
    }

    // 온라인 상태 변화 감지
    const handleOnline = () => {
      console.log('🌐 온라인 상태 복구 - 연결 상태 확인')
      checkConnection()
    }

    const handleOffline = () => {
      console.log('📴 오프라인 상태')
      setIsConnected(false)
    }

    // 이벤트 리스너 등록
    window.addEventListener('focus', handleFocus)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        handleFocus()
      }
    })

    // 주기적 연결 체크 (2분마다)
    connectionCheckInterval = setInterval(checkConnection, 2 * 60 * 1000)

    // 초기 연결 체크
    checkConnection()

    return () => {
      clearInterval(connectionCheckInterval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isConnected])

  return {
    isConnected,
    lastConnectedAt,
    checkConnection: async () => {
      try {
        const { error } = await supabase.from('stores').select('id').limit(1)
        return !error
      } catch {
        return false
      }
    }
  }
}
