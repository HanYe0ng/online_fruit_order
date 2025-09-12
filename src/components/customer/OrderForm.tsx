import React, { useState, useEffect } from 'react'
import { Button, Input, Card, Modal } from '../common'
import { useSearchApartments, useCreateOrder } from '../../hooks/useOrder'
import { orderService } from '../../services/order'
import { useCartStore } from '../../stores/cartStore'
import { useToast } from '../../hooks/useToast'
import { OrderFormData } from '../../types/order'

interface OrderFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// 로컬 폼 타입에 memo 추가
type OrderFormWithMemo = OrderFormData & { memo: string }

const OrderForm: React.FC<OrderFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<OrderFormWithMemo>({
    customer_name: '',
    customer_phone: '',
    apartment_name: '',
    dong: '',
    ho: '',
    memo: '' // 추가
  })
  const [selectedApartmentId, setSelectedApartmentId] = useState<number | null>(null)
  const [apartmentQuery, setApartmentQuery] = useState('')
  const [showApartmentList, setShowApartmentList] = useState(false)
  const [errors, setErrors] = useState<Partial<OrderFormData>>({})

  const { items, selectedStoreId, getTotalPrice, clearCart } = useCartStore()
  const { data: apartmentsResponse, isLoading: apartmentsLoading } = useSearchApartments(apartmentQuery)
  const createOrder = useCreateOrder()
  const toast = useToast()

  const apartments = apartmentsResponse?.data || []

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: Partial<OrderFormData> = {}

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = '이름을 입력해주세요'
    }

    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = '연락처를 입력해주세요'
    } else if (!/^010-?\d{4}-?\d{4}$/.test(formData.customer_phone.replace(/[- ]/g, ''))) {
      newErrors.customer_phone = '올바른 연락처를 입력해주세요 (010-0000-0000)'
    }

    if (!selectedApartmentId || !formData.apartment_name) {
      newErrors.apartment_name = '아파트를 선택해주세요'
    }

    if (!formData.dong.trim()) {
      newErrors.dong = '동을 입력해주세요'
    }

    if (!formData.ho.trim()) {
      newErrors.ho = '호를 입력해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 아파트 선택
  const handleApartmentSelect = (apartment: any) => {
    setSelectedApartmentId(apartment.id)
    setFormData(prev => ({ ...prev, apartment_name: apartment.name }))
    setApartmentQuery(apartment.name)
    setShowApartmentList(false)
    setErrors(prev => ({ ...prev, apartment_name: undefined }))
  }

  // 입력 필드 변경 시 에러 제거
  const handleInputChange = (field: keyof OrderFormWithMemo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof OrderFormData]) {
      setErrors(prev => ({ ...prev, [field as keyof OrderFormData]: undefined }))
    }
  }

  // 주문 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.warning('입력 확인 필요', '모든 필드를 올바르게 입력해주세요.')
      return
    }

    if (!selectedApartmentId || !selectedStoreId) {
      toast.error('주문 정보 오류', '아파트와 점포 정보가 필요합니다.')
      return
    }

    if (items.length === 0) {
      toast.error('주문 상품 없음', '주문할 상품을 선택해주세요.')
      return
    }

    try {
      // 아파트 세대 찾기 또는 생성
      const { data: apartmentUnit, error: unitError } = await orderService.findOrCreateApartmentUnit(
        selectedApartmentId,
        formData.dong,
        formData.ho
      )

      if (unitError || !apartmentUnit) {
        toast.error('주소 처리 실패', unitError || '아파트 세대 정보 처리 중 오류가 발생했습니다.')
        return
      }

      // 주문 데이터 생성 (memo 포함)
      const orderData: any = {
        store_id: selectedStoreId,
        apartment_unit_id: apartmentUnit.id,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        memo: formData.memo, // ✅ 메모 전달 (백엔드에 memo 컬럼 존재 시 저장)
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price
        }))
      }

      const result = await createOrder.mutateAsync(orderData)

      if (result.error) {
        if (result.error.includes('재고가 부족')) {
          toast.error('재고 부족', result.error)
        } else if (result.error.includes('품절')) {
          toast.error('상품 품절', result.error)
        } else if (result.error.includes('재고 차감')) {
          toast.error('주문 처리 오류', '재고 업데이트 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.')
        } else {
          toast.error('주문 처리 실패', result.error)
        }
      } else {
        // 주문 완료 정보를 임시 저장 (memo 포함)
        const orderCompleteData = {
          totalAmount: getTotalPrice(),
          items: items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price
          })),
          customerName: formData.customer_name,
          memo: formData.memo, // ✅
          orderId: result.data?.id || Date.now(),
          timestamp: new Date().toISOString()
        }
        localStorage.setItem('orderCompleteData', JSON.stringify(orderCompleteData))
        
        toast.success('주문 완료!', '주문이 성공적으로 접수되었습니다.', {
          duration: 3000
        })
        clearCart()
        onSuccess()
      }
    } catch (error) {
      console.error('Order submission error:', error)
      toast.error('주문 처리 오류', '예상치 못한 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      apartment_name: '',
      dong: '',
      ho: '',
      memo: '' // ✅ 리셋
    })
    setSelectedApartmentId(null)
    setApartmentQuery('')
    setErrors({})
    setShowApartmentList(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="주문 정보 입력" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* 고객 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="(이름(송금 보내는 이))"
            value={formData.customer_name}
            onChange={(e) => handleInputChange('customer_name', e.target.value)}
            placeholder="이름을 입력하세요"
            error={errors.customer_name}
            required
          />
          <Input
            label="연락처"
            type="tel"
            value={formData.customer_phone}
            onChange={(e) => handleInputChange('customer_phone', e.target.value)}
            placeholder="010-0000-0000"
            error={errors.customer_phone}
            required
          />
        </div>

        {/* 아파트 검색 */}
        <div className="relative">
          <Input
            label="아파트"
            value={apartmentQuery}
            onChange={(e) => {
              setApartmentQuery(e.target.value)
              setShowApartmentList(true)
              handleInputChange('apartment_name', e.target.value)
            }}
            placeholder="아파트명을 검색하세요"
            error={errors.apartment_name}
            required
          />
          
          {/* 아파트 검색 결과 */}
          {showApartmentList && apartmentQuery.length > 1 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
              {apartmentsLoading ? (
                <div className="p-3 text-center text-gray-500">검색 중...</div>
              ) : apartments.length > 0 ? (
                apartments.map((apartment) => (
                  <button
                    key={apartment.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0 focus:outline-none focus:bg-gray-100"
                    onClick={() => handleApartmentSelect(apartment)}
                  >
                    <div className="font-medium">{apartment.name}</div>
                    {apartment.address && (
                      <div className="text-sm text-gray-600">{apartment.address}</div>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-gray-500">검색 결과가 없습니다</div>
              )}
            </div>
          )}
        </div>

        {/* 동호수 */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="동"
            value={formData.dong}
            onChange={(e) => handleInputChange('dong', e.target.value)}
            placeholder="예: 101"
            error={errors.dong}
            required
          />
          <Input
            label="호"
            value={formData.ho}
            onChange={(e) => handleInputChange('ho', e.target.value)}
            placeholder="예: 1001"
            error={errors.ho}
            required
          />
        </div>

        {/* 메모 (공동현관 비밀번호/요청사항) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            메모 (공동현관 비밀번호/요청사항)
          </label>
          <textarea
            value={formData.memo}
            onChange={(e) => handleInputChange('memo', e.target.value)}
            placeholder="예: 공동현관 1234#, 경비실 앞에 두세요 / 초인종 누르지 말아주세요 등"
            rows={3}
            maxLength={300}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 주문 요약 */}
        <Card className="bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-3">주문 요약</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span>{item.product.name} x {item.quantity}</span>
                <span>{(item.product.price * item.quantity).toLocaleString()}원</span>
              </div>
            ))}
            <hr className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>총 금액</span>
              <span className="text-blue-600">{getTotalPrice().toLocaleString()}원</span>
            </div>
          </div>
        </Card>

        {/* 주의사항 */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">📢 주문 전 확인사항</p>
            <ul className="text-xs space-y-1">
              <li>• 주문완료를 누르시고 마감전(오후 4시)까지 입금해 주셔야 배송이 가능합니다.</li>
              <li>• 배달은 오후 4시 30분 부터 순차적으로 배달이 시작됩니다.</li>
              <li>• 연락처와 주문자 성함을 정확히 확인하여 작성해 주세요.</li>
              <li>• 계좌이체시 주문자 성함으로 작성하여 이체해 주세요</li>
            </ul>
          </div>
        </Card>

        {/* 버튼 */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            취소
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            loading={createOrder.isPending}
            disabled={items.length === 0}
          >
            주문 완료
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default OrderForm
