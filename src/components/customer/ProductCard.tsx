import React from 'react'
import { Button, Card } from '../common'
import { Product } from '../../types/product'
import { useCartStore } from '../../stores/cartStore'
import { useToast } from '../../hooks/useToast'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const addItem = useCartStore(state => state.addItem)
  const toast = useToast()

  const handleAddToCart = () => {
    try {
      addItem(product, 1)
      
      // 성공 토스트
      toast.success('장바구니 추가 완료', `${product.name}이(가) 장바구니에 추가되었습니다.`)
      
      if (onAddToCart) {
        onAddToCart(product)
      }
    } catch (error) {
      toast.error('장바구니 추가 실패', '다시 시도해주세요.')
    }
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = 'none'
    const fallback = e.currentTarget.nextElementSibling as HTMLElement
    if (fallback) {
      fallback.classList.remove('hidden')
    }
  }

  return (
    <div className="dalkomne-product-card h-full flex flex-col">
      {/* 상품 이미지 */}
      <div className="w-full h-40 sm:h-48 bg-gray-50 overflow-hidden flex-shrink-0 relative">
        {product.image_url ? (
          <>
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
            <div className="hidden w-full h-full flex items-center justify-center absolute inset-0"
                 style={{ background: 'var(--gray-50)', color: 'var(--gray-400)' }}>
              <span className="text-3xl sm:text-4xl">🍎</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center" 
               style={{ color: 'var(--gray-400)' }}>
            <span className="text-3xl sm:text-4xl">🍎</span>
          </div>
        )}

        {/* 카테고리 배지 */}
        <div 
          className="absolute top-2 sm:top-3 right-2 sm:right-3 px-2 py-1 rounded-full text-xs font-medium"
          style={{
            background: (product.category || 'today') === 'gift' ? 'var(--dalkomne-orange)' : 'var(--dalkomne-peach)',
            color: 'var(--white)'
          }}
        >
          {(product.category || 'today') === 'gift' ? '🎁' : '🍎'}
        </div>

        {/* 품절 오버레이 */}
        {product.is_soldout && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <span 
              className="px-3 py-1 rounded-lg font-medium text-sm"
              style={{ background: 'var(--error)', color: 'var(--white)' }}
            >
              품절
            </span>
          </div>
        )}
      </div>

      {/* 상품 정보 */}
      <div className="flex-grow flex flex-col justify-between p-3 sm:p-4">
        <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
          {/* 상품명 - 모바일에서 텍스트 오버플로우 방지 */}
          <h3 
            className="font-semibold text-sm sm:text-base leading-tight"
            style={{ 
              color: 'var(--gray-900)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'keep-all',
              lineHeight: '1.3'
            }}
            title={product.name}
          >
            {product.name}
          </h3>
          
          {/* 가격 */}
          <p 
            className="text-base sm:text-lg font-bold"
            style={{ color: 'var(--dalkomne-orange)' }}
          >
            {product.price.toLocaleString()}원
          </p>
          
          {/* 재고 정보 */}
          <p 
            className="text-xs sm:text-sm"
            style={{ color: 'var(--gray-600)' }}
          >
            재고: {product.quantity}개
          </p>
        </div>

        {/* 주문 버튼 */}
        <div className="mt-auto">
          {product.is_soldout ? (
            <button 
              disabled 
              className="w-full py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm"
              style={{ 
                background: 'var(--gray-200)', 
                color: 'var(--gray-500)'
              }}
            >
              품절
            </button>
          ) : product.quantity === 0 ? (
            <button 
              disabled 
              className="w-full py-2 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm"
              style={{ 
                background: 'var(--gray-200)', 
                color: 'var(--gray-500)'
              }}
            >
              재고 없음
            </button>
          ) : (
            <button 
              onClick={handleAddToCart} 
              className="dalkomne-button-primary w-full py-2 sm:py-3 text-xs sm:text-sm font-semibold"
            >
              🛒 장바구니 담기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard