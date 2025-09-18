import { supabase } from './supabase'
import { Product } from '../types/product'

// 상품 순서 업데이트 인터페이스
export interface ProductOrderUpdate {
  id: number
  display_order: number
}

// 특정 점포의 상품들을 순서대로 조회
export const getProductsByOrder = async (storeId: number): Promise<Product[]> => {
  try {
    console.log('📦 상품 순서 조회 시작:', { storeId })
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ 상품 순서 조회 실패:', error)
      throw new Error(`상품 조회 실패: ${error.message}`)
    }

    console.log('✅ 상품 조회 성공:', data?.length || 0, '개')
    if (data && data.length > 0) {
      console.log('순서 정보:', data.map((p: any) => ({ id: p.id, name: p.name, order: p.display_order })))
    }
    
    return (data as Product[]) || []
  } catch (error) {
    console.error('💥 getProductsByOrder 에러:', error)
    throw error
  }
}

// 상품 순서 업데이트 (단일) - 타임아웃 추가
export const updateProductOrder = async (productId: number, displayOrder: number): Promise<void> => {
  try {
    console.log('📝 단일 상품 순서 업데이트:', { productId, displayOrder })
    
    // 타임아웃 추가 (10초)
    const updatePromise = (supabase as any)
      .from('products')
      .update({ display_order: displayOrder })
      .eq('id', productId)

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('업데이트 타임아웃 (10초 경과)')), 10000)
    )

    const { error } = await Promise.race([updatePromise, timeoutPromise]) as any

    if (error) {
      console.error('❌ 단일 업데이트 실패:', error)
      throw new Error(`상품 순서 업데이트 실패: ${error.message}`)
    }
    
    console.log('✅ 단일 상품 순서 업데이트 성공')
  } catch (error) {
    console.error('💥 updateProductOrder 에러:', error)
    throw error
  }
}

