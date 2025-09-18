import React, { useState, useEffect } from 'react'
import { Button, Loading, Modal } from '../common'
import { Product } from '../../types/product'
import { getProductsByOrder, updateProductsOrder, reorderProducts, ProductOrderUpdate, debugProductOrders } from '../../services/productOrder'
import { useToast } from '../../hooks/useToast'
import { debugDatabase } from '../../utils/debug/dbTest'

interface ProductOrderManagerProps {
  storeId: number
  onClose: () => void
}

interface OrderInputModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product
  currentOrder: number
  onSave: (newOrder: number) => void
}

const OrderInputModal: React.FC<OrderInputModalProps> = ({ isOpen, onClose, product, currentOrder, onSave }) => {
  const [inputValue, setInputValue] = useState(currentOrder.toString())
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setInputValue(currentOrder.toString())
      setIsValid(true)
    }
  }, [isOpen, currentOrder])

  const handleSave = () => {
    const newOrder = parseInt(inputValue, 10)
    if (isNaN(newOrder) || newOrder < 1) {
      setIsValid(false)
      return
    }
    onSave(newOrder)
    onClose()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    const num = parseInt(value, 10)
    setIsValid(!isNaN(num) && num >= 1)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="dalkomne-card p-6 max-w-md mx-4" style={{ background: 'var(--white)' }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--gray-900)' }}>
          상품 순서 변경
        </h3>
        
        <div className="mb-4">
          <p className="text-sm mb-2" style={{ color: 'var(--gray-600)' }}>
            상품: <span className="font-semibold">{product.name}</span>
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--gray-600)' }}>
            현재 순서: <span className="font-semibold">{currentOrder}</span>
          </p>
          
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>
            새 순서 (1 이상의 숫자)
          </label>
          <input
            type="number"
            min="1"
            value={inputValue}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              isValid ? 'focus:ring-orange-200 focus:border-orange-400' : 'focus:ring-red-200 focus:border-red-400'
            }`}
            style={{
              borderColor: isValid ? 'var(--gray-300)' : 'var(--error)'
            }}
            autoFocus
          />
          {!isValid && (
            <p className="text-sm mt-1" style={{ color: 'var(--error)' }}>
              1 이상의 숫자를 입력해주세요.
            </p>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border-2 font-semibold transition-all duration-300"
            style={{
              borderColor: 'var(--gray-300)',
              color: 'var(--gray-600)',
              background: 'var(--white)'
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="dalkomne-button-primary px-4 py-2 font-semibold"
            style={{ opacity: isValid ? 1 : 0.6 }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

interface ProductOrderManagerProps {
  storeId: number
  onClose: () => void
}

const ProductOrderManager: React.FC<ProductOrderManagerProps> = ({ storeId, onClose }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false) // 타임아웃 경고
  const toast = useToast()

  // 상품 목록 로드
  const loadProducts = async () => {
    try {
      console.log('상품 목록 로드 시작:', { storeId })
      
      // 디버깅 실행
      console.log('🔍 데이터베이스 디버깅 시작...')
      await debugDatabase()
      
      setIsLoading(true)
      
      const data = await getProductsByOrder(storeId)
      console.log('로드된 상품 데이터:', data)
      
      setProducts(data)
    } catch (error) {
      console.error('상품 목록 로드 실패:', error)
      toast.error('로드 실패', '상품 목록을 불러올 수 없습니다. 다시 시도해주세요.')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [storeId])

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML)
    ;(e.currentTarget as HTMLElement).style.opacity = '0.5'
  }

  // 드래그 종료
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedItem(null)
    ;(e.currentTarget as HTMLElement).style.opacity = '1'
  }

  // 드롭 허용
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // 드롭 처리
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedItem === null || draggedItem === dropIndex) return

    const newProducts = [...products]
    const draggedProduct = newProducts[draggedItem]
    
    // 드래그된 아이템 제거
    newProducts.splice(draggedItem, 1)
    
    // 새 위치에 삽입
    newProducts.splice(dropIndex, 0, draggedProduct)
    
    setProducts(newProducts)
    setDraggedItem(null)
  }

  // 순서 저장
  const handleSaveOrder = async () => {
    if (products.length === 0) {
      toast.error('저장 실패', '저장할 상품이 없습니다.')
      return
    }

    try {
      console.log('💾 순서 저장 시작')
      setIsSaving(true)
      setShowTimeoutWarning(false)
      
      // 10초 후 타임아웃 경고 표시
      const timeoutWarning = setTimeout(() => {
        if (isSaving) {
          setShowTimeoutWarning(true)
          console.log('⚠️ 10초 경과 - 타임아웃 경고 표시')
        }
      }, 10000)
      
      // 업데이트 데이터 준비
      const updates: ProductOrderUpdate[] = products.map((product, index) => ({
        id: product.id,
        display_order: index + 1
      }))

      console.log('📄 업데이트 목록:', updates.map(u => ({ id: u.id, order: u.display_order })))
      
      // 디버깅 정보 출력
      console.log('🔍 업데이트 전 상태 확인...')
      await debugProductOrders(storeId)
      
      // 순서 업데이트 실행
      console.log('⏱️ 업데이트 시작 시간:', new Date().toLocaleTimeString())
      await updateProductsOrder(updates)
      console.log('✅ 업데이트 완료 시간:', new Date().toLocaleTimeString())
      
      // 타임아웃 경고 타이머 해제
      clearTimeout(timeoutWarning)
      
      // 성공 알림
      toast.success('순서 저장 완료', `상품 ${products.length}개의 순서가 성공적으로 업데이트되었습니다.`)
      
      // 모달 닫기 (지연 없이)
      onClose()
      
    } catch (error) {
      console.error('💥 순서 저장 실패:', error)
      
      // 사용자에게 친화적인 에러 메시지 표시
      let errorMessage = '순서 저장 중 오류가 발생했습니다.'
      
      if (error instanceof Error) {
        if (error.message.includes('타임아웃')) {
          errorMessage = '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.'
        } else if (error.message.includes('네트워크')) {
          errorMessage = '네트워크 연결을 확인하고 다시 시도해주세요.'
        } else if (error.message.includes('인증')) {
          errorMessage = '로그인이 만료되었습니다. 다시 로그인해주세요.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error('저장 실패', errorMessage)
    } finally {
      setIsSaving(false)
      setShowTimeoutWarning(false)
    }
  }

  // 순서 초기화
  const handleResetOrder = async () => {
    try {
      setIsSaving(true)
      await reorderProducts(storeId)
      await loadProducts()
      toast.success('순서 초기화 완료', '상품 순서가 생성일 기준으로 초기화되었습니다.')
    } catch (error) {
      console.error('순서 초기화 실패:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      toast.error('초기화 실패', `순서 초기화 중 오류가 발생했습니다: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }

  // 직접 순서 변경 모달 열기
  const handleOpenOrderModal = (product: Product) => {
    setSelectedProduct(product)
    setShowOrderModal(true)
  }

  // 직접 순서 변경 처리
  const handleDirectOrderChange = (newOrder: number) => {
    if (!selectedProduct) return

    const currentIndex = products.findIndex(p => p.id === selectedProduct.id)
    if (currentIndex === -1) return

    const newProducts = [...products]
    const targetIndex = Math.min(Math.max(newOrder - 1, 0), products.length - 1)
    
    // 현재 상품을 제거하고 새 위치에 삽입
    const [movedProduct] = newProducts.splice(currentIndex, 1)
    newProducts.splice(targetIndex, 0, movedProduct)
    
    setProducts(newProducts)
    setSelectedProduct(null)
    setShowOrderModal(false)
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="dalkomne-card p-8 max-w-md mx-4" style={{ background: 'var(--white)' }}>
          <div className="text-center">
            <Loading text="상품 목록을 불러오는 중..." />
            <div className="mt-4 space-y-2">
              <button
                onClick={onClose}
                className="block mx-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="dalkomne-card max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ background: 'var(--white)' }}
      >
        {/* 헤더 */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--gray-200)' }}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>
                🔄 상품 순서 관리
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--gray-600)' }}>
                드래그하거나 점 3개 아이콘을 클릭하여 홈 화면에 표시될 상품 순서를 변경하세요
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-2xl p-2 rounded-full hover:bg-gray-100"
              style={{ color: 'var(--gray-600)' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 상품 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 타임아웃 경고 메시지 */}
          {showTimeoutWarning && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <span className="text-yellow-600 text-xl">⏳</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    서버 응답이 지연되고 있습니다
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    대용량 데이터 처리 중이거나 네트워크 상태가 불안정할 수 있습니다. 잠시만 기다려주세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📦</div>
              <p style={{ color: 'var(--gray-600)' }}>등록된 상품이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="flex items-center p-4 rounded-lg border-2 cursor-move transition-all duration-200 hover:shadow-md"
                  style={{
                    borderColor: draggedItem === index ? 'var(--dalkomne-orange)' : 'var(--gray-200)',
                    background: draggedItem === index ? 'var(--dalkomne-cream)' : 'var(--white)'
                  }}
                >
                  {/* 순서 번호 */}
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4"
                    style={{ 
                      background: 'var(--dalkomne-orange)', 
                      color: 'var(--white)' 
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* 상품 이미지 */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden mr-4 flex-shrink-0"
                       style={{ background: 'var(--gray-50)' }}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                           style={{ color: 'var(--gray-400)' }}>
                        <span className="text-2xl">🍎</span>
                      </div>
                    )}
                  </div>

                  {/* 상품 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate" style={{ color: 'var(--gray-900)' }}>
                      {product.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {product.discount_price ? (
                        <>
                          <span className="font-bold" style={{ color: 'var(--dalkomne-orange)' }}>
                            {product.discount_price.toLocaleString()}원
                          </span>
                          <span className="text-sm line-through" style={{ color: 'var(--gray-500)' }}>
                            {product.price.toLocaleString()}원
                          </span>
                        </>
                      ) : (
                        <span className="font-bold" style={{ color: 'var(--dalkomne-orange)' }}>
                          {product.price.toLocaleString()}원
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: product.category === 'gift' ? 'var(--dalkomne-orange-soft)' : 'var(--dalkomne-cream)',
                          color: 'var(--dalkomne-orange-dark)'
                        }}
                      >
                        {product.category === 'gift' ? '🎁 선물용' : '🍎 일반'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--gray-500)' }}>
                        재고: {product.quantity}개
                      </span>
                    </div>
                  </div>

                  {/* 순서 변경 버튼 & 드래그 핸들 */}
                  <div className="ml-4 flex items-center space-x-2">
                    {/* 직접 순서 입력 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenOrderModal(product)
                      }}
                      className="p-2 rounded-lg transition-all duration-200 hover:bg-orange-50 hover:text-orange-600"
                      title="순서 직접 입력"
                      style={{ color: 'var(--gray-500)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="3" cy="8" r="1.5"/>
                        <circle cx="8" cy="8" r="1.5"/>
                        <circle cx="13" cy="8" r="1.5"/>
                      </svg>
                    </button>
                    
                    {/* 드래그 핸들 */}
                    <div className="text-gray-400 cursor-move" title="드래그하여 순서 변경">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <rect x="2" y="3" width="2" height="2" rx="1"/>
                        <rect x="7" y="3" width="2" height="2" rx="1"/>
                        <rect x="12" y="3" width="2" height="2" rx="1"/>
                        <rect x="2" y="7" width="2" height="2" rx="1"/>
                        <rect x="7" y="7" width="2" height="2" rx="1"/>
                        <rect x="12" y="7" width="2" height="2" rx="1"/>
                        <rect x="2" y="11" width="2" height="2" rx="1"/>
                        <rect x="7" y="11" width="2" height="2" rx="1"/>
                        <rect x="12" y="11" width="2" height="2" rx="1"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="p-6 border-t" style={{ borderColor: 'var(--gray-200)' }}>
          <div className="flex justify-between">
            <button
              onClick={handleResetOrder}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg border-2 font-semibold transition-all duration-300"
              style={{
                borderColor: 'var(--gray-300)',
                color: 'var(--gray-600)',
                background: 'var(--white)',
                opacity: isSaving ? 0.6 : 1
              }}
            >
              🔄 순서 초기화
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-6 py-2 rounded-lg border-2 font-semibold transition-all duration-300"
                style={{
                  borderColor: 'var(--gray-300)',
                  color: 'var(--gray-600)',
                  background: 'var(--white)',
                  opacity: isSaving ? 0.6 : 1
                }}
              >
                취소
              </button>
              <button
                onClick={handleSaveOrder}
                disabled={isSaving || products.length === 0}
                className="dalkomne-button-primary px-6 py-2 font-semibold relative overflow-hidden"
                style={{ 
                  opacity: (isSaving || products.length === 0) ? 0.6 : 1,
                  minWidth: '120px'
                }}
              >
                <div className="flex items-center space-x-2">
                  {isSaving ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>순서 저장</span>
                    </>
                  )}
                </div>
                {isSaving && (
                  <div className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-30 animate-pulse"
                       style={{ 
                         width: '100%',
                         animation: 'pulse 1.5s ease-in-out infinite'
                       }}>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 순서 직접 입력 모달 */}
      {selectedProduct && (
        <OrderInputModal
          isOpen={showOrderModal}
          onClose={() => {
            setShowOrderModal(false)
            setSelectedProduct(null)
          }}
          product={selectedProduct}
          currentOrder={products.findIndex(p => p.id === selectedProduct.id) + 1}
          onSave={handleDirectOrderChange}
        />
      )}
    </div>
  )
}

export default ProductOrderManager
