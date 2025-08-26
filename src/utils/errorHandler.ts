import { useToast } from '../hooks/useToast'

export const handleApiError = (error: any, customMessage?: string) => {
  console.error('API Error:', error)
  
  let title = '오류가 발생했습니다'
  let message = customMessage || '잠시 후 다시 시도해주세요.'

  if (error?.message) {
    if (error.message.includes('Network')) {
      title = '네트워크 오류'
      message = '인터넷 연결을 확인해주세요.'
    } else if (error.message.includes('timeout')) {
      title = '요청 시간 초과'
      message = '서버 응답이 지연되고 있습니다.'
    } else if (error.message.includes('404')) {
      title = '데이터를 찾을 수 없습니다'
      message = '요청한 정보가 존재하지 않습니다.'
    } else if (error.message.includes('403')) {
      title = '권한이 없습니다'
      message = '이 작업을 수행할 권한이 없습니다.'
    }
  }

  return { title, message }
}

export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  customErrorMessage?: string
) => {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      const { title, message } = handleApiError(error, customErrorMessage)
      
      // 여기서 토스트를 직접 호출할 수 없으므로 에러를 다시 throw
      throw new Error(`${title}: ${message}`)
    }
  }
}