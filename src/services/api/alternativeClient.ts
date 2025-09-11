// 인앱브라우저용 대안 클라이언트 (서버 API 방식)
import { ProductFormData, Product } from '../../types/product'
import { detectInAppBrowser } from '../../utils/browserDetection'

// 서버 API 엔드포인트 (실제 서버가 구축되면 사용)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://your-server.com/api'

export const alternativeApiClient = {
  // 인앱브라우저에서 서버 API를 통한 상품 생성
  async createProductViaAPI(productData: ProductFormData, storeId: number): Promise<{ data: Product | null; error: string | null }> {
    const browserInfo = detectInAppBrowser()
    
    console.log('🔄 서버 API를 통한 상품 생성:', {
      browser: browserInfo.browser,
      useAlternativeAPI: true
    })

    try {
      // FormData 생성 (이미지 포함)
      const formData = new FormData()
      formData.append('store_id', storeId.toString())
      formData.append('name', productData.name)
      formData.append('price', productData.price.toString())
      formData.append('quantity', productData.quantity.toString())
      formData.append('category', productData.category || 'today')
      
      if (productData.image) {
        formData.append('image', productData.image)
      }

      // 서버 API 호출
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        body: formData,
        headers: {
          // Content-Type은 자동으로 설정됨 (multipart/form-data)
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        // 인앱브라우저용 추가 설정
        ...(browserInfo.isInApp && {
          mode: 'cors',
          credentials: 'include',
          cache: 'no-cache'
        })
      })

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.error) {
        return { data: null, error: result.error }
      }

      return { data: result.data, error: null }

    } catch (error) {
      console.error('서버 API 호출 실패:', error)
      
      let errorMessage = '서버 API를 통한 상품 등록에 실패했습니다.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      return { data: null, error: errorMessage }
    }
  },

  // 서버 API를 통한 DB 연결 테스트
  async testServerConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        return { 
          success: true, 
          message: `서버 연결 성공: ${data.message || 'OK'}` 
        }
      } else {
        return { 
          success: false, 
          message: `서버 응답 오류: ${response.status}` 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        message: `서버 연결 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
      }
    }
  }
}

// 인증 토큰 가져오기 (Supabase 세션 기반)
async function getAuthToken(): Promise<string> {
  // 실제 구현 시 Supabase 세션에서 JWT 토큰을 가져와야 함
  // 현재는 더미 토큰 반환
  return 'dummy-token'
}

// 인앱브라우저에서 사용할지 결정하는 함수
export const shouldUseAlternativeAPI = (): boolean => {
  const browserInfo = detectInAppBrowser()
  
  // 개발 환경에서는 강제로 직접 연결 사용
  if (process.env.NODE_ENV === 'development') {
    return false
  }
  
  // 카카오톡에서 계속 실패하면 서버 API 사용
  if (browserInfo.browser === 'kakao') {
    // 메모리 기반 실패 카운트 확인
    const currentFailureCount = getFailureCount()
    return currentFailureCount >= 3
  }
  
  return false
}

// 실패 카운트 관리 (메모리 기반)
let failureCount = 0

export const incrementFailureCount = (): void => {
  failureCount++
  console.log('📊 Supabase 실패 카운트 증가:', failureCount)
}

export const resetFailureCount = (): void => {
  failureCount = 0
  console.log('🔄 Supabase 실패 카운트 리셋')
}

export const getFailureCount = (): number => {
  return failureCount
}
