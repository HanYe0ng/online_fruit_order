import React, { memo, useCallback } from 'react'
import { Button, Card } from '../common'
import { Product } from '../../types/product'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: number) => void
  onToggleSoldOut: (id: number, isSoldOut: boolean) => void
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onToggleSoldOut
}) => {
  const handleEditClick = useCallback(() => {
    console.log('✏️ 수정 클릭:', product.id)
    onEdit(product)
  }, [product, onEdit])

  const handleDeleteClick = useCallback(() => {
    console.log('🗑️ 삭제 클릭:', product.id)
    onDelete(product.id)
  }, [product.id, onDelete])

  const handleToggleSoldOut = useCallback(() => {
    console.log('🔄 품절 토글:', product.id, !product.is_soldout)
    onToggleSoldOut(product.id, !product.is_soldout)
  }, [product.id, product.is_soldout, onToggleSoldOut])

  return (
    <Card className={`relative transition-opacity duration-200 ${product.is_soldout ? 'opacity-75' : ''}`}>
      {/* 상품 이미지 */}
      <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
        {/* 품절 오버레이 - 이미지 영역에만 적용 */}
        {product.is_soldout && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center z-10">
            <span className="bg-red-500 text-white px-3 py-1 rounded-lg font-medium">
              품절
            </span>
          </div>
        )}
        
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            이미지 없음
          </div>
        )}
      </div>

      {/* 상품 정보 */}
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h3 className={`font-medium truncate flex-1 ${product.is_soldout ? 'text-gray-500' : 'text-gray-900'}`}>
            {product.is_soldout && '🚫 '}{product.name}
          </h3>
          {/* 카테고리 배지 */}
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
            (product.category || 'today') === 'gift' 
              ? 'bg-purple-100 text-purple-700' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {(product.category || 'today') === 'gift' ? '🎁 선물' : '🍎 오늘'}
          </span>
        </div>
        <p className={`text-lg font-bold ${product.is_soldout ? 'text-gray-400 line-through' : 'text-blue-600'}`}>
          {product.price.toLocaleString()}원
          {product.is_soldout && (
            <span className="ml-2 text-sm font-medium text-red-500">🚫 품절</span>
          )}
        </p>
        <p className={`text-sm ${product.is_soldout ? 'text-gray-400' : 'text-gray-600'}`}>
          재고: {product.quantity}개
        </p>
      </div>

      {/* 액션 버튼 */}
      <div className="mt-4 space-y-2">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditClick}
            className={`flex-1 ${product.is_soldout ? 'opacity-75' : ''}`}
          >
            ✏️ 수정
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteClick}
            className={`flex-1 ${product.is_soldout ? 'opacity-75' : ''}`}
          >
            🗑️ 삭제
          </Button>
        </div>
        <Button
          variant={product.is_soldout ? "primary" : "outline"}
          size="sm"
          onClick={handleToggleSoldOut}
          className={`w-full ${product.is_soldout ? 'bg-green-600 hover:bg-green-700 border-green-600 text-white' : 'border-red-300 text-red-700 hover:bg-red-50'}`}
        >
          {product.is_soldout ? '✅ 판매재개' : '⏸️ 품절처리'}
        </Button>
      </div>
    </Card>
  )
}

ProductCard.displayName = 'ProductCard'

// React.memo의 비교 함수를 추가하여 불필요한 리렌더링 방지
const areEqual = (prevProps: ProductCardProps, nextProps: ProductCardProps) => {
  // product 객체의 주요 속성들만 비교
  const prevProduct = prevProps.product
  const nextProduct = nextProps.product
  
  // 기본 속성 비교
  if (
    prevProduct.id !== nextProduct.id ||
    prevProduct.name !== nextProduct.name ||
    prevProduct.price !== nextProduct.price ||
    prevProduct.quantity !== nextProduct.quantity ||
    prevProduct.is_soldout !== nextProduct.is_soldout ||
    prevProduct.category !== nextProduct.category ||
    prevProduct.image_url !== nextProduct.image_url
  ) {
    return false // 다르므로 리렌더링 필요
  }
  
  // 함수 props는 기본적으로 참조 비교 (같은 함수인지 확인)
  if (
    prevProps.onEdit !== nextProps.onEdit ||
    prevProps.onDelete !== nextProps.onDelete ||
    prevProps.onToggleSoldOut !== nextProps.onToggleSoldOut
  ) {
    return false // 다르므로 리렌더링 필요
  }
  
  return true // 모든 것이 같으므로 리렌더링 방지
}

export default memo(ProductCard, areEqual)