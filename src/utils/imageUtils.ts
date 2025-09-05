import imageCompression from 'browser-image-compression'

interface ImageCompressionOptions {
  maxSizeMB: number
  maxWidthOrHeight: number
  useWebWorker?: boolean
}

export const compressImage = async (
  file: File,
  options: ImageCompressionOptions = {
    maxSizeMB: 1, // 최대 1MB
    maxWidthOrHeight: 800, // 최대 800px
    useWebWorker: true
  }
): Promise<File> => {
  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (error) {
    console.error('이미지 압축 실패:', error)
    // 압축 실패 시 원본 파일 반환
    return file
  }
}

export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // 파일 크기 체크 (5MB 제한)
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, error: '이미지 파일은 5MB 이하만 업로드 가능합니다.' }
  }

  // 파일 형식 체크
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'JPG, PNG, WEBP 파일만 업로드 가능합니다.' }
  }

  return { isValid: true }
}