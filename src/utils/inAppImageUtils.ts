// 인앱브라우저용 이미지 처리 유틸리티
import { detectInAppBrowser } from './browserDetection'

// 이미지를 Base64로 변환
export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Base64 변환 실패'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'))
    }
    
    reader.readAsDataURL(file)
  })
}

// 파일 크기를 줄이기 위한 간단한 리사이징
export const resizeImageForInApp = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // 비율 계산
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      
      // 캔버스에 그리기
      ctx?.drawImage(img, 0, 0, width, height)
      
      // Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(resizedFile)
          } else {
            reject(new Error('리사이징 실패'))
          }
        },
        file.type,
        quality
      )
    }
    
    img.onerror = () => {
      reject(new Error('이미지 로드 실패'))
    }
    
    img.src = URL.createObjectURL(file)
  })
}

// 인앱브라우저에서 Storage 업로드를 우회할지 결정
export const shouldBypassStorageUpload = (): boolean => {
  const browserInfo = detectInAppBrowser()
  
  // 개발 모드에서는 환경변수로 제어
  if (process.env.NODE_ENV === 'development') {
    return process.env.REACT_APP_BYPASS_STORAGE === 'true'
  }
  
  // 카카오톡은 항상 우회
  if (browserInfo.browser === 'kakao') {
    console.log('🟡 카카오톡 인앱브라우저: Storage 업로드 우회')
    return true
  }
  
  // 다른 인앱브라우저도 우회 (필요시 개별 설정 가능)
  if (browserInfo.isInApp) {
    console.log('🟡 인앱브라우저: Storage 업로드 우회')
    return true
  }
  
  return false
}

// 이미지 데이터를 DB에 저장할 수 있는 형태로 준비
export const prepareImageForDatabase = async (file: File): Promise<{
  base64: string
  mimeType: string
  originalName: string
  size: number
}> => {
  console.log('📸 이미지 DB 저장 준비 시작:', {
    name: file.name,
    size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
    type: file.type
  })
  
  try {
    // 5MB 이상이면 리사이징
    let processedFile = file
    if (file.size > 5 * 1024 * 1024) {
      console.log('📏 파일 크기가 5MB를 초과하여 리사이징 수행')
      processedFile = await resizeImageForInApp(file, 800, 0.7)
      console.log('✅ 리사이징 완료:', (processedFile.size / 1024 / 1024).toFixed(2) + 'MB')
    }
    
    // Base64 변환
    const base64 = await convertImageToBase64(processedFile)
    
    return {
      base64,
      mimeType: processedFile.type,
      originalName: file.name,
      size: processedFile.size
    }
  } catch (error) {
    console.error('💥 이미지 DB 저장 준비 실패:', error)
    throw error
  }
}
