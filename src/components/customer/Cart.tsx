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
    <div className="space-y-4 sm:space-y-6">
      {/* 장바구니 아이템들 */}
      <div className="space-y-3 sm:space-y-4">
        {/* 일반 상품 */}
        {items.map((item, index) => (
          <div key={`regular-${item.product.id}`} className="dalkomne-card">
            <div className="p-3 sm:p-4">
              {/* 모바일: 세로 레이아웃, 데스크톱: 가로 레이아웃 */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                
                {/* 상품 이미지와 기본 정보 */}
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  {/* 상품 이미지 */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0"
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
                        <span className="text-xl sm:text-2xl">🍎</span>
                      </div>
                    )}
                  </div>

                  {/* 상품 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base mb-1 truncate" 
                        style={{ color: 'var(--gray-900)' }}
                        title={item.product.name}>
                      {item.product.name}
                    </h3>
                    <p className="font-bold text-sm sm:text-base" style={{ color: 'var(--dalkomne-orange)' }}>
                      {item.product.price.toLocaleString()}원
                    </p>
                    {/* 카테고리 배지 */}
                    <div className="mt-1 sm:mt-2">
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
                </div>

                {/* 모바일에서는 하단에, 데스크톱에서는 우측에 배치 */}
                <div className="flex items-center justify-between sm:flex-col sm:items-center sm:space-y-3 sm:min-w-[120px]">
                  {/* 수량 조절 */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors text-sm"
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
                    <span className="w-6 sm:w-8 text-center font-semibold text-sm"
                          style={{ color: 'var(--gray-900)' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors text-sm"
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

                  {/* 소계 및 삭제 버튼 */}
                  <div className="flex items-center space-x-2 sm:flex-col sm:space-x-0 sm:space-y-2 sm:text-center">
                    <div className="text-right sm:text-center">
                      <p className="text-xs" style={{ color: 'var(--gray-600)' }}>소계</p>
                      <p className="text-sm sm:text-base font-bold" style={{ color: 'var(--dalkomne-orange)' }}>
                        {(item.product.price * item.quantity).toLocaleString()}원
                      </p>
                    </div>
                    
                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-xs px-2 py-1 sm:px-3 rounded-full border transition-colors whitespace-nowrap"
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
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* 과일선물 상품 */}
        {giftItems.map((giftItem, index) => (
          <div key={`gift-${giftItem.product.id}-${index}`} className="dalkomne-card">
            <div className="p-3 sm:p-4">
              {/* 모바일: 세로 레이아웃, 데스크톱: 가로 레이아웃 */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                
                {/* 상품 이미지와 기본 정보 */}
                <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                  {/* 상품 이미지 */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0"
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
                        <span className="text-xl sm:text-2xl">🎁</span>
                      </div>
                    )}
                  </div>

                  {/* 상품 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base mb-1 truncate" 
                        style={{ color: 'var(--gray-900)' }}
                        title={giftItem.product.name}>
                      {giftItem.product.name}
                    </h3>
                    <p className="font-bold text-sm sm:text-base mb-1" style={{ color: 'var(--dalkomne-orange)' }}>
                      {giftItem.product.price.toLocaleString()}원
                    </p>
                    
                    {/* 배송 옵션 정보 */}
                    <div className="text-xs mb-2 p-2 rounded break-words" 
                         style={{ 
                           color: 'var(--gray-600)', 
                           background: 'var(--gray-100)' 
                         }}>
                      📦 {getDeliveryOptionText(giftItem.deliveryOption)}
                    </div>
                    
                    {/* 카테고리 배지 */}
                    <div className="mt-1 sm:mt-2">
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
                </div>

                {/* 모바일에서는 하단에, 데스크톱에서는 우측에 배치 */}
                <div className="flex items-center justify-between sm:flex-col sm:items-center sm:space-y-3 sm:min-w-[120px]">
                  {/* 수량 조절 */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateGiftQuantity(giftItem.product.id, giftItem.quantity - 1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors text-sm"
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
                    <span className="w-6 sm:w-8 text-center font-semibold text-sm"
                          style={{ color: 'var(--gray-900)' }}>
                      {giftItem.quantity}
                    </span>
                    <button
                      onClick={() => updateGiftQuantity(giftItem.product.id, giftItem.quantity + 1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors text-sm"
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

                  {/* 소계 및 삭제 버튼 */}
                  <div className="flex items-center space-x-2 sm:flex-col sm:space-x-0 sm:space-y-2 sm:text-center">
                    <div className="text-right sm:text-center">
                      <p className="text-xs" style={{ color: 'var(--gray-600)' }}>소계</p>
                      <p className="text-sm sm:text-base font-bold" style={{ color: 'var(--dalkomne-orange)' }}>
                        {(giftItem.product.price * giftItem.quantity).toLocaleString()}원
                      </p>
                    </div>
                    
                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => removeGiftItem(giftItem.product.id)}
                      className="text-xs px-2 py-1 sm:px-3 rounded-full border transition-colors whitespace-nowrap"
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
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 총합 및 액션 */}
      <div className="dalkomne-card p-4 sm:p-6"
           style={{ background: 'linear-gradient(135deg, var(--dalkomne-cream) 0%, var(--white) 100%)' }}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <div>
            <p className="text-sm sm:text-base" style={{ color: 'var(--gray-600)' }}>총 {getTotalItems()}개 상품</p>
            {giftItems.length > 0 && (
              <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--dalkomne-orange-dark)' }}>
                🎁 선물용 상품 {giftItems.length}개 포함
              </p>
            )}
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm" style={{ color: 'var(--gray-600)' }}>총 결제금액</p>
            <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--dalkomne-orange)' }}>
              {getTotalPrice().toLocaleString()}원
            </p>
          </div>
        </div>

        {/* 주의사항 */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg"
             style={{ background: 'var(--dalkomne-orange-soft)' }}>
          <h4 className="font-semibold mb-2 text-sm sm:text-base" style={{ color: 'var(--dalkomne-orange-dark)' }}>
            📋 주문 안내
          </h4>
          <div className="text-xs sm:text-sm space-y-1" style={{ color: 'var(--gray-700)' }}>
            <p>• 주문전 상품과 수량을 확인후 결제해 주세요</p>
            <p>• 결제는 계좌이체로만 가능하며 결제 완료시 배달접수가 가능합니다.</p>
            <p>• 결제시  받는 통장의 표시를 주문자의 성함과 같게 해야 확인이 가능합니다.</p>
            {giftItems.length > 0 && (
              <p>• 선물용 상품은 선택하신 배송 방법에 따라 배송됩니다</p>
            )}
          </div>
        </div>

        {/* 데스크톱에서만 버튼 표시, 모바일에서는 하단 고정 버튼 사용 */}
        <div className="hidden sm:flex sm:flex-row sm:space-x-3">
          <button 
            onClick={clearCart}
            className="flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all duration-300 text-base"
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
            className="dalkomne-button-primary flex-1 py-3 px-4 font-semibold text-base"
            style={{ opacity: isCheckingStock ? 0.7 : 1 }}
          >
            {isCheckingStock ? '🔄 재고 확인중...' : '🎉 주문하기'}
          </button>
        </div>
        
        {/* 모바일에서만 장바구니 비우기 버튼 표시 */}
        <div className="sm:hidden">
          <button 
            onClick={clearCart}
            className="w-full py-3 px-4 rounded-lg border-2 font-semibold transition-all duration-300 text-sm"
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
        </div>
      </div>
    </div>
  )
}

export default Cart