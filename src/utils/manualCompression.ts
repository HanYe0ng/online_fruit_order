/**
 * Canvas를 사용한 수동 이미지 압축 (browser-image-compression 대안)
 */
export const compressImageManually = (file: File, quality = 0.6, maxWidth = 600): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    if (!ctx) {
      reject(new Error('Canvas를 지원하지 않는 브라우저입니다.'))
      return
    }
    
    img.onload = () => {
      // 비율 유지하면서 크기 조정
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      const newWidth = img.width * ratio
      const newHeight = img.height * ratio
      
      canvas.width = newWidth
      canvas.height = newHeight
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, newWidth, newHeight)
      
      // Blob으로 변환
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('이미지 압축에 실패했습니다.'))
        }
      }, 'image/jpeg', quality)
      
      // 메모리 정리
      URL.revokeObjectURL(img.src)
    }
    
    img.onerror = () => {
      reject(new Error('이미지 로드에 실패했습니다.'))
    }
    
    img.src = URL.createObjectURL(file)
  })
}
