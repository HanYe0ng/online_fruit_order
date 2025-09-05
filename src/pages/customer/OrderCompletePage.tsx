import React from 'react'
import { Link } from 'react-router-dom'
import { Button, Card } from '../../components/common'
import { ROUTES } from '../../utils/constants'

const OrderCompletePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-center">
            <Link to={ROUTES.HOME} className="hover:opacity-80 transition-opacity">
              <div className="text-center">
                <h1 className="text-xl font-bold text-gray-900">🍎 달콤네</h1>
                <p className="text-sm text-gray-600">집까지 배달해드립니다!</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="max-w-md w-full mx-4">
          <Card className="text-center py-12">
            {/* 성공 아이콘 */}
            <div className="text-6xl mb-4">✅</div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">주문 완료!</h1>
          <p className="text-gray-600 mb-6">
            주문이 성공적으로 접수되었습니다.<br />
            곧 신선한 과일을 배달해드릴게요!
          </p>

          {/* 안내 정보 */}
          <Card className="bg-blue-50 border-blue-200 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">📞 결제 안내</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• 배달 시 현금 또는 계좌이체로 결제</p>
              <p>• 곧 담당자가 연락드릴 예정입니다</p>
              <p>• 배달 예상 시간: 1-2시간</p>
            </div>
          </Card>

          {/* 액션 버튼 */}
          <div className="space-y-3">
            <Link to={ROUTES.HOME} className="block">
              <Button variant="primary" className="w-full">
                홈으로 돌아가기
              </Button>
            </Link>
            <Link to={ROUTES.PRODUCTS} className="block">
              <Button variant="outline" className="w-full">
                다른 상품 더 보기
              </Button>
            </Link>
          </div>
        </Card>
        </div>
      </main>
    </div>
  )
}

export default OrderCompletePage