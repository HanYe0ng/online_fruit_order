// src/components/admin/ProtectedRoute.tsx
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loading } from '../common'
import { ROUTES } from '../../utils/constants'
import { useAuth } from '../../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoading, isAuthenticated, user } = useAuth()
  const location = useLocation()

  console.log('🛡️ ProtectedRoute 상태 확인:', {
    isLoading,
    isAuthenticated,
    hasUser: !!user,
    userRole: user?.role,
    currentPath: location.pathname
  })

  // 로딩 중일 때
  if (isLoading) {
    console.log('⏳ 인증 상태 로딩 중...')
    return <Loading fullScreen text="인증 확인 중..." />
  }

  // 인증되지 않은 경우
  if (!isAuthenticated || !user) {
    console.log('🚫 인증되지 않음 - 로그인 페이지로 리다이렉트')
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace state={{ from: location }} />
  }

  // 관리자 권한 확인
  if (user.role !== 'admin' && user.role !== 'manager') {
    console.log('🚫 관리자 권한 없음:', user.role)
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace />
  }

  console.log('✅ 인증 및 권한 확인 완료 - 보호된 컴포넌트 렌더링')
  return <>{children}</>
}

export { ProtectedRoute }