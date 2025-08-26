import React from 'react'
import { Link } from 'react-router-dom'
import { Button, Card } from '../common'
import { RecentOrder } from '../../types/dashboard'
import { ORDER_STATUS, ROUTES } from '../../utils/constants'

interface RecentOrdersProps {
  orders: RecentOrder[] | null
  isLoading: boolean
}

const RecentOrders: React.FC<RecentOrdersProps> = ({ orders, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">📋 최근 주문</h3>
          <Link to={ROUTES.ADMIN_ORDERS}>
            <Button variant="outline" size="sm">전체보기</Button>
          </Link>
        </div>
        <p className="text-gray-500">주문이 없습니다.</p>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case ORDER_STATUS.RECEIVED: return 'bg-blue-100 text-blue-800'
      case ORDER_STATUS.DELIVERING: return 'bg-yellow-100 text-yellow-800'
      case ORDER_STATUS.COMPLETED: return 'bg-green-100 text-green-800'
      case ORDER_STATUS.CANCELLED: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">📋 최근 주문</h3>
        <Link to={ROUTES.ADMIN_ORDERS}>
          <Button variant="outline" size="sm">전체보기</Button>
        </Link>
      </div>
      
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.order_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium">#{order.order_id}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {order.customer_name} • {order.apartment_name}
              </div>
              <div className="text-xs text-gray-500">
                {formatTime(order.created_at)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-blue-600">
                {order.total_amount.toLocaleString()}원
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default RecentOrders