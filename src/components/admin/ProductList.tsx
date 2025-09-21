import React, { useState, useCallback } from 'react'
import { Button, Input, Loading, Modal } from '../common'
import { Product } from '../../types/product'
import ProductCard from './ProductCard'

interface ProductListProps {
  products: Product[]
  isLoading: boolean
  onEdit: (product: Product) => void
  onDelete: (id: number) => void
  onToggleSoldOut: (id: number, isSoldOut: boolean) => void
  onRefresh: () => void
  onPageReset?: () => void
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
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: number | null }>({
    isOpen: false,
    productId: null
  })

  // 검색 필터링만 클라이언트에서 처리 (카테고리 필터링은 서버에서 처리)
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 삭제 버튼 클릭 처리
  const handleDeleteClick = useCallback((productId: number) => {
    console.log('🗑️ 삭제 버튼 클릭:', productId)
    setDeleteModal({ isOpen: true, productId })
  }, [])

  // 삭제 확인 처리
  const handleDeleteConfirm = useCallback(() => {
    console.log('✅ 삭제 확인:', deleteModal.productId)
    if (deleteModal.productId) {
      onDelete(deleteModal.productId)
      setDeleteModal({ isOpen: false, productId: null })
    }
  }, [deleteModal.productId, onDelete])

  // 모달 닫기 처리
  const handleDeleteModalClose = useCallback(() => {
    setDeleteModal({ isOpen: false, productId: null })
  }, [])

  // 검색어 변경 처리
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  if (isLoading) {
    return <Loading text="상품 목록을 불러오는 중..." />
  }

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="상품명으로 검색..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <Button variant="outline" onClick={onRefresh}>
          새로고침
        </Button>
      </div>

      {/* 상품 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={onEdit}
            onDelete={handleDeleteClick}
            onToggleSoldOut={onToggleSoldOut}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchTerm ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'}
          </p>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteModalClose}
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