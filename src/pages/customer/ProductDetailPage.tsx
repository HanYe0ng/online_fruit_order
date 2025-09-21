import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Product } from '../../types/product'
import { directSupabaseCall } from '../../services/directSupabase'
import { useCartStore } from '../../stores/cartStore'
import { ROUTES } from '../../utils/constants'

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { addItem } = useCartStore()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [logoError, setLogoError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        navigate(ROUTES.HOME)
        return
      }

      try {
        setLoading(true)
        
        const data = await directSupabaseCall(`products?select=*&id=eq.${productId}`)
        console.log('상품 상세 데이터:', data)
        
        if (Array.isArray(data) && data.length > 0) {
          setProduct(data[0] as Product)
        } else {
          console.error('상품을 찾을 수 없습니다:', productId)
          navigate(ROUTES.HOME)
        }
      } catch (error) {
        console.error('상품 로딩 오류:', error)
        alert('상품 정보를 불러오는데 실패했습니다.')
        navigate(ROUTES.HOME)
      } finally {
        setLoading(false)
      }
    }
    
    loadProduct()
  }, [productId, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <div>로딩 중...</div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-lg font-semibold mb-2">상품을 찾을 수 없습니다</h3>
          <p className="text-gray-600 mb-6">요청하신 상품이 존재하지 않거나 삭제되었을 수 있습니다.</p>
          <button 
            onClick={() => navigate(ROUTES.HOME)}
            className="dalkomne-button-primary"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR')
  }

  const handleAddToCart = () => {
    if (product.is_soldout || product.quantity === 0) {
      alert('품절된 상품입니다.')
      return
    }

    if (quantity > product.quantity) {
      alert(`재고가 부족합니다. (재고: ${product.quantity}개)`)
      return
    }

    addItem(product, quantity)
    alert('장바구니에 추가되었습니다!')
  }

  const currentPrice = product.discount_price && product.discount_price < product.price 
    ? product.discount_price 
    : product.price

  const hasDiscount = product.discount_price && product.discount_price < product.price

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
                    <p className="text-xs" style={{ color: 'var(--gray-600)' }}>상품 상세</p>
                  </div>
                </div>
              )}
            </Link>

            <button 
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all duration-300"
              style={{
                borderColor: 'var(--gray-200)',
                color: 'var(--gray-700)',
                background: 'var(--white)'
              }}
            >
              <span>←</span>
              <span>뒤로가기</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="dalkomne-card p-4">
              <img 
                src={product.image_url || '/placeholder-fruit.jpg'} 
                alt={product.name}
                className="w-full h-80 lg:h-96 object-cover rounded-lg"
              />
            </div>

            <div className="space-y-6">
              <div className="dalkomne-card p-6">
                <div className="mb-4">
                  <span 
                    className="inline-block px-3 py-1 text-sm rounded-full"
                    style={{
                      backgroundColor: product.category === 'gift' ? 'var(--dalkomne-peach)' : 'var(--dalkomne-orange-soft)',
                      color: product.category === 'gift' ? 'white' : 'var(--dalkomne-orange-dark)'
                    }}
                  >
                    {product.category === 'gift' ? '🎁 과일선물' : '🍎 오늘의 과일'}
                  </span>
                </div>

                <h1 className="text-2xl lg:text-3xl font-bold mb-6" style={{ color: 'var(--gray-900)' }}>
                  {product.name}
                </h1>

                <div className="mb-6">
                  {hasDiscount ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span 
                          className="text-lg line-through"
                          style={{ color: 'var(--gray-400)' }}
                        >
                          {formatPrice(product.price)}원
                        </span>
                        <span 
                          className="px-2 py-1 text-sm font-bold rounded"
                          style={{
                            backgroundColor: 'var(--dalkomne-orange)',
                            color: 'white'
                          }}
                        >
                          {Math.round((1 - (product.discount_price! / product.price)) * 100)}% 할인
                        </span>
                      </div>
                      <div className="text-3xl font-bold" style={{ color: 'var(--dalkomne-orange-dark)' }}>
                        {formatPrice(product.discount_price!)}원
                      </div>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold" style={{ color: 'var(--dalkomne-orange-dark)' }}>
                      {formatPrice(product.price)}원
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="font-medium" style={{ color: 'var(--gray-900)' }}>수량:</span>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors"
                        style={{ borderColor: 'var(--gray-300)' }}
                      >
                        -
                      </button>
                      <span className="w-16 text-center font-medium text-lg">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                        className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors"
                        style={{ borderColor: 'var(--gray-300)' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--gray-600)' }}>
                      재고: {product.quantity}개
                    </span>
                    {product.is_soldout && (
                      <span 
                        className="px-3 py-1 text-sm font-medium rounded"
                        style={{
                          backgroundColor: 'var(--red-100)',
                          color: 'var(--red-600)'
                        }}
                      >
                        품절
                      </span>
                    )}
                  </div>
                </div>

                {/* 총 금액 */}
                <div 
                  className="p-4 rounded-lg mb-6"
                  style={{ backgroundColor: 'var(--gray-50)' }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium" style={{ color: 'var(--gray-900)' }}>
                      총 금액
                    </span>
                    <span className="text-2xl font-bold" style={{ color: 'var(--dalkomne-orange-dark)' }}>
                      {formatPrice(currentPrice * quantity)}원
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleAddToCart}
                  disabled={product.is_soldout || product.quantity === 0}
                  className="w-full dalkomne-button-primary py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {product.is_soldout ? '품절' : '장바구니 담기'}
                </button>
              </div>
            </div>
          </div>

          {/* 상품 정보 */}
          <div className="dalkomne-card p-6 mt-8">
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--gray-900)' }}>
              상품 정보
            </h3>
            <div className="space-y-4 text-gray-700">
              <div>
                <span className="font-medium">상품명:</span> {product.name}
              </div>
              <div>
                <span className="font-medium">가격:</span> {formatPrice(currentPrice)}원
                {hasDiscount && (
                  <span className="ml-2 text-sm text-gray-500">
                    (정가: {formatPrice(product.price)}원)
                  </span>
                )}
              </div>
              <div>
                <span className="font-medium">재고:</span> {product.quantity}개
              </div>
              <div>
                <span className="font-medium">카테고리:</span> {product.category === 'gift' ? '과일선물' : '오늘의 과일'}
              </div>
            </div>
          </div>

          {/* 주의사항 */}
          <div 
            className="p-6 rounded-lg mt-8"
            style={{ 
              background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)',
              color: 'var(--white)'
            }}
          >
            <h3 className="text-lg font-bold mb-3">주문 안내</h3>
            <div className="space-y-2 text-sm">
              <div>• 배달주문은 최소 2만원 이상 결제시 배달이 가능합니다.</div>
              <div>• 주문마감은 오후 4시이며, 당일 오후 5시부터 순차 배달됩니다.</div>
              <div>• 신선한 과일을 위해 당일 주문 당일 배송을 원칙으로 합니다.</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProductDetailPage
