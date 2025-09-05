import React, { useState, useEffect } from 'react'
import { Card, Loading } from '../../components/common'
import { AdminLayout, OrderCard, OrderStats, OrderFilters } from '../../components/admin'
import { useOrders } from '../../hooks/useOrder'
import { useAuth } from '../../hooks/useAuth'
import { ORDER_STATUS } from '../../utils/constants'

const OrderManagePage: React.FC = () => {
  const { user } = useAuth()
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const { data: ordersResponse, isLoading, refetch } = useOrders(
    user?.store_id || undefined
  )

  const orders = ordersResponse?.data || []

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
      <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">주문 관리</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'admin' ? '전체 주문' : `${user?.store_id}번 점포 주문`} 관리
            {urgentOrders.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                🚨 긴급 {urgentOrders.length}건
              </span>
            )}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          자동 새로고침: 30초마다
        </div>
      </div>

      {/* 통계 카드 */}
      <OrderStats orders={orders} />

      {/* 필터 */}
      <OrderFilters
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={() => refetch()}
      />

      {/* 주문 목록 */}
      {isLoading ? (
        <Loading text="주문 목록을 불러오는 중..." />
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
            <Card className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm ? '검색 결과가 없습니다.' : '주문이 없습니다.'}
              </p>
            </Card>
          )}
        </>
      )}
      </div>
    </AdminLayout>
  )
}

export default OrderManagePage