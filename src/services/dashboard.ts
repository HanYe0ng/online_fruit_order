import { supabase } from './supabase'
import { DashboardStats, OrderTrend, PopularProduct, RecentOrder } from '../types/dashboard'
import { OrderView, Product } from '../types/order'

export const dashboardService = {
  // 대시보드 통계 조회
  async getDashboardStats(storeId?: number): Promise<{ data: DashboardStats | null; error: string | null }> {
    try {
      // 오늘 날짜
      const today = new Date().toISOString().split('T')[0]

      let ordersQuery = supabase.from('order_view').select('*')
      if (storeId) {
        ordersQuery = ordersQuery.eq('store_id', storeId)
      }

      const { data: orders, error: ordersError } = await ordersQuery

      if (ordersError) {
        return { data: null, error: ordersError.message }
      }

      // 상품 통계
      let productsQuery = supabase.from('products').select('*')
      if (storeId) {
        productsQuery = productsQuery.eq('store_id', storeId)
      }

      const { data: products, error: productsError } = await productsQuery

      if (productsError) {
        return { data: null, error: productsError.message }
      }

      // 통계 계산
      const ordersData = (orders || []) as OrderView[]
      const productsData = (products || []) as Product[]
      
      const todayOrders = ordersData.filter(o => o.created_at.startsWith(today))
      const completedOrders = ordersData.filter(o => o.status === '완료')
      
      const stats: DashboardStats = {
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.length * 15000, // 임시 평균 주문 금액
        totalOrders: ordersData.length,
        totalRevenue: completedOrders.length * 15000, // 임시 계산
        activeProducts: productsData.filter(p => !p.is_soldout && p.quantity > 0).length,
        lowStockProducts: productsData.filter(p => p.quantity <= 5 && p.quantity > 0).length
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error: '통계 정보를 가져오는 중 오류가 발생했습니다.' }
    }
  },

  // 최근 7일 주문 트렌드
  async getOrderTrends(storeId?: number): Promise<{ data: OrderTrend[] | null; error: string | null }> {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      let query = supabase
        .from('order_view')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())

      if (storeId) {
        query = query.eq('store_id', storeId)
      }

      const { data: orders, error } = await query

      if (error) {
        return { data: null, error: error.message }
      }

      // 날짜별 그룹화
      const ordersData = (orders || []) as OrderView[]
      const trends: OrderTrend[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateString = date.toISOString().split('T')[0]
        
        const dayOrders = ordersData.filter(o => o.created_at.startsWith(dateString))
        
        trends.push({
          date: date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
          orders: dayOrders.length,
          revenue: dayOrders.length * 15000 // 임시 계산
        })
      }

      return { data: trends, error: null }
    } catch (error) {
      return { data: null, error: '주문 트렌드를 가져오는 중 오류가 발생했습니다.' }
    }
  },

  // 인기 상품 (주문 기준)
  async getPopularProducts(storeId?: number): Promise<{ data: PopularProduct[] | null; error: string | null }> {
    try {
      // 임시 데이터 (실제로는 order_items와 products를 조인해야 함)
      let query = supabase.from('products').select('*').limit(5)
      if (storeId) {
        query = query.eq('store_id', storeId)
      }

      const { data: products, error } = await query

      if (error) {
        return { data: null, error: error.message }
      }

      const productsData = (products || []) as Product[]
      const popularProducts: PopularProduct[] = productsData.map((product, index) => ({
        id: product.id,
        name: product.name,
        image_url: product.image_url,
        orderCount: Math.floor(Math.random() * 50) + 10, // 임시 데이터
        revenue: (Math.floor(Math.random() * 50) + 10) * product.price
      })).sort((a, b) => b.orderCount - a.orderCount)

      return { data: popularProducts, error: null }
    } catch (error) {
      return { data: null, error: '인기 상품을 가져오는 중 오류가 발생했습니다.' }
    }
  },

  // 최근 주문
  async getRecentOrders(storeId?: number, limit: number = 10): Promise<{ data: RecentOrder[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('order_view')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (storeId) {
        query = query.eq('store_id', storeId)
      }

      const { data: orders, error } = await query

      if (error) {
        return { data: null, error: error.message }
      }

      const ordersData = (orders || []) as OrderView[]
      const recentOrders: RecentOrder[] = ordersData.map(order => ({
        order_id: order.order_id,
        customer_name: order.customer_name || '익명',
        apartment_name: order.apartment_name,
        total_amount: 15000, // 임시 계산
        status: order.status,
        created_at: order.created_at
      }))

      return { data: recentOrders, error: null }
    } catch (error) {
      return { data: null, error: '최근 주문을 가져오는 중 오류가 발생했습니다.' }
    }
  }
}