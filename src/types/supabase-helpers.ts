// Supabase 타입 이슈를 해결하기 위한 헬퍼 타입들
import { Database } from './database'

// 테이블 타입 추출\
export type Tables = Database['public']['Tables']
export type Views = Database['public']['Views']

// 개별 테이블 타입\
export type ProductRow = Tables['products']['Row']
export type ProductInsert = Tables['products']['Insert']
export type ProductUpdate = Tables['products']['Update']

export type GiftProductDetailsRow = Tables['gift_product_details']['Row']
export type GiftProductDetailsInsert = Tables['gift_product_details']['Insert']
export type GiftProductDetailsUpdate = Tables['gift_product_details']['Update']

export type ApartmentUnitRow = Tables['apartment_units']['Row']
export type ApartmentUnitInsert = Tables['apartment_units']['Insert']

export type OrderRow = Tables['orders']['Row']
export type OrderInsert = Tables['orders']['Insert']
export type OrderUpdate = Tables['orders']['Update']

export type OrderItemRow = Tables['order_items']['Row']
export type OrderItemInsert = Tables['order_items']['Insert']

// 뷰 타입\
export type OrderViewRow = Views['order_view']['Row']
export type GiftProductsViewRow = Views['gift_products_view']['Row']

// 유틸리티 타입들\
export type SupabaseResponse<T> = {
  data: T | null
  error: string | null
}

export type SupabaseData<T> = T extends { data: infer U } ? U : never