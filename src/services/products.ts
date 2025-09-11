// src/services/products.ts
import { supabase } from './supabase'
import { Product, ProductFormData, ProductFilters } from '../types/product'
import { detectInAppBrowser } from '../utils/browserDetection'
import { getInAppOptimizationSettings } from '../utils/inAppOptimization'
import { shouldBypassStorageUpload, prepareImageForDatabase } from '../utils/inAppImageUtils'

export const productService = {
  // 상품 목록 조회
  async getProducts(filters?: ProductFilters): Promise<{ data: Product[] | null; error: string | null }> {
    try {
      let query = supabase.from('products').select('*').order('id', { ascending: false })

      if (filters?.search) query = query.ilike('name', `%${filters.search}%`)
      if (filters?.is_soldout !== undefined) query = query.eq('is_soldout', filters.is_soldout)
      if (filters?.store_id) query = query.eq('store_id', filters.store_id)

      const { data, error } = await query
      if (error) return { data: null, error: error.message }
      return { data, error: null }
    } catch {
      return { data: null, error: '상품 목록을 가져오는 중 오류가 발생했습니다.' }
    }
  },

  // 상품 생성 (인앱 최적화 유지 + 업로드/DB 타임아웃/재시도 간소화)
  async createProduct(productData: ProductFormData, storeId: number): Promise<{ data: Product | null; error: string | null }> {
    const browserInfo = detectInAppBrowser()
    const settings = getInAppOptimizationSettings()

    try {
      if (!storeId) return { data: null, error: '점포가 선택되지 않았습니다.' }

      const price = Number(productData.price)
      const quantity = Number(productData.quantity)
      if (!Number.isFinite(price) || !Number.isFinite(quantity)) {
        return { data: null, error: '가격/수량이 올바르지 않습니다.' }
      }

      let imageUrl: string | null = null
      let imageBase64Data: any = null

      // 이미지 처리
      if (productData.image) {
        if (productData.image.size > settings.maxFileSize) {
          return { data: null, error: `파일이 너무 큽니다. ${Math.round(settings.maxFileSize / 1024 / 1024)}MB 이하로 선택해주세요.` }
        }

        // 인앱 우회(Base64 직저장) 옵션
        if (shouldBypassStorageUpload()) {
          try {
            imageBase64Data = await prepareImageForDatabase(productData.image)
          } catch (err) {
            const msg = err instanceof Error ? err.message : '알 수 없는 오류'
            return { data: null, error: `이미지 처리에 실패했습니다: ${msg}` }
          }
        } else {
          // 일반 Storage 업로드 (UUID 파일명, 1회 재시도)
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

          // 1차 시도
          let up = await doUpload()
          // 업로드 실패 시 1회만 재시도(네트워크 일시 hiccup 대비)
          if (up.error) up = await doUpload()
          if (up.error) return { data: null, error: `이미지 업로드 실패: ${up.error.message}` }

          const { data: pub } = supabase.storage.from('product-images').getPublicUrl(key)
          if (!pub?.publicUrl) return { data: null, error: '이미지 URL 생성에 실패했습니다.' }
          imageUrl = pub.publicUrl
        }
      }

      // DB 저장(재시도 없음)
      const insertData: Record<string, any> = {
        store_id: storeId,
        name: productData.name?.trim(),
        price,
        quantity,
        image_url: imageUrl,
      }
      if (imageBase64Data) {
        insertData.image_base64 = imageBase64Data.base64
        insertData.image_mime_type = imageBase64Data.mimeType
        insertData.image_original_name = imageBase64Data.originalName
      }

      const { data, error } = await supabase.from('products').insert(insertData).select().single()
      if (error) return { data: null, error: `상품 저장 실패: ${error.message}` }

      return { data, error: null }
    } catch (error) {
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
      if (productData.quantity !== undefined) {
        const quantity = Number(productData.quantity)
        if (!Number.isFinite(quantity)) return { data: null, error: '수량이 올바르지 않습니다.' }
        updateData.quantity = quantity
      }

      // 새 이미지 업로드(필요 시)
      if (productData.image) {
        if (productData.image.size > settings.maxFileSize) {
          return { data: null, error: `파일이 너무 큽니다. ${Math.round(settings.maxFileSize / 1024 / 1024)}MB 이하로 선택해주세요.` }
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
        if (up.error) return { data: null, error: `이미지 업로드 실패: ${up.error.message}` }

        const { data: pub } = supabase.storage.from('product-images').getPublicUrl(key)
        if (!pub?.publicUrl) return { data: null, error: '이미지 URL 생성에 실패했습니다.' }
        updateData.image_url = pub.publicUrl
      }

      const { data, error } = await supabase.from('products').update(updateData).eq('id', id).select().single()
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
      const res = await supabase.from('products').update({ is_soldout: isSoldOut }).eq('id', id)
      if (res.error) return { error: `상품 상태 변경 실패: ${res.error.message}` }
      return { error: null }
    } catch (error) {
      let errorMessage = '상품 상태 변경 중 오류가 발생했습니다.'
      if (error instanceof Error) errorMessage = error.message
      return { error: errorMessage }
    }
  },
}
