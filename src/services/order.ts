import { supabase } from './supabase'
import { PostgrestError } from '@supabase/supabase-js'
import { CreateOrderData, Order, OrderItem } from '../types/order'

const getErrorMessage = (e: unknown, fallback: string) =>
  e instanceof Error ? e.message : fallback

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
        return { data: null, error: (error as PostgrestError).message }
      }

      return { data, error: null }
    } catch (e) {
      return { data: null, error: getErrorMessage(e, '아파트 검색 중 오류가 발생했습니다.') }
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

      // PGRST116: No rows found
      if (error && (error as PostgrestError).code !== 'PGRST116') {
        return { data: null, error: (error as PostgrestError).message }
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
          return { data: null, error: (createError as PostgrestError).message }
        }

        unit = newUnit
      }

      return { data: unit, error: null }
    } catch (e) {
      return { data: null, error: getErrorMessage(e, '아파트 세대 처리 중 오류가 발생했습니다.') }
    }
  },

  // 주문 생성 (재고 확인 및 차감 포함)
  async createOrder(orderData: CreateOrderData) {
    try {
      // 1. 재고 확인
      const stockCheckPromises = orderData.items.map(async (item) => {
        const { data: product, error } = await supabase
          .from('products')
          .select('id, name, quantity, is_soldout')
          .eq('id', item.product_id)
          .single()
        
        if (error) {
          throw new Error(`상품 정보를 가져올 수 없습니다: ${(error as PostgrestError).message}`)
        }
        
        if (product.is_soldout) {
          throw new Error(`${product.name}은(는) 품절된 상품입니다.`)
        }
        
        if (product.quantity < item.quantity) {
          throw new Error(`${product.name}의 재고가 부족합니다. (요청: ${item.quantity}, 재고: ${product.quantity})`)
        }
        
        return product
      })

      // 재고 확인 대기
      await Promise.all(stockCheckPromises)

      // 2. 주문 생성
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
        return { data: null, error: `주문 생성 실패: ${(orderError as PostgrestError).message}` }
      }

      // 3. 주문 상세 항목 생성
      const orderItems = orderData.items.map(item => ({
        order_id: order!.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        // 주문 롤백
        await supabase.from('orders').delete().eq('id', order!.id)
        return { data: null, error: `주문 상세 정보 저장 실패: ${(itemsError as PostgrestError).message}` }
      }

      // 4. 재고 차감
      const stockUpdatePromises = orderData.items.map(async (item) => {
        const { error } = await supabase.rpc('decrease_product_quantity', {
          product_id: item.product_id,
          decrease_amount: item.quantity
        })
        
        if (error) {
          throw new Error(`재고 차감 실패: ${(error as PostgrestError).message}`)
        }
      })

      try {
        await Promise.all(stockUpdatePromises)
      } catch (e) {
        // 주문과 주문 상세 롤백
        await supabase.from('orders').delete().eq('id', order!.id)
        return { data: null, error: getErrorMessage(e, '재고 차감 중 오류가 발생했습니다.') }
      }

      return { data: order, error: null }
    } catch (e) {
      console.error('Order creation error:', e)
      return { 
        data: null, 
        error: getErrorMessage(e, '주문 생성 중 알 수 없는 오류가 발생했습니다.') 
      }
    }
  },

  // 주문 목록 조회 (관리자용)
  async getOrders(storeId?: number) {
    try {
      let query = supabase
        .from('order_view')
        .select('*')
        .order('created_at', { ascending: false })

      if (typeof storeId === 'number') {
        query = query.eq('store_id', storeId)
      }

      const { data, error } = await query

      if (error) {
        return { data: null, error: (error as PostgrestError).message }
      }

      return { data, error: null }
    } catch (e) {
      return { data: null, error: getErrorMessage(e, '주문 목록을 가져오는 중 오류가 발생했습니다.') }
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
        return { data: null, error: (error as PostgrestError).message }
      }

      return { data, error: null }
    } catch (e) {
      return { data: null, error: getErrorMessage(e, '주문 상세 정보를 가져오는 중 오류가 발생했습니다.') }
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
        return { data: null, error: (error as PostgrestError).message }
      }

      return { data, error: null }
    } catch (e) {
      return { data: null, error: getErrorMessage(e, '주문 상태 업데이트 중 오류가 발생했습니다.') }
    }
  },

  // 주문 취소 (재고 복구)
  async cancelOrder(orderId: number) {
    try {
      // 주문 상세 정보 가져오기
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId)

      if (itemsError) {
        return { data: null, error: `주문 정보 조회 실패: ${(itemsError as PostgrestError).message}` }
      }

      if (!orderItems || orderItems.length === 0) {
        return { data: null, error: '주문 항목을 찾을 수 없습니다.' }
      }

      // 주문 상태를 '취소됨'으로 업데이트
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: '취소됨' })
        .eq('id', orderId)

      if (updateError) {
        return { data: null, error: `주문 취소 처리 실패: ${(updateError as PostgrestError).message}` }
      }

      // 재고 복구
      const stockRestorePromises = orderItems.map(async (item) => {
        const { error } = await supabase.rpc('increase_product_quantity', {
          product_id: item.product_id,
          increase_amount: item.quantity
        })
        
        if (error) {
          throw new Error(`재고 복구 실패: ${(error as PostgrestError).message}`)
        }
      })

      await Promise.all(stockRestorePromises)

      return { data: { success: true }, error: null }
    } catch (e) {
      console.error('Order cancellation error:', e)
      return { 
        data: null, 
        error: getErrorMessage(e, '주문 취소 중 알 수 없는 오류가 발생했습니다.') 
      }
    }
  }
}
