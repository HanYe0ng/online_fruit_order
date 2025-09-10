import imageCompression from 'browser-image-compression'

interface ImageCompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  onProgress?: (progress: number) => void
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

export const compressImage = async (
  file: File,
  options: ImageCompressionOptions = {},
  onProgress?: (progress: number) => void
): Promise<CompressionResult> => {
  const {
    maxSizeMB = 0.3, // 기본 300KB로 낮춤
    maxWidthOrHeight = 500, // 기본 500px로 낮춤
    useWebWorker = true
  } = options

  try {
    onProgress?.(10) // 시작
    
    // browser-image-compression 옵션
    const compressionOptions = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker,
      onProgress: (progress: number) => {
        // browser-image-compression의 진행률을 10-90% 범위로 매핑
        onProgress?.(10 + (progress * 80))
      }
    }
    
    let compressedFile = await imageCompression(file, compressionOptions)
    
    // 만약 압축이 충분하지 않으면 더 강한 옵션 사용
    if (compressedFile.size > maxSizeMB * 1024 * 1024) {
      console.log('초기 압축 부족, 더 강한 압축 시도...')
      
      compressedFile = await imageCompression(file, {
        maxSizeMB: maxSizeMB * 0.7, // 70%로 더 작게
        maxWidthOrHeight: maxWidthOrHeight * 0.8, // 80%로 더 작게
        useWebWorker,
        onProgress: (progress: number) => {
          onProgress?.(10 + (progress * 80))
        }
      })
    }
    
    onProgress?.(100) // 완료
    
    const compressionRatio = Math.round((1 - compressedFile.size / file.size) * 100)
    
    console.log(`이미지 압축 완료:`, {
      original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      compressed: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
      ratio: `${compressionRatio}% 압축`
    })
    
    return {
      file: compressedFile,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio
    }
  } catch (error) {
    console.error('이미지 압축 실패:', error)
    onProgress?.(100)
    
    // 압축 실패 시 원본 파일 반환
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0
    }
  }
}

export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // 파일 크기 체크 (20MB 제한)
  if (file.size > 20 * 1024 * 1024) {
    return { isValid: false, error: '이미지 파일은 20MB 이하만 업로드 가능합니다.' }
  }

  // 파일 형식 체크
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'JPG, PNG, WEBP 파일만 업로드 가능합니다.' }
  }

  return { isValid: true }
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}