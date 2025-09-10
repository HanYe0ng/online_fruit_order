import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Input, Loading } from '../../components/common'
import { ProductCard } from '../../components/customer'
import { useProducts } from '../../hooks/useProducts'
import { useCartStore } from '../../stores/cartStore'
import { fetchStores } from '../../services/stores'
import { ROUTES } from '../../utils/constants'
import type { StoreInfo } from '../../types/product'

const ProductPage: React.FC = () => {
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSoldOut, setShowSoldOut] = useState(false)
  const [isLoadingStores, setIsLoadingStores] = useState(true)
  
  const { data: productsResponse, isLoading: isLoadingProducts } = useProducts({ 
    store_id: selectedStoreId || 0 
  })
  const { getTotalItems } = useCartStore()

  // 점포 데이터 불러오기
  useEffect(() => {
    const loadStores = async () => {
      try {
        setIsLoadingStores(true)
        const storesData = await fetchStores()
        setStores(storesData)
        
        // 첫 번째 점포를 기본으로 선택
        if (storesData.length > 0 && !selectedStoreId) {
          setSelectedStoreId(storesData[0].id)
        }
      } catch (error) {
        console.error('점포 정보를 불러오는 중 오류 발생:', error)
        setStores([])
      } finally {
        setIsLoadingStores(false)
      }
    }
    
    loadStores()
  }, [])

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
              <Link to={ROUTES.HOME} className="hover:opacity-80 transition-opacity">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">🍎 전체 상품</h1>
                  <p className="text-sm text-gray-600">{filteredProducts.length}개 상품</p>
                </div>
              </Link>
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
              {isLoadingStores ? (
                <div className="text-sm text-gray-500">점포 데이터를 불러오는 중...</div>
              ) : stores.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {stores.map(store => (
                    <Button
                      key={store.id}
                      variant={selectedStoreId === store.id ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setSelectedStoreId(store.id)}
                    >
                      {store.name}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">등록된 점포가 없습니다.</div>
              )}
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
        {isLoadingStores ? (
          <Loading text="점포 정보를 불러오는 중..." />
        ) : !selectedStoreId ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">점포를 선택해주세요.</p>
          </Card>
        ) : isLoadingProducts ? (
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