import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Input, Loading } from '../../components/common'
import { ProductCard } from '../../components/customer'
import { useProducts } from '../../hooks/useProducts'
import { useCartStore } from '../../stores/cartStore'
import { ROUTES } from '../../utils/constants'

const ProductPage: React.FC = () => {
  const [selectedStoreId, setSelectedStoreId] = useState<number>(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSoldOut, setShowSoldOut] = useState(false)
  
  const { data: productsResponse, isLoading } = useProducts({ store_id: selectedStoreId })
  const { getTotalItems } = useCartStore()

  const products = productsResponse?.data || []
  
  // 필터링된 상품들
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAvailability = showSoldOut || (!product.is_soldout && product.quantity > 0)
    return matchesSearch && matchesAvailability
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link to={ROUTES.HOME}>
                <Button variant="outline" size="sm" className="mr-4">
                  ← 홈
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">🍎 전체 상품</h1>
                <p className="text-sm text-gray-600">{filteredProducts.length}개 상품</p>
              </div>
            </div>
            
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
        {/* 필터 섹션 */}
        <Card className="mb-6">
          <div className="space-y-4">
            {/* 점포 선택 */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">점포 선택</h3>
              <div className="flex space-x-2">
                {[1, 2, 3].map(storeId => (
                  <Button
                    key={storeId}
                    variant={selectedStoreId === storeId ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStoreId(storeId)}
                  >
                    {storeId === 1 ? '신사점' : storeId === 2 ? '홍대점' : '강남점'}
                  </Button>
                ))}
              </div>
            </div>

            {/* 검색 */}
            <div>
              <Input
                placeholder="상품명을 검색하세요..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* 품절 상품 표시 옵션 */}
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showSoldOut}
                  onChange={(e) => setShowSoldOut(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">품절 상품도 표시</span>
              </label>
            </div>
          </div>
        </Card>

        {/* 상품 목록 */}
        {isLoading ? (
          <Loading text="상품을 불러오는 중..." />
        ) : (
          <>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  {searchTerm ? '검색 결과가 없습니다.' : '판매 중인 상품이 없습니다.'}
                </p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    검색 초기화
                  </Button>
                )}
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default ProductPage