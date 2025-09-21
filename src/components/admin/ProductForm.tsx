import React, { useState, useRef, useEffect } from 'react'
import { Button, Input, Modal, CameraCapture } from '../common'
import { ProductFormData, Product } from '../../types/product'
import { compressImage, validateImageFile, formatFileSize, CompressionResult } from '../../utils/imageUtils'
import { detectInAppBrowser } from '../../utils/browserDetection'
import { getInAppOptimizationSettings } from '../../utils/inAppOptimization'

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
  const [bypassImageProcessing, setBypassImageProcessing] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState<'thumbnail' | 'detail' | null>(null)

  const thumbnailFileInputRef = useRef<HTMLInputElement | null>(null)
  const detailFileInputRef = useRef<HTMLInputElement | null>(null)

  // 모달 초기화
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
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
        resetForm()
      }
    }
  }, [isOpen, initialData])

  // 이미지 파일 처리
  const processImageFile = async (file: File, type: 'thumbnail' | 'detail') => {
    console.log(`🖼️ 이미지 처리 시작 (${type}):`, {
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      fileType: file.type,
      platform: browserInfo.isDesktop ? 'desktop' : 'mobile'
    })

    const validation = validateImageFile(file)
    if (!validation.isValid) {
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

    try {
      // 미리보기 즉시 표시
      const objectURL = URL.createObjectURL(file)
      type === 'thumbnail' ? setThumbnailPreview(objectURL) : setDetailPreview(objectURL)

      let result: CompressionResult
      
      // 🔧 데스크탑에서 작은 파일은 압축 생략
      const fileSizeMB = file.size / (1024 * 1024)
      const shouldSkipCompression = bypassImageProcessing || 
        (browserInfo.isDesktop && fileSizeMB < 2) || 
        fileSizeMB < 0.5
      
      if (shouldSkipCompression) {
        console.log(`📝 압축 생략 (파일이 충분히 작음: ${formatFileSize(file.size)})`) 
        setProgress(100)
        result = { file, originalSize: file.size, compressedSize: file.size, compressionRatio: 0 }
      } else {
        console.log(`🔄 이미지 압축 시작: ${formatFileSize(file.size)}`)
        // 🔧 데스크탑에서 더 관대한 압축 옵션 사용
        const compressionOptions = browserInfo.isDesktop ? {
          maxSizeMB: fileSizeMB > 10 ? 2 : 1,
          maxWidthOrHeight: 1000,
          useWebWorker: false, // 데스크탑에서도 Web Worker 비활성화
          initialQuality: 0.85
        } : {}
        
        result = await compressImage(file, compressionOptions, progress => setProgress(Math.round(progress)))
      }

      setCompressionInfo(prev => ({ ...prev, [type]: result }))
      setFormData(prev => ({ ...prev, [type === 'thumbnail' ? 'image' : 'detail_image']: result.file }))
      console.log(`✅ 이미지 처리 완료 (${type}):`, {
        originalSize: formatFileSize(result.originalSize),
        compressedSize: formatFileSize(result.compressedSize),
        compressionRatio: result.compressionRatio
      })

    } catch (error: any) {
      console.error(`❌ 이미지 처리 실패 (${type}):`, error)
      const key = type === 'thumbnail' ? 'image' : 'detail_image'
      
      // 🔧 더 자세한 에러 메시지
      let errorMessage = '이미지 처리 중 오류가 발생했습니다.'
      
      if (error?.message?.includes('파일이 너무 큽니다')) {
        errorMessage = error.message
      } else if (error?.name === 'InvalidStateError') {
        errorMessage = '파일이 손상되었거나 지원되지 않는 형식입니다.'
      } else if (error?.message?.includes('compression')) {
        errorMessage = '이미지 압축 중 오류가 발생했습니다. 다른 이미지를 시도해보세요.'
      } else if (browserInfo.isDesktop) {
        errorMessage = '데스크탑에서 이미지 처리 중 오류가 발생했습니다. 파일을 다시 선택해보세요.'
      }
      
      setErrors(prev => ({ ...prev, [key]: errorMessage }))
      
      // 미리보기 제거
      type === 'thumbnail' ? setThumbnailPreview(null) : setDetailPreview(null)
    } finally {
      setCompressing(false)
      setProgress(0)
    }
  }

  // 파일 input 이벤트 핸들러
  const handleThumbnailImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await processImageFile(file, 'thumbnail')
  }

  const handleDetailImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await processImageFile(file, 'detail')
  }

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
    setBypassImageProcessing(false)
    setIsCameraOpen(null)
    if (thumbnailFileInputRef.current) thumbnailFileInputRef.current.value = ''
    if (detailFileInputRef.current) detailFileInputRef.current.value = ''
  }

  const handleClose = () => {
    if (isLoading || isSubmitting) return
    resetForm()
    onClose()
  }

  const actuallyLoading = isLoading || isSubmitting
  const isGiftCategory = formData.category === 'gift'

  // 이미지 업로드 컴포넌트
  const ImageUploadSection = ({
    type,
    title,
    preview,
    isCompressing,
    compressionProgress,
    compressionInfo,
    error,
    fileInputRef,
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
    fileInputRef: React.RefObject<HTMLInputElement | null>
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
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onImageChange}
            hidden
          />
          <div className="flex gap-2 mb-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
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
          fileInputRef={thumbnailFileInputRef}
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
            fileInputRef={detailFileInputRef}
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
