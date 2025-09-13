import React from 'react'
import { Card } from '../common'
import { ORDER_STATUS } from '../../utils/constants'
import { OrderView } from '../../types/order'

interface OrderStatsProps {
  orders: OrderView[]
}

const OrderStats: React.FC<OrderStatsProps> = ({ orders }) => {
  // 통계 계산
  const stats = {
    total: orders.length,
    received: orders.filter(o => o.status === ORDER_STATUS.RECEIVED).length,
    delivering: orders.filter(o => o.status === ORDER_STATUS.DELIVERING).length,
    completed: orders.filter(o => o.status === ORDER_STATUS.COMPLETED).length,
    cancelled: orders.filter(o => o.status === ORDER_STATUS.CANCELLED).length
  }

  // 오늘 주문
  const today = new Date()
  const todayString = today.toISOString().split('T')[0]
  const todayOrders = orders.filter(order => 
    order.created_at.startsWith(todayString)
  )

  // 총 매출 (완료된 주문만)
  const totalRevenue = orders
    .filter(o => o.status === ORDER_STATUS.COMPLETED)
    .length * 15000 // 임시로 평균 주문 금액

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      <Card padding="md" className="text-center">
        <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        <p className="text-sm text-gray-600">전체 주문</p>
      </Card>
      
      <Card padding="md" className="text-center">
        <p className="text-2xl font-bold text-orange-600">{stats.received}</p>
        <p className="text-sm text-gray-600">접수됨</p>
      </Card>
      
      <Card padding="md" className="text-center">
        <p className="text-2xl font-bold text-yellow-600">{stats.delivering}</p>
        <p className="text-sm text-gray-600">배달중</p>
      </Card>
      
      <Card padding="md" className="text-center">
        <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        <p className="text-sm text-gray-600">완료</p>
      </Card>
      
      <Card padding="md" className="text-center">
        <p className="text-2xl font-bold text-purple-600">{todayOrders.length}</p>
        <p className="text-sm text-gray-600">오늘 주문</p>
      </Card>
      
      <Card padding="md" className="text-center">
        <p className="text-2xl font-bold text-emerald-600">
          {Math.floor(totalRevenue / 10000)}만
        </p>
        <p className="text-sm text-gray-600">총 매출</p>
      </Card>
    </div>
  )
}

export default OrderStats