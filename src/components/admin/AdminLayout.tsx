// /components/admin/AdminLayout.tsx
import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../common'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../utils/constants'

interface AdminLayoutProps {
  children: React.ReactNode
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [logoError, setLogoError] = useState(false)

  const handleLogout = async () => {
    console.log('🚪 로그아웃 버튼 클릭됨')
    
    if (window.confirm('로그아웃 하시겠습니까?')) {
      console.log('로그아웃 확인됨 - 로그아웃 실행')
      
      try {
        // 1. useAuth 훅의 logout 호출
        const { error } = await logout()
        console.log('logout() 함수 실행 결과:', { error })
        
        // 2. 강제로 localStorage 클리어
        try {
          localStorage.clear()
          sessionStorage.clear()
          console.log('저장소 클리어 완료')
        } catch (storageError) {
          console.log('저장소 클리어 실패:', storageError)
        }
        
        // 3. 강제로 페이지 새로고침으로 리다이렉트 (빠른 리다이렉트를 위해)
        console.log('✅ 로그아웃 완료 - 로그인 페이지로 리다이렉트')
        window.location.href = ROUTES.ADMIN_LOGIN
        
      } catch (exception) {
        console.error('❌ 로그아웃 예외:', exception)
        // 예외가 발생해도 강제 로그아웃
        console.log('예외 무시하고 강제 리다이렉트')
        window.location.href = ROUTES.ADMIN_LOGIN
      }
    } else {
      console.log('로그아웃 취소됨')
    }
  }

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { path: ROUTES.ADMIN_PRODUCTS, label: '상품 관리', icon: '🛍️', desc: '상품 등록 및 수정' },
    { path: ROUTES.ADMIN_ORDERS, label: '주문 관리', icon: '📋', desc: '주문 확인 및 처리' },
    { path: ROUTES.ADMIN_DASHBOARD, label: '대시보드', icon: '📊', desc: '매출 현황 및 통계' },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--gray-50)' }}>
      {/* 상단 네비게이션 - 고객 페이지 스타일 */}
      <header className="sticky top-0 z-40" style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--gray-100)'
      }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to={ROUTES.ADMIN_DASHBOARD} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              {!logoError ? (
                <img 
                  src="/logo.png" 
                  alt="달콤네 로고" 
                  className="h-12 w-auto object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <div style={{ 
                    background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)',
                    borderRadius: 'var(--radius)',
                    padding: 'var(--spacing-sm)'
                  }}>
                    <span className="text-2xl">🍎</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>달콤네</h1>
                    <p className="text-sm" style={{ color: 'var(--gray-600)' }}>과일가게 관리</p>
                  </div>
                </div>
              )}
            </Link>

            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium" style={{ color: 'var(--gray-900)' }}>{user?.email ?? '-'}</p>
                <p className="text-xs" style={{ color: 'var(--gray-600)' }}>
                  {user ? (user.role === 'admin' ? '관리자' : '매장 관리자') : '로그인 필요'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="dalkomne-button-primary"
                style={{ fontSize: '14px' }}
              >
                <span>🚪</span>
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 네비게이션 메뉴 - 작은 사이즈로 수정 */}
      <div className="container mx-auto px-4 py-4">
        <div className="dalkomne-card p-4 mb-4">

          <div className="grid grid-cols-3 gap-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <div
                  className="p-3 rounded-lg border transition-all duration-300 hover:shadow-md cursor-pointer text-center"
                  style={{
                    background: isActive(item.path) 
                      ? 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)' 
                      : 'var(--white)',
                    borderColor: isActive(item.path) ? 'var(--dalkomne-orange)' : 'var(--gray-200)',
                    color: isActive(item.path) ? 'var(--white)' : 'var(--gray-900)',
                    boxShadow: isActive(item.path) ? 'var(--shadow-soft)' : 'none'
                  }}
                >
                  <div className="text-xl mb-1">{item.icon}</div>
                  <h4 className="font-semibold text-sm">{item.label}</h4>
                  {isActive(item.path) && (
                    <div className="mt-1">
                      <span 
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.2)', 
                          color: 'var(--white)' 
                        }}
                      >
                        현재
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 pb-8">{children}</main>

      <footer 
        className="mt-8 p-6 rounded-lg"
        style={{ 
          background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)',
          color: 'var(--white)',
          margin: '2rem'
        }}
      >
        <div className="flex items-start space-x-4">
          <div className="text-3xl">🍎</div>
          <div>
            <h3 className="text-lg font-bold mb-3">달콤네 관리 시스템</h3>
            <div className="space-y-2 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span>• 실시간 주문 관리 및 상품 등록 시스템</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>• 매출 통계 및 재고 관리 기능 제공</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span>• 모바일 최적화 관리자 인터페이스</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>• 안전한 계정 관리 및 권한 시스템</span>
                </div>
              </div>
            </div>
            <div className='mt-6'></div>
            <p className='text-sm opacity-75'>© 2025 달콤네 과일가게 관리 시스템 v1.0</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AdminLayout
