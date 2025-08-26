import React from 'react'
import { Button, Input } from '../common'
import { ORDER_STATUS } from '../../utils/constants'

interface OrderFiltersProps {
  selectedStatus: string
  onStatusChange: (status: string) => void
  searchTerm: string
  onSearchChange: (term: string) => void
  onRefresh: () => void
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  selectedStatus,
  onStatusChange,
  searchTerm,
  onSearchChange,
  onRefresh
}) => {
  const statusOptions = [
    { value: 'all', label: '전체', color: 'outline' },
    { value: ORDER_STATUS.RECEIVED, label: '접수됨', color: 'outline' },
    { value: ORDER_STATUS.DELIVERING, label: '배달중', color: 'outline' },
    { value: ORDER_STATUS.COMPLETED, label: '완료', color: 'outline' },
    { value: ORDER_STATUS.CANCELLED, label: '취소', color: 'outline' }
  ]

  return (
    <div className="space-y-4 mb-6">
      {/* 상태 필터 */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <Button
            key={option.value}
            variant={selectedStatus === option.value ? "primary" : "outline"}
            size="sm"
            onClick={() => onStatusChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* 검색 및 새로고침 */}
      <div className="flex space-x-3">
        <div className="flex-1">
          <Input
            placeholder="고객명, 주문번호, 아파트명으로 검색..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={onRefresh}>
          새로고침
        </Button>
      </div>
    </div>
  )
}

export default OrderFilters