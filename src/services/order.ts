import { supabase } from './supabase'
import { CreateOrderData, Order, OrderItem } from '../types/order'

export const orderService = {
  // 아파트 검색
  async searchApartments(query: string) {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10)

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: '아파트 검색 중 오류가 발생했습니다.' }
    }
  },

  // 아파트 세대 찾기 또는 생성
  async findOrCreateApartmentUnit(apartmentId: number, dong: string, ho: string) {
    try {
      // 기존 세대 찾기
      let { data: unit, error } = await supabase
        .from('apartment_units')
        .select('*')
        .eq('apartment_id', apartmentId)
        .eq('dong', dong)
        .eq('ho', ho)
        .single()

      if (error && error.code !== 'PGRST116') {
        return { data: null, error: error.message }
      }

      // 세대가 없으면 새로 생성
      if (!unit) {
        const { data: newUnit, error: createError } = await supabase
          .from('apartment_units')
          .insert([{
            apartment_id: apartmentId,
            dong,
            ho
          }])
          .select()
          .single()

        if (createError) {
          return { data: null, error: createError.message }
        }

        unit = newUnit
      }

      return { data: unit, error: null }
    } catch (error) {
      return { data: null, error: '아파트 세대 처리 중 오류가 발생했습니다.' }
    }
  },

  // 주문 생성
  async createOrder(orderData: CreateOrderData) {
    try {
      // 주문 생성
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          store_id: orderData.store_id,
          apartment_unit_id: orderData.apartment_unit_id,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone
        }])
        .select()
        .single()

      if (orderError) {
        return { data: null, error: orderError.message }
      }

      // 주문 상세 항목 생성
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        return { data: null, error: itemsError.message }
      }

      return { data: order, error: null }
    } catch (error) {
      return { data: null, error: '주문 생성 중 오류가 발생했습니다.' }
    }
  },

  // 주문 목록 조회 (관리자용)
  async getOrders(storeId?: number) {
    try {
      let query = supabase
        .from('order_view')
        .select('*')
        .order('created_at', { ascending: false })

      if (storeId) {
        query = query.eq('store_id', storeId)
      }

      const { data, error } = await query

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: '주문 목록을 가져오는 중 오류가 발생했습니다.' }
    }
  },

  // 주문 상세 조회
  async getOrderDetails(orderId: number) {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            name,
            image_url
          )
        `)
        .eq('order_id', orderId)

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: '주문 상세 정보를 가져오는 중 오류가 발생했습니다.' }
    }
  },

  // 주문 상태 업데이트
  async updateOrderStatus(orderId: number, status: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: '주문 상태 업데이트 중 오류가 발생했습니다.' }
    }
  }
}
