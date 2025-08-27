import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Loading } from '../../components/common'
import { ProductCard } from '../../components/customer'
import { useCartStore } from '../../stores/cartStore'
import { ROUTES } from '../../utils/constants'
import { supabase } from '../../services/supabase'
import type { Product as UiProduct } from '../../types/product' // <-- UI 타입(가격 number)

type Store = {
  id: number
  name: string
  location: string | null
}

// DB에서 읽어오는 원본 타입 (price가 nullable)
type DbProduct = {
  id: number
  store_id: number
  name: string
  price: number | null
  quantity: number
  image_url: string | null
  is_soldout: boolean
  created_at: string
}

const HomePage: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null)
  const [products, setProducts] = useState<DbProduct[]>([])
  const [isLoadingStores, setIsLoadingStores] = useState<boolean>(true)
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true)
  const { getTotalItems } = useCartStore()

  /** 점포 목록 로드 */
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

  /** 상품 로드 */
  const fetchProducts = useCallback(async (storeId: number) => {
    setIsLoadingProducts(true)
    const { data, error } = await supabase
      .from('products')
      .select('id, store_id, name, price, quantity, image_url, is_soldout, created_at')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[products.fetch] error:', error)
      setProducts([])
    } else {
      setProducts((data || []) as DbProduct[])
    }
    setIsLoadingProducts(false)
  }, [])

  /** 점포 목록 최초 로드 */
  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  /** 선택된 점포 변경 시 상품 조회 + 실시간 구독 */
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

  /** 가용 상품 필터(DB 타입 유지) */
  const availableDbProducts = useMemo(
    () => products.filter((p) => !p.is_soldout && p.quantity > 0),
    [products]
  )

  /** UI에 맞게 매핑(가격 null → 0 등) */
  const availableUiProducts: UiProduct[] = useMemo(
    () =>
      availableDbProducts.map((p) => ({
        // UiProduct 구조에 맞게 채우세요.
        // 아래는 UiProduct가 DbProduct와 필드명이 동일하다고 가정
        id: p.id,
        store_id: p.store_id,
        name: p.name,
        price: p.price ?? 0,            // ✅ 핵심: null → 0 변환
        quantity: p.quantity,
        image_url: p.image_url ?? '',
        is_soldout: p.is_soldout,
        created_at: p.created_at,
      })),
    [availableDbProducts]
  )

  const currentStoreName =
    stores.find((s) => s.id === selectedStoreId)?.name ?? '점포 선택'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">🍎 달콤네</h1>
              <p className="text-sm text-gray-600">집까지 배달해드립니다!</p>
            </div>

            <div className="flex items-center gap-3">
              {/* 관리자 로그인 버튼 */}
              <Link to={ROUTES.ADMIN_LOGIN}>
                <Button variant="outline" size="sm">
                  관리자 로그인
                </Button>
              </Link>

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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 점포 선택 */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-3">🏪 점포 선택</h2>

          {isLoadingStores ? (
            <Loading text="점포를 불러오는 중..." />
          ) : stores.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto">
              {stores.map((store) => (
                <Button
                  key={store.id}
                  variant={selectedStoreId === store.id ? 'primary' : 'outline'}
                  onClick={() => setSelectedStoreId(store.id)}
                  className="whitespace-nowrap"
                >
                  {store.name}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">등록된 점포가 없습니다.</p>
          )}
        </Card>

        {/* 상품 목록 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              🛒 {currentStoreName} – 신선한 상품들
            </h2>
            <p className="text-sm text-gray-600">{availableUiProducts.length}개 상품</p>
          </div>

          {isLoadingProducts ? (
            <Loading text="상품을 불러오는 중..." />
          ) : availableUiProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {availableUiProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product} // ✅ UiProduct 전달
                  onAddToCart={(p) => {
                    console.log(`${p.name}이(가) 장바구니에 추가되었습니다.`)
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <p className="text-gray-500 mb-4">현재 판매 중인 상품이 없습니다.</p>
              {selectedStoreId && (
                <Button variant="outline" onClick={() => fetchProducts(selectedStoreId)}>
                  새로고침
                </Button>
              )}
            </Card>
          )}
        </div>

        {/* 안내 사항 */}
        <Card className="bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 주문 안내</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 신선한 과일을 당일 배달해드립니다</li>
            <li>• 배달비는 무료입니다</li>
            <li>• 주문 후 1–2시간 내 배달 완료</li>
            <li>• 현금 또는 계좌이체로 결제해주세요</li>
          </ul>
        </Card>
      </main>
    </div>
  )
}

export default HomePage
