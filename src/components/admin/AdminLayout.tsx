// /components/admin/AdminLayout.tsx
import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../common'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../utils/constants'

interface AdminLayoutProps {
  children: React.ReactNode
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      const { error } = await logout()
      if (!error) {
        // 로그아웃 성공 시 로그인 페이지로 리다이렉트
        navigate(ROUTES.ADMIN_LOGIN, { replace: true })
      }
    }
  }

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { path: ROUTES.ADMIN_DASHBOARD, label: '대시보드', icon: '📊' },
    { path: ROUTES.ADMIN_ORDERS,    label: '주문 관리', icon: '📋' },
    { path: ROUTES.ADMIN_PRODUCTS,  label: '상품 관리', icon: '🛍️' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to={ROUTES.ADMIN_DASHBOARD} className="flex items-center space-x-2">
              <span className="text-2xl">🍎</span>
              <div>
                <h1 className="text-lg font-bold text-gray-900">과일가게 관리</h1>
                <p className="text-xs text-gray-600">
                  {user
                    ? (user.role === 'admin' ? '마스터 관리자' : `${user.store_id ?? '-'}번 점포`)
                    : '인증 필요'}
                </p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? 'primary' : 'outline'}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Button>
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.email ?? '-'}</p>
                <p className="text-xs text-gray-600">
                  {user ? (user.role === 'admin' ? '관리자' : '매장 관리자') : '로그인 필요'}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 모바일 네비게이션 */}
      <nav className="md:hidden bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className="flex-shrink-0">
                <Button
                  variant={isActive(item.path) ? 'primary' : 'outline'}
                  size="sm"
                  className="flex items-center space-x-1 whitespace-nowrap"
                >
                  <span>{item.icon}</span>
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-gray-600">
            <p>과일가게 관리 시스템 v1.0</p>
            <p>© 2025 Fruit Store Management System</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AdminLayout
