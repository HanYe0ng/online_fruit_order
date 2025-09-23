// src/services/products.ts
import { supabase } from './supabase'
import { Product, ProductFormData, ProductFilters } from '../types/product'
import { detectInAppBrowser } from '../utils/browserDetection'
import { getInAppOptimizationSettings } from '../utils/inAppOptimization'
import { shouldBypassStorageUpload, prepareImageForDatabase } from '../utils/inAppImageUtils'
import { getNextDisplayOrder } from './productOrder'

// UUID 생성 유틸리티 (브라우저 호환성 고려)
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

// 페이지네이션 타입 정의
interface PaginationParams {
  page?: number
  limit?: number
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error: string | null
}

// Base64 이미지 데이터 인터페이스
interface Base64ImageData {
  base64: string
  mimeType: string
  originalName: string
}

export type { PaginationParams, PaginatedResponse }

export const productService = {
  // 상품 목록 조회 (페이지네이션 지원)
  async getProducts(
    filters?: ProductFilters, 
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Product>> {
    try {
      const page = pagination?.page || 1
      const limit = pagination?.limit || 10
      const offset = (page - 1) * limit

      // 기본 쿼리 설정
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      // 필터 적용
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }
      if (filters?.is_soldout !== undefined) {
        query = query.eq('is_soldout', filters.is_soldout)
      }
      if (filters?.store_id) {
        query = query.eq('store_id', filters.store_id)
      }

      // 페이지네이션 적용
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query
      
      if (error) {
        console.error('상품 목록 조회 실패:', error)
        return {
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          error: error.message
        }
      }

      const total = count || 0
      const totalPages = Math.ceil(total / limit)

      return {
        data: data || [],
        pagination: { page, limit, total, totalPages },
        error: null
      }
    } catch (err) {
      console.error('상품 목록 조회 예외:', err)
      return {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        error: '상품 목록을 가져오는 중 오류가 발생했습니다.'
      }
    }
  },

  // 이미지 업로드 처리 (공통 함수)
  async uploadImage(
    file: File, 
    type: 'thumbnail' | 'detail', 
    settings: any
  ): Promise<{ url?: string; base64Data?: Base64ImageData; error?: string }> {
    console.log(`📷 ${type} 이미지 처리 시작:`, {
      name: file.name,
      size: file.size,
      type: file.type
    })
    
    if (file.size > settings.maxFileSize) {
      const sizeLimitMb = Math.round(settings.maxFileSize / 1024 / 1024)
      return { error: `${type === 'thumbnail' ? '썸네일' : '상세페이지'} 이미지가 너무 큽니다. ${sizeLimitMb}MB 이하로 선택해주세요.` }
    }

    // Base64 저장 방식 (인앱 브라우저)
    if (shouldBypassStorageUpload()) {
      console.log('📱 인앱 브라우저 - Base64 저장 방식 사용')
      try {
        const base64Data = await prepareImageForDatabase(file)
        console.log(`✅ ${type} Base64 변환 완료`)
        return { base64Data }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '알 수 없는 오류'
        console.error(`❌ ${type} Base64 변환 실패:`, err)
        return { error: `${type === 'thumbnail' ? '썸네일' : '상세페이지'} 이미지 처리에 실패했습니다: ${msg}` }
      }
    }

    // 일반 Storage 업로드
    console.log('🌐 일반 브라우저 - Storage 업로드 방식 사용')
    const ext = file.name.split('.').pop() || 'jpg'
    const key = type === 'detail' 
      ? `products/detail/${generateUUID()}.${ext}`
      : `products/${generateUUID()}.${ext}`
    
    console.log(`📁 ${type} 업로드 경로:`, key)

    const doUpload = async () =>
      supabase.storage
        .from('product-images')
        .upload(key, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        })

    // 업로드 시도 (2회 재시도)
    let uploadResult = await doUpload()
    console.log(`📤 ${type} 1차 업로드 결과:`, uploadResult)
    
    if (uploadResult.error) {
      console.log(`🔄 ${type} 2차 업로드 시도`)
      uploadResult = await doUpload()
      console.log(`📤 ${type} 2차 업로드 결과:`, uploadResult)
    }
    
    if (uploadResult.error) {
      console.error(`❌ ${type} 업로드 최종 실패:`, uploadResult.error)
      return { error: `${type === 'thumbnail' ? '썸네일' : '상세페이지'} 이미지 업로드 실패: ${uploadResult.error.message}` }
    }

    // Public URL 생성 (안전한 에러 처리)
    const { data: publicUrlData, error: urlError } = supabase.storage
      .from('product-images')
      .getPublicUrl(key)
    
    console.log(`🔗 ${type} Public URL 생성:`, publicUrlData)
    
    if (urlError || !publicUrlData?.publicUrl) {
      console.error(`❌ ${type} URL 생성 실패:`, urlError)
      return { error: `${type === 'thumbnail' ? '썸네일' : '상세페이지'} 이미지 URL 생성에 실패했습니다.` }
    }

    console.log(`✅ ${type} 이미지 처리 완료:`, publicUrlData.publicUrl)
    return { url: publicUrlData.publicUrl }
  },

  // 상품 생성
  async createProduct(productData: ProductFormData, storeId: number): Promise<{ data: Product | null; error: string | null }> {
    const browserInfo = detectInAppBrowser()
    const settings = getInAppOptimizationSettings()

    try {
      console.log('🚀 상품 생성 시작:', { productData, storeId })
      
      if (!storeId) return { data: null, error: '점포가 선택되지 않았습니다.' }

      const price = Number(productData.price)
      const discountPrice = productData.discount_price ? Number(productData.discount_price) : null
      const quantity = Number(productData.quantity)
      
      if (!Number.isFinite(price) || !Number.isFinite(quantity)) {
        return { data: null, error: '가격/수량이 올바르지 않습니다.' }
      }
      
      if (discountPrice !== null && (!Number.isFinite(discountPrice) || discountPrice >= price)) {
        return { data: null, error: '할인가는 원래 가격보다 낮아야 합니다.' }
      }

      // 다음 순서 번호 자동 할당
      const displayOrder = await getNextDisplayOrder(storeId)
      console.log('📋 Display Order:', displayOrder)

      // DB 저장 기본 데이터 구성
      const insertData: Record<string, any> = {
        store_id: storeId,
        name: productData.name?.trim(),
        price,
        discount_price: discountPrice,
        quantity,
        display_order: displayOrder,
        category: productData.category,
      }

      console.log('📷 이미지 처리 시작:', {
        hasImage: !!productData.image,
        hasDetailImage: !!productData.detail_image,
        category: productData.category
      })

      // 썸네일 이미지 처리
      if (productData.image) {
        const thumbnailResult = await this.uploadImage(productData.image, 'thumbnail', settings)
        if (thumbnailResult.error) {
          return { data: null, error: thumbnailResult.error }
        }
        
        if (thumbnailResult.url) {
          insertData.image_url = thumbnailResult.url
        } else if (thumbnailResult.base64Data) {
          insertData.image_base64 = thumbnailResult.base64Data.base64
          insertData.image_mime_type = thumbnailResult.base64Data.mimeType
          insertData.image_original_name = thumbnailResult.base64Data.originalName
        }
      }

      // 상세페이지 이미지 처리 (과일선물 카테고리일 때만)
      if (productData.category === 'gift' && productData.detail_image) {
        const detailResult = await this.uploadImage(productData.detail_image, 'detail', settings)
        if (detailResult.error) {
          return { data: null, error: detailResult.error }
        }
        
        if (detailResult.url) {
          insertData.detail_image_url = detailResult.url
        } else if (detailResult.base64Data) {
          insertData.detail_image_base64 = detailResult.base64Data.base64
          insertData.detail_image_mime_type = detailResult.base64Data.mimeType
          insertData.detail_image_original_name = detailResult.base64Data.originalName
        }
      }

      console.log('💾 DB 저장 데이터:', insertData)

      const { data: savedProduct, error } = await supabase
        .from('products')
        .insert(insertData)
        .select()
        .single()
      
      if (error) {
        console.error('❌ DB 저장 실패:', error)
        return { data: null, error: `상품 저장 실패: ${error.message}` }
      }

      console.log('✅ 상품 저장 성공:', savedProduct)
      return { data: savedProduct, error: null }
    } catch (error) {
      console.error('❌ 상품 생성 전체 오류:', error)
      let errorMessage = '상품 등록 중 오류가 발생했습니다.'
      if (error instanceof Error) errorMessage = error.message
      if (browserInfo.browser === 'kakao') {
        errorMessage += '\n\n💡 카카오톡에서 문제가 지속되면 외부 브라우저(Chrome, Safari)를 사용해보세요.'
      }
      return { data: null, error: errorMessage }
    }
  },

  // 상품 수정
  async updateProduct(id: number, productData: Partial<ProductFormData>): Promise<{ data: Product | null; error: string | null }> {
    const browserInfo = detectInAppBrowser()
    const settings = getInAppOptimizationSettings()

    try {
      const updateData: Record<string, any> = {}
      
      // 기본 필드 업데이트
      if (productData.name !== undefined) updateData.name = productData.name?.trim()
      if (productData.price !== undefined) {
        const price = Number(productData.price)
        if (!Number.isFinite(price)) return { data: null, error: '가격이 올바르지 않습니다.' }
        updateData.price = price
      }
      if (productData.discount_price !== undefined) {
        const discountPrice = productData.discount_price ? Number(productData.discount_price) : null
        if (discountPrice !== null && !Number.isFinite(discountPrice)) {
          return { data: null, error: '할인가가 올바르지 않습니다.' }
        }
        updateData.discount_price = discountPrice
      }
      if (productData.quantity !== undefined) {
        const quantity = Number(productData.quantity)
        if (!Number.isFinite(quantity)) return { data: null, error: '수량이 올바르지 않습니다.' }
        updateData.quantity = quantity
      }
      if (productData.category !== undefined) updateData.category = productData.category

      // 새 썸네일 이미지 업로드
      if (productData.image) {
        const thumbnailResult = await this.uploadImage(productData.image, 'thumbnail', settings)
        if (thumbnailResult.error) {
          return { data: null, error: thumbnailResult.error }
        }
        
        if (thumbnailResult.url) {
          updateData.image_url = thumbnailResult.url
          // Base64 데이터 초기화 (Storage 방식으로 변경 시)
          updateData.image_base64 = null
          updateData.image_mime_type = null
          updateData.image_original_name = null
        } else if (thumbnailResult.base64Data) {
          updateData.image_base64 = thumbnailResult.base64Data.base64
          updateData.image_mime_type = thumbnailResult.base64Data.mimeType
          updateData.image_original_name = thumbnailResult.base64Data.originalName
          // URL 초기화 (Base64 방식으로 변경 시)
          updateData.image_url = null
        }
      }

      // 새 상세페이지 이미지 업로드
      if (productData.detail_image) {
        const detailResult = await this.uploadImage(productData.detail_image, 'detail', settings)
        if (detailResult.error) {
          return { data: null, error: detailResult.error }
        }
        
        if (detailResult.url) {
          updateData.detail_image_url = detailResult.url
          // Base64 데이터 초기화 (Storage 방식으로 변경 시)
          updateData.detail_image_base64 = null
          updateData.detail_image_mime_type = null
          updateData.detail_image_original_name = null
        } else if (detailResult.base64Data) {
          updateData.detail_image_base64 = detailResult.base64Data.base64
          updateData.detail_image_mime_type = detailResult.base64Data.mimeType
          updateData.detail_image_original_name = detailResult.base64Data.originalName
          // URL 초기화 (Base64 방식으로 변경 시)
          updateData.detail_image_url = null
        }
      }

      console.log('💾 상품 수정 데이터:', updateData)

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
        
      if (error) {
        console.error('❌ 상품 수정 실패:', error)
        return { data: null, error: `상품 수정 실패: ${error.message}` }
      }

      console.log('✅ 상품 수정 성공:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ 상품 수정 전체 오류:', error)
      let errorMessage = '상품 수정 중 오류가 발생했습니다.'
      if (error instanceof Error) errorMessage = error.message
      if (browserInfo.browser === 'kakao') {
        errorMessage += '\n\n💡 카카오톡에서 문제가 지속되면 외부 브라우저를 사용해보세요.'
      }
      return { data: null, error: errorMessage }
    }
  },

  // 상품 삭제 (Soft Delete 방식으로 개선)
  async deleteProduct(id: number): Promise<{ error: string | null }> {
    try {
      console.log('🗑️ 상품 삭제 시작:', id)
      
      // 주문 항목과의 참조 관계 확인
      const { data: orderItems, error: checkError } = await supabase
        .from('order_items')
        .select('id, order_id')
        .eq('product_id', id)
        .limit(1)

      if (checkError) {
        console.error('❌ 참조 관계 확인 실패:', checkError)
        return { error: `관련 데이터 확인 실패: ${checkError.message}` }
      }

      // 주문 이력이 있는 경우 Soft Delete 수행
      if (orderItems && orderItems.length > 0) {
        console.log('📋 주문 이력이 있는 상품 - Soft Delete 수행')
        const { error: softDeleteError } = await supabase
          .from('products')
          .update({ 
            is_deleted: true, 
            deleted_at: new Date().toISOString() 
          })
          .eq('id', id)

        if (softDeleteError) {
          console.error('❌ Soft Delete 실패:', softDeleteError)
          return { error: `상품 삭제 실패: ${softDeleteError.message}` }
        }

        console.log('✅ 상품 Soft Delete 완료')
        return { error: null }
      }

      // 주문 이력이 없는 경우 Hard Delete 수행
      console.log('🗑️ 주문 이력이 없는 상품 - Hard Delete 수행')
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('❌ Hard Delete 실패:', deleteError)
        if ((deleteError as any).code === '23503') {
          return { error: '아직 이 상품을 참조하는 주문이 있습니다.' }
        }
        return { error: `상품 삭제 실패: ${deleteError.message}` }
      }

      console.log('✅ 상품 Hard Delete 완료')
      return { error: null }
    } catch (error) {
      console.error('❌ 상품 삭제 전체 오류:', error)
      let errorMessage = '상품 삭제 중 오류가 발생했습니다.'
      if (error instanceof Error) errorMessage = error.message
      return { error: errorMessage }
    }
  },

  // 품절 상태 토글
  async toggleSoldOut(id: number, isSoldOut: boolean): Promise<{ error: string | null }> {
    try {
      console.log('🔄 상품 품절 상태 변경:', { id, isSoldOut })
      
      const { error } = await supabase
        .from('products')
        .update({ is_soldout: isSoldOut })
        .eq('id', id)

      if (error) {
        console.error('❌ 상품 상태 변경 실패:', error)
        return { error: `상품 상태 변경 실패: ${error.message}` }
      }

      console.log('✅ 상품 상태 변경 완료')
      return { error: null }
    } catch (error) {
      console.error('❌ 상품 상태 변경 전체 오류:', error)
      let errorMessage = '상품 상태 변경 중 오류가 발생했습니다.'
      if (error instanceof Error) errorMessage = error.message
      return { error: errorMessage }
    }
  },
}