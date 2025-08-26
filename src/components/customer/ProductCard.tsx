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
    e.currentTarget.nextElementSibling?.classList.remove('hidden')
  }

  return (
    <Card hover className="h-full flex flex-col">
      {/* 상품 이미지 */}
      <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden flex-shrink-0 relative">
        {product.image_url ? (
          <>
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
            <div className="hidden w-full h-full flex items-center justify-center text-gray-400 text-sm absolute inset-0 bg-gray-100">
              이미지 로드 실패
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            이미지 없음
          </div>
        )}

        {/* 품절 오버레이 */}
        {product.is_soldout && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-lg font-medium text-sm">
              품절
            </span>
          </div>
        )}
      </div>

      {/* 상품 정보 */}
      <div className="flex-grow flex flex-col justify-between">
        <div className="space-y-2 mb-4">
          <h3 className="font-medium text-gray-900 line-clamp-2" title={product.name}>
            {product.name}
          </h3>
          <p className="text-lg font-bold text-blue-600">
            {product.price.toLocaleString()}원
          </p>
          <p className="text-sm text-gray-600">
            재고: {product.quantity}개
          </p>
        </div>

        {/* 주문 버튼 */}
        <div className="mt-auto">
          {product.is_soldout ? (
            <Button variant="secondary" disabled className="w-full">
              품절
            </Button>
          ) : product.quantity === 0 ? (
            <Button variant="secondary" disabled className="w-full">
              재고 없음
            </Button>
          ) : (
            <Button variant="primary" onClick={handleAddToCart} className="w-full">
              장바구니 담기
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default ProductCard