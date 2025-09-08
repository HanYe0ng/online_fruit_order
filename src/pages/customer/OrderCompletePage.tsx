import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card } from '../../components/common'
import { ROUTES } from '../../utils/constants'

const OrderCompletePage: React.FC = () => {
  const [logoError, setLogoError] = useState(false)

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
        <div className="max-w-md w-full">
          <div className="dalkomne-card text-center py-12 px-6">
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

            {/* 안내 정보 */}
            <div 
              className="p-4 rounded-lg mb-6 text-left"
              style={{ background: 'var(--gray-50)' }}
            >
              <h3 className="font-semibold mb-3" style={{ color: 'var(--dalkomne-orange)' }}>
                📞 결제 안내
              </h3>
              <div className="text-sm space-y-2" style={{ color: 'var(--gray-700)' }}>
                <div className="flex items-center space-x-2">
                  <span>•</span>
                  <span>배달 시 현금 또는 계좌이체로 결제</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>•</span>
                  <span>곧 담당자가 연락드릴 예정입니다</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>•</span>
                  <span>배달 예상 시간: 1-2시간</span>
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
                  🛒 다른 상품 더 보기
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default OrderCompletePage