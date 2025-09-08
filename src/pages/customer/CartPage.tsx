import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card } from '../../components/common'
import { Cart, OrderForm } from '../../components/customer'
import { useCartStore } from '../../stores/cartStore'
import { ROUTES } from '../../utils/constants'

const CartPage: React.FC = () => {
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const navigate = useNavigate()
  const { items } = useCartStore()

  const handleOrderSuccess = () => {
    setIsOrderFormOpen(false)
    navigate(ROUTES.ORDER_COMPLETE)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--gray-50)' }}>
      <header className="sticky top-0 z-40" style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--gray-100)'
      }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={ROUTES.HOME} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              {!logoError ? (
                <img 
                  src="/logo.png" 
                  alt="달콤네 로고" 
                  className="h-10 w-auto object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <div style={{ 
                    background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)',
                    borderRadius: 'var(--radius)',
                    padding: 'var(--spacing-sm)'
                  }}>
                    <span className="text-xl">🍎</span>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold" style={{ color: 'var(--gray-900)' }}>달콤네</h1>
                    <p className="text-xs" style={{ color: 'var(--gray-600)' }}>장바구니</p>
                  </div>
                </div>
              )}
            </Link>

            <Link to={ROUTES.HOME}>
              <button 
                className="flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all duration-300"
                style={{
                  borderColor: 'var(--gray-200)',
                  color: 'var(--gray-700)',
                  background: 'var(--white)'
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
                <span>계속 쇼핑하기</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div 
          className="text-center py-6 mb-8"
          style={{
            background: 'linear-gradient(135deg, var(--dalkomne-orange-soft) 0%, var(--dalkomne-cream) 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--dalkomne-orange-light)'
          }}
        >
          <div className="text-4xl mb-2">🛒</div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--dalkomne-orange-dark)' }}>장바구니</h1>
          <p style={{ color: 'var(--gray-600)' }}>선택하신 신선한 과일들</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {items.length === 0 ? (
            <div className="dalkomne-card text-center py-16">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>장바구니가 비어있습니다</h2>
              <p className="mb-6" style={{ color: 'var(--gray-600)' }}>신선한 과일을 담아보세요!</p>
              <Link to={ROUTES.HOME}>
                <button className="dalkomne-button-primary px-8 py-3">
                  🍎 쇼핑 계속하기
                </button>
              </Link>
            </div>
          ) : (
            <Cart onCheckout={() => setIsOrderFormOpen(true)} />
          )}
        </div>

        <OrderForm
          isOpen={isOrderFormOpen}
          onClose={() => setIsOrderFormOpen(false)}
          onSuccess={handleOrderSuccess}
        />
      </main>
    </div>
  )
}

export default CartPage