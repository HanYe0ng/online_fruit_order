import React from 'react'
import { useNavigate } from 'react-router-dom'
import { GiftProduct } from '../../types/product'

interface GiftProductCardProps {
  product: GiftProduct
}

const GiftProductCard: React.FC<GiftProductCardProps> = ({ product }) => {
  const navigate = useNavigate()

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR')
  }

  const handleClick = () => {
    // 선물상품 상세페이지로 이동
    navigate(`/gift-product/${product.id}`)
  }

  return (
    <div 
      className="dalkomne-card cursor-pointer transition-all duration-300 hover:shadow-lg"
      onClick={handleClick}
    >
      <div className="relative">
        <img 
          src={product.image_url || '/placeholder-fruit.jpg'} 
          alt={product.name}
          className="w-full h-40 sm:h-48 object-cover rounded-t-lg"
        />
        
        {/* 할인 배지 */}
        {product.discount_price && product.discount_price < product.price && (
          <div 
            className="absolute top-2 sm:top-3 left-2 sm:left-3 px-2 py-1 text-xs sm:text-sm font-bold rounded"
            style={{
              backgroundColor: 'var(--dalkomne-orange)',
              color: 'white'
            }}
          >
            {Math.round((1 - product.discount_price / product.price) * 100)}% 할인
          </div>
        )}

        {/* 품절 오버레이 */}
        {product.is_soldout && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-lg">
            <span className="text-white text-base sm:text-lg font-bold">품절</span>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4">
        {/* 태그 */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {product.tags.slice(0, 2).map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs rounded"
                style={{
                  backgroundColor: 'var(--dalkomne-orange-soft)',
                  color: 'var(--dalkomne-orange-dark)'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 상품명 */}
        <h3 className="font-semibold text-sm sm:text-lg mb-2 text-ellipsis-2" style={{ color: 'var(--gray-900)' }}>
          {product.name}
        </h3>

        {/* 평점 */}
        {product.rating && product.reviewCount && (
          <div className="flex items-center mb-2">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-sm ml-1 mr-1">{product.rating}</span>
            <span className="text-xs" style={{ color: 'var(--gray-500)' }}>
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* 가격 */}
        <div className="flex items-end justify-between mb-2">
          <div>
            {product.discount_price && product.discount_price < product.price ? (
              <div>
                <div 
                  className="text-xs sm:text-sm line-through mb-1"
                  style={{ color: 'var(--gray-400)' }}
                >
                  {formatPrice(product.price)}원
                </div>
                <div className="text-base sm:text-lg font-bold" style={{ color: 'var(--dalkomne-orange-dark)' }}>
                  {formatPrice(product.discount_price)}원
                </div>
              </div>
            ) : (
              <div className="text-base sm:text-lg font-bold" style={{ color: 'var(--dalkomne-orange-dark)' }}>
                {formatPrice(product.price)}원
              </div>
            )}
          </div>

          {/* 재고 정보 */}
          <div className="text-xs" style={{ color: 'var(--gray-500)' }}>
            {product.is_soldout ? '품절' : `재고 ${product.quantity}개`}
          </div>
        </div>

        {/* 짧은 설명 */}
        <p 
          className="text-xs sm:text-sm text-ellipsis-2"
          style={{ color: 'var(--gray-600)' }}
        >
          {product.description}
        </p>
      </div>
    </div>
  )
}

export default GiftProductCard