// 🚀 개선된 배치 업데이트 함수
export const updateProductsOrder = async (updates: ProductOrderUpdate[]): Promise<void> => {
  if (!updates || updates.length === 0) {
    throw new Error('업데이트할 데이터가 없습니다')
  }

  try {
    console.log('🔄 배치 업데이트 시작:', { count: updates.length })
    console.log('업데이트 목록:', updates.map(u => ({ id: u.id, order: u.display_order })))

    // 방법 1: RPC 함수 사용 (가장 안정적)
    try {
      console.log('🎯 RPC 함수로 일괄 업데이트 시도...')
      
      // RPC 함수 호출로 서버에서 트랜잭션 처리
      const { error: rpcError } = await (supabase as any).rpc('update_products_order_batch', {
        product_updates: updates
      })

      if (!rpcError) {
        console.log('✅ RPC 배치 업데이트 성공!')
        return
      }

      console.log('⚠️ RPC 실패, 대체 방법 사용:', rpcError.message)
    } catch (rpcError) {
      console.log('⚠️ RPC 함수 없음, 대체 방법 사용')
    }

    // 방법 2: 병렬 처리로 업데이트 (RPC 실패 시)
    console.log('🔧 병렬 처리로 업데이트 시작...')
    
    const updatePromises = updates.map(async (update) => {
      try {
        const { error } = await (supabase as any)
          .from('products')
          .update({ display_order: update.display_order })
          .eq('id', update.id)

        if (error) {
          throw new Error(`ID ${update.id} 업데이트 실패: ${error.message}`)
        }

        console.log(`✅ 상품 ${update.id} 순서 업데이트 완료`)
        return { id: update.id, success: true }
      } catch (error) {
        console.error(`❌ 상품 ${update.id} 업데이트 실패:`, error)
        return { id: update.id, success: false, error }
      }
    })

    // 모든 업데이트를 병렬로 실행 (타임아웃 15초)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('배치 업데이트 타임아웃 (15초 경과)')), 15000)
    )

    const results = await Promise.race([
      Promise.allSettled(updatePromises),
      timeoutPromise
    ]) as PromiseSettledResult<any>[]

    // 결과 분석
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success)
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))

    console.log('📊 업데이트 결과:', { 
      total: updates.length, 
      successful: successful.length, 
      failed: failed.length 
    })

    if (failed.length > 0) {
      console.error('❌ 일부 업데이트 실패:', failed)
      throw new Error(`${failed.length}/${updates.length} 상품의 순서 업데이트에 실패했습니다.`)
    }

    console.log('🎉 모든 상품 순서 업데이트 완료!')
    
  } catch (error) {
    console.error('💥 updateProductsOrder 전체 실패:', error)
    
    // 사용자에게 친화적인 에러 메시지 제공
    if (error instanceof Error) {
      if (error.message.includes('타임아웃')) {
        throw new Error('서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.')
      } else if (error.message.includes('네트워크')) {
        throw new Error('네트워크 연결을 확인하고 다시 시도해주세요.')
      } else {
        throw new Error(`순서 저장 실패: ${error.message}`)
      }
    } else {
      throw new Error('알 수 없는 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }
}

// 새 상품의 순서를 자동으로 설정 (마지막 순서 + 1)
export const getNextDisplayOrder = async (storeId: number): Promise<number> => {
  try {
    console.log('🔢 다음 순서 번호 조회:', { storeId })
    
    const { data, error } = await supabase
      .from('products')
      .select('display_order')
      .eq('store_id', storeId)
      .order('display_order', { ascending: false })
      .limit(1)

    if (error) {
      console.error('❌ 최대 순서 조회 실패:', error)
      throw new Error(`순서 번호 조회 실패: ${error.message}`)
    }

    const maxOrder = (data as any)?.[0]?.display_order || 0
    const nextOrder = maxOrder + 1
    
    console.log('✅ 다음 순서 번호:', nextOrder)
    return nextOrder
  } catch (error) {
    console.error('💥 getNextDisplayOrder 에러:', error)
    throw error
  }
}

// 상품 순서 재정렬 (1부터 시작하도록)
export const reorderProducts = async (storeId: number): Promise<void> => {
  try {
    console.log('🔄 상품 순서 재정렬 시작:', { storeId })
    
    // 현재 순서대로 상품 조회
    const products = await getProductsByOrder(storeId)
    
    if (products.length === 0) {
      console.log('⚠️ 재정렬할 상품이 없음')
      return
    }

    // 순서를 1부터 다시 설정
    const updates: ProductOrderUpdate[] = products.map((product, index) => ({
      id: product.id,
      display_order: index + 1
    }))

    console.log('📋 재정렬 업데이트 목록:', updates.map(u => ({ id: u.id, order: u.display_order })))

    await updateProductsOrder(updates)
    
    console.log('🎉 상품 순서 재정렬 완료!')
  } catch (error) {
    console.error('💥 reorderProducts 에러:', error)
    throw error
  }
}

// 🛠️ 디버깅 함수: 상품 순서 상태 확인
export const debugProductOrders = async (storeId: number): Promise<void> => {
  try {
    console.log('🔍 상품 순서 디버깅 시작:', { storeId })
    
    const { data, error } = await supabase
      .from('products')
      .select('id, name, display_order, created_at')
      .eq('store_id', storeId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('❌ 디버깅 쿼리 실패:', error)
      return
    }

    console.log('📊 현재 상품 순서 상태:')
    console.table((data as any)?.map((p: any) => ({
      ID: p.id,
      이름: p.name,
      순서: p.display_order,
      생성일: new Date(p.created_at).toLocaleDateString()
    })))

    // 순서 중복 확인
    const orders = (data as any)?.map((p: any) => p.display_order) || []
    const duplicates = orders.filter((order: number, index: number) => orders.indexOf(order) !== index)
    
    if (duplicates.length > 0) {
      console.warn('⚠️ 중복된 순서 번호 발견:', [...new Set(duplicates)])
    } else {
      console.log('✅ 순서 번호 중복 없음')
    }

    // 순서 연속성 확인
    const sortedOrders = orders.sort((a: number, b: number) => a - b)
    const hasGaps = sortedOrders.some((order: number, index: number) => index > 0 && order !== sortedOrders[index - 1] + 1)
    
    if (hasGaps) {
      console.warn('⚠️ 순서 번호에 빈 공간 존재:', sortedOrders)
    } else {
      console.log('✅ 순서 번호 연속성 정상')
    }
    
  } catch (error) {
    console.error('💥 디버깅 함수 오류:', error)
  }
}
