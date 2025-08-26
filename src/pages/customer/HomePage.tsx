import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Loading } from '../../components/common'
import { ProductCard } from '../../components/customer'
import { useProducts } from '../../hooks/useProducts'
import { useCartStore } from '../../stores/cartStore'
import { ROUTES } from '../../utils/constants'

const HomePage: React.FC = () => {
  const [selectedStoreId, setSelectedStoreId] = useState<number>(1) // 기본값
  const { data: productsResponse, isLoading } = useProducts({ store_id: selectedStoreId })
  const { getTotalItems } = useCartStore()

  const products = productsResponse?.data || []
  const availableProducts = products.filter(p => !p.is_soldout && p.quantity > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">🍎 신선한 과일가게</h1>
              <p className="text-sm text-gray-600">집까지 배달해드립니다!</p>
            </div>
            
            {/* 장바구니 버튼 */}
            <Link to={ROUTES.CART}>
              <Button variant="primary" className="relative">
                장바구니
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 점포 선택 */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-3">🏪 점포 선택</h2>
          <div className="flex space-x-2 overflow-x-auto">
            {[1, 2, 3].map(storeId => (
              <Button
                key={storeId}
                variant={selectedStoreId === storeId ? "primary" : "outline"}
                onClick={() => setSelectedStoreId(storeId)}
                className="whitespace-nowrap"
              >
                {storeId === 1 ? '신사점' : storeId === 2 ? '홍대점' : '강남점'}
              </Button>
            ))}
          </div>
        </Card>

        {/* 상품 목록 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">🛒 신선한 상품들</h2>
            <p className="text-sm text-gray-600">{availableProducts.length}개 상품</p>
          </div>

          {isLoading ? (
            <Loading text="상품을 불러오는 중..." />
          ) : (
            <>
              {availableProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {availableProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={(product) => {
                        // 장바구니 추가 시 알림 (선택사항)
                        console.log(`${product.name}이(가) 장바구니에 추가되었습니다.`)
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <p className="text-gray-500 mb-4">현재 판매 중인 상품이 없습니다.</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    새로고침
                  </Button>
                </Card>
              )}
            </>
          )}
        </div>
          
        {/* 안내 사항 */}
        <Card className="bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 주문 안내</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 신선한 과일을 당일 배달해드립니다</li>
            <li>• 배달비는 무료입니다</li>
            <li>• 주문 후 1-2시간 내 배달 완료</li>
            <li>• 현금 또는 계좌이체로 결제해주세요</li>
          </ul>
        </Card>
      </main>
    </div>
  )
}

export default HomePage