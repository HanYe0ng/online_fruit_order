import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button, Input, Modal, CameraCapture } from '../common'
import { ProductFormData, Product } from '../../types/product'
import { compressImage, validateImageFile, formatFileSize, CompressionResult } from '../../utils/imageUtils'
import { detectInAppBrowser } from '../../utils/browserDetection'

interface ProductFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProductFormData) => void
  isLoading?: boolean
  initialData?: Product | null
  title?: string
}

const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialData = null,
  title = '상품 등록'
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    discount_price: null,
    quantity: '',
    category: 'today',
    image: null,
    detail_image: null
  })

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [detailPreview, setDetailPreview] = useState<string | null>(null)
  const [isCompressingThumbnail, setIsCompressingThumbnail] = useState(false)
  const [isCompressingDetail, setIsCompressingDetail] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState({ thumbnail: 0, detail: 0 })
  const [compressionInfo, setCompressionInfo] = useState<{ thumbnail: CompressionResult | null; detail: CompressionResult | null }>({
    thumbnail: null,
    detail: null
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [browserInfo] = useState(() => {
    const info = detectInAppBrowser()
    const isDesktop = !(/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()))
    return { ...info, isDesktop }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState<'thumbnail' | 'detail' | null>(null)

  const thumbnailFileInputRef = useRef<HTMLInputElement>(null)
  const detailFileInputRef = useRef<HTMLInputElement>(null)

  // 모달 초기화 (개선된 로직)
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        console.log('✏️ 기존 데이터로 초기화')
        setFormData({
          name: initialData.name,
          price: String(initialData.price ?? ''),
          discount_price: initialData.discount_price ? String(initialData.discount_price) : null,
          quantity: String(initialData.quantity ?? ''),
          category: (initialData.category as 'today' | 'gift') || 'today',
          image: null,
          detail_image: null
        })
        setThumbnailPreview(initialData.image_url || null)
        setDetailPreview(initialData.detail_image_url || null)
      } else {
        // 새 상품 등록 시 기본 상태로 설정 (resetForm 대신)
        console.log('🆕 새 상품 등록 모드 초기화')
        setFormData({
          name: '',
          price: '',
          discount_price: null,
          quantity: '',
          category: 'today',
          image: null,
          detail_image: null
        })
        setThumbnailPreview(null)
        setDetailPreview(null)
        setCompressionInfo({ thumbnail: null, detail: null })
        setCompressionProgress({ thumbnail: 0, detail: 0 })
        setErrors({})
        setIsSubmitting(false)
        setIsCameraOpen(null)
      }
    }
  }, [isOpen, initialData])

  // 미리보기 URL 정리 (수정된 로직)
  useEffect(() => {
    // 컴포넌트 언마운트 시에만 정리
    return () => {
      console.log('🧽 컴포넌트 언마운트 - 모든 blob URL 정리')
      if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
        console.log('🧽 썸네일 blob URL 정리:', thumbnailPreview)
        URL.revokeObjectURL(thumbnailPreview)
      }
      if (detailPreview && detailPreview.startsWith('blob:')) {
        console.log('🧽 상세 이미지 blob URL 정리:', detailPreview)
        URL.revokeObjectURL(detailPreview)
      }
    }
  }, [])

  // 이미지 파일 처리 (안정성 강화)
  const processImageFile = useCallback(async (file: File, type: 'thumbnail' | 'detail') => {
    console.log(`🖼️ 이미지 처리 시작 (${type}):`, file.name)
    
    // 유효성 검사
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      console.log(`❌ 이미지 유효성 검사 실패 (${type}):`, validation.error)
      setErrors(prev => ({ ...prev, [type === 'thumbnail' ? 'image' : 'detail_image']: validation.error || '' }))
      return
    }

    // 에러 초기화
    const errorKey = type === 'thumbnail' ? 'image' : 'detail_image'
    setErrors(prev => ({ ...prev, [errorKey]: '' }))

    const setCompressing = type === 'thumbnail' ? setIsCompressingThumbnail : setIsCompressingDetail
    const setProgress = (val: number) => {
      setCompressionProgress(prev => ({ ...prev, [type]: val }))
    }

    setCompressing(true)
    setProgress(0)
    
    console.log(`🔄 이미지 처리 상태 설정 완료 (${type})`)

    try {
      // 미리보기 즉시 표시 (기존 URL 정리)
      const currentPreview = type === 'thumbnail' ? thumbnailPreview : detailPreview
      if (currentPreview && currentPreview.startsWith('blob:')) {
        console.log(`🧽 기존 미리보기 URL 정리 (${type})`)
        URL.revokeObjectURL(currentPreview)
      }
      
      const objectURL = URL.createObjectURL(file)
      console.log(`📁 새 미리보기 URL 생성 (${type}):`, objectURL)
      
      if (type === 'thumbnail') {
        setThumbnailPreview(objectURL)
      } else {
        setDetailPreview(objectURL)
      }

      let result: CompressionResult

      const fileSizeMB = file.size / (1024 * 1024)
      const isDetail = type === 'detail'
      const detailSkipThreshold = browserInfo.isDesktop ? 3 : 2.5
      const thumbnailSkipThreshold = browserInfo.isDesktop ? 2 : 1
      const shouldSkipCompression =
        fileSizeMB < 0.45 ||
        (isDetail ? fileSizeMB <= detailSkipThreshold : fileSizeMB <= thumbnailSkipThreshold)

      if (shouldSkipCompression) {
        console.log(`⏩ 압축 생략 (${type}): 파일 크기 ${fileSizeMB.toFixed(2)}MB`)
        setProgress(100)
        result = { file, originalSize: file.size, compressedSize: file.size, compressionRatio: 0 }
      } else {
        console.log(`📊 이미지 압축 시작 (${type}): ${fileSizeMB.toFixed(2)}MB`)
        
        const compressionOptions = (() => {
          if (isDetail) {
            const maxSizeTarget = Math.min(Math.max(fileSizeMB * 0.8, 1.2), browserInfo.isDesktop ? 3.5 : 3)
            return {
              maxSizeMB: maxSizeTarget,
              maxWidthOrHeight: browserInfo.isDesktop ? 1900 : 1600,
              useWebWorker: false, // 안정성을 위해 false로 고정
              initialQuality: 0.9
            }
          }

          if (browserInfo.isDesktop) {
            return {
              maxSizeMB: fileSizeMB > 8 ? 1.8 : 1.1,
              maxWidthOrHeight: 1200,
              useWebWorker: false,
              initialQuality: 0.86
            }
          }

          return {
            maxSizeMB: 0.9,
            maxWidthOrHeight: 1100,
            useWebWorker: false, // 인앱 브라우저에서는 항상 false
            initialQuality: 0.87
          }
        })()

        console.log(`🔧 압축 옵션 (${type}):`, compressionOptions)
        result = await compressImage(file, compressionOptions, progress => {
          const roundedProgress = Math.round(progress)
          setProgress(roundedProgress)
          console.log(`🔄 압축 진행 (${type}): ${roundedProgress}%`)
        })
        console.log(`✅ 압축 완료 (${type}):`, {
          원본: (result.originalSize / 1024 / 1024).toFixed(2) + 'MB',
          압축: (result.compressedSize / 1024 / 1024).toFixed(2) + 'MB',
          절약: result.compressionRatio + '%'
        })
      }

      setCompressionInfo(prev => ({ ...prev, [type]: result }))
      setFormData(prev => ({ ...prev, [isDetail ? 'detail_image' : 'image']: result.file }))
      
      console.log(`✅ 이미지 처리 완료 (${type})`)

    } catch (error: any) {
      console.error(`❌ 이미지 처리 실패 (${type}):`, error)
      const key = type === 'thumbnail' ? 'image' : 'detail_image'
      
      let errorMessage = '이미지 처리 중 오류가 발생했습니다.'
      
      if (error?.message?.includes('파일이 너무 큽니다')) {
        errorMessage = error.message
      } else if (error?.name === 'InvalidStateError') {
        errorMessage = '파일이 손상되었거나 지원되지 않는 형식입니다.'
      } else if (error?.message?.includes('compression')) {
        errorMessage = '이미지 압축 중 오류가 발생했습니다. 다른 이미지를 시도해보세요.'
      }
      
      setErrors(prev => ({ ...prev, [key]: errorMessage }))
      
      // 미리보기 제거
      if (type === 'thumbnail') {
        setThumbnailPreview(null)
      } else {
        setDetailPreview(null)
      }
    } finally {
      console.log(`🏁 이미지 처리 종료 (${type})`)
      setCompressing(false)
      setProgress(0)
    }
  }, [browserInfo, thumbnailPreview, detailPreview])

  // 파일 input 이벤트 핸들러 (안정성 강화)
  const handleThumbnailImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 썸네일 파일 선택 이벤트 발생')
    console.log('📁 target.files:', e.target.files)
    console.log('📁 files length:', e.target.files?.length)
    
    const file = e.target.files?.[0]
    if (file) {
      console.log('📁 썸네일 파일 정보:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      })
      
      // 다른 이미지 처리 중이라면 대기
      if (isCompressingDetail) {
        console.log('⚠️ 상세 이미지 처리 중이라 썸네일 처리 대기')
        return
      }
      
      await processImageFile(file, 'thumbnail')
    } else {
      console.log('⚠️ 선택된 파일이 없습니다')
    }
  }, [isCompressingDetail])

  const handleDetailImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 상세 이미지 파일 선택 이벤트 발생')
    console.log('📁 target.files:', e.target.files)
    console.log('📁 files length:', e.target.files?.length)
    
    const file = e.target.files?.[0]
    if (file) {
      console.log('📁 상세 이미지 파일 정보:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      })
      
      // 다른 이미지 처리 중이라면 대기
      if (isCompressingThumbnail) {
        console.log('⚠️ 썸네일 처리 중이라 상세 이미지 처리 대기')
        return
      }
      
      await processImageFile(file, 'detail')
    } else {
      console.log('⚠️ 선택된 파일이 없습니다')
    }
  }, [isCompressingThumbnail])

  // 카메라 캡처
  const handleCameraCapture = async (file: File) => {
    if (isCameraOpen) await processImageFile(file, isCameraOpen)
    setIsCameraOpen(null)
  }

  const handleCameraError = (error: string) => {
    setErrors(prev => ({ ...prev, image: error }))
    setIsCameraOpen(null)
  }

  // 폼 검증
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}
    const priceValue = parseInt(formData.price || '0', 10)
    const discountPriceValue = formData.discount_price ? parseInt(formData.discount_price, 10) : null
    const quantityValue = parseInt(formData.quantity || '0', 10)

    if (!formData.name.trim()) newErrors.name = '상품명을 입력해주세요.'
    if (priceValue <= 0) newErrors.price = '가격은 0보다 커야 합니다.'
    if (discountPriceValue !== null && discountPriceValue >= priceValue) {
      newErrors.discount_price = '할인가는 원래 가격보다 낮아야 합니다.'
    }
    if (quantityValue < 0) newErrors.quantity = '수량은 0 이상이어야 합니다.'

    if (formData.category === 'gift') {
      if (!formData.image) newErrors.image = '썸네일 이미지는 필수입니다.'
      if (!formData.detail_image) newErrors.detail_image = '상세페이지 이미지는 필수입니다.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || isSubmitting || isLoading) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      if (!initialData) resetForm()
    } catch (error) {
      console.error('폼 제출 오류:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    console.log('🧽 resetForm 실행 - 모달 종료 시에만 호췜')
    setFormData({
      name: '',
      price: '',
      discount_price: null,
      quantity: '',
      category: 'today',
      image: null,
      detail_image: null
    })
    
    // 기존 미리보기 URL 정리
    if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnailPreview)
    }
    if (detailPreview && detailPreview.startsWith('blob:')) {
      URL.revokeObjectURL(detailPreview)
    }
    
    setThumbnailPreview(null)
    setDetailPreview(null)
    setCompressionInfo({ thumbnail: null, detail: null })
    setCompressionProgress({ thumbnail: 0, detail: 0 })
    setErrors({})
    setIsSubmitting(false)
    setIsCameraOpen(null)
    
    // input value 초기화
    if (thumbnailFileInputRef.current) {
      console.log('🧽 썸네일 input value 초기화')
      thumbnailFileInputRef.current.value = ''
    }
    if (detailFileInputRef.current) {
      console.log('🧽 상세 이미지 input value 초기화')
      detailFileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    console.log('🚪 모달 닫기 시도')
    if (isLoading || isSubmitting) {
      console.log('⚠️ 로딩 중이라 모달 닫기 차단')
      return
    }
    console.log('🚪 모달 닫기 실행 - resetForm 호출')
    resetForm()
    onClose()
  }

  const actuallyLoading = isLoading || isSubmitting
  const isGiftCategory = formData.category === 'gift'

  // 파일 선택 핸들러 (더 안정적인 방법)
  const handleFileSelect = useCallback((type: 'thumbnail' | 'detail') => {
    const fileInputRef = type === 'thumbnail' ? thumbnailFileInputRef : detailFileInputRef
    const isOtherCompressing = type === 'thumbnail' ? isCompressingDetail : isCompressingThumbnail
    const isCurrentCompressing = type === 'thumbnail' ? isCompressingThumbnail : isCompressingDetail
    
    if (!fileInputRef.current) {
      console.log(`⚠️ ${type} input ref가 없습니다`)
      return
    }
    
    if (isOtherCompressing || isCurrentCompressing) {
      console.log(`⚠️ 이미지 처리 중이라 ${type} 파일 선택 대기 (다른: ${isOtherCompressing}, 현재: ${isCurrentCompressing})`)
      return
    }
    
    console.log(`🖱️ ${type} 파일 선택 버튼 클릭`)
    console.log(`📄 ${type} input ref:`, fileInputRef.current)
    
    // 직접적인 방법: 새로운 input 엘리먼트 생성
    const newInput = document.createElement('input')
    newInput.type = 'file'
    newInput.accept = 'image/jpeg,image/jpg,image/png,image/webp'
    newInput.style.display = 'none'
    
    console.log(`🆕 ${type} 새로운 input 엘리먼트 생성`)
    
    newInput.onchange = (e) => {
      const target = e.target as HTMLInputElement
      console.log(`✅ ${type} 새 input onChange 이벤트 발생!`)
      console.log(`✅ ${type} 선택된 파일:`, target.files)
      
      if (target.files && target.files.length > 0) {
        const file = target.files[0]
        console.log(`✅ ${type} 파일 처리 시작:`, file.name)
        
        if (type === 'thumbnail') {
          handleThumbnailImageChange({ target: { files: target.files } } as any)
        } else {
          handleDetailImageChange({ target: { files: target.files } } as any)
        }
      }
      
      // 사용 후 제거
      document.body.removeChild(newInput)
      console.log(`🗑️ ${type} 임시 input 엘리먼트 제거`)
    }
    
    document.body.appendChild(newInput)
    newInput.click()
    console.log(`🖱️ ${type} 새 input 클릭 완료`)
  }, [isCompressingThumbnail, isCompressingDetail, handleThumbnailImageChange, handleDetailImageChange])

  // 이미지 업로드 컴포넌트
  const ImageUploadSection = ({
    type,
    title,
    preview,
    isCompressing,
    compressionProgress,
    compressionInfo,
    error,
    onImageChange,
    onCameraClick
  }: {
    type: 'thumbnail' | 'detail'
    title: string
    preview: string | null
    isCompressing: boolean
    compressionProgress: number
    compressionInfo: CompressionResult | null
    error?: string
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onCameraClick: () => void
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{title}</label>
      <div className="flex items-center space-x-4">
        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          {isCompressing ? (
            <div className="flex flex-col items-center space-y-1">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-gray-500">{compressionProgress}%</span>
            </div>
          ) : preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-xs">이미지 없음</span>
          )}
        </div>
        <div className="flex-1">
          {/* 숨겨진 input */}
          <input
            ref={type === 'thumbnail' ? thumbnailFileInputRef : detailFileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => {
              console.log(`📎 ${title} input onChange 이벤트 트리거!`)
              console.log(`📎 ${title} 파일 리스트:`, e.target.files)
              console.log(`📎 ${title} 이벤트 대상:`, e.target)
              console.log(`📎 ${title} 이벤트 타입:`, e.type)
              
              // 이벤트가 예상대로 발생했으니 직접 핸들러 호출
              try {
                onImageChange(e)
              } catch (error) {
                console.error(`❌ ${title} onChange 핸들러 오류:`, error)
              }
            }}
            onClick={() => {
              console.log(`📎 ${title} input onClick 이벤트`)
            }}
            style={{ display: 'none' }}
          />
          <div className="flex gap-2 mb-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleFileSelect(type)}
              disabled={isCompressing || actuallyLoading}
              className="flex-1"
            >
              {isCompressing ? '이미지 처리중...' : actuallyLoading ? '업로드 중...' : '파일 선택'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCameraClick}
              disabled={isCompressing || actuallyLoading}
              className="flex-1 bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
            >
              📷 카메라 촬영
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG, WEBP 파일 (최대 {browserInfo.isDesktop ? '25MB' : browserInfo.browser === 'kakao' ? '10MB' : '20MB'})
            {browserInfo.isDesktop && <span className="text-green-600"> • 데스크탑 모드</span>}
          </p>
          {compressionInfo && (
            <div className="mt-2 p-2 bg-green-50 rounded-md text-xs text-green-700">
              ✅ 이미지 처리 완료
              <div className="text-green-600">
                <p>원본: {formatFileSize(compressionInfo.originalSize)}</p>
                <p>최적화: {formatFileSize(compressionInfo.compressedSize)}</p>
                {compressionInfo.compressionRatio > 0 && (
                  <p>절약: {compressionInfo.compressionRatio}%</p>
                )}
              </div>
            </div>
          )}
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, category: 'today' }))}
              disabled={actuallyLoading}
              className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium ${
                formData.category === 'today'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              🍎 오늘의 과일
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, category: 'gift' }))}
              disabled={actuallyLoading}
              className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium ${
                formData.category === 'gift'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              🎁 과일선물
            </button>
          </div>
        </div>

        {/* 썸네일 이미지 업로드 */}
        <ImageUploadSection
          type="thumbnail"
          title={isGiftCategory ? "썸네일 이미지 (홈 화면 표시용)" : "상품 이미지"}
          preview={thumbnailPreview}
          isCompressing={isCompressingThumbnail}
          compressionProgress={compressionProgress.thumbnail}
          compressionInfo={compressionInfo.thumbnail}
          error={errors.image}
          onImageChange={handleThumbnailImageChange}
          onCameraClick={() => setIsCameraOpen('thumbnail')}
        />

        {/* 상세페이지 이미지 업로드 (gift 전용) */}
        {isGiftCategory && (
          <ImageUploadSection
            type="detail"
            title="상세페이지 이미지 (모바일 크기 세로형)"
            preview={detailPreview}
            isCompressing={isCompressingDetail}
            compressionProgress={compressionProgress.detail}
            compressionInfo={compressionInfo.detail}
            error={errors.detail_image}
            onImageChange={handleDetailImageChange}
            onCameraClick={() => setIsCameraOpen('detail')}
          />
        )}

        {/* 상품명 */}
        <Input
          label="상품명"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="상품명을 입력하세요"
          error={errors.name}
          disabled={actuallyLoading}
          required
        />

        {/* 가격 */}
        <Input
          label="가격 (원)"
          type="number"
          value={formData.price}
          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
          placeholder="가격을 입력하세요"
          error={errors.price}
          disabled={actuallyLoading}
          min={1}
          required
        />

        {/* 할인가 */}
        <Input
          label="할인가 (원) - 선택사항"
          type="number"
          value={formData.discount_price || ''}
          onChange={(e) => {
            const value = e.target.value
            setFormData(prev => ({ ...prev, discount_price: value || null }))
          }}
          placeholder="할인가를 입력하세요 (선택사항)"
          error={errors.discount_price}
          disabled={actuallyLoading}
          min={1}
        />

        {/* 수량 */}
        <Input
          label="재고 수량"
          type="number"
          value={formData.quantity}
          onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
          placeholder="재고 수량을 입력하세요"
          error={errors.quantity}
          disabled={actuallyLoading}
          min={0}
          required
        />

        {/* 안내 메시지 */}
        {isGiftCategory && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-800">
            <p className="font-medium mb-1">과일선물 상품 등록 안내</p>
            <ul className="text-xs space-y-1 text-purple-700">
              <li>• <strong>썸네일 이미지:</strong> 홈 화면 상품 목록 이미지</li>
              <li>• <strong>상세페이지 이미지:</strong> 상품 클릭 시 표시되는 세로형 이미지</li>
              <li>• 두 이미지 모두 업로드해야 등록이 완료됩니다</li>
            </ul>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={actuallyLoading}>
            취소
          </Button>
          <Button type="submit" variant="primary" loading={actuallyLoading} disabled={actuallyLoading}>
            {initialData ? '수정' : '등록'}
          </Button>
        </div>
      </form>

      {/* 카메라 모달 */}
      <CameraCapture
        isOpen={isCameraOpen !== null}
        onClose={() => setIsCameraOpen(null)}
        onCapture={handleCameraCapture}
        onError={handleCameraError}
      />
    </Modal>
  )
}

export default ProductForm