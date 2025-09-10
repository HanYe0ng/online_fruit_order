import React, { useState, useRef, useEffect } from 'react'
import { Button, Input, Modal } from '../common'
import { ProductFormData, Product } from '../../types/product'
import { compressImage, validateImageFile, formatFileSize, CompressionResult } from '../../utils/imageUtils'
import { quickConnectionTest } from '../../utils/quickTest'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Supabase 설정 체크 (개발 중에만)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      quickConnectionTest()
    }
  }, [])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 이미지 검증
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
      // 이미지 압축 (더 강한 옵션)
      const result = await compressImage(
        file,
        {
          maxSizeMB: 0.3,           // 300KB로 더 작게
          maxWidthOrHeight: 500,    // 500px로 더 작게  
          useWebWorker: true
        },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    onSubmit(formData)
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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이미지 업로드 */}
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
                disabled={isCompressing}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
              >
                {isCompressing ? '이미지 처리중...' : '이미지 선택'}
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, WEBP 파일 (20MB 이하)
              </p>
              
              {/* 압축 정보 표시 */}
              {compressionInfo && (
                <div className="mt-2 p-2 bg-green-50 rounded-md">
                  <p className="text-xs text-green-700 font-medium">🎉 이미지 압축 완료</p>
                  <div className="text-xs text-green-600 mt-1">
                    <p>원본: {formatFileSize(compressionInfo.originalSize)}</p>
                    <p>압축후: {formatFileSize(compressionInfo.compressedSize)}</p>
                    <p>압축률: {compressionInfo.compressionRatio}% 절약</p>
                  </div>
                </div>
              )}
              
              {/* 진행률 바 */}
              {isCompressing && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${compressionProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">이미지 압축 중...</p>
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
              className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                formData.category === 'today'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              🍎 오늘의 과일
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, category: 'gift' }))}
              className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                formData.category === 'gift'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
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
          min={0}
          required
        />

        {/* 버튼 */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            취소
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            {initialData ? '수정' : '등록'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ProductForm