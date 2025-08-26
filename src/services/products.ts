import { supabase } from './supabase'
import { Product, ProductFormData, ProductFilters } from '../types/product'

export const productService = {
  // 상품 목록 조회
  async getProducts(filters?: ProductFilters): Promise<{ data: Product[] | null; error: string | null }> {
    try {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false })

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
      let imageUrl: string | null = null

      // 이미지 업로드
      if (productData.image) {
        const fileExt = productData.image.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, productData.image)

        if (uploadError) {
          return { data: null, error: '이미지 업로드에 실패했습니다.' }
        }

        // 공개 URL 생성
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        imageUrl = publicUrl
      }

      // 상품 데이터 삽입
      const { data, error } = await supabase
        .from('products')
        .insert([{
          store_id: storeId,
          name: productData.name,
          price: productData.price,
          quantity: productData.quantity,
          image_url: imageUrl
        }])
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: '상품 등록 중 오류가 발생했습니다.' }
    }
  },

  // 상품 수정
  async updateProduct(id: number, productData: Partial<ProductFormData>): Promise<{ data: Product | null; error: string | null }> {
    try {
      let updateData: any = {
        name: productData.name,
        price: productData.price,
        quantity: productData.quantity
      }

      // 새 이미지가 있는 경우 업로드
      if (productData.image) {
        const fileExt = productData.image.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, productData.image)

        if (uploadError) {
          return { data: null, error: '이미지 업로드에 실패했습니다.' }
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        updateData.image_url = publicUrl
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

  // 상품 삭제
  async deleteProduct(id: number): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return { error: '상품 삭제 중 오류가 발생했습니다.' }
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
  }
}