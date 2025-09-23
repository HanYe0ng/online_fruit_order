import { 
  productsTable, 
  giftProductDetailsTable, 
  viewsTable 
} from './supabase-wrapper'

// DB에서 과일선물 상품 조회
export interface DbGiftProduct {
  id: number
  store_id: number
  store_name: string
  name: string
  price: number
  discount_price?: number | null
  original_price?: number
  discount_rate?: number
  quantity: number
  image_url: string | null
  detail_image_url?: string | null // 상세페이지 이미지 URL 추가
  is_soldout: boolean
  display_order: number
  tags?: string[]
  rating?: number
  review_count?: number
  nutrition_info?: string
  storage_info?: string
  origin?: string
  description_detail?: string
  created_at: string
}

// 과일선물 상품 전체 조회
export const fetchGiftProducts = async (): Promise<DbGiftProduct[]> => {
  try {
    const { data, error } = await viewsTable.selectGiftProductsView()

    if (error) {
      console.error('과일선물 상품 조회 오류:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('fetchGiftProducts 에러:', error)
    throw error
  }
}

// 특정 점포의 과일선물 상품 조회
export const fetchGiftProductsByStore = async (storeId: number): Promise<DbGiftProduct[]> => {
  try {
    const { data, error } = await viewsTable.selectGiftProductsViewByStore(storeId)

    if (error) {
      console.error('점포별 과일선물 상품 조회 오류:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('fetchGiftProductsByStore 에러:', error)
    throw error
  }
}

// 특정 과일선물 상품 상세 조회
export const fetchGiftProductById = async (productId: number): Promise<DbGiftProduct | null> => {
  try {
    const { data, error } = await viewsTable.selectGiftProductsViewById(productId)

    if (error) {
      if (error.code === 'PGRST116') {
        // 데이터를 찾을 수 없음
        return null
      }
      console.error('과일선물 상품 상세 조회 오류:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('fetchGiftProductById 에러:', error)
    throw error
  }
}

// 과일선물 상품 추가 (관리자용)
export interface CreateGiftProductData {
  store_id: number
  name: string
  price: number
  discount_price?: number
  quantity: number
  image_url?: string
  original_price?: number
  discount_rate?: number
  tags?: string[]
  rating?: number
  review_count?: number
  nutrition_info?: string
  storage_info?: string
  origin?: string
  description_detail?: string
}

export const createGiftProduct = async (productData: CreateGiftProductData): Promise<number> => {
  try {
    // 1. 기본 상품 정보 추가
    const productInsert = {
      store_id: productData.store_id,
      name: productData.name,
      price: productData.price,
      discount_price: productData.discount_price,
      quantity: productData.quantity,
      image_url: productData.image_url,
      is_soldout: false,
      category: 'gift' as const
    }

    const { data: product, error: productError } = await productsTable.insert(productInsert)

    if (productError) {
      console.error('상품 추가 오류:', productError)
      throw productError
    }

    if (!product?.id) {
      throw new Error('상품 ID가 반환되지 않았습니다.')
    }

    const productId = product.id as number

    // 2. 과일선물 상세 정보 추가 (선택적 필드가 있는 경우에만)
    if (productData.original_price || productData.discount_rate || 
        productData.tags || productData.rating || productData.review_count ||
        productData.nutrition_info || productData.storage_info || 
        productData.origin || productData.description_detail) {
      
      const detailInsert = {
        product_id: productId,
        original_price: productData.original_price,
        discount_rate: productData.discount_rate,
        tags: productData.tags,
        rating: productData.rating,
        review_count: productData.review_count,
        nutrition_info: productData.nutrition_info,
        storage_info: productData.storage_info,
        origin: productData.origin,
        description_detail: productData.description_detail
      }

      const { error: detailError } = await giftProductDetailsTable.insert(detailInsert)

      if (detailError) {
        console.error('상품 상세정보 추가 오류:', detailError)
        // 상품은 추가되었으므로 상세정보 추가 실패는 경고만
        console.warn('상품 상세정보 추가에 실패했지만 상품은 정상적으로 추가되었습니다.')
      }
    }

    return productId
  } catch (error) {
    console.error('createGiftProduct 에러:', error)
    throw error
  }
}

// 과일선물 상품 업데이트 (관리자용)
export const updateGiftProduct = async (productId: number, productData: Partial<CreateGiftProductData>): Promise<void> => {
  try {
    // 1. 기본 상품 정보 업데이트
    const basicFields = {
      name: productData.name,
      price: productData.price,
      discount_price: productData.discount_price,
      quantity: productData.quantity,
      image_url: productData.image_url
    }

    // undefined 필드 제거
    const filteredBasicFields = Object.fromEntries(
      Object.entries(basicFields).filter(([_, value]) => value !== undefined)
    )

    if (Object.keys(filteredBasicFields).length > 0) {
      const { error: productError } = await productsTable.update(productId, filteredBasicFields)

      if (productError) {
        console.error('상품 업데이트 오류:', productError)
        throw productError
      }
    }

    // 2. 상세 정보 업데이트
    const detailFields = {
      original_price: productData.original_price,
      discount_rate: productData.discount_rate,
      tags: productData.tags,
      rating: productData.rating,
      review_count: productData.review_count,
      nutrition_info: productData.nutrition_info,
      storage_info: productData.storage_info,
      origin: productData.origin,
      description_detail: productData.description_detail
    }

    // undefined 필드 제거
    const filteredDetailFields = Object.fromEntries(
      Object.entries(detailFields).filter(([_, value]) => value !== undefined)
    )

    if (Object.keys(filteredDetailFields).length > 0) {
      // 상세 정보가 이미 존재하는지 확인
      const { data: existingDetail } = await giftProductDetailsTable.selectByProductId(productId)

      if (existingDetail) {
        // 업데이트
        const { error: detailError } = await giftProductDetailsTable.update(productId, filteredDetailFields)

        if (detailError) {
          console.error('상품 상세정보 업데이트 오류:', detailError)
          throw detailError
        }
      } else {
        // 새로 추가
        const detailInsert = {
          product_id: productId,
          ...filteredDetailFields
        }
        
        const { error: detailError } = await giftProductDetailsTable.insert(detailInsert)

        if (detailError) {
          console.error('상품 상세정보 추가 오류:', detailError)
          throw detailError
        }
      }
    }
  } catch (error) {
    console.error('updateGiftProduct 에러:', error)
    throw error
  }
}

// 과일선물 상품 삭제 (관리자용)
export const deleteGiftProduct = async (productId: number): Promise<void> => {
  try {
    // products 테이블에서 삭제하면 gift_product_details도 CASCADE로 자동 삭제됨
    const { error } = await productsTable.delete(productId)

    if (error) {
      console.error('과일선물 상품 삭제 오류:', error)
      throw error
    }
  } catch (error) {
    console.error('deleteGiftProduct 에러:', error)
    throw error
  }
}

// 과일선물 상품 품절 상태 변경
export const toggleGiftProductSoldOut = async (productId: number, isSoldOut: boolean): Promise<void> => {
  try {
    const { error } = await productsTable.update(productId, { is_soldout: isSoldOut })

    if (error) {
      console.error('상품 품절 상태 변경 오류:', error)
      throw error
    }
  } catch (error) {
    console.error('toggleGiftProductSoldOut 에러:', error)
    throw error
  }
}

// DB 데이터를 프론트엔드 타입으로 변환하는 유틸리티 함수
export const convertDbGiftProductToGiftProduct = (dbProduct: DbGiftProduct): import('../types/product').GiftProduct => {
  return {
    id: dbProduct.id,
    store_id: dbProduct.store_id,
    name: dbProduct.name,
    price: dbProduct.price,
    discount_price: dbProduct.discount_price || null,
    discount_rate: dbProduct.discount_rate || null,
    display_order: dbProduct.display_order,
    quantity: dbProduct.quantity,
    image_url: dbProduct.image_url,
    detail_image_url: dbProduct.detail_image_url || null, // 필수 필드로 string | null 타입 보장
    is_soldout: dbProduct.is_soldout,
    category: 'gift',
    created_at: dbProduct.created_at,
    // 과일선물 전용 필드
    description: dbProduct.description_detail || '',
    originalPrice: dbProduct.original_price,
    discount: dbProduct.discount_rate,
    tags: dbProduct.tags,
    rating: dbProduct.rating,
    reviewCount: dbProduct.review_count,
    images: dbProduct.image_url ? [dbProduct.image_url] : [],
    nutritionInfo: dbProduct.nutrition_info,
    storageInfo: dbProduct.storage_info,
    origin: dbProduct.origin,
    detail_image: dbProduct.detail_image_url || undefined // null을 undefined로 변환
  }
}
