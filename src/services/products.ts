// src/services/products.ts
import { supabase } from './supabase'
import { Product, ProductFormData, ProductFilters } from '../types/product'
import { detectInAppBrowser } from '../utils/browserDetection'
import { getInAppOptimizationSettings } from '../utils/inAppOptimization'
import { shouldBypassStorageUpload, prepareImageForDatabase } from '../utils/inAppImageUtils'
import { getNextDisplayOrder } from './productOrder'

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
      return {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        error: '상품 목록을 가져오는 중 오류가 발생했습니다.'
      }
    }
  },

  // 상품 생성 (인앱 최적화 유지 + 업로드/DB 타임아웃/재시도 간소화)
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

      let imageUrl: string | null = null
      let imageBase64Data: any = null
      let detailImageUrl: string | null = null

      console.log('📷 이미지 처리 시작:', {
        hasImage: !!productData.image,
        hasDetailImage: !!productData.detail_image,
        category: productData.category
      })

      // 썸네일 이미지 처리
      if (productData.image) {
        console.log('📷 썸네일 이미지 처리 시작:', {
          name: productData.image.name,
          size: productData.image.size,
          type: productData.image.type
        })
        
        if (productData.image.size > settings.maxFileSize) {
          return { data: null, error: `썸네일 이미지가 너무 큽니다. ${Math.round(settings.maxFileSize / 1024 / 1024)}MB 이하로 선택해주세요.` }
        }

        // 인앱 우회(Base64 직저장) 옵션
        if (shouldBypassStorageUpload()) {
          console.log('📱 인앱 브라우저 - Base64 저장 방식 사용')
          try {
            imageBase64Data = await prepareImageForDatabase(productData.image)
            console.log('✅ Base64 변환 완료')
          } catch (err) {
            const msg = err instanceof Error ? err.message : '알 수 없는 오류'
            console.error('❌ Base64 변환 실패:', err)
            return { data: null, error: `이미지 처리에 실패했습니다: ${msg}` }
          }
        } else {
          console.log('🌐 일반 브라우저 - Storage 업로드 방식 사용')
          // 일반 Storage 업로드 (UUID 파일명, 1회 재시도)
          const ext = productData.image.name.split('.').pop() || 'jpg'
          const key = `products/${crypto.randomUUID()}.${ext}`
          console.log('📁 썸네일 업로드 경로:', key)

          const doUpload = async () =>
            supabase.storage
              .from('product-images')
              .upload(key, productData.image!, {
                contentType: productData.image!.type,
                cacheControl: '3600',
                upsert: false,
              })

          // 1차 시도
          let up = await doUpload()
          console.log('📤 썸네일 1차 업로드 결과:', up)
          // 업로드 실패 시 1회만 재시도(네트워크 일시 hiccup 대비)
          if (up.error) {
            console.log('🔄 썸네일 2차 업로드 시도')
            up = await doUpload()
            console.log('📤 썸네일 2차 업로드 결과:', up)
          }
          if (up.error) {
            console.error('❌ 썸네일 업로드 최종 실패:', up.error)
            return { data: null, error: `이미지 업로드 실패: ${up.error.message}` }
          }

          const { data: pub } = supabase.storage.from('product-images').getPublicUrl(key)
          console.log('🔗 썸네일 Public URL 생성:', pub)
          if (!pub?.publicUrl) return { data: null, error: '이미지 URL 생성에 실패했습니다.' }
          imageUrl = pub.publicUrl
          console.log('✅ 썸네일 이미지 처리 완료:', imageUrl)
        }
      }

      // 상세페이지 이미지 처리 (과일선물 카테고리일 때만)
      if (productData.category === 'gift' && productData.detail_image) {
        console.log('🎁 상세페이지 이미지 처리 시작:', {
          name: productData.detail_image.name,
          size: productData.detail_image.size,
          type: productData.detail_image.type
        })
        
        if (productData.detail_image.size > settings.maxFileSize) {
          return { data: null, error: `상세페이지 이미지가 너무 큽니다. ${Math.round(settings.maxFileSize / 1024 / 1024)}MB 이하로 선택해주세요.` }
        }

        const ext = productData.detail_image.name.split('.').pop() || 'jpg'
        const key = `products/detail/${crypto.randomUUID()}.${ext}`
        console.log('📁 상세페이지 업로드 경로:', key)

        const doUpload = async () =>
          supabase.storage
            .from('product-images')
            .upload(key, productData.detail_image!, {
              contentType: productData.detail_image!.type,
              cacheControl: '3600',
              upsert: false,
            })

        let up = await doUpload()
        console.log('📤 상세페이지 1차 업로드 결과:', up)
        if (up.error) {
          console.log('🔄 상세페이지 2차 업로드 시도')
          up = await doUpload()
          console.log('📤 상세페이지 2차 업로드 결과:', up)
        }
        if (up.error) {
          console.error('❌ 상세페이지 업로드 최종 실패:', up.error)
          return { data: null, error: `상세페이지 이미지 업로드 실패: ${up.error.message}` }
        }

        const { data: pub } = supabase.storage.from('product-images').getPublicUrl(key)
        console.log('🔗 상세페이지 Public URL 생성:', pub)
        if (!pub?.publicUrl) return { data: null, error: '상세페이지 이미지 URL 생성에 실패했습니다.' }
        detailImageUrl = pub.publicUrl
        console.log('✅ 상세페이지 이미지 처리 완료:', detailImageUrl)
      }

      // 다음 순서 번호 자동 할당
      const displayOrder = await getNextDisplayOrder(storeId)
      console.log('📋 Display Order:', displayOrder)

      // 상품 DB 저장
      const insertData: Record<string, any> = {
        store_id: storeId,
        name: productData.name?.trim(),
        price,
        discount_price: discountPrice,
        quantity,
        image_url: imageUrl,
        detail_image_url: detailImageUrl, // 상세페이지 이미지 URL 추가
        display_order: displayOrder,
        category: productData.category,
      }
      
      if (imageBase64Data) {
        insertData.image_base64 = imageBase64Data.base64
        insertData.image_mime_type = imageBase64Data.mimeType
        insertData.image_original_name = imageBase64Data.originalName
      }

      console.log('💾 DB 저장 데이터:', insertData)

      const { data: savedProduct, error } = await supabase.from('products').insert(insertData).select().single()
      
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

      // 새 썸네일 이미지 업로드(필요 시)
      if (productData.image) {
        if (productData.image.size > settings.maxFileSize) {
          return { data: null, error: `썸네일 이미지가 너무 큽니다. ${Math.round(settings.maxFileSize / 1024 / 1024)}MB 이하로 선택해주세요.` }
        }

        const ext = productData.image.name.split('.').pop() || 'jpg'
        const key = `products/${crypto.randomUUID()}.${ext}`

        const doUpload = async () =>
          supabase.storage
            .from('product-images')
            .upload(key, productData.image!, {
              contentType: productData.image!.type,
              cacheControl: '3600',
              upsert: false,
            })

        let up = await doUpload()
        if (up.error) up = await doUpload()
        if (up.error) return { data: null, error: `썸네일 이미지 업로드 실패: ${up.error.message}` }

        const { data: pub } = supabase.storage.from('product-images').getPublicUrl(key)
        if (!pub?.publicUrl) return { data: null, error: '썸네일 이미지 URL 생성에 실패했습니다.' }
        updateData.image_url = pub.publicUrl
      }

      // 새 상세페이지 이미지 업로드(필요 시)
      if (productData.detail_image) {
        if (productData.detail_image.size > settings.maxFileSize) {
          return { data: null, error: `상세페이지 이미지가 너무 큽니다. ${Math.round(settings.maxFileSize / 1024 / 1024)}MB 이하로 선택해주세요.` }
        }

        const ext = productData.detail_image.name.split('.').pop() || 'jpg'
        const key = `products/detail/${crypto.randomUUID()}.${ext}`

        const doUpload = async () =>
          supabase.storage
            .from('product-images')
            .upload(key, productData.detail_image!, {
              contentType: productData.detail_image!.type,
              cacheControl: '3600',
              upsert: false,
            })

        let up = await doUpload()
        if (up.error) up = await doUpload()
        if (up.error) return { data: null, error: `상세페이지 이미지 업로드 실패: ${up.error.message}` }

        const { data: pub } = supabase.storage.from('product-images').getPublicUrl(key)
        if (!pub?.publicUrl) return { data: null, error: '상세페이지 이미지 URL 생성에 실패했습니다.' }
        updateData.detail_image_url = pub.publicUrl
      }

      const { data, error } = await (supabase as any).from('products').update(updateData).eq('id', id).select().single()
      if (error) return { data: null, error: `상품 수정 실패: ${error.message}` }

      return { data, error: null }
    } catch (error) {
      let errorMessage = '상품 수정 중 오류가 발생했습니다.'
      if (error instanceof Error) errorMessage = error.message
      if (browserInfo.browser === 'kakao') {
        errorMessage += '\n\n💡 카카오톡에서 문제가 지속되면 외부 브라우저를 사용해보세요.'
      }
      return { data: null, error: errorMessage }
    }
  },

  // 상품 삭제 (재시도/중첩 타임아웃 제거)
  async deleteProduct(id: number): Promise<{ error: string | null }> {
    try {
      // 참조 관계 확인
      const rel = await supabase.from('order_items').select('id, order_id').eq('product_id', id)
      if (rel.error) return { error: `관련 데이터 확인 실패: ${rel.error.message}` }

      if (rel.data && rel.data.length > 0) {
        const delItems = await supabase.from('order_items').delete().eq('product_id', id)
        if (delItems.error) return { error: `관련 주문 항목 삭제 실패: ${delItems.error.message}` }
      }

      const del = await supabase.from('products').delete().eq('id', id)
      if (del.error) {
        if ((del.error as any).code === '23503') return { error: '아직 이 상품을 참조하는 주문이 있습니다.' }
        return { error: `상품 삭제 실패: ${del.error.message}` }
      }

      return { error: null }
    } catch (error) {
      let errorMessage = '상품 삭제 중 오류가 발생했습니다.'
      if (error instanceof Error) errorMessage = error.message
      return { error: errorMessage }
    }
  },

  // 품절 상태 토글
  async toggleSoldOut(id: number, isSoldOut: boolean): Promise<{ error: string | null }> {
    try {
      const res = await (supabase as any).from('products').update({ is_soldout: isSoldOut }).eq('id', id)
      if (res.error) return { error: `상품 상태 변경 실패: ${res.error.message}` }
      return { error: null }
    } catch (error) {
      let errorMessage = '상품 상태 변경 중 오류가 발생했습니다.'
      if (error instanceof Error) errorMessage = error.message
      return { error: errorMessage }
    }
  },
}
