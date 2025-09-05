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
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 대시보드</h1>
            <p className="text-gray-600 mt-1">
              {user?.role === 'admin' ? '전체' : `${user?.store_id}번 점포`} 현황을 한눈에 확인하세요
            </p>
          </div>
          <div className="flex space-x-3">
            <Link to={ROUTES.ADMIN_PRODUCTS}>
              <Button variant="outline" size="sm">상품 관리</Button>
            </Link>
            <Link to={ROUTES.ADMIN_ORDERS}>
              <Button variant="primary" size="sm">주문 관리</Button>
            </Link>
          </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 최근 주문 */}
        <div className="lg:col-span-2">
          <RecentOrders orders={orders} isLoading={ordersLoading} />
        </div>

        {/* 빠른 액션 */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">⚡ 빠른 액션</h3>
          <div className="space-y-3">
            <Link to={ROUTES.ADMIN_PRODUCTS} className="block">
              <Button variant="outline" className="w-full justify-start">
                🛍️ 새 상품 등록
              </Button>
            </Link>
            
            <Link to={ROUTES.ADMIN_ORDERS} className="block">
              <Button variant="outline" className="w-full justify-start">
                📋 주문 확인
              </Button>
            </Link>
            
            <Button variant="outline" className="w-full justify-start" disabled>
              📊 매출 리포트 (준비중)
            </Button>
            
            <Button variant="outline" className="w-full justify-start" disabled>
              ⚙️ 설정 (준비중)
            </Button>
          </div>

          {/* 재고 부족 알림 */}
          {stats && stats.lowStockProducts > 0 && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-red-500">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-red-800">재고 부족 알림</p>
                  <p className="text-xs text-red-600">
                    {stats.lowStockProducts}개 상품의 재고가 부족합니다
                  </p>
                </div>
              </div>
              <Link to={ROUTES.ADMIN_PRODUCTS} className="block mt-2">
                <Button variant="danger" size="sm" className="w-full">
                  재고 확인하기
                </Button>
              </Link>
            </div>
          )}

          {/* 시간 표시 */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">
              30초마다 자동 새로고침
            </p>
          </div>
        </Card>
      </div>

        {/* 환영 메시지 (첫 방문자용) */}
        {stats && stats.totalOrders === 0 && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                과일가게 관리 시스템에 오신 것을 환영합니다!
              </h3>
              <p className="text-blue-800 mb-4">
                첫 번째 상품을 등록하고 주문을 받아보세요.
              </p>
              <Link to={ROUTES.ADMIN_PRODUCTS}>
                <Button variant="primary">첫 상품 등록하기</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}

export default DashboardPage