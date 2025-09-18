import { Database } from './database'

// Supabase 자동 생성 타입 사용
export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

// 커스텀 타입들 (비즈니스 로직용)
export interface ProductFormData {
  name: string
  price: number
  discount_price?: number | null
  discount_rate?: number | null
  quantity: number
  category: 'today' | 'gift'
  image?: File | null
}

export interface ProductFilters {
  search?: string
  is_soldout?: boolean
  store_id?: number
}

// 과일선물 관련 타입
export interface GiftProduct extends Product {
  description: string
  originalPrice?: number // 할인 전 가격
  discount?: number // 할인 퍼센트
  tags?: string[] // 태그 (예: "인기", "신상", "특가")
  rating?: number // 평점
  reviewCount?: number // 리뷰 수
  images?: string[] // 상세 이미지들
  nutritionInfo?: string // 영양 정보
  storageInfo?: string // 보관 방법
  origin?: string // 원산지
}

// 배송 옵션 타입
export type DeliveryOptionType = 'pickup' | 'delivery' | 'shipping'

export interface StoreInfo {
  id: number
  name: string
  address: string
  phone: string
}

// 픽업 옵션
export interface PickupOption {
  type: 'pickup'
  storeId: number
  storeName: string
}

// 배달 옵션 (구매자에게)
export interface DeliveryToCustomerOption {
  type: 'delivery'
}

// 택배 옵션 (선물 받는 사람에게)
export interface ShippingOption {
  type: 'shipping'
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  deliveryMessage?: string
}

export type ProductDeliveryOption = PickupOption | DeliveryToCustomerOption | ShippingOption

// 장바구니 아이템 (선물용)
export interface GiftCartItem {
  product: GiftProduct
  quantity: number
  deliveryOption: ProductDeliveryOption
}
