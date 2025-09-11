import React, { useState, useRef, useEffect } from 'react'
import { Button, Input, Modal, CameraCapture } from '../common'
import { ProductFormData, Product } from '../../types/product'
import { compressImage, validateImageFile, formatFileSize, CompressionResult } from '../../utils/imageUtils'
import { detectInAppBrowser } from '../../utils/browserDetection'
import { getInAppOptimizationSettings } from '../../utils/inAppOptimization'
import { quickConnectionTest } from '../../utils/quickTest'
import { supabase } from '../../services/supabase'
import { alternativeApiClient } from '../../services/api/alternativeClient'
import { prepareImageForDatabase } from '../../utils/inAppImageUtils'

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
    name: initialData?.name || '',
    price: initialData?.price || 0,
    quantity: initialData?.quantity || 0,
    category: initialData?.category || 'today',
    image: null
  })
  const [preview, setPreview] = useState<string | null>(initialData?.image_url || null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState(0)
  const [compressionInfo, setCompressionInfo] = useState<CompressionResult | null>(null)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [browserInfo, setBrowserInfo] = useState(detectInAppBrowser())
  const [uploadTip, setUploadTip] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bypassImageProcessing, setBypassImageProcessing] = useState(false) // 새로 추가
  const [isCameraOpen, setIsCameraOpen] = useState(false) // 카메라 모달 상태
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setBrowserInfo(detectInAppBrowser())
    const settings = getInAppOptimizationSettings()
    
    if (process.env.NODE_ENV === 'development') {
      quickConnectionTest()
    }
  }, [browserInfo.browser, browserInfo.needsSpecialHandling, browserInfo.isInApp])

  // 카메라 촬영 완료 핸들러
  const handleCameraCapture = async (file: File) => {
    console.log('카메라에서 촬영된 파일:', {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      type: file.type
    });

    await processImageFile(file)
  }

  // 카메라 오류 핸들러
  const handleCameraError = (error: string) => {
    console.error('카메라 오류:', error)
    setErrors(prev => ({ ...prev, image: error }))
  }

  // 이미지 파일 처리 공통 함수
  const processImageFile = async (file: File) => {
    const settings = getInAppOptimizationSettings()

    console.log('파일 처리 시작:', {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      type: file.type,
      browser: browserInfo.browser,
      maxAllowed: (settings.maxFileSize / 1024 / 1024).toFixed(2) + 'MB'
    });

    const validation = validateImageFile(file)
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, image: validation.error || '' }))
      return
    }

    setErrors(prev => ({ ...prev, image: '' }))
    setIsCompressing(true)
    setCompressionProgress(0)
    setCompressionInfo(null)

    try {
      // 🚨 우회 모드가 활성화된 경우 압축 건너뛰기
      if (bypassImageProcessing) {
        console.log('🟬 이미지 처리 우회 모드: 압축 건너뛰기')
        setCompressionProgress(100)
        
        const result: CompressionResult = {
          file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0
        }
        
        setCompressionInfo(result)
        setFormData(prev => ({ ...prev, image: file })) // 원본 파일 사용
        
        // 미리보기 생성
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            setPreview(e.target.result as string)
          }
        }
        reader.readAsDataURL(file)
        
        console.log('🟢 우회 모드 이미지 처리 완료')
        return
      }
      
      const result = await compressImage(
        file,
        {}, // 기본 전략 사용
        (progress) => {
          setCompressionProgress(Math.round(progress))
        }
      )
      
      setCompressionInfo(result)
      setFormData(prev => ({ ...prev, image: result.file }))
      
      // 미리보기 생성
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreview(e.target.result as string)
        }
      }
      reader.readAsDataURL(result.file)
      
      console.log('이미지 처리 완료');
      
    } catch (error) {
      console.error('이미지 처리 오류:', error)
      
      let errorMessage = '이미지 처리 중 오류가 발생했습니다.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setErrors(prev => ({ ...prev, image: errorMessage }))
    } finally {
      setIsCompressing(false)
      setCompressionProgress(0)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await processImageFile(file)
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = '상품명을 입력해주세요.'
    }

    if (formData.price <= 0) {
      newErrors.price = '가격은 0보다 커야 합니다.'
    }

    if (formData.quantity < 0) {
      newErrors.quantity = '수량은 0 이상이어야 합니다.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    if (isSubmitting || isLoading) {
      return // 중복 제출 방지
    }
    
    setIsSubmitting(true)
    
    console.log('폼 제출 시작:', {
      ...formData,
      imageSize: formData.image ? (formData.image.size / 1024 / 1024).toFixed(2) + 'MB' : 'none',
      browser: browserInfo.browser
    });
    
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 🧪 테스트용: 이미지 없이 저장
  const handleSubmitWithoutImage = async () => {
    console.log('🧪 ===== 이미지 없이 저장 테스트 시작 =====')
    console.log('현재 폼 데이터:', formData)
    console.log('브라우저 정보:', browserInfo)
    
    if (!validateForm()) {
      console.log('🚨 폼 유효성 검사 실패')
      return
    }
    
    if (isSubmitting || isLoading) {
      console.log('🚨 이미 제출 중이거나 로딩 중입니다.')
      return // 중복 제출 방지
    }
    
    setIsSubmitting(true)
    console.log('🟢 제출 상태를 true로 설정했습니다.')
    
    const testFormData = {
      ...formData,
      image: null // 강제로 이미지를 null로 설정
    }
    
    console.log('🧪 테스트 데이터 준비 완료:', {
      name: testFormData.name,
      price: testFormData.price,
      quantity: testFormData.quantity,
      category: testFormData.category,
      image: testFormData.image,
      browser: browserInfo.browser,
      testMode: true,
      timestamp: new Date().toISOString()
    });
    
    try {
      console.log('🚀 onSubmit 함수 호출 시작...')
      const startTime = Date.now()
      
      await onSubmit(testFormData)
      
      const endTime = Date.now()
      console.log('✅ onSubmit 완료! 소요시간:', endTime - startTime, 'ms')
      
    } catch (error) {
      console.error('💥 onSubmit 에러 발생:', error)
      console.error('에러 상세 정보:', {
        message: error instanceof Error ? error.message : '알 수 없는 에러',
        stack: error instanceof Error ? error.stack : '스택 없음'
      })
    } finally {
      console.log('🔄 제출 상태를 false로 리셋합니다.')
      setIsSubmitting(false)
    }
    
    console.log('🧪 ===== 이미지 없이 저장 테스트 종료 =====')
  }

  // 🔍 DB 연결 테스트만 수행
  const handleDbConnectionTest = async () => {
    console.log('🔍 ===== DB 연결 테스트 시작 =====')
    
    try {
      // 간단한 SELECT 쿼리로 DB 연결 테스트
      console.log('📡 Supabase DB 연결 테스트 중...')
      const startTime = Date.now()
      
      const { data, error } = await supabase
        .from('products')
        .select('count')
        .limit(1)
      
      const endTime = Date.now()
      
      if (error) {
        console.error('❌ DB 연결 실패:', error)
        alert(`DB 연결 실패: ${error.message}`)
      } else {
        console.log('✅ DB 연결 성공! 소요시간:', endTime - startTime, 'ms')
        alert(`DB 연결 성공! 응답시간: ${endTime - startTime}ms`)
      }
      
    } catch (error) {
      console.error('💥 DB 연결 테스트 중 예외:', error)
      alert(`DB 연결 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
    
    console.log('🔍 ===== DB 연결 테스트 종료 =====')
  }

  // 🌐 서버 API 연결 테스트
  const handleServerApiTest = async () => {
    console.log('🌐 ===== 서버 API 연결 테스트 시작 =====')
    
    try {
      const result = await alternativeApiClient.testServerConnection()
      
      if (result.success) {
        console.log('✅ 서버 API 연결 성공:', result.message)
        alert(`서버 API 연결 성공!\n${result.message}`)
      } else {
        console.error('❌ 서버 API 연결 실패:', result.message)
        alert(`서버 API 연결 실패\n${result.message}`)
      }
      
    } catch (error) {
      console.error('💥 서버 API 테스트 중 예외:', error)
      alert(`서버 API 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
    
    console.log('🌐 ===== 서버 API 연결 테스트 종료 =====')
  }

  // 🟬 Storage 우회 모드 테스트
  const handleStorageBypassTest = async () => {
    console.log('🟬 ===== Storage 우회 모드 테스트 시작 =====')
    
    if (!validateForm()) {
      console.log('🚨 폼 유효성 검사 실패')
      return
    }
    
    if (!formData.image) {
      alert('이미지를 먼저 선택해주세요.')
      return
    }
    
    if (isSubmitting || isLoading) {
      console.log('🚨 이미 제출 중이거나 로딩 중입니다.')
      return
    }
    
    setIsSubmitting(true)
    console.log('🟢 Storage 우회 모드 테스트 시작')
    
    try {
      // Base64 변환 테스트
      console.log('📸 Base64 변환 테스트 시작...')
      const startTime = Date.now()
      
      const imageBase64Data = await prepareImageForDatabase(formData.image)
      
      const endTime = Date.now()
      console.log('✅ Base64 변환 성공!', {
        소요시간: endTime - startTime + 'ms',
        원본크기: (formData.image.size / 1024 / 1024).toFixed(2) + 'MB',
        변환후크기: (imageBase64Data.size / 1024 / 1024).toFixed(2) + 'MB',
        MIME타입: imageBase64Data.mimeType,
        원본파일명: imageBase64Data.originalName
      })
      
      alert(`Storage 우회 모드 테스트 성공!\n` +
            `소요시간: ${endTime - startTime}ms\n` +
            `원본: ${(formData.image.size / 1024 / 1024).toFixed(2)}MB\n` +
            `변환후: ${(imageBase64Data.size / 1024 / 1024).toFixed(2)}MB`)
      
    } catch (error) {
      console.error('💥 Storage 우회 모드 테스트 실패:', error)
      alert(`Storage 우회 모드 테스트 실패:\n${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsSubmitting(false)
    }
    
    console.log('🟬 ===== Storage 우회 모드 테스트 종료 =====')
  }

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      quantity: 0,
      category: 'today',
      image: null
    })
    setPreview(null)
    setCompressionInfo(null)
    setCompressionProgress(0)
    setErrors({})
    setIsSubmitting(false)
    setBypassImageProcessing(false) // 우회 모드도 리셋
    setIsCameraOpen(false) // 카메라 모달도 리셋
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    if (isLoading || isSubmitting) {
      return // 로딩 중에는 닫기 방지
    }
    resetForm()
    onClose()
  }

  const actuallyLoading = isLoading || isSubmitting

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      {/* 브라우저 정보 (개발 모드에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
          브라우저: {browserInfo.browser} | 인앱: {browserInfo.isInApp ? 'Y' : 'N'} | 
          특별처리: {browserInfo.needsSpecialHandling ? 'Y' : 'N'} | 
          제출중: {isSubmitting ? 'Y' : 'N'}
        </div>
      )}

      {/* 업로드 팁 */}
      {uploadTip && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">{uploadTip}</p>
        </div>
      )}

      {/* 로딩 중 오버레이 */}
      {actuallyLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">
              {isSubmitting ? '상품 저장 중...' : '처리 중...'}
            </p>
            {browserInfo.browser === 'kakao' && (
              <p className="text-xs text-gray-500 mt-1">카카오톡에서는 시간이 조금 더 걸릴 수 있어요</p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이미지 업로드 섹션 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            상품 이미지
          </label>
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={isCompressing || actuallyLoading}
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
                  onClick={() => setIsCameraOpen(true)}
                  disabled={isCompressing || actuallyLoading}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  카메라 촬영
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, WEBP 파일 (최대 {browserInfo.browser === 'kakao' ? '10MB' : '20MB'})
              </p>
              
              {/* 압축 정보 표시 */}
              {compressionInfo && (
                <div className="mt-2 p-2 bg-green-50 rounded-md">
                  <p className="text-xs text-green-700 font-medium">✅ 이미지 처리 완료</p>
                  <div className="text-xs text-green-600 mt-1">
                    <p>원본: {formatFileSize(compressionInfo.originalSize)}</p>
                    <p>최적화: {formatFileSize(compressionInfo.compressedSize)}</p>
                    {compressionInfo.compressionRatio > 0 && (
                      <p>용량 절약: {compressionInfo.compressionRatio}%</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* 진행률 바 */}
              {isCompressing && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${compressionProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    이미지 최적화 중... {compressionProgress}%
                  </p>
                </div>
              )}
              
              {errors.image && (
                <p className="text-xs text-red-500 mt-1">{errors.image}</p>
              )}
            </div>
          </div>
        </div>

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

        {/* 카테고리 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            카테고리
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, category: 'today' }))}
              disabled={actuallyLoading}
              className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                formData.category === 'today'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : actuallyLoading
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              🍎 오늘의 과일
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, category: 'gift' }))}
              disabled={actuallyLoading}
              className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                formData.category === 'gift'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : actuallyLoading
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              🎁 과일선물
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formData.category === 'today' 
              ? '일반 과일 또는 간식용 상품' 
              : '선물용 과일 또는 기프트 세트'
            }
          </p>
        </div>

        {/* 가격 */}
        <Input
          label="가격 (원)"
          type="number"
          value={formData.price}
          onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
          placeholder="0"
          error={errors.price}
          disabled={actuallyLoading}
          min={1}
          required
        />

        {/* 수량 */}
        <Input
          label="재고 수량"
          type="number"
          value={formData.quantity}
          onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
          placeholder="0"
          error={errors.quantity}
          disabled={actuallyLoading}
          min={0}
          required
        />

        {/* 🧪 테스트 영역 (개발 모드에서만 표시) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">🧪 디버깅 테스트</h4>
            <p className="text-xs text-yellow-700 mb-3">
              이미지 업로드 vs DB 저장 중 어느 부분에서 무한로딩이 발생하는지 테스트해보세요.<br/>
              📝 브라우저 개발자 도구 콘솔을 열고 테스트하면 상세 로그를 볼 수 있습니다.
            </p>
            <div className="flex gap-2 mb-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleDbConnectionTest}
                disabled={actuallyLoading}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
                size="sm"
              >
                🔍 DB 연결 테스트
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={handleServerApiTest}
                disabled={actuallyLoading}
                className="text-green-700 border-green-300 hover:bg-green-100"
                size="sm"
              >
                🌐 서버 API 테스트
              </Button>
            </div>
            <div className="flex gap-2 mb-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleStorageBypassTest}
                disabled={actuallyLoading || !formData.image}
                className="text-purple-700 border-purple-300 hover:bg-purple-100"
                size="sm"
              >
                🟬 Storage 우회 테스트
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={handleSubmitWithoutImage}
                disabled={actuallyLoading}
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                size="sm"
              >
                🚀 이미지 없이 저장 테스트
              </Button>
            </div>
            
            {/* 인앱브라우저 전용 우회 모드 */}
            {browserInfo.isInApp && (
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-medium text-orange-800">🟬 인앱브라우저 우회 모드</h5>
                    <p className="text-xs text-orange-700 mt-1">
                      이미지 압축 처리를 건너뛰고 원본 파일 그대로 업로드
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bypassImageProcessing}
                      onChange={(e) => setBypassImageProcessing(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                      bypassImageProcessing ? 'bg-orange-600' : 'bg-gray-200'
                    }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        bypassImageProcessing ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                  </label>
                </div>
                {bypassImageProcessing && (
                  <p className="text-xs text-orange-600 mt-2">
                    ⚠️ 우회 모드 활성화됨: 이미지 압축 없이 원본 파일 사용
                  </p>
                )}
              </div>
            )}
            <div className="text-xs text-yellow-600">
              <p><strong>1단계:</strong> DB 연결 테스트 → Supabase 직연 상태 확인</p>
              <p><strong>2단계:</strong> 서버 API 테스트 → 대안 서버 연결 확인</p>
              <p><strong>3단계:</strong> Storage 우회 테스트 → Base64 변환 테스트 (이미지 선택 후)</p>
              <p><strong>4단계:</strong> 이미지 없이 저장 → 전체 플로우 확인</p>
              <p>• <strong>3단계 성공</strong> → 이제 Storage 우회 모드로 상품 등록 가능!</p>
              <p>• <strong>3단계 실패</strong> → 브라우저 JavaScript 자체 문제</p>
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleClose}
            disabled={actuallyLoading}
          >
            취소
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            loading={actuallyLoading}
            disabled={actuallyLoading}
          >
            {actuallyLoading ? (browserInfo.browser === 'kakao' ? '카카오톡 최적화 처리중...' : '처리중...') : (initialData ? '수정' : '등록')}
          </Button>
        </div>
      </form>

      {/* 카메라 촬영 모달 */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        onError={handleCameraError}
      />
    </Modal>
  )
}

export default ProductForm