export interface DashboardStats {
  todayOrders: number
  todayRevenue: number
  totalOrders: number
  totalRevenue: number
  activeProducts: number
  lowStockProducts: number
}

export interface OrderTrend {
  date: string
  orders: number
  revenue: number
}

export interface PopularProduct {
  id: number
  name: string
  image_url: string | null
  orderCount: number
  revenue: number
}

export interface RecentOrder {
  order_id: number
  customer_name: string
  apartment_name: string
  total_amount: number
  status: string
  created_at: string
}