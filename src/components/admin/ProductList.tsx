import React, { useState } from 'react'
import { Button, Card, Input, Loading, Modal } from '../common'
import { Product } from '../../types/product'

interface ProductListProps {
  products: Product[]
  isLoading: boolean
  onEdit: (product: Product) => void
  onDelete: (id: number) => void
  onToggleSoldOut: (id: number, isSoldOut: boolean) => void
  onRefresh: () => void
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  isLoading,
  onEdit,
  onDelete,
  onToggleSoldOut,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'today' | 'gift'>('all')
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: number | null }>({
    isOpen: false,
    productId: null
  })

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const productCategory = product.category || 'today' // 기본값 설정
    const matchesCategory = categoryFilter === 'all' || productCategory === categoryFilter
    return matchesSearch && matchesCategory
  }) || []

  const handleDeleteClick = (productId: number) => {
    setDeleteModal({ isOpen: true, productId })
  }

  const handleDeleteConfirm = () => {
    if (deleteModal.productId) {
      onDelete(deleteModal.productId)
      setDeleteModal({ isOpen: false, productId: null })
    }
  }

  if (isLoading) {
    return <Loading text="상품 목록을 불러오는 중..." />
  }

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="상품명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={onRefresh}>
            새로고침
          </Button>
        </div>
        
        {/* 카테고리 필터 */}
        <div className="flex gap-2">
          <Button
            variant={categoryFilter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('all')}
          >
            전체
          </Button>
          <Button
            variant={categoryFilter === 'today' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('today')}
          >
            🍎 오늘의 과일
          </Button>
          <Button
            variant={categoryFilter === 'gift' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('gift')}
          >
            🎁 과일선물
          </Button>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="relative">
            {/* 품절 오버레이 */}
            {product.is_soldout && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center z-10">
                <span className="bg-red-500 text-white px-3 py-1 rounded-lg font-medium">
                  품절
                </span>
              </div>
            )}

            {/* 상품 이미지 */}
            <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  이미지 없음
                </div>
              )}
            </div>

            {/* 상품 정보 */}
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-900 truncate flex-1">{product.name}</h3>
                {/* 카테고리 배지 */}
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  (product.category || 'today') === 'gift' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {(product.category || 'today') === 'gift' ? '🎁 선물' : '🍎 오늘'}
                </span>
              </div>
              <p className="text-lg font-bold text-blue-600">
                {product.price.toLocaleString()}원
              </p>
              <p className="text-sm text-gray-600">
                재고: {product.quantity}개
              </p>
            </div>

            {/* 액션 버튼 */}
            <div className="mt-4 space-y-2">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(product)}
                  className="flex-1"
                >
                  수정
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteClick(product.id)}
                  className="flex-1"
                >
                  삭제
                </Button>
              </div>
              <Button
                variant={product.is_soldout ? "secondary" : "outline"}
                size="sm"
                onClick={() => onToggleSoldOut(product.id, !product.is_soldout)}
                className="w-full"
              >
                {product.is_soldout ? '판매 재개' : '품절 처리'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">등록된 상품이 없습니다.</p>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, productId: null })}
        title="상품 삭제"
        confirmText="삭제"
        onConfirm={handleDeleteConfirm}
      >
        <p>정말로 이 상품을 삭제하시겠습니까?</p>
        <p className="text-sm text-gray-600 mt-2">삭제된 상품은 복구할 수 없습니다.</p>
      </Modal>
    </div>
  )
}

export default ProductList