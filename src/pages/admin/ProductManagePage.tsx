import React, { useState } from 'react'
import { Button, Card, ErrorBoundary, ProductCardSkeleton, NetworkError } from '../../components/common'
import { ProductForm, ProductList } from '../../components/admin'
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useToggleSoldOut } from '../../hooks/useProducts'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { Product, ProductFormData } from '../../types/product'

const ProductManagePage: React.FC = () => {
  const { user } = useAuth()
  const toast = useToast()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // 쿼리 및 뮤테이션
  const { data: productsResponse, isLoading, error, refetch } = useProducts({ 
    store_id: user?.store_id || undefined 
  })
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()
  const toggleSoldOut = useToggleSoldOut()

  const products = productsResponse?.data || []

  // 상품 등록 (개선된 에러 처리)
  const handleCreateProduct = async (productData: ProductFormData) => {
    if (!user?.store_id) {
      toast.error('점포 정보 오류', '점포 정보가 없습니다. 다시 로그인해주세요.')
      return
    }

    try {
      const result = await createProduct.mutateAsync({ 
        productData, 
        storeId: user.store_id 
      })

      if (result.error) {
        toast.error('상품 등록 실패', result.error)
      } else {
        setIsFormOpen(false)
        toast.success('상품 등록 완료', '새 상품이 성공적으로 등록되었습니다.')
      }
    } catch (error) {
      toast.error('상품 등록 오류', '예상치 못한 오류가 발생했습니다.')
    }
  }

  // 상품 수정 (개선된 에러 처리)
  const handleUpdateProduct = async (productData: ProductFormData) => {
    if (!editingProduct) return

    try {
      const result = await updateProduct.mutateAsync({
        id: editingProduct.id,
        productData
      })

      if (result.error) {
        toast.error('상품 수정 실패', result.error)
      } else {
        setEditingProduct(null)
        setIsFormOpen(false)
        toast.success('상품 수정 완료', '상품 정보가 성공적으로 수정되었습니다.')
      }
    } catch (error) {
      toast.error('상품 수정 오류', '예상치 못한 오류가 발생했습니다.')
    }
  }

  // 상품 삭제 (개선된 에러 처리)
  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('정말로 이 상품을 삭제하시겠습니까?\n삭제된 상품은 복구할 수 없습니다.')) {
      return
    }

    try {
      const result = await deleteProduct.mutateAsync(id)

      if (result.error) {
        toast.error('상품 삭제 실패', result.error)
      } else {
        toast.success('상품 삭제 완료', '상품이 성공적으로 삭제되었습니다.')
      }
    } catch (error) {
      toast.error('상품 삭제 오류', '예상치 못한 오류가 발생했습니다.')
    }
  }

  // 품절 상태 토글 (개선된 에러 처리)
  const handleToggleSoldOut = async (id: number, isSoldOut: boolean) => {
    try {
      const result = await toggleSoldOut.mutateAsync({ id, isSoldOut })

      if (result.error) {
        toast.error('상태 변경 실패', result.error)
      } else {
        toast.success(
          '상태 변경 완료', 
          `상품이 ${isSoldOut ? '품절' : '판매 재개'} 상태로 변경되었습니다.`
        )
      }
    } catch (error) {
      toast.error('상태 변경 오류', '예상치 못한 오류가 발생했습니다.')
    }
  }

  // 수정 버튼 클릭
  const handleEditClick = (product: Product) => {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  // 새 상품 등록 버튼 클릭
  const handleNewProductClick = () => {
    setEditingProduct(null)
    setIsFormOpen(true)
  }

  // 폼 닫기
  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingProduct(null)
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">상품 관리</h1>
        </div>
        <NetworkError 
          title="데이터를 불러올 수 없습니다"
          message="네트워크 연결을 확인하고 다시 시도해주세요."
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">상품 관리</h1>
            <p className="text-gray-600 mt-1">
              {user?.role === 'admin' ? '전체 상품' : `${user?.store_id}번 점포 상품`} 관리
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={handleNewProductClick}
            disabled={createProduct.isPending}
          >
            새 상품 등록
          </Button>
        </div>

        {/* 통계 카드 */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card padding="md">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{products.length}</p>
                <p className="text-sm text-gray-600">총 상품 수</p>
              </div>
            </Card>
            <Card padding="md">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {products.filter(p => !p.is_soldout).length}
                </p>
                <p className="text-sm text-gray-600">판매 중</p>
              </div>
            </Card>
            <Card padding="md">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {products.filter(p => p.is_soldout).length}
                </p>
                <p className="text-sm text-gray-600">품절</p>
              </div>
            </Card>
            <Card padding="md">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {products.reduce((sum, p) => sum + p.quantity, 0)}
                </p>
                <p className="text-sm text-gray-600">총 재고</p>
              </div>
            </Card>
          </div>
        )}

        {/* 상품 목록 */}
        <Card>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {[...Array(6)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <ProductList
              products={products}
              isLoading={isLoading}
              onEdit={handleEditClick}
              onDelete={handleDeleteProduct}
              onToggleSoldOut={handleToggleSoldOut}
              onRefresh={() => refetch()}
            />
          )}
        </Card>

        {/* 상품 등록/수정 폼 */}
        <ProductForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
          isLoading={createProduct.isPending || updateProduct.isPending}
          initialData={editingProduct}
          title={editingProduct ? '상품 수정' : '새 상품 등록'}
        />
      </div>
    </ErrorBoundary>
  )
}

export default ProductManagePage