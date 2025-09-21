export const ORDER_STATUS = {
  RECEIVED: '접수됨',
  DELIVERING: '배달중',
  COMPLETED: '완료',
  CANCELLED: '취소됨'
} as const

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager'
} as const

export const ROUTES = {
  // Customer routes
  HOME: '/',
  PRODUCTS: '/products',
  CART: '/cart',
  ORDER_COMPLETE: '/order-complete',
  PRODUCT_DETAIL: (id: string | number) => `/product/${id}`,
  GIFT_PRODUCT_DETAIL: (id: string | number) => `/gift-product/${id}`,
  
  // Admin routes
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS: '/admin/orders'
} as const

export const STORAGE_KEYS = {
  CART: 'fruit-store-cart',
  CUSTOMER_INFO: 'fruit-store-customer-info',
  SELECTED_STORE: 'fruit-store-selected-store'
} as const