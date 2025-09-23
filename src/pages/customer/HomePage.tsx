import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Loading } from '../../components/common'
// import { Pagination } from '../../components/common' // 임시 비활성화
import { ProductCard, OrderBar } from '../../components/customer'
import GiftProductCard from '../../components/customer/GiftProductCard'
import { useCartStore } from '../../stores/cartStore'
// import { useResponsivePagination } from '../../hooks/useResponsivePagination'
import { ROUTES } from '../../utils/constants'
import { directSupabaseCall } from '../../services/directSupabase'
import { updatePageTitle, updatePageDescription, PAGE_TITLES, PAGE_DESCRIPTIONS } from '../../utils/pageTitle'
import type { Product as UiProduct } from '../../types/product'
import type { Store } from '../../types/store'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

const HomePage: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [products, setProducts] = useState<UiProduct[]>([])
  const [selectedCategory, setSelectedCategory] = useState<'today' | 'gift'>('today')
  const [logoError, setLogoError] = useState(false)
  const [isLoadingStores, setIsLoadingStores] = useState<boolean>(true)
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true)
  const { getTotalItems } = useCartStore()

  const fetchStores = useCallback(async () => {
    console.log('🏪 === fetchStores START (Direct Fetch) ===')
    console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL)
    console.log('Supabase Key exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY)
    
    setIsLoadingStores(true)
    
    try {
      console.log('📞 Direct API 호출 시도 중...')
      
      const data = await directSupabaseCall('stores?select=id,name,location&order=id.asc')
      console.log('📞 Direct API 성공:', data)
      
      const storesData = (data as Store[]) || []
      setStores(storesData)
      console.log('🏦 설정된 stores:', storesData.length, '개')
      
    } catch (err) {
      console.error('🚫 fetchStores 에러:', err)
      setStores([])
    } finally {
      setIsLoadingStores(false)
      console.log('🏪 === fetchStores END ===')
    }
  }, []) // 의존성 배열에서 selectedStoreId 제거

  const fetchProducts = useCallback(async (storeId: number) => {
    console.log('🛍️ fetchProducts 호출 시작 (Direct Fetch), storeId:', storeId)
    setIsLoadingProducts(true)
    
    try {
      const endpoint = `products?select=*&store_id=eq.${storeId}&order=display_order.asc.nullslast,created_at.desc`
      console.log('📞 Products API endpoint:', endpoint)
      
      const data = await directSupabaseCall(endpoint)
      console.log('🛍️ Direct Products API 성공:')
      console.log('- Raw data:', data)
      console.log('- Data type:', typeof data)
      console.log('- Is array:', Array.isArray(data))
      console.log('- Data length:', data?.length)
      
      const productsData = (data as UiProduct[]) || []
      console.log('📺 Processed products data:')
      console.log('- Products count:', productsData.length)
      console.log('- First product:', productsData[0])
      
      setProducts(productsData)
      console.log('📋 State 업데이트 완료, 설정된 상품 수:', productsData.length)
      
    } catch (error) {
      console.error('🚫 [products.fetch] error:', error)
      setProducts([])
    } finally {
      setIsLoadingProducts(false)
      console.log('🛍️ fetchProducts 완료')
    }
  }, [])

  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  // 첫 번째 점포 자동 선택
  useEffect(() => {
    console.log('🎯 첫 번째 점포 선택 체크:', { selectedStoreId, storesLength: stores.length })
    if (!selectedStoreId && stores.length > 0) {
      const firstStore = stores[0] as Store
      console.log('🎯 첫 번째 점포 선택:', firstStore)
      setSelectedStoreId(firstStore.id)
    }
  }, [stores, selectedStoreId])

  useEffect(() => {
    if (!selectedStoreId) return

    let isMounted = true
    fetchProducts(selectedStoreId)

    // 실시간 업데이트 임시 비활성화 (Direct Fetch 사용 시)
    /*
    const channel = supabase
      .channel(`public:products:store_${selectedStoreId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `store_id=eq.${selectedStoreId}`
        },
        (payload: RealtimePostgresChangesPayload<UiProduct>) => {
          if (!isMounted) return
          setProducts((prev) => {
            const next = [...prev]
            switch (payload.eventType) {
              case 'INSERT': {
                const row = payload.new as UiProduct
                if (!next.find((p) => p.id === row.id)) next.unshift(row)
                return next
              }
              case 'UPDATE': {
                const row = payload.new as UiProduct
                const idx = next.findIndex((p) => p.id === row.id)
                if (idx !== -1) next[idx] = { ...next[idx], ...row }
                else next.unshift(row)
                return next
              }
              case 'DELETE': {
                const row = payload.old as UiProduct
                return next.filter((p) => p.id !== row.id)
              }
              default:
                return next
            }
          })
        }
      )
    channel.subscribe()
    */

    return () => {
      isMounted = false
      // supabase.removeChannel(channel)
    }
  }, [selectedStoreId, fetchProducts])

  const availableProducts = useMemo(() => {
    const filtered = products.filter((p) => !p.is_soldout && p.quantity > 0)
    console.log('📋 상품 필터링 결과:')
    console.log('- 전체 상품 수:', products.length)
    console.log('- 판매 가능 상품 수:', filtered.length)
    console.log('- 판매 가능 상품:', filtered.map(p => ({ id: p.id, name: p.name, is_soldout: p.is_soldout, quantity: p.quantity })))
    return filtered
  }, [products])

  const filteredProducts = useMemo(() => {
    const categoryFiltered = availableProducts.filter(p => {
      // category 필드가 있으면 그것을 우선 사용
      if ('category' in p && p.category) {
        return p.category === selectedCategory
      }
      
      // category 필드가 없으면 상품명으로 판단 (레거시 지원)
      if (selectedCategory === 'gift') {
        return p.name.toLowerCase().includes('선물') || 
               p.name.toLowerCase().includes('기프트') ||
               p.name.toLowerCase().includes('gift')
      }
      return !p.name.toLowerCase().includes('선물') && 
             !p.name.toLowerCase().includes('기프트') &&
             !p.name.toLowerCase().includes('gift')
    })
    
    console.log('🏷️ 카테고리 필터링 결과:')
    console.log('- 선택된 카테고리:', selectedCategory)
    console.log('- 카테고리 필터링 후 상품 수:', categoryFiltered.length)
    console.log('- 카테고리 필터링 후 상품:', categoryFiltered.map(p => ({ id: p.id, name: p.name, category: p.category })))
    
    return categoryFiltered
  }, [availableProducts, selectedCategory])

  const availableUiProducts: UiProduct[] = useMemo(
    () => filteredProducts,
    [filteredProducts]
  )

  // 간단한 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8) // 고정값으로 시작
  
  // 현재 페이지의 상품들
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageProducts = availableUiProducts.slice(startIndex, endIndex)
  const totalPages = Math.ceil(availableUiProducts.length / itemsPerPage)
  
  // 페이지 변경 함수
  const handlePageChange = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  // 카테고리 변경 시 페이지 리셋
  useEffect(() => {
    console.log('📄 카테고리 변경으로 인한 페이지 리셋:', selectedCategory)
    setCurrentPage(1)
  }, [selectedCategory])

  // 점포 변경 시 페이지 리셋  
  useEffect(() => {
    console.log('🏪 점포 변경으로 인한 페이지 리셋:', selectedStoreId)
    setCurrentPage(1)
  }, [selectedStoreId])

  const currentStoreName = useMemo(() => {
    const foundStore = (stores as Store[]).find((s: Store) => s.id === selectedStoreId)
    return foundStore?.name ?? '점포 선택'
  }, [stores, selectedStoreId])

  // 페이지 제목 설정
  useEffect(() => {
    updatePageTitle(PAGE_TITLES.HOME)
    updatePageDescription(PAGE_DESCRIPTIONS.HOME)
  }, [])

  // 카테고리 변경 핸들러 - 페이지 리셋 포함
  const handleCategoryChange = (category: 'today' | 'gift') => {
    console.log('🏷️ 카테고리 변경:', category)
    setSelectedCategory(category)
    // setCurrentPage(1)는 useEffect에서 자동으로 처리됨
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--gray-50)' }}>
      <header className="sticky top-0 z-40" style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--gray-100)'
      }}>
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <Link to={ROUTES.HOME} className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity flex-shrink-0">
              {!logoError ? (
                <img 
                  src="/logo.png" 
                  alt="달콤네 로고" 
                  className="h-8 sm:h-12 w-auto object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div style={{ 
                    background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)',
                    borderRadius: 'var(--radius)',
                    padding: 'var(--spacing-xs) var(--spacing-sm)'
                  }}>
                    <span className="text-lg sm:text-2xl">🍎</span>
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>달콤네</h1>
                    <p className="text-sm" style={{ color: 'var(--gray-600)' }}>신선한 과일을 집까지</p>
                  </div>
                </div>
              )}
            </Link>

            <Link to={ROUTES.CART} className="flex-shrink-0">
              <button 
                className="relative flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)',
                  color: 'var(--white)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius)',
                  fontSize: '14px',
                  fontWeight: '600',
                  minHeight: '44px',
                  minWidth: '100px',
                  maxWidth: '140px'
                }}
              >
                <span className="text-base mr-1">🛒</span>
                <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                  <span className="hidden xs:inline">장바구니</span>
                  <span className="xs:hidden">카트</span>
                </span>
                
                {getTotalItems() > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                    style={{ 
                      background: 'var(--dalkomne-peach)',
                      minWidth: '20px',
                      fontSize: '11px'
                    }}
                  >
                    {getTotalItems() > 99 ? '99+' : getTotalItems()}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        {/* 배달 구매 오픈 이벤트 배너 */}
        <div 
          className="relative text-center py-12 mb-8 overflow-hidden"
          style={{
            borderRadius: 'var(--radius-lg)',
            // 기본 배경은 메인 컴러로 설정
            background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)',
            // 이미지를 contain으로 세로 길이에 맞추고 가운데 정렬
            backgroundImage: 'url("/fruit-delivery-banner.png")',
            backgroundSize: 'contain', // 세로 기준으로 맞춤
            backgroundPosition: 'center', // 가운데 정렬
            backgroundRepeat: 'no-repeat', // 반복 방지
            minHeight: '200px' // 최소 높이 설정
          }}
        >
          
        </div>

        <div className="dalkomne-card p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)' }}
            >
              <span className="text-white text-xl">🏪</span>
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--gray-900)' }}>매장 선택</h3>
              <p className="text-sm" style={{ color: 'var(--gray-600)' }}>가장 가까운 매장을 선택해주세요</p>
            </div>
          </div>

          {isLoadingStores ? (
            <Loading text="매장을 불러오는 중..." />
          ) : stores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(stores as Store[]).map((store: Store) => (
                <button
                  key={store.id}
                  onClick={() => setSelectedStoreId(store.id)}
                  className="p-4 rounded-lg border-2 transition-all duration-300 text-left"
                  style={{
                    background: selectedStoreId === store.id 
                      ? 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)' 
                      : 'var(--white)',
                    borderColor: selectedStoreId === store.id ? 'var(--dalkomne-orange)' : 'var(--gray-200)',
                    color: selectedStoreId === store.id ? 'var(--white)' : 'var(--gray-900)',
                    boxShadow: selectedStoreId === store.id ? 'var(--shadow-orange)' : 'none'
                  }}
                >
                  <div className="font-semibold">{store.name}</div>
                  {store.location && (
                    <div className="text-sm mt-1 opacity-75">📍 {store.location}</div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center py-8" style={{ color: 'var(--gray-500)' }}>등록된 매장이 없습니다.</p>
          )}
        </div>

        <div className="dalkomne-card p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>
                {currentStoreName}
              </h2>
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ 
                  background: 'var(--dalkomne-peach)', 
                  color: 'var(--white)' 
                }}
              >
                전체 {availableUiProducts.length}개
              </span>
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <div 
              className="inline-flex rounded-full p-1"
              style={{ background: 'var(--gray-100)' }}
            >
              <button
                onClick={() => handleCategoryChange('today')}
                className="px-6 py-3 rounded-full font-semibold transition-all duration-300"
                style={{
                  background: selectedCategory === 'today' 
                    ? 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)'
                    : 'transparent',
                  color: selectedCategory === 'today' ? 'var(--white)' : 'var(--gray-700)',
                  boxShadow: selectedCategory === 'today' ? 'var(--shadow-orange)' : 'none'
                }}
              >
                🍎 오늘의 과일
              </button>
              <button
                onClick={() => handleCategoryChange('gift')}
                className="px-6 py-3 rounded-full font-semibold transition-all duration-300"
                style={{
                  background: selectedCategory === 'gift' 
                    ? 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)'
                    : 'transparent',
                  color: selectedCategory === 'gift' ? 'var(--white)' : 'var(--gray-700)',
                  boxShadow: selectedCategory === 'gift' ? 'var(--shadow-orange)' : 'none'
                }}
              >
                🎁 과일선물
              </button>
            </div>
          </div>

          {isLoadingProducts ? (
            <div className="py-12">
              <Loading text="상품을 불러오는 중..." />
            </div>
          ) : availableUiProducts.length > 0 ? (
            <div className="space-y-6">
              {/* 반응형 상품 그리드 */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {currentPageProducts.map((product) => (
                  selectedCategory === 'gift' ? (
                    <GiftProductCard
                      key={product.id}
                      product={{
                        ...product,
                        originalPrice: product.price + Math.floor(product.price * 0.1),
                        discount: 10,
                        description: `신선한 ${product.name}을 선물로 전해보세요.`,
                        tags: ['신선한', '선물용', '추천'],
                        rating: 4.5 + Math.random() * 0.5,
                        reviewCount: Math.floor(Math.random() * 50) + 10,
                        images: product.image_url ? [product.image_url] : [],
                        detail_image_url: product.detail_image_url || null, // 필수 필드로 명시적 변환
                        nutritionInfo: `영양가득한 ${product.name}`,
                        storageInfo: '서늘하고 통풍이 잘 되는 곳에 보관',
                        origin: '국내산'
                      }}
                    />
                  ) : (
                    <ProductCard
                      key={product.id}
                      product={product} 
                      onAddToCart={(p) => {
                        console.log(`${p.name}이(가) 장바구니에 추가되었습니다.`)
                      }}
                    />
                  )
                ))}
              </div>
              
              {/* 페이지네이션 - 임시 비활성화 */}
              {/* {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={availableUiProducts.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    maxVisiblePages={5}
                  />
                </div>
              )} */}
              
              {/* 간단한 페이지네이션 */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center space-y-4">
                  <div className="text-sm" style={{ color: 'var(--gray-600)' }}>
                    전체 {availableUiProducts.length}개 중 {startIndex + 1}-{Math.min(endIndex, availableUiProducts.length)}개 표시
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
                      style={{
                        background: currentPage === 1 ? 'var(--gray-100)' : 'var(--white)',
                        color: currentPage === 1 ? 'var(--gray-400)' : 'var(--gray-700)',
                        borderColor: 'var(--gray-200)'
                      }}
                    >
                      이전
                    </button>
                    
                    <span className="px-4 py-2 text-sm font-medium">
                      {currentPage} / {totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
                      style={{
                        background: currentPage === totalPages ? 'var(--gray-100)' : 'var(--white)',
                        color: currentPage === totalPages ? 'var(--gray-400)' : 'var(--gray-700)',
                        borderColor: 'var(--gray-200)'
                      }}
                    >
                      다음
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div 
              className="text-center py-16 rounded-lg"
              style={{ background: 'var(--gray-50)' }}
            >
              <div className="text-6xl mb-4">
                {selectedCategory === 'gift' ? '🎁' : '🛒'}
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>
                {selectedCategory === 'gift' 
                  ? '과일선물 상품이 없습니다'
                  : '오늘의 과일 상품이 없습니다'
                }
              </h3>
              <p className="mb-6" style={{ color: 'var(--gray-600)' }}>
                {selectedCategory === 'gift'
                  ? '과일선물 상품을 준비하고 있습니다. 잠시만 기다려주세요!'
                  : '곧 신선한 상품들을 준비해드릴게요!'
                }
              </p>
              {selectedStoreId && (
                <div className="flex justify-center">
                  <button 
                    onClick={() => {
                      fetchProducts(selectedStoreId)
                      // 페이지를 1로 리셋
                      setCurrentPage(1)
                    }}
                    className="dalkomne-button-primary"
                  >
                    새로고침
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div 
          className="mt-8 p-6 rounded-lg"
          style={{ 
            background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)',
            color: 'var(--white)'
          }}
        >
          <div className="flex items-start space-x-4">
            <div className="text-3xl">📢</div>
            <div>
              <h3 className="text-lg font-bold mb-3">1. 오늘의 과일 배달 주문</h3>
              <div className="space-y-2 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span>배달주문은 매주 월~금요일 운영되고 있습니다.(공휴일 제외)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>배달주문은 최소 2만원 이상 결제시 배달이 가능합니다.</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span>주문마감은 오후 4시 입니다.</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>배달은 주문마감 후 당일 오후 5시부터 순차적으로 진행됩니다.</span>
                  </div>
                </div>
              </div>
              <div className='mt-6'></div>
              <h3 className='text-lg font-bold mb-3'>2. 명절선물 과일기프트</h3>
              <div className="space-y-2 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span>상품과 옵션에 따라 예약, 픽업, 택배배송, 당일배달 사항을 정확히 확인하여 주문해 주세요.</span>
                  </div>
                </div>
              </div>
              <div className='mt-6'></div>
              <h3 className='text-lg font-bold mb-3'>3. 공동현관번호로 출입이 가능한 아파트인 경우 번호를 기재해주셔야 원활한 배달이 가능합니다.</h3>
            </div>
          </div>
        </div>
      </main>
      
      {/* 하단 주문바 */}
      <OrderBar />
    </div>
  )
}

export default HomePage
