import React, { useState, useEffect } from 'react'
import { Card, Loading } from '../../components/common'
import { AdminLayout, OrderCard, OrderStats, OrderFilters } from '../../components/admin'
import { useOrders } from '../../hooks/useOrder'
import { useAuth } from '../../hooks/useAuth'
import { ORDER_STATUS } from '../../utils/constants'
import { OrderView } from '../../types/order'

const OrderManagePage: React.FC = () => {
  const { user } = useAuth()
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const { data: ordersResponse, isLoading, refetch } = useOrders(
    user?.store_id || undefined
  )

  const orders: OrderView[] = (ordersResponse?.data || []) as OrderView[]

  // 필터링된 주문 목록
  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
    const matchesSearch = !searchTerm || 
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.apartment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_id.toString().includes(searchTerm)
    
    return matchesStatus && matchesSearch
  })

  // 상태별 정렬 (접수됨 > 배달중 > 완료 > 취소)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const statusOrder = {
      [ORDER_STATUS.RECEIVED]: 1,
      [ORDER_STATUS.DELIVERING]: 2,
      [ORDER_STATUS.COMPLETED]: 3,
      [ORDER_STATUS.CANCELLED]: 4
    }
    
    const aOrder = statusOrder[a.status as keyof typeof statusOrder] || 5
    const bOrder = statusOrder[b.status as keyof typeof statusOrder] || 5
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder
    }
    
    // 같은 상태면 최신순
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  // 자동 새로고침 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 30000)

    return () => clearInterval(interval)
  }, [refetch])

  // 실시간 알림 표시
  const urgentOrders = orders.filter(order => 
    order.status === ORDER_STATUS.RECEIVED &&
    new Date().getTime() - new Date(order.created_at).getTime() > 30 * 60 * 1000 // 30분 경과
  )

  return (
    <AdminLayout>

      {/* 필터 */}
      <OrderFilters
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={() => refetch()}
      />

      {/* 주문 목록 */}
      <div className="dalkomne-card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="text-2xl">📋</div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--gray-900)' }}>주문 목록</h3>
            <p className="text-sm" style={{ color: 'var(--gray-600)' }}>
              {filteredOrders.length > 0 
                ? `${filteredOrders.length}건의 주문을 처리해주세요` 
                : '새로운 주문을 기다리고 있습니다'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12">
            <Loading text="주문 목록을 불러오는 중..." />
          </div>
        ) : (
          <>
            {sortedOrders.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sortedOrders.map((order) => (
                  <OrderCard
                    key={order.order_id}
                    order={order}
                    onRefresh={() => refetch()}
                  />
                ))}
              </div>
            ) : (
              <div 
                className="text-center py-16 rounded-lg"
                style={{ background: 'var(--gray-50)' }}
              >
                <div className="text-6xl mb-4">
                  {searchTerm ? '🔍' : '📋'}
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>
                  {searchTerm ? '검색 결과가 없습니다' : '주문이 없습니다'}
                </h3>
                <p className="mb-6" style={{ color: 'var(--gray-600)' }}>
                  {searchTerm
                    ? '다른 검색어를 시도해보세요.'
                    : '새로운 주문이 들어오면 여기에 표시됩니다!'}
                </p>
                <div className="flex justify-center">
                  <button 
                    onClick={() => refetch()}
                    className="dalkomne-button-primary"
                  >
                    새로고침
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default OrderManagePage