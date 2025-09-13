import React from 'react'
import { Link } from 'react-router-dom'
import { Button, Card } from '../../components/common'
import { 
  AdminLayout,
  DashboardStats, 
  OrderTrends, 
  PopularProducts, 
  RecentOrders 
} from '../../components/admin'
import { 
  useDashboardStats, 
  useOrderTrends, 
  usePopularProducts, 
  useRecentOrders 
} from '../../hooks/useDashboard'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../utils/constants'

const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  
  // 데이터 훅들
  const { data: statsResponse, isLoading: statsLoading } = useDashboardStats(user?.store_id)
  const { data: trendsResponse, isLoading: trendsLoading } = useOrderTrends(user?.store_id)
  const { data: productsResponse, isLoading: productsLoading } = usePopularProducts(user?.store_id)
  const { data: ordersResponse, isLoading: ordersLoading } = useRecentOrders(user?.store_id, 8)

  const stats = statsResponse?.data || null
  const trends = trendsResponse?.data || null
  const products = productsResponse?.data || null
  const orders = ordersResponse?.data || null

  return (
    <AdminLayout>

      {/* 빠른 액션 카드 */}
      <div className="dalkomne-card p-6 mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)' }}
          >
            <span className="text-white text-xl">⚡</span>
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--gray-900)' }}>빠른 액션</h3>
            <p className="text-sm" style={{ color: 'var(--gray-600)' }}>자주 사용하는 기능을 직접 사용하세요</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to={ROUTES.ADMIN_PRODUCTS}>
            <div className="dalkomne-card p-4 text-center hover:shadow-lg transition-all duration-300 cursor-pointer hover:transform hover:scale-105">
              <div className="text-3xl mb-2">🛍️</div>
              <h4 className="font-semibold text-sm" style={{ color: 'var(--gray-900)' }}>상품 등록</h4>
              <p className="text-xs" style={{ color: 'var(--gray-600)' }}>새 상품 추가</p>
            </div>
          </Link>
          
          <Link to={ROUTES.ADMIN_ORDERS}>
            <div className="dalkomne-card p-4 text-center hover:shadow-lg transition-all duration-300 cursor-pointer hover:transform hover:scale-105">
              <div className="text-3xl mb-2">📋</div>
              <h4 className="font-semibold text-sm" style={{ color: 'var(--gray-900)' }}>주문 확인</h4>
              <p className="text-xs" style={{ color: 'var(--gray-600)' }}>주문 및 배송</p>
            </div>
          </Link>
          
          <div className="dalkomne-card p-4 text-center opacity-50 cursor-not-allowed">
            <div className="text-3xl mb-2">📊</div>
            <h4 className="font-semibold text-sm" style={{ color: 'var(--gray-500)' }}>매출 리포트</h4>
            <p className="text-xs" style={{ color: 'var(--gray-500)' }}>준비중</p>
          </div>
          
          <div className="dalkomne-card p-4 text-center opacity-50 cursor-not-allowed">
            <div className="text-3xl mb-2">⚙️</div>
            <h4 className="font-semibold text-sm" style={{ color: 'var(--gray-500)' }}>설정</h4>
            <p className="text-xs" style={{ color: 'var(--gray-500)' }}>준비중</p>
          </div>
        </div>

        {/* 재고 부족 알림 */}
        {stats && stats.lowStockProducts > 0 && (
          <div className="mt-6 p-4 rounded-lg" style={{ background: 'var(--dalkomne-orange-soft)', borderColor: 'var(--dalkomne-orange-light)' }}>
            <div className="flex items-center space-x-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h4 className="font-semibold" style={{ color: 'var(--dalkomne-orange-dark)' }}>재고 부족 알림</h4>
                <p className="text-sm" style={{ color: 'var(--dalkomne-orange-dark)' }}>
                  {stats.lowStockProducts}개 상품의 재고가 부족합니다
                </p>
              </div>
              <Link to={ROUTES.ADMIN_PRODUCTS} className="ml-auto">
                <button className="dalkomne-button-primary" style={{ fontSize: '12px' }}>
                  재고 확인
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 통계 카드 */}
      <DashboardStats stats={stats} isLoading={statsLoading} />

      {/* 메인 콘텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 주문 트렌드 */}
        <OrderTrends trends={trends} isLoading={trendsLoading} />
        
        {/* 인기 상품 */}
        <PopularProducts products={products} isLoading={productsLoading} />
      </div>

      {/* 하단 콘텐츠 */}
      <div className="grid grid-cols-1 gap-6">
        {/* 최근 주문 */}
        <RecentOrders orders={orders} isLoading={ordersLoading} />
      </div>

      {/* 환영 메시지 (첫 방문자용) */}
      {stats && stats.totalOrders === 0 && (
        <div 
          className="mt-8 p-8 rounded-lg text-center"
          style={{ 
            background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)',
            color: 'var(--white)'
          }}
        >
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold mb-3">
            달콤네 과일가게 관리 시스템에 오신 것을 환영합니다!
          </h3>
          <p className="text-lg opacity-90 mb-6">
            첫 번째 상품을 등록하고 주문을 받아보세요.
          </p>
          <Link to={ROUTES.ADMIN_PRODUCTS}>
            <button 
              className="px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:transform hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'var(--white)',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              ✨ 첫 상품 등록하기
            </button>
          </Link>
        </div>
      )}

      {/* 시간 표시 */}
      <div 
        className="mt-8 p-4 rounded-lg text-center"
        style={{ background: 'var(--gray-100)' }}
      >
        <p className="text-sm" style={{ color: 'var(--gray-600)' }}>
          마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
        </p>
        <p className="text-xs" style={{ color: 'var(--gray-500)' }}>
          30초마다 자동 새로고침
        </p>
      </div>
    </AdminLayout>
  )
}

export default DashboardPage