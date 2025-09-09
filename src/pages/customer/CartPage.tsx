import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card } from '../../components/common'
import { Cart, OrderForm } from '../../components/customer'
import { useCartStore } from '../../stores/cartStore'
import { ROUTES } from '../../utils/constants'
import { updatePageTitle, updatePageDescription, PAGE_TITLES, PAGE_DESCRIPTIONS } from '../../utils/pageTitle'

const CartPage: React.FC = () => {
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const navigate = useNavigate()
  const { items, giftItems } = useCartStore()

  const handleOrderSuccess = () => {
    setIsOrderFormOpen(false)
    navigate(ROUTES.ORDER_COMPLETE)
  }

  // 페이지 제목 설정
  useEffect(() => {
    updatePageTitle(PAGE_TITLES.CART)
    updatePageDescription(PAGE_DESCRIPTIONS.CART)
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--gray-50)' }}>
      {/* 모바일 최적화된 헤더 */}
      <header className="sticky top-0 z-40" style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--gray-100)'
      }}>
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* 로고 및 브랜드 */}
            <Link to={ROUTES.HOME} className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
              {!logoError ? (
                <img 
                  src="/logo.png" 
                  alt="달콤네 로고" 
                  className="h-8 sm:h-10 w-auto object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <div style={{ 
                    background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)',
                    borderRadius: 'var(--radius)',
                    padding: 'var(--spacing-xs) var(--spacing-sm)'
                  }}>
                    <span className="text-lg sm:text-xl">🍎</span>
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg font-bold" style={{ color: 'var(--gray-900)' }}>달콤네</h1>
                    <p className="text-xs hidden sm:block" style={{ color: 'var(--gray-600)' }}>장바구니</p>
                  </div>
                </div>
              )}
            </Link>

            {/* 뒤로가기 버튼 */}
            <Link to={ROUTES.HOME}>
              <button 
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg border-2 transition-all duration-300"
                style={{
                  borderColor: 'var(--gray-200)',
                  color: 'var(--gray-700)',
                  background: 'var(--white)',
                  minHeight: '44px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--dalkomne-orange)'
                  e.currentTarget.style.color = 'var(--dalkomne-orange)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--gray-200)'
                  e.currentTarget.style.color = 'var(--gray-700)'
                }}
              >
                <span>←</span>
                <span className="text-sm sm:text-base">계속 쇼핑하기</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* 페이지 타이틀 섹션 */}
        <div 
          className="text-center py-4 sm:py-6 mb-4 sm:mb-8"
          style={{
            background: 'linear-gradient(135deg, var(--dalkomne-orange-soft) 0%, var(--dalkomne-cream) 100%)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--dalkomne-orange-light)'
          }}
        >
          <div className="text-3xl sm:text-4xl mb-2">🛒</div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: 'var(--dalkomne-orange-dark)' }}>
            장바구니
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'var(--gray-600)' }}>
            선택하신 신선한 과일들
          </p>
        </div>

        {/* 장바구니 내용 */}
        <div className="max-w-4xl mx-auto">
          {items.length === 0 && giftItems.length === 0 ? (
            /* 빈 장바구니 상태 */
            <div className="dalkomne-card text-center py-12 sm:py-16">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🛒</div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>
                장바구니가 비어있습니다
              </h2>
              <p className="text-sm sm:text-base mb-4 sm:mb-6" style={{ color: 'var(--gray-600)' }}>
                신선한 과일을 담아보세요!
              </p>
              <Link to={ROUTES.HOME}>
                <button className="dalkomne-button-primary px-6 sm:px-8 py-3 text-sm sm:text-base">
                  🍎 쇼핑 계속하기
                </button>
              </Link>
            </div>
          ) : (
            /* 장바구니 아이템들 */
            <Cart onCheckout={() => setIsOrderFormOpen(true)} />
          )}
        </div>

        {/* 주문 폼 모달 */}
        <OrderForm
          isOpen={isOrderFormOpen}
          onClose={() => setIsOrderFormOpen(false)}
          onSuccess={handleOrderSuccess}
        />
      </main>

      {/* 모바일에서 하단 고정 버튼 (장바구니에 상품이 있을 때만) */}
      {(items.length > 0 || giftItems.length > 0) && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 p-4"
             style={{ 
               background: 'linear-gradient(180deg, transparent 0%, var(--white) 20%)',
               borderTop: '1px solid var(--gray-200)'
             }}>
          <button 
            onClick={() => setIsOrderFormOpen(true)}
            className="dalkomne-button-primary w-full py-4 text-base font-bold rounded-xl"
            style={{
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            🎉 주문하기
          </button>
        </div>
      )}

      {/* 모바일에서 하단 여백 (고정 버튼이 있을 때) */}
      {(items.length > 0 || giftItems.length > 0) && (
        <div className="sm:hidden h-20"></div>
      )}
    </div>
  )
}

export default CartPage