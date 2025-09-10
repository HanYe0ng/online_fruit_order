import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card } from '../../components/common'
import { ROUTES } from '../../utils/constants'
import { useToast } from '../../hooks/useToast'

interface OrderCompleteData {
  totalAmount: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  customerName: string
  orderId: string | number
  timestamp: string
}

const OrderCompletePage: React.FC = () => {
  const [logoError, setLogoError] = useState(false)
  const [orderData, setOrderData] = useState<OrderCompleteData | null>(null)
  const toast = useToast()

  // 계좌 정보
  const bankInfo = {
    bankName: '기업은행',
    accountNumber: '000000000000'
  }

  useEffect(() => {
    // 주문 완료 데이터 불러오기
    const savedData = localStorage.getItem('orderCompleteData')
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        setOrderData(data)
        // 데이터 사용 후 삭제 (보안상 이유)
        localStorage.removeItem('orderCompleteData')
      } catch (error) {
        console.error('Failed to parse order data:', error)
      }
    }
  }, [])

  // 계좌번호 복사
  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(bankInfo.accountNumber)
      toast.success('복사 완료!', '계좌번호가 클립보드에 복사되었습니다.', {
        duration: 2000
      })
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = bankInfo.accountNumber
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('복사 완료!', '계좌번호가 복사되었습니다.', {
        duration: 2000
      })
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--gray-50)' }}>
      {/* 헤더 */}
      <header className="" style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        borderBottom: '1px solid var(--gray-100)'
      }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-center">
            <Link to={ROUTES.HOME} className="hover:opacity-80 transition-opacity">
              <div className="text-center flex flex-col items-center">
                {!logoError ? (
                  <img 
                    src="/logo.png" 
                    alt="달콤네 로고" 
                    className="h-12 w-auto object-contain mb-1"
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
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="max-w-lg w-full space-y-6">
          <div className="dalkomne-card text-center py-8 px-6">
            {/* 성공 아이콘 */}
            <div 
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-peach) 100%)' }}
            >
              <span className="text-4xl text-white">✅</span>
            </div>
          
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--gray-900)' }}>주문 완료!</h1>
            <p className="mb-6" style={{ color: 'var(--gray-600)' }}>
              주문이 성공적으로 접수되었습니다.<br />
              곧 신선한 과일을 배달해드릴게요!
            </p>

            {/* 주문 정보 및 결제 금액 */}
            {orderData && (
              <div 
                className="p-4 rounded-lg mb-6 text-left"
                style={{ background: 'var(--dalkomne-cream)' }}
              >
                <h3 className="font-semibold mb-3 text-center" style={{ color: 'var(--dalkomne-orange-dark)' }}>
                  💳 결제 정보
                </h3>
                
                {/* 주문 상품 리스트 */}
                <div className="mb-4">
                  <h4 className="font-medium mb-2 text-sm" style={{ color: 'var(--gray-700)' }}>주문 상품</h4>
                  <div className="space-y-1">
                    {orderData.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm" style={{ color: 'var(--gray-600)' }}>
                        <span>{item.name} x {item.quantity}</span>
                        <span>{(item.price * item.quantity).toLocaleString()}원</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 총 결제 금액 */}
                <div className="border-t pt-3" style={{ borderColor: 'var(--dalkomne-orange-light)' }}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold" style={{ color: 'var(--gray-900)' }}>총 결제 금액</span>
                    <span className="text-xl font-bold" style={{ color: 'var(--dalkomne-orange)' }}>
                      {orderData.totalAmount.toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 계좌이체 정보 */}
          <div className="dalkomne-card p-6">
            <h3 className="font-semibold mb-4 text-center" style={{ color: 'var(--dalkomne-orange-dark)' }}>
              🏦 계좌이체 정보
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'var(--gray-50)' }}>
                <div>
                  <div className="font-medium" style={{ color: 'var(--gray-900)' }}>은행명</div>
                  <div className="text-lg font-semibold" style={{ color: 'var(--dalkomne-orange)' }}>{bankInfo.bankName}</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'var(--gray-50)' }}>
                <div className="flex-1">
                  <div className="font-medium mb-1" style={{ color: 'var(--gray-900)' }}>계좌번호</div>
                  <div className="text-lg font-mono font-semibold" style={{ color: 'var(--dalkomne-orange)' }}>
                    {bankInfo.accountNumber}
                  </div>
                </div>
                <button
                  onClick={copyAccountNumber}
                  className="ml-3 px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm"
                  style={{
                    background: 'var(--dalkomne-orange)',
                    color: 'var(--white)',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--dalkomne-orange-dark)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--dalkomne-orange)'
                  }}
                >
                  📋 복사하기
                </button>
              </div>
            </div>
          </div>

          {/* 안내 정보 */}
          <div className="dalkomne-card p-6">
            <h3 className="font-semibold mb-3" style={{ color: 'var(--dalkomne-orange)' }}>
              📢 배달 안내
            </h3>
            <div className="text-sm space-y-2" style={{ color: 'var(--gray-700)' }}>
              <div className="flex items-center space-x-2">
                <span>•</span>
                <span>배달은 주문마감 후 당일 오후 5시부터 순차적으로 진행됩니다.</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>•</span>
                <span>계좌이체 시 입금자명을 주문자명으로 기재해주세요.</span>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="space-y-3">
            <Link to={ROUTES.HOME} className="block">
              <button className="dalkomne-button-primary w-full py-3">
                🏠 홈으로 돌아가기
              </button>
            </Link>
            <Link to={ROUTES.PRODUCTS} className="block">
              <button 
                className="w-full py-3 rounded-lg font-semibold border-2 transition-all duration-300"
                style={{
                  borderColor: 'var(--dalkomne-orange)',
                  color: 'var(--dalkomne-orange)',
                  background: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--dalkomne-orange)'
                  e.currentTarget.style.color = 'var(--white)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--dalkomne-orange)'
                }}
              >
                🛍 다른 상품 더 보기
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default OrderCompletePage