import { supabase } from './supabase'
import { Product, ProductFormData, ProductFilters } from '../types/product'

export const productService = {
  // 상품 목록 조회
  async getProducts(filters?: ProductFilters): Promise<{ data: Product[] | null; error: string | null }> {
    try {
      // created_at 미보유 테이블 안전 위해 id 기준 정렬
      let query = supabase.from('products').select('*').order('id', { ascending: false })

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      if (filters?.is_soldout !== undefined) {
        query = query.eq('is_soldout', filters.is_soldout)
      }

      if (filters?.store_id) {
        query = query.eq('store_id', filters.store_id)
      }

      const { data, error } = await query

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: '상품 목록을 가져오는 중 오류가 발생했습니다.' }
    }
  },

  // 상품 생성
  async createProduct(productData: ProductFormData, storeId: number): Promise<{ data: Product | null; error: string | null }> {
    try {
      if (!storeId) {
        return { data: null, error: '점포가 선택되지 않았습니다. 다시 로그인하거나 점포를 선택해 주세요.' }
      }

      const price = Number(productData.price)
      const quantity = Number(productData.quantity)
      if (!Number.isFinite(price) || !Number.isFinite(quantity)) {
        return { data: null, error: '가격/수량이 올바르지 않습니다.' }
      }

      let imageUrl: string | null = null

      // 이미지 업로드
      if (productData.image) {
        const fileExt = productData.image.name.split('.').pop() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, productData.image, {
            contentType: productData.image.type,
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          return { data: null, error: `이미지 업로드 실패: ${uploadError.message}` }
        }

        const { data: pub } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        imageUrl = pub.publicUrl
      }

      const insertData = {
        store_id: storeId,
        name: productData.name?.trim(),
        price,
        quantity,
        image_url: imageUrl,
      }

      const { data, error } = await supabase
        .from('products')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      console.error('상품 생성 전체 오류:', error)
      return { data: null, error: '상품 등록 중 오류가 발생했습니다.' }
    }
  },

  // 상품 수정
  async updateProduct(id: number, productData: Partial<ProductFormData>): Promise<{ data: Product | null; error: string | null }> {
    try {
      // 안전한 업데이트 데이터 구성 (undefined 필드 제외)
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

      // 새 이미지 업로드
      if (productData.image) {
        const fileExt = productData.image.name.split('.').pop() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, productData.image, {
            contentType: productData.image.type,
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          return { data: null, error: `이미지 업로드 실패: ${uploadError.message}` }
        }

        const { data: pub } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        updateData.image_url = pub.publicUrl
      }

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: '상품 수정 중 오류가 발생했습니다.' }
    }
  },

  // 상품 삭제 (참조 정리 시도)
  async deleteProduct(id: number): Promise<{ error: string | null }> {
    try {
      // 참조 여부 확인
      const { data: relatedOrders, error: checkError } = await supabase
        .from('order_items')
        .select('id, order_id')
        .eq('product_id', id)

      if (checkError) {
        return { error: `관련 데이터 확인 실패: ${checkError.message}` }
      }

      if (relatedOrders && relatedOrders.length > 0) {
        const { error: orderItemsError } = await supabase
          .from('order_items')
          .delete()
          .eq('product_id', id)

        if (orderItemsError) {
          return { error: `관련 주문 항목 삭제 실패: ${orderItemsError.message}` }
        }
      }

      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (productError) {
        if ((productError as any).code === '23503') {
          return { error: '아직 이 상품을 참조하는 주문이 있습니다. Supabase 대시보드에서 수동으로 삭제해주세요.' }
        }
        return { error: `상품 삭제 실패: ${productError.message}` }
      }

      return { error: null }
    } catch (error) {
      return { error: '상품 삭제 중 오류가 발생했습니다. 수동으로 삭제해주세요.' }
    }
  },

  // 품절 상태 토글
  async toggleSoldOut(id: number, isSoldOut: boolean): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_soldout: isSoldOut })
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return { error: '상품 상태 변경 중 오류가 발생했습니다.' }
    }
  },
}
