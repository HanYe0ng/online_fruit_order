import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../stores/cartStore'
import { ROUTES } from '../../utils/constants'

const OrderBar: React.FC = () => {
  const navigate = useNavigate()
  const { getTotalItems, getTotalPrice } = useCartStore()
  
  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  // 장바구니가 비어있으면 컴포넌트를 렌더링하지 않음
  if (totalItems === 0) {
    return null
  }

  const handleOrderClick = () => {
    navigate(ROUTES.CART)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom">
      {/* 그라데이션 배경 */}
      <div 
        className="px-4 py-4"
        style={{
          background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <button
          onClick={handleOrderClick}
          className="w-full flex items-center justify-between p-4 rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            color: 'var(--dalkomne-orange)'
          }}
        >
          {/* 왼쪽: 장바구니 정보 */}
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center relative"
              style={{ background: 'var(--dalkomne-orange)' }}
            >
              <span className="text-white text-lg">🛒</span>
              {/* 상품 개수 배지 */}
              <span 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ 
                  background: 'var(--dalkomne-peach)', 
                  color: 'var(--white)' 
                }}
              >
                {totalItems}
              </span>
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="font-semibold text-sm text-ellipsis-1">
                {totalItems}개 상품 선택
              </div>
              <div 
                className="text-lg font-bold text-ellipsis-1"
                style={{ color: 'var(--dalkomne-orange)' }}
              >
                {totalPrice.toLocaleString()}원
              </div>
            </div>
          </div>

          {/* 오른쪽: 주문하기 버튼 */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="font-bold text-base sm:text-lg whitespace-nowrap">주문하기</span>
            <span className="text-lg sm:text-xl">→</span>
          </div>
        </button>
      </div>
      
      {/* iOS Safe Area를 위한 추가 패딩 */}
      <div 
        className="h-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      />
    </div>
  )
}

export default OrderBar
