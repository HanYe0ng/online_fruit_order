import React from 'react'
import { Card } from '../common'
import { DashboardStats as StatsType } from '../../types/dashboard'

interface DashboardStatsProps {
  stats: StatsType | null
  isLoading: boolean
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const statItems = [
    {
      title: '오늘 주문',
      value: stats.todayOrders,
      icon: '📋',
      color: 'text-blue-600'
    },
    {
      title: '오늘 매출',
      value: `${Math.floor(stats.todayRevenue / 10000)}만원`,
      icon: '💰',
      color: 'text-green-600'
    },
    {
      title: '총 주문',
      value: stats.totalOrders,
      icon: '📊',
      color: 'text-purple-600'
    },
    {
      title: '총 매출',
      value: `${Math.floor(stats.totalRevenue / 10000)}만원`,
      icon: '🏆',
      color: 'text-emerald-600'
    },
    {
      title: '판매중 상품',
      value: stats.activeProducts,
      icon: '🛍️',
      color: 'text-orange-600'
    },
    {
      title: '재고 부족',
      value: stats.lowStockProducts,
      icon: '⚠️',
      color: 'text-red-600'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {statItems.map((item, index) => (
        <Card key={index} padding="md" className="text-center">
          <div className="text-2xl mb-1">{item.icon}</div>
          <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
          <div className="text-sm text-gray-600">{item.title}</div>
        </Card>
      ))}
    </div>
  )
}

export default DashboardStats