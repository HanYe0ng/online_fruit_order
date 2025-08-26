import React from 'react'
import { Button, Card } from '../common'
import { useCartStore } from '../../stores/cartStore'

interface CartProps {
  onCheckout?: () => void
}

const Cart: React.FC<CartProps> = ({ onCheckout }) => {
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCartStore()

  if (items.length === 0) {
    return (
      <Card className="text-center py-8">
        <p className="text-gray-500">장바구니가 비어있습니다.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 장바구니 항목들 */}
      {items.map((item) => (
        <Card key={item.product.id} className="flex items-center space-x-4">
          {/* 상품 이미지 */}
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {item.product.image_url ? (
              <img
                src={item.product.image_url}
                alt={item.product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                이미지 없음
              </div>
            )}
          </div>

          {/* 상품 정보 */}
          <div className="flex-grow">
            <h3 className="font-medium text-gray-900">{item.product.name}</h3>
            <p className="text-blue-600 font-semibold">
              {item.product.price.toLocaleString()}원
            </p>
          </div>

          {/* 수량 조절 */}
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
            >
              -
            </Button>
            <span className="w-8 text-center">{item.quantity}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
            >
              +
            </Button>
          </div>

          {/* 소계 */}
          <div className="w-20 text-right">
            <p className="font-semibold text-gray-900">
              {(item.product.price * item.quantity).toLocaleString()}원
            </p>
          </div>

          {/* 삭제 버튼 */}
          <Button
            size="sm"
            variant="danger"
            onClick={() => removeItem(item.product.id)}
          >
            삭제
          </Button>
        </Card>
      ))}

      {/* 총합 및 액션 */}
      <Card className="bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg">
            <p className="text-gray-600">총 {getTotalItems()}개 상품</p>
          </div>
          <div className="text-xl font-bold text-blue-600">
            총 {getTotalPrice().toLocaleString()}원
          </div>
        </div>

        <div className="flex space-x-3">
          <Button variant="secondary" onClick={clearCart} className="flex-1">
            장바구니 비우기
          </Button>
          <Button variant="primary" onClick={onCheckout} className="flex-1">
            주문하기
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default Cart