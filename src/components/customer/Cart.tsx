import React, { useState } from 'react'
import { Button, Card } from '../common'
import { useCartStore } from '../../stores/cartStore'
import { GiftCartItem, ProductDeliveryOption } from '../../types/product'

interface CartProps {
  onCheckout?: () => void
}

const Cart: React.FC<CartProps> = ({ onCheckout }) => {
  const { items, giftItems, removeItem, removeGiftItem, updateQuantity, updateGiftQuantity, getTotalPrice, getTotalItems, clearCart } = useCartStore()
  const [isCheckingStock, setIsCheckingStock] = useState(false)

  const handleCheckoutClick = async () => {
    setIsCheckingStock(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('재고 확인 완료 - 주문 진행!')
      onCheckout?.()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsCheckingStock(false)
    }
  }

  if (items.length === 0 && giftItems.length === 0) {
    return (
      <div className="dalkomne-card text-center py-8">
        <p style={{ color: 'var(--gray-500)' }}>장바구니가 비어있습니다.</p>
      </div>
    )
  }

  const getDeliveryOptionText = (option: ProductDeliveryOption): string => {
    switch (option.type) {
      case 'pickup':
        return `매장 픽업 - ${option.storeName}`
      case 'delivery':
        return '배달 (구매자에게)'
      case 'shipping':
        return `택배 - ${option.recipientName} (${option.recipientPhone})`
      default:
        return '배송 옵션'
    }
  }

  return (
    <div className="space-y-6">
      {/* 장바구니 아이템들 */}
      <div className="space-y-4">
        {/* 일반 상품 */}
        {items.map((item, index) => (
          <div key={`regular-${item.product.id}`} className="dalkomne-card">
            <div className="flex items-center space-x-4 p-4">
              {/* 상품 이미지 */}
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
                   style={{ background: 'var(--gray-50)' }}>
                {item.product.image_url ? (
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
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
              <div className="flex-grow">
                <h3 className="font-semibold mb-1" style={{ color: 'var(--gray-900)' }}>
                  {item.product.name}
                </h3>
                <p className="font-bold" style={{ color: 'var(--dalkomne-orange)' }}>
                  {item.product.price.toLocaleString()}원
                </p>
                {/* 카테고리 배지 */}
                <div className="mt-2">
                  <span 
                    className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: 'var(--dalkomne-cream)',
                      color: 'var(--dalkomne-orange-dark)'
                    }}
                  >
                    🍎 일반
                  </span>
                </div>
              </div>

              {/* 수량 조절 */}
              <div className="flex flex-col items-center space-y-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{
                      background: 'var(--gray-200)',
                      color: 'var(--gray-600)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--dalkomne-orange)'
                      e.currentTarget.style.color = 'var(--white)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--gray-200)'
                      e.currentTarget.style.color = 'var(--gray-600)'
                    }}
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-semibold"
                        style={{ color: 'var(--gray-900)' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{
                      background: 'var(--dalkomne-orange)',
                      color: 'var(--white)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--dalkomne-orange-dark)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--dalkomne-orange)'
                    }}
                  >
                    +
                  </button>
                </div>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-xs px-3 py-1 rounded-full border transition-colors"
                  style={{
                    borderColor: 'var(--gray-300)',
                    color: 'var(--gray-600)',
                    background: 'var(--white)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--error)'
                    e.currentTarget.style.color = 'var(--error)'
                    e.currentTarget.style.background = 'var(--white)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gray-300)'
                    e.currentTarget.style.color = 'var(--gray-600)'
                    e.currentTarget.style.background = 'var(--white)'
                  }}
                >
                  🗑️ 삭제
                </button>
              </div>

              {/* 소계 */}
              <div className="text-right min-w-[80px]">
                <p className="text-sm" style={{ color: 'var(--gray-600)' }}>소계</p>
                <p className="text-lg font-bold" style={{ color: 'var(--dalkomne-orange)' }}>
                  {(item.product.price * item.quantity).toLocaleString()}원
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {/* 과일선물 상품 */}
        {giftItems.map((giftItem, index) => (
          <div key={`gift-${giftItem.product.id}-${index}`} className="dalkomne-card">
            <div className="flex items-center space-x-4 p-4">
              {/* 상품 이미지 */}
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
                   style={{ background: 'var(--gray-50)' }}>
                {giftItem.product.image_url ? (
                  <img
                    src={giftItem.product.image_url}
                    alt={giftItem.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                       style={{ color: 'var(--gray-400)' }}>
                    <span className="text-2xl">🎁</span>
                  </div>
                )}
              </div>

              {/* 상품 정보 */}
              <div className="flex-grow">
                <h3 className="font-semibold mb-1" style={{ color: 'var(--gray-900)' }}>
                  {giftItem.product.name}
                </h3>
                <p className="font-bold mb-1" style={{ color: 'var(--dalkomne-orange)' }}>
                  {giftItem.product.price.toLocaleString()}원
                </p>
                
                {/* 배송 옵션 정보 */}
                <div className="text-xs mb-2 p-2 rounded" 
                     style={{ 
                       color: 'var(--gray-600)', 
                       background: 'var(--gray-100)' 
                     }}>
                  📦 {getDeliveryOptionText(giftItem.deliveryOption)}
                </div>
                
                {/* 카테고리 배지 */}
                <div className="mt-2">
                  <span 
                    className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: 'var(--dalkomne-orange-soft)',
                      color: 'var(--dalkomne-orange-dark)'
                    }}
                  >
                    🎁 선물용
                  </span>
                </div>
              </div>

              {/* 수량 조절 */}
              <div className="flex flex-col items-center space-y-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateGiftQuantity(giftItem.product.id, giftItem.quantity - 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{
                      background: 'var(--gray-200)',
                      color: 'var(--gray-600)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--dalkomne-orange)'
                      e.currentTarget.style.color = 'var(--white)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--gray-200)'
                      e.currentTarget.style.color = 'var(--gray-600)'
                    }}
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-semibold"
                        style={{ color: 'var(--gray-900)' }}>
                    {giftItem.quantity}
                  </span>
                  <button
                    onClick={() => updateGiftQuantity(giftItem.product.id, giftItem.quantity + 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{
                      background: 'var(--dalkomne-orange)',
                      color: 'var(--white)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--dalkomne-orange-dark)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--dalkomne-orange)'
                    }}
                  >
                    +
                  </button>
                </div>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => removeGiftItem(giftItem.product.id)}
                  className="text-xs px-3 py-1 rounded-full border transition-colors"
                  style={{
                    borderColor: 'var(--gray-300)',
                    color: 'var(--gray-600)',
                    background: 'var(--white)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--error)'
                    e.currentTarget.style.color = 'var(--error)'
                    e.currentTarget.style.background = 'var(--white)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gray-300)'
                    e.currentTarget.style.color = 'var(--gray-600)'
                    e.currentTarget.style.background = 'var(--white)'
                  }}
                >
                  🗑️ 삭제
                </button>
              </div>

              {/* 소계 */}
              <div className="text-right min-w-[80px]">
                <p className="text-sm" style={{ color: 'var(--gray-600)' }}>소계</p>
                <p className="text-lg font-bold" style={{ color: 'var(--dalkomne-orange)' }}>
                  {(giftItem.product.price * giftItem.quantity).toLocaleString()}원
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 총합 및 액션 */}
      <div className="dalkomne-card p-6"
           style={{ background: 'linear-gradient(135deg, var(--dalkomne-cream) 0%, var(--white) 100%)' }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <p style={{ color: 'var(--gray-600)' }}>총 {getTotalItems()}개 상품</p>
            {giftItems.length > 0 && (
              <p className="text-sm mt-1" style={{ color: 'var(--dalkomne-orange-dark)' }}>
                🎁 선물용 상품 {giftItems.length}개 포함
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ color: 'var(--gray-600)' }}>총 결제금액</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--dalkomne-orange)' }}>
              {getTotalPrice().toLocaleString()}원
            </p>
          </div>
        </div>

        {/* 주의사항 */}
        <div className="mb-6 p-4 rounded-lg"
             style={{ background: 'var(--dalkomne-orange-soft)' }}>
          <h4 className="font-semibold mb-2" style={{ color: 'var(--dalkomne-orange-dark)' }}>
            📋 주문 안내
          </h4>
          <div className="text-sm space-y-1" style={{ color: 'var(--gray-700)' }}>
            <p>• 배달 시 현금 또는 계좌이체로 결제</p>
            <p>• 배달 예상 시간: 1-2시간</p>
            <p>• 신선한 과일을 당일 배송해드립니다</p>
            {giftItems.length > 0 && (
              <p>• 선물용 상품은 선택하신 배송 방법에 따라 배송됩니다</p>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={clearCart}
            className="flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all duration-300"
            style={{
              borderColor: 'var(--gray-300)',
              color: 'var(--gray-600)',
              background: 'var(--white)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--error)'
              e.currentTarget.style.color = 'var(--error)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--gray-300)'
              e.currentTarget.style.color = 'var(--gray-600)'
            }}
          >
            🗑️ 장바구니 비우기
          </button>
          <button 
            onClick={handleCheckoutClick}
            disabled={isCheckingStock}
            className="dalkomne-button-primary flex-1 py-3 px-4 font-semibold"
            style={{ opacity: isCheckingStock ? 0.7 : 1 }}
          >
            {isCheckingStock ? '🔄 재고 확인중...' : '🎉 주문하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart
