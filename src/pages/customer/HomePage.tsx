import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Loading } from '../../components/common'
import { ProductCard } from '../../components/customer'
import GiftProductCard from '../../components/customer/GiftProductCard'
import { useCartStore } from '../../stores/cartStore'
import { ROUTES } from '../../utils/constants'
import { supabase } from '../../services/supabase'
import { updatePageTitle, updatePageDescription, PAGE_TITLES, PAGE_DESCRIPTIONS } from '../../utils/pageTitle'
import type { Product as UiProduct } from '../../types/product'

type Store = {
  id: number
  name: string
  location: string | null
}

type DbProduct = {
  id: number
  store_id: number
  name: string
  price: number | null
  quantity: number
  image_url: string | null
  is_soldout: boolean
  category?: string
  created_at: string
}

const HomePage: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [products, setProducts] = useState<DbProduct[]>([])
  const [selectedCategory, setSelectedCategory] = useState<'today' | 'gift'>('today')
  const [logoError, setLogoError] = useState(false)
  const [isLoadingStores, setIsLoadingStores] = useState<boolean>(true)
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true)
  const { getTotalItems } = useCartStore()

  const fetchStores = useCallback(async () => {
    setIsLoadingStores(true)
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, location')
      .order('id', { ascending: true })

    if (error) {
      console.error('[stores.fetch] error:', error)
      setStores([])
    } else {
      setStores((data || []) as Store[])
      if (!selectedStoreId && data && data.length > 0) {
        setSelectedStoreId(data[0].id)
      }
    }
    setIsLoadingStores(false)
  }, [selectedStoreId])

  const fetchProducts = useCallback(async (storeId: number) => {
    setIsLoadingProducts(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[products.fetch] error:', error)
      setProducts([])
    } else {
      console.log('[products.fetch] data:', data)
      setProducts((data || []) as DbProduct[])
    }
    setIsLoadingProducts(false)
  }, [])

  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  useEffect(() => {
    if (!selectedStoreId) return

    let isMounted = true
    fetchProducts(selectedStoreId)

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
        (payload) => {
          if (!isMounted) return
          setProducts((prev) => {
            const next = [...prev]
            switch (payload.eventType) {
              case 'INSERT': {
                const row = payload.new as DbProduct
                if (!next.find((p) => p.id === row.id)) next.unshift(row)
                return next
              }
              case 'UPDATE': {
                const row = payload.new as DbProduct
                const idx = next.findIndex((p) => p.id === row.id)
                if (idx !== -1) next[idx] = { ...next[idx], ...row }
                else next.unshift(row)
                return next
              }
              case 'DELETE': {
                const row = payload.old as DbProduct
                return next.filter((p) => p.id !== row.id)
              }
              default:
                return next
            }
          })
        }
      )
    channel.subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [selectedStoreId, fetchProducts])

  const availableDbProducts = useMemo(
    () => products.filter((p) => !p.is_soldout && p.quantity > 0),
    [products]
  )

  const filteredProducts = useMemo(() => {
    return availableDbProducts.filter(p => {
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
  }, [availableDbProducts, selectedCategory])

  const availableUiProducts: UiProduct[] = useMemo(
    () =>
      filteredProducts.map((p) => ({
        id: p.id,
        store_id: p.store_id,
        name: p.name,
        price: p.price ?? 0,
        quantity: p.quantity,
        image_url: p.image_url ?? '',
        is_soldout: p.is_soldout,
        category: (p.category as 'today' | 'gift') || 'today',
        created_at: p.created_at,
      })),
    [filteredProducts]
  )

  const currentStoreName =
    stores.find((s) => s.id === selectedStoreId)?.name ?? '점포 선택'

  // 페이지 제목 설정
  useEffect(() => {
    updatePageTitle(PAGE_TITLES.HOME)
    updatePageDescription(PAGE_DESCRIPTIONS.HOME)
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--gray-50)' }}>
      <header className="sticky top-0 z-40" style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--gray-100)'
      }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to={ROUTES.HOME} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              {!logoError ? (
                <img 
                  src="/logo.png" 
                  alt="달콤네 로고" 
                  className="h-12 w-auto object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <div style={{ 
                    background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)',
                    borderRadius: 'var(--radius)',
                    padding: 'var(--spacing-sm)'
                  }}>
                    <span className="text-2xl">🍎</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--gray-900)' }}>달콤네</h1>
                    <p className="text-sm" style={{ color: 'var(--gray-600)' }}>신선한 과일을 집까지</p>
                  </div>
                </div>
              )}
            </Link>

            <Link to={ROUTES.CART}>
              <button 
                className="dalkomne-button-primary relative flex items-center space-x-2"
                style={{ fontSize: '14px' }}
              >
                <span>🛒</span>
                <span>장바구니</span>
                {getTotalItems() > 0 && (
                  <span 
                    className="absolute -top-2 -right-2 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    style={{ background: 'var(--dalkomne-peach)' }}
                  >
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div 
          className="text-center py-8 mb-8"
          style={{
            background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--white)'
          }}
        >
          <h2 className="text-2xl font-bold mb-2">🍎 신선과일 FRESH ZONE</h2>
          <p className="text-lg opacity-90">매일 새벽 배송되는 신선한 과일</p>
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
              {stores.map((store) => (
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
                {availableUiProducts.length}개 상품
              </span>
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <div 
              className="inline-flex rounded-full p-1"
              style={{ background: 'var(--gray-100)' }}
            >
              <button
                onClick={() => setSelectedCategory('today')}
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
                onClick={() => setSelectedCategory('gift')}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {availableUiProducts.map((product) => (
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
                <button 
                  onClick={() => fetchProducts(selectedStoreId)}
                  className="dalkomne-button-primary"
                >
                  새로고침
                </button>
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
    </div>
  )
}

export default HomePage
