import { Database } from './database'

// Supabase 자동 생성 타입 사용
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']

export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']

export type Apartment = Database['public']['Tables']['apartments']['Row']
export type ApartmentUnit = Database['public']['Tables']['apartment_units']['Row']
export type Product = Database['public']['Tables']['products']['Row']

// 뷰 타입
export type OrderView = Database['public']['Views']['order_view']['Row']

// 주문 상세 타입 (OrderItem + Product 조인 결과)
export interface OrderDetail extends OrderItem {
  products?: {
    name: string
    image_url: string | null
  } | null
}

// 커스텀 타입들 (비즈니스 로직용)
export interface CartItem {
  product: Product
  quantity: number
}

export interface OrderFormData {
  customer_name: string
  customer_phone: string
  apartment_name: string
  dong: string
  ho: string
}

export interface CreateOrderData {
  store_id: number
  apartment_unit_id: number
  customer_name: string
  customer_phone: string
  memo?: string // 메모 필드 추가 (필요시 DB에도 추가)
  items: {
    product_id: number
    quantity: number
    unit_price: number
  }[]
}
