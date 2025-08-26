import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Loading } from '../common'
import { ROUTES } from '../../utils/constants'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'manager'
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return <Loading fullScreen text="인증 확인 중..." />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    // 권한이 없는 경우 대시보드로 리다이렉트
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />
  }

  return <>{children}</>
}

export {ProtectedRoute}