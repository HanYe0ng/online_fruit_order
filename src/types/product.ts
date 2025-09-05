export interface Product {
  id: number
  store_id: number
  name: string
  price: number
  quantity: number
  image_url: string | null
  is_soldout: boolean
  category?: 'today' | 'gift' // 옵셔널로 변경 (하위 호환성)
  created_at: string
}

export interface ProductFormData {
  name: string
  price: number
  quantity: number
  category: 'today' | 'gift'
  image?: File | null
}

export interface ProductFilters {
  search?: string
  is_soldout?: boolean
  store_id?: number
}