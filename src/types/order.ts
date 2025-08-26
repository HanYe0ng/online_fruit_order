export interface Order {
  id: number
  store_id: number
  apartment_unit_id: number
  customer_name: string | null
  customer_phone: string | null
  is_paid: boolean
  status: string
  created_at: string
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  unit_price: number
}

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
  items: {
    product_id: number
    quantity: number
    unit_price: number
  }[]
}

import { Product } from './product'