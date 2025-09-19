import React from 'react'
import { 
  AdminLayout,
  RecentOrders 
} from '../../components/admin'
import { 
  useDashboardStats, 
  useOrderTrends, 
  usePopularProducts, 
  useRecentOrders 
} from '../../hooks/useDashboard'
import { useAuth } from '../../hooks/useAuth'

const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  
  // 데이터 훅들
  const { data: ordersResponse, isLoading: ordersLoading } = useRecentOrders(user?.store_id, 8)

  const orders = ordersResponse?.data || null

  return (
    <AdminLayout>

      {/* 하단 콘텐츠 */}
      <div className="grid grid-cols-1 gap-6">
        {/* 최근 주문 */}
        <RecentOrders orders={orders} isLoading={ordersLoading} />
      </div>

    </AdminLayout>
  )
}

export default DashboardPage