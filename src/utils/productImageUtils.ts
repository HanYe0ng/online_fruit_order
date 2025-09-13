// 상품 이미지 표시 유틸리티
import { Product } from '../types/product'

// Base64 이미지 지원을 위한 확장된 Product 타입
interface ExtendedProduct extends Product {
  image_base64?: string;
  image_mime_type?: string;
  image_original_name?: string;
}

// 상품의 이미지 URL을 가져오는 함수 (Storage URL 또는 Base64)
export const getProductImageUrl = (product: Product | ExtendedProduct): string | null => {
  // 1. Storage URL이 있으면 우선 사용
  if (product.image_url) {
    return product.image_url
  }
  
  // 2. Base64 데이터가 있으면 사용
  const extendedProduct = product as ExtendedProduct;
  if (extendedProduct.image_base64) {
    return extendedProduct.image_base64
  }
  
  // 3. 둘 다 없으면 null
  return null
}

// 상품에 이미지가 있는지 확인
export const hasProductImage = (product: Product | ExtendedProduct): boolean => {
  const extendedProduct = product as ExtendedProduct;
  return !!(product.image_url || extendedProduct.image_base64)
}

// 이미지 소스 타입 확인
export const getImageSourceType = (product: Product | ExtendedProduct): 'storage' | 'base64' | 'none' => {
  if (product.image_url) return 'storage'
  const extendedProduct = product as ExtendedProduct;
  if (extendedProduct.image_base64) return 'base64'
  return 'none'
}

// 개발 모드에서 이미지 정보 로그
export const logImageInfo = (product: Product | ExtendedProduct): void => {
  if (process.env.NODE_ENV === 'development') {
    const extendedProduct = product as ExtendedProduct;
    const sourceType = getImageSourceType(product)
    console.log(`상품 ${product.id} 이미지 정보:`, {
      소스타입: sourceType,
      Storage_URL: product.image_url ? '있음' : '없음',
      Base64: extendedProduct.image_base64 ? `있음 (${(extendedProduct.image_base64.length / 1024).toFixed(1)}KB)` : '없음',
      MIME타입: extendedProduct.image_mime_type || '없음',
      원본파일명: extendedProduct.image_original_name || '없음'
    })
  }
}
