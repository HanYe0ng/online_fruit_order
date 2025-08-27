// 실시간 재고 확인을 위한 유틸리티 함수
import { supabase } from '../services/supabase'

interface StockCheckResult {
  isAvailable: boolean
  message?: string
  unavailableItems?: Array<{
    productName: string
    requestedQuantity: number
    availableQuantity: number
  }>
}

export const checkCartItemsStock = async (cartItems: Array<{
  product: { id: number; name: string }
  quantity: number
}>): Promise<StockCheckResult> => {
  try {
    const stockCheckPromises = cartItems.map(async (item) => {
      const { data: product, error } = await supabase
        .from('products')
        .select('id, name, quantity, is_soldout')
        .eq('id', item.product.id)
        .single()
      
      if (error) {
        throw new Error(`상품 정보 조회 실패: ${error.message}`)
      }
      
      return {
        productId: item.product.id,
        productName: product.name,
        requestedQuantity: item.quantity,
        availableQuantity: product.quantity,
        isSoldout: product.is_soldout,
        isAvailable: !product.is_soldout && product.quantity >= item.quantity
      }
    })

    const stockResults = await Promise.all(stockCheckPromises)
    const unavailableItems = stockResults.filter(result => !result.isAvailable)

    if (unavailableItems.length > 0) {
      return {
        isAvailable: false,
        message: '일부 상품의 재고가 부족하거나 품절되었습니다.',
        unavailableItems: unavailableItems.map(item => ({
          productName: item.productName,
          requestedQuantity: item.requestedQuantity,
          availableQuantity: item.availableQuantity
        }))
      }
    }

    return {
      isAvailable: true,
      message: '모든 상품이 주문 가능합니다.'
    }
  } catch (error) {
    return {
      isAvailable: false,
      message: error instanceof Error ? error.message : '재고 확인 중 오류가 발생했습니다.'
    }
  }
}