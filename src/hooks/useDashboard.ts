import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../services/dashboard'

export const useDashboardStats = (storeId?: number) => {
  return useQuery({
    queryKey: ['dashboard-stats', storeId],
    queryFn: () => dashboardService.getDashboardStats(storeId),
    refetchInterval: 30000 // 30초마다 새로고침
  })
}

export const useOrderTrends = (storeId?: number) => {
  return useQuery({
    queryKey: ['order-trends', storeId],
    queryFn: () => dashboardService.getOrderTrends(storeId)
  })
}

export const usePopularProducts = (storeId?: number) => {
  return useQuery({
    queryKey: ['popular-products', storeId],
    queryFn: () => dashboardService.getPopularProducts(storeId)
  })
}

export const useRecentOrders = (storeId?: number, limit: number = 10) => {
  return useQuery({
    queryKey: ['recent-orders', storeId, limit],
    queryFn: () => dashboardService.getRecentOrders(storeId, limit)
  })
}
