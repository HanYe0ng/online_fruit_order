import { supabase } from './supabase'
import { 
  SupabaseProductInsert, 
  SupabaseProductUpdate, 
  GiftProductDetailsInsert, 
  GiftProductDetailsUpdate,
  SupabaseApartmentUnitInsert,
  SupabaseOrderInsert,
  SupabaseOrderItemInsert
} from '../types'

// Products 테이블 작업
export const productsTable = {
  async insert(data: SupabaseProductInsert) {
    return await (supabase as any)
      .from('products')
      .insert(data)
      .select('id')
      .single()
  },

  async update(id: number, data: SupabaseProductUpdate) {
    return await (supabase as any)
      .from('products')
      .update(data)
      .eq('id', id)
  },

  async select() {
    return await (supabase as any)
      .from('products')
      .select('*')
  },

  async selectById(id: number) {
    return await (supabase as any)
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
  },

  async selectByStoreAndCategory(storeId: number, category: string) {
    return await (supabase as any)
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .eq('category', category)
  },

  async delete(id: number) {
    return await (supabase as any)
      .from('products')
      .delete()
      .eq('id', id)
      .eq('category', 'gift')
  }
}

// Gift Product Details 테이블 작업
export const giftProductDetailsTable = {
  async insert(data: GiftProductDetailsInsert) {
    return await (supabase as any)
      .from('gift_product_details')
      .insert(data)
  },

  async update(productId: number, data: GiftProductDetailsUpdate) {
    return await (supabase as any)
      .from('gift_product_details')
      .update(data)
      .eq('product_id', productId)
  },

  async selectByProductId(productId: number) {
    return await (supabase as any)
      .from('gift_product_details')
      .select('id')
      .eq('product_id', productId)
      .single()
  }
}

// Apartment Units 테이블 작업
export const apartmentUnitsTable = {
  async insert(data: SupabaseApartmentUnitInsert[]) {
    return await (supabase as any)
      .from('apartment_units')
      .insert(data)
      .select()
      .single()
  },

  async selectByApartmentAndUnit(apartmentId: number, dong: string, ho: string) {
    return await (supabase as any)
      .from('apartment_units')
      .select('*')
      .eq('apartment_id', apartmentId)
      .eq('dong', dong)
      .eq('ho', ho)
      .single()
  }
}

// Orders 테이블 작업
export const ordersTable = {
  async insert(data: SupabaseOrderInsert[]) {
    return await (supabase as any)
      .from('orders')
      .insert(data)
      .select()
      .single()
  },

  async update(id: number, data: { status: string }) {
    return await (supabase as any)
      .from('orders')
      .update(data)
      .eq('id', id)
      .select()
      .single()
  },

  async delete(id: number) {
    return await (supabase as any)
      .from('orders')
      .delete()
      .eq('id', id)
  }
}

// Order Items 테이블 작업
export const orderItemsTable = {
  async insert(data: SupabaseOrderItemInsert[]) {
    return await (supabase as any)
      .from('order_items')
      .insert(data)
  },

  async selectByOrderId(orderId: number) {
    return await (supabase as any)
      .from('order_items')
      .select(`
        *,
        products (
          name,
          image_url
        )
      `)
      .eq('order_id', orderId)
  }
}

// Views 작업
export const viewsTable = {
  async selectOrderView(storeId?: number) {
    let query = (supabase as any)
      .from('order_view')
      .select('*')
      .order('created_at', { ascending: false })

    if (typeof storeId === 'number') {
      query = query.eq('store_id', storeId)
    }

    return await query
  },

  async selectGiftProductsView() {
    return await (supabase as any)
      .from('gift_products_view')
      .select('*')
      .order('created_at', { ascending: false })
  },

  async selectGiftProductsViewByStore(storeId: number) {
    return await (supabase as any)
      .from('gift_products_view')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
  },

  async selectGiftProductsViewById(id: number) {
    return await (supabase as any)
      .from('gift_products_view')
      .select('*')
      .eq('id', id)
      .single()
  }
}

// 기타 유틸리티 함수들
export const supabaseUtils = {
  async searchApartments(query: string) {
    return await (supabase as any)
      .from('apartments')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(10)
  },

  async callRpc(functionName: string, params: Record<string, any>) {
    return await (supabase as any).rpc(functionName, params)
  }
}