import React from 'react'
import { Card } from '../common'
import { OrderTrend } from '../../types/dashboard'

interface OrderTrendsProps {
  trends: OrderTrend[] | null
  isLoading: boolean
}

const OrderTrends: React.FC<OrderTrendsProps> = ({ trends, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  if (!trends || trends.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold mb-4">📈 주문 트렌드 (최근 7일)</h3>
        <p className="text-gray-500">데이터가 없습니다.</p>
      </Card>
    )
  }

  const maxOrders = Math.max(...trends.map(t => t.orders))

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">📈 주문 트렌드 (최근 7일)</h3>
      
      {/* 간단한 바 차트 */}
      <div className="space-y-3">
        {trends.map((trend, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-12 text-sm text-gray-600">{trend.date}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div 
                  className="bg-blue-500 h-6 rounded"
                  style={{ 
                    width: maxOrders > 0 ? `${(trend.orders / maxOrders) * 100}%` : '0%',
                    minWidth: trend.orders > 0 ? '20px' : '0px'
                  }}
                ></div>
                <span className="text-sm font-medium">{trend.orders}건</span>
              </div>
            </div>
            <div className="w-16 text-sm text-gray-600 text-right">
              {Math.floor(trend.revenue / 10000)}만원
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600 text-center">
          총 {trends.reduce((sum, t) => sum + t.orders, 0)}건 주문 • 
          {Math.floor(trends.reduce((sum, t) => sum + t.revenue, 0) / 10000)}만원 매출
        </div>
      </div>
    </Card>
  )
}

export default OrderTrends