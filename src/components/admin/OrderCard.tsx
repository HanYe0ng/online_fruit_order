import React, { useState } from 'react'
import { Button, Card, Modal } from '../common'
import { useOrderDetails, useUpdateOrderStatus } from '../../hooks/useOrder'
import { ORDER_STATUS } from '../../utils/constants'
import { OrderView, OrderDetail } from '../../types/order'

interface OrderCardProps {
  order: OrderView
  onRefresh: () => void
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onRefresh }) => {
  const [showDetails, setShowDetails] = useState(false)
  const { data: orderDetailsResponse } = useOrderDetails(order.order_id)
  const updateOrderStatus = useUpdateOrderStatus()

  const orderDetails: OrderDetail[] = (orderDetailsResponse?.data || []) as OrderDetail[]

  // 총 금액 계산
  const totalAmount = orderDetails.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case ORDER_STATUS.RECEIVED: return 'bg-blue-100 text-blue-800'
      case ORDER_STATUS.DELIVERING: return 'bg-yellow-100 text-yellow-800'
      case ORDER_STATUS.COMPLETED: return 'bg-green-100 text-green-800'
      case ORDER_STATUS.CANCELLED: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // 상태 변경
  const handleStatusChange = async (newStatus: string) => {
    const result = await updateOrderStatus.mutateAsync({
      orderId: order.order_id,
      status: newStatus
    })

    if (result.error) {
      alert(result.error)
    } else {
      onRefresh()
    }
  }

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold text-gray-900">#{order.order_id}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
              {order.is_paid && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  결제완료
                </span>
              )}
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p>📍 {order.apartment_name} {order.apartment_dong}동 {order.apartment_ho}호</p>
              <p>👤 {order.customer_name}</p>
              <p>📞 {order.customer_phone}</p>
              <p>🕐 {formatTime(order.created_at)}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-lg font-bold text-blue-600">
              {totalAmount.toLocaleString()}원
            </p>
            <p className="text-xs text-gray-500">
              {orderDetails.length}개 상품
            </p>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(true)}
            className="flex-1"
          >
            상세보기
          </Button>

          {order.status === ORDER_STATUS.RECEIVED && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange(ORDER_STATUS.DELIVERING)}
              loading={updateOrderStatus.isPending}
              className="flex-1"
            >
              배달시작
            </Button>
          )}

          {order.status === ORDER_STATUS.DELIVERING && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange(ORDER_STATUS.COMPLETED)}
              loading={updateOrderStatus.isPending}
              className="flex-1"
            >
              배달완료
            </Button>
          )}

          {order.status !== ORDER_STATUS.COMPLETED && order.status !== ORDER_STATUS.CANCELLED && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleStatusChange(ORDER_STATUS.CANCELLED)}
              loading={updateOrderStatus.isPending}
            >
              취소
            </Button>
          )}
        </div>
      </Card>

      {/* 주문 상세 모달 */}
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title={`주문 상세 #${order.order_id}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* 고객 정보 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">고객 정보</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">이름:</span>
                  <span className="ml-2 font-medium">{order.customer_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">연락처:</span>
                  <span className="ml-2 font-medium">{order.customer_phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">주소:</span>
                  <span className="ml-2 font-medium">
                    {order.apartment_name} {order.apartment_dong}동 {order.apartment_ho}호
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 주문 상품 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">주문 상품</h3>
            <div className="space-y-3">
              {orderDetails.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {item.products?.image_url && (
                      <img
                        src={item.products.image_url}
                        alt={item.products.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <p className="font-medium">{item.products?.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.unit_price.toLocaleString()}원 × {item.quantity}개
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold">
                    {(item.unit_price * item.quantity).toLocaleString()}원
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 주문 요약 */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">총 금액</span>
              <span className="text-xl font-bold text-blue-600">
                {totalAmount.toLocaleString()}원
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-600">주문 시간</span>
              <span className="text-sm text-gray-600">{formatTime(order.created_at)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-gray-600">결제 상태</span>
              <span className={`text-sm font-medium ${order.is_paid ? 'text-green-600' : 'text-red-600'}`}>
                {order.is_paid ? '결제완료' : '미결제'}
              </span>
            </div>
          </div>

          {/* 상태 변경 버튼들 */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">주문 상태 변경</h4>
            <div className="flex space-x-2">
              {order.status === ORDER_STATUS.RECEIVED && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleStatusChange(ORDER_STATUS.DELIVERING)
                    setShowDetails(false)
                  }}
                  loading={updateOrderStatus.isPending}
                >
                  배달 시작
                </Button>
              )}
              {order.status === ORDER_STATUS.DELIVERING && (
                <Button
                  variant="primary"
                  onClick={() => {
                    handleStatusChange(ORDER_STATUS.COMPLETED)
                    setShowDetails(false)
                  }}
                  loading={updateOrderStatus.isPending}
                >
                  배달 완료
                </Button>
              )}
              {order.status !== ORDER_STATUS.COMPLETED && order.status !== ORDER_STATUS.CANCELLED && (
                <Button
                  variant="danger"
                  onClick={() => {
                    handleStatusChange(ORDER_STATUS.CANCELLED)
                    setShowDetails(false)
                  }}
                  loading={updateOrderStatus.isPending}
                >
                  주문 취소
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default OrderCard