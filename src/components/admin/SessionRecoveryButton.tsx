// src/components/admin/SessionRecoveryButton.tsx
import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { supabase } from '../../services/supabase'

interface SessionRecoveryButtonProps {
  onRecoverySuccess?: () => void
  className?: string
}

export const SessionRecoveryButton: React.FC<SessionRecoveryButtonProps> = ({
  onRecoverySuccess,
  className = ''
}) => {
  const [isRecovering, setIsRecovering] = useState(false)
  const { logout } = useAuth()
  const toast = useToast()

  const handleRecovery = async () => {
    setIsRecovering(true)
    
    try {
      console.log('🔄 세션 복구 시도 시작')
      
      // 1. 현재 세션 확인
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('세션 확인 실패:', error)
        throw new Error('세션 확인에 실패했습니다.')
      }
      
      if (!session) {
        console.log('세션이 없음 - 로그아웃 처리')
        await logout()
        toast.error('세션 만료', '로그인이 필요합니다.')
        return
      }
      
      // 2. 토큰 갱신 시도
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('토큰 갱신 실패:', refreshError)
        await logout()
        toast.error('세션 복구 실패', '다시 로그인해주세요.')
        return
      }
      
      if (!refreshData.session) {
        console.log('갱신된 세션이 없음')
        await logout()
        toast.error('세션 복구 실패', '다시 로그인해주세요.')
        return
      }
      
      console.log('✅ 세션 복구 성공')
      toast.success('연결 복구 완료', '세션이 성공적으로 복구되었습니다.')
      onRecoverySuccess?.()
      
    } catch (error) {
      console.error('세션 복구 중 오류:', error)
      toast.error('복구 실패', '세션 복구에 실패했습니다. 다시 로그인해주세요.')
    } finally {
      setIsRecovering(false)
    }
  }

  return (
    <button
      onClick={handleRecovery}
      disabled={isRecovering}
      className={`px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 ${className}`}
    >
      {isRecovering ? (
        <>
          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          <span>복구 중...</span>
        </>
      ) : (
        <>
          <span>🔄</span>
          <span>연결 복구</span>
        </>
      )}
    </button>
  )
}
