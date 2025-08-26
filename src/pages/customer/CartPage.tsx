import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card } from '../../components/common'
import { Cart, OrderForm } from '../../components/customer'
import { useCartStore } from '../../stores/cartStore'
import { ROUTES } from '../../utils/constants'

const CartPage: React.FC = () => {
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false)
  const navigate = useNavigate()
  const { items } = useCartStore()

  const handleOrderSuccess = () => {
    setIsOrderFormOpen(false)
    navigate(ROUTES.ORDER_COMPLETE)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link to={ROUTES.HOME}>
              <Button variant="outline" size="sm" className="mr-4">
                ← 뒤로가기
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">🛒 장바구니</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {items.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">장바구니가 비어있습니다</h2>
              <p className="text-gray-600 mb-6">신선한 과일을 담아보세요!</p>
              <Link to={ROUTES.HOME}>
                <Button variant="primary">쇼핑 계속하기</Button>
              </Link>
            </Card>
          ) : (
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
    </div>
  )
}

export default CartPage