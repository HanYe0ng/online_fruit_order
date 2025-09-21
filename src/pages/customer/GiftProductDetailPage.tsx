import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { GiftProduct, ProductDeliveryOption, Product } from '../../types/product'
import { mockGiftProducts } from '../../data/mockData'
import { fetchStores } from '../../services/stores'
import { StoreInfo } from '../../types/product'
import { directSupabaseCall } from '../../services/directSupabase'
import { useCartStore } from '../../stores/cartStore'
import { ROUTES } from '../../utils/constants'
import { Modal } from '../../components/common'

const GiftProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { addGiftItem } = useCartStore()
  
  const [product, setProduct] = useState<GiftProduct | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [stores, setStores] = useState<StoreInfo[]>([])
  const [loading, setLoading] = useState(true)
  
  // 옵션 선택 상태
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery' | 'shipping'>('pickup')
  const [selectedStore, setSelectedStore] = useState<number>(0)
  const [recipientInfo, setRecipientInfo] = useState({
    name: '',
    phone: '',
    address: '',
    message: ''
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // 매장 데이터 로드
        const storesData = await fetchStores()
        setStores(storesData)
        
        // 첫 번째 매장을 기본 선택
        if (storesData.length > 0) {
          setSelectedStore(storesData[0].id)
        }
        
        // 상품 데이터 로드
        if (productId) {
          // 먼저 mockGiftProducts에서 찾기
          let foundProduct = mockGiftProducts.find(p => p.id === Number(productId))
          
          // mockGiftProducts에 없으면 실제 DB에서 찾기
          if (!foundProduct) {
            try {
              const dbProducts = await directSupabaseCall(`products?select=*&id=eq.${productId}`)
              const dbProduct = (dbProducts as Product[])?.[0]
              
              if (dbProduct) {
                // DB 상품을 GiftProduct 형태로 변환
                foundProduct = {
                  ...dbProduct,
                  originalPrice: dbProduct.price + Math.floor(dbProduct.price * 0.1),
                  discount: 10,
                  description: dbProduct.name ? `신선한 ${dbProduct.name}을 선물로 전해보세요.` : '신선한 과일을 선물로 전해보세요.',
                  tags: ['신선한', '선물용', '추천'],
                  rating: 4.5 + Math.random() * 0.5,
                  reviewCount: Math.floor(Math.random() * 50) + 10,
                  // 기존 images 배열 방식 대신 thumbnail_url과 detail_images로 분리
                  thumbnail_url: dbProduct.image_url,
                  detail_images: dbProduct.image_url ? [dbProduct.image_url] : [],
                  nutritionInfo: `영양가득한 ${dbProduct.name || '과일'}`,
                  storageInfo: '서늘하고 통풍이 잘 되는 곳에 보관',
                  origin: '국내산'
                } as GiftProduct
              }
            } catch (error) {
              console.error('DB에서 상품 로딩 오류:', error)
            }
          }
          
          if (foundProduct) {
            setProduct(foundProduct)
          } else {
            console.error('상품을 찾을 수 없습니다. ID:', productId)
            navigate(ROUTES.HOME)
          }
        }
      } catch (error) {
        console.error('데이터 로딩 오류:', error)
        alert('데이터를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [productId, navigate])

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <div>로딩 중...</div>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR')
  }

  const handleAddToCart = () => {
    setShowOptionsModal(true)
  }

  const handleConfirmAddToCart = () => {
    let deliveryOption: ProductDeliveryOption

    switch (deliveryType) {
      case 'pickup':
        const store = stores.find(s => s.id === selectedStore)
        if (!store) {
          alert('매장을 선택해주세요.')
          return
        }
        deliveryOption = {
          type: 'pickup',
          storeId: selectedStore,
          storeName: store.name
        }
        break
      case 'delivery':
        deliveryOption = {
          type: 'delivery'
        }
        break
      case 'shipping':
        if (!recipientInfo.name || !recipientInfo.phone || !recipientInfo.address) {
          alert('받는 분의 정보를 모두 입력해주세요.')
          return
        }
        deliveryOption = {
          type: 'shipping',
          recipientName: recipientInfo.name,
          recipientPhone: recipientInfo.phone,
          recipientAddress: recipientInfo.address,
          deliveryMessage: recipientInfo.message
        }
        break
    }

    addGiftItem({
      product,
      quantity,
      deliveryOption
    })

    setShowOptionsModal(false)
    alert('장바구니에 추가되었습니다!')
  }

  // 표시할 이미지들 결합 (썸네일 + 상세이미지)
  const getAllImages = () => {
    const images: string[] = []
    
    // 썸네일이 있으면 첫 번째로 추가
    if (product?.thumbnail_url) {
      images.push(product.thumbnail_url)
    }
    
    // 상세 이미지들 추가 (썸네일과 중복되지 않도록)
    if (product?.detail_images && product.detail_images.length > 0) {
      const uniqueDetailImages = product.detail_images.filter(img => img !== product.thumbnail_url)
      images.push(...uniqueDetailImages)
    }
    
    // 기존 images 배열도 지원 (하위 호환성)
    if (product?.images && product.images.length > 0) {
      const uniqueImages = product.images.filter(img => !images.includes(img))
      images.push(...uniqueImages)
    }
    
    // image_url도 지원 (하위 호환성)
    if (product?.image_url && !images.includes(product.image_url)) {
      images.push(product.image_url)
    }
    
    return images.length > 0 ? images : ['/placeholder-image.jpg']
  }

  // 새로운 이미지 배열 생성
  const images = getAllImages()

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
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="dalkomne-card p-4">
                <img 
                  src={images[selectedImageIndex]} 
                  alt={product.name}
                  className="w-full h-96 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-image.jpg'
                  }}
                />
              </div>
              
              {images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        selectedImageIndex === index ? 'border-dalkomne-orange' : 'border-gray-200'
                      }`}
                    >
                      <img 
                        src={image} 
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.jpg'
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="dalkomne-card p-6">
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 text-sm rounded-full"
                        style={{
                          backgroundColor: 'var(--dalkomne-orange-soft)',
                          color: 'var(--dalkomne-orange-dark)'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--gray-900)' }}>
                  {product.name}
                </h1>

                {product.rating && product.reviewCount && (
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center">
                      <span className="text-yellow-400">★</span>
                      <span className="ml-1 font-medium">{product.rating}</span>
                    </div>
                    <span style={{ color: 'var(--gray-500)' }}>
                      ({product.reviewCount}개 리뷰)
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  {product.originalPrice && product.discount ? (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span 
                          className="text-lg line-through"
                          style={{ color: 'var(--gray-400)' }}
                        >
                          {formatPrice(product.originalPrice)}원
                        </span>
                        <span 
                          className="px-2 py-1 text-sm font-bold rounded"
                          style={{
                            backgroundColor: 'var(--dalkomne-orange)',
                            color: 'white'
                          }}
                        >
                          {product.discount}% 할인
                        </span>
                      </div>
                      <div className="text-3xl font-bold" style={{ color: 'var(--dalkomne-orange-dark)' }}>
                        {formatPrice(product.price)}원
                      </div>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold" style={{ color: 'var(--dalkomne-orange-dark)' }}>
                      {formatPrice(product.price)}원
                    </div>
                  )}
                </div>

                <p className="text-lg" style={{ color: 'var(--gray-700)' }}>
                  {product.description}
                </p>

                <div className="flex items-center space-x-4">
                  <span className="font-medium" style={{ color: 'var(--gray-900)' }}>수량:</span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-full border flex items-center justify-center"
                      style={{ borderColor: 'var(--gray-300)' }}
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                      className="w-8 h-8 rounded-full border flex items-center justify-center"
                      style={{ borderColor: 'var(--gray-300)' }}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ color: 'var(--gray-500)' }}>
                    (재고: {product.quantity}개)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="dalkomne-card p-6 mt-8">
            <div className="space-y-6">
              {product.nutritionInfo && (
                <div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--gray-900)' }}>
                    영양 정보
                  </h3>
                  <p style={{ color: 'var(--gray-700)' }}>{product.nutritionInfo}</p>
                </div>
              )}

              {product.storageInfo && (
                <div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--gray-900)' }}>
                    보관 방법
                  </h3>
                  <p style={{ color: 'var(--gray-700)' }}>{product.storageInfo}</p>
                </div>
              )}

              {product.origin && (
                <div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--gray-900)' }}>
                    원산지
                  </h3>
                  <p style={{ color: 'var(--gray-700)' }}>{product.origin}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div 
        className="fixed bottom-0 left-0 right-0 p-4 border-t"
        style={{
          backgroundColor: 'var(--white)',
          borderColor: 'var(--gray-200)',
          zIndex: 50
        }}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-bold" style={{ color: 'var(--gray-900)' }}>
                총 금액:
              </span>
              <span className="text-2xl font-bold" style={{ color: 'var(--dalkomne-orange-dark)' }}>
                {formatPrice(product.price * quantity)}원
              </span>
            </div>
            <button 
              onClick={handleAddToCart}
              disabled={product.is_soldout || product.quantity === 0}
              className="dalkomne-button-primary px-8 py-3 text-lg font-bold"
            >
              {product.is_soldout ? '품절' : '장바구니 담기'}
            </button>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={showOptionsModal} 
        onClose={() => setShowOptionsModal(false)}
        title="배송 옵션 선택"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--gray-900)' }}>
              수령 방법을 선택해주세요
            </h3>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="deliveryType" 
                  value="pickup"
                  checked={deliveryType === 'pickup'}
                  onChange={(e) => setDeliveryType(e.target.value as any)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium" style={{ color: 'var(--gray-900)' }}>
                    매장 픽업
                  </div>
                  <div className="text-sm" style={{ color: 'var(--gray-600)' }}>
                    선택한 매장에서 직접 수령
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="deliveryType" 
                  value="delivery"
                  checked={deliveryType === 'delivery'}
                  onChange={(e) => setDeliveryType(e.target.value as any)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium" style={{ color: 'var(--gray-900)' }}>
                    배달 (잠실 내)
                  </div>
                  <div className="text-sm" style={{ color: 'var(--gray-600)' }}>
                    구매자 본인이 수령
                  </div>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="deliveryType" 
                  value="shipping"
                  checked={deliveryType === 'shipping'}
                  onChange={(e) => setDeliveryType(e.target.value as any)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium" style={{ color: 'var(--gray-900)' }}>
                    택배 발송
                  </div>
                  <div className="text-sm" style={{ color: 'var(--gray-600)' }}>
                    받는 분의 주소로 배송
                  </div>
                </div>
              </label>
            </div>
          </div>

          {deliveryType === 'pickup' && (
            <div>
              <h4 className="font-medium mb-2" style={{ color: 'var(--gray-900)' }}>
                픽업 매장 선택
              </h4>
              <select 
                value={selectedStore} 
                onChange={(e) => setSelectedStore(Number(e.target.value))}
                className="w-full p-3 border rounded-lg"
                style={{ borderColor: 'var(--gray-300)' }}
              >
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name} {store.address && `- ${store.address}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {deliveryType === 'shipping' && (
            <div className="space-y-4">
              <h4 className="font-medium" style={{ color: 'var(--gray-900)' }}>
                받는 분 정보
              </h4>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--gray-700)' }}>
                  받는 분 이름 *
                </label>
                <input 
                  type="text" 
                  value={recipientInfo.name}
                  onChange={(e) => setRecipientInfo({...recipientInfo, name: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  style={{ borderColor: 'var(--gray-300)' }}
                  placeholder="받는 분의 이름을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--gray-700)' }}>
                  전화번호 *
                </label>
                <input 
                  type="tel" 
                  value={recipientInfo.phone}
                  onChange={(e) => setRecipientInfo({...recipientInfo, phone: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  style={{ borderColor: 'var(--gray-300)' }}
                  placeholder="010-0000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--gray-700)' }}>
                  배송 주소 *
                </label>
                <textarea 
                  value={recipientInfo.address}
                  onChange={(e) => setRecipientInfo({...recipientInfo, address: e.target.value})}
                  className="w-full p-3 border rounded-lg h-20 resize-none"
                  style={{ borderColor: 'var(--gray-300)' }}
                  placeholder="받는 분의 주소를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--gray-700)' }}>
                  배송 메시지 (선택)
                </label>
                <input 
                  type="text" 
                  value={recipientInfo.message}
                  onChange={(e) => setRecipientInfo({...recipientInfo, message: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                  style={{ borderColor: 'var(--gray-300)' }}
                  placeholder="배송 시 전달할 메시지를 입력하세요"
                />
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button 
              onClick={() => setShowOptionsModal(false)}
              className="flex-1 px-4 py-3 border rounded-lg font-medium"
              style={{
                borderColor: 'var(--gray-300)',
                color: 'var(--gray-700)'
              }}
            >
              취소
            </button>
            <button 
              onClick={handleConfirmAddToCart}
              className="flex-1 dalkomne-button-primary px-4 py-3 font-medium"
            >
              장바구니에 담기
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default GiftProductDetailPage;