// Types index file for easy imports
export * from './auth'
export * from './dashboard'
export * from './database'
export * from './store'
export * from './toast'

// Order types - 명시적으로 re-export
export type {
  Order,
  OrderInsert as OrderInsertType,
  OrderUpdate as OrderUpdateType,
  OrderItem,
  OrderItemInsert as OrderItemInsertType,
  Apartment,
  ApartmentUnit,
  Product as OrderProduct,
  OrderView,
  OrderDetail,
  CartItem,
  OrderFormData,
  CreateOrderData
} from './order'

// Product types - 명시적으로 re-export
export type {
  Product,
  ProductInsert as ProductInsertType,
  ProductUpdate as ProductUpdateType,
  ProductFormData,
  ProductFilters,
  GiftProduct,
  DeliveryOptionType,
  StoreInfo,
  PickupOption,
  DeliveryToCustomerOption,
  ShippingOption,
  ProductDeliveryOption,
  GiftCartItem
} from './product'

// Supabase helpers - 명시적으로 re-export
export type {
  Tables,
  Views,
  ProductRow,
  ProductInsert as SupabaseProductInsert,
  ProductUpdate as SupabaseProductUpdate,
  GiftProductDetailsRow,
  GiftProductDetailsInsert,
  GiftProductDetailsUpdate,
  ApartmentUnitRow,
  ApartmentUnitInsert as SupabaseApartmentUnitInsert,
  OrderRow,
  OrderInsert as SupabaseOrderInsert,
  OrderUpdate as SupabaseOrderUpdate,
  OrderItemRow,
  OrderItemInsert as SupabaseOrderItemInsert,
  OrderViewRow,
  GiftProductsViewRow,
  SupabaseResponse,
  SupabaseData
} from './supabase-helpers'
