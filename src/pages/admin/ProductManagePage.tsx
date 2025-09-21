import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Button, Card, ErrorBoundary, ProductCardSkeleton, NetworkError, Pagination } from '../../components/common'
import { AdminLayout, ProductForm, ProductList, ProductOrderManager } from '../../components/admin'
import { SessionRecoveryButton } from '../../components/admin/SessionRecoveryButton'
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useToggleSoldOut } from '../../hooks/useProducts'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { useConnectionStatus } from '../../hooks/useConnectionStatus'
import { Product, ProductFormData } from '../../types/product'
import { supabase } from '../../services/supabase'

type StoreLite = { id: number; name: string }

const ProductManagePage: React.FC = () => {
  const { user } = useAuth()
  const toast = useToast()
  const { isConnected, checkConnection } = useConnectionStatus()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isOrderManagerOpen, setIsOrderManagerOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12) // 한 페이지당 12개 상품
  
  // 카테고리 필터 상태 추가
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'today' | 'gift'>('all')

  const isAdmin = user?.role === 'admin'
  const [stores, setStores] = useState<StoreLite[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>(undefined)

  // 관리자: 점포 목록 로드 + 초기 선택값(없음=전체)
  useEffect(() => {
    if (!isAdmin) {
      setSelectedStoreId(user?.store_id ?? undefined)
      return
    }
    
    let mounted = true
    
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id, name')
          .order('id', { ascending: true })
        
        if (!mounted) return
        
        if (error) {
          console.error('❌ 점포 목록 로드 실패:', error)
          setStores([])
        } else {
          const storesData = (data as StoreLite[]) ?? []
          setStores(storesData)
        }
      } catch (exception) {
        console.error('❌ 점포 로드 예외:', exception)
        setStores([])
      }
      
      setSelectedStoreId(undefined) // 기본: 전체
    })()
    
    return () => { 
      mounted = false
    }
  }, [isAdmin, user?.store_id])

  // 점포 변경 시 페이지 리셋
  useEffect(() => {
    console.log('🏪 점포 변경으로 인한 페이지 리셋:', selectedStoreId)
    setCurrentPage(1)
  }, [selectedStoreId])

  // 카테고리 필터 변경 시 페이지 리셋
  useEffect(() => {
    console.log('🏷️ 카테고리 필터 변경으로 인한 페이지 리셋:', categoryFilter)
    setCurrentPage(1)
  }, [categoryFilter])

  // 쿼리 및 뮤테이션
  const queryKey = useMemo(() => ({ store_id: selectedStoreId }), [selectedStoreId])
  const paginationParams = useMemo(() => ({ 
    page: 1, // 서버에서는 모든 데이터를 가져오고 클라이언트에서 페이지네이션
    limit: 1000 // 충분히 큰 수로 설정
  }), [])
  
  const { data: productsResponse, isLoading, error, refetch: originalRefetch } = useProducts(queryKey, paginationParams)
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()
  const toggleSoldOut = useToggleSoldOut()
  
  const refetch = useCallback(() => {
    console.log('🔄 refetch 호출')
    return originalRefetch()
  }, [originalRefetch])

  // 카테고리 필터링 적용
  const filteredProducts = useMemo(() => {
    const allProducts = productsResponse?.data || []
    
    // 카테고리 필터링 (클라이언트 사이드)
    if (categoryFilter === 'all') {
      return allProducts
    }
    
    return allProducts.filter(product => {
      // category 필드가 있으면 그것을 우선 사용
      if (product.category) {
        return product.category === categoryFilter
      }
      
      // category 필드가 없으면 상품명으로 판단 (레거시 지원)
      const name = product.name.toLowerCase()
      if (categoryFilter === 'gift') {
        return name.includes('선물') || name.includes('기프트') || name.includes('gift')
      } else { // 'today'
        return !name.includes('선물') && !name.includes('기프트') && !name.includes('gift')
      }
    })
  }, [productsResponse?.data, categoryFilter])

  // 페이지네이션을 위한 현재 페이지 상품들 계산
  const currentPageProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage, itemsPerPage])

  // 총 페이지 수 계산
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [totalPages])

  // 점포 선택 변경 핸들러 - 페이지 리셋 포함
  const handleStoreChange = useCallback((storeId: number | undefined) => {
    console.log('🏪 점포 선택 변경:', storeId)
    setSelectedStoreId(storeId)
  }, [])

  // 카테고리 필터 변경 핸들러
  const handleCategoryFilterChange = useCallback((category: 'all' | 'today' | 'gift') => {
    console.log('🏷️ 카테고리 필터 변경:', category)
    setCategoryFilter(category)
  }, [])

  // 상품 등록
  const handleCreateProduct = useCallback(async (productData: ProductFormData) => {
    const sid = isAdmin ? selectedStoreId : user?.store_id
    if (!sid) {
      toast.error('점포 정보 오류', '등록할 점포를 선택하세요.')
      return
    }

    try {
      const result = await createProduct.mutateAsync({ productData, storeId: sid })
      if (result.error) {
        toast.error('상품 등록 실패', result.error)
      } else {
        setIsFormOpen(false)
        setEditingProduct(null)
        toast.success('상품 등록 완료', '새 상품이 성공적으로 등록되었습니다.')
        setCurrentPage(1)
        refetch()
      }
    } catch (error) {
      console.error('상품 등록 오류:', error)
      toast.error('상품 등록 오류', '예상치 못한 오류가 발생했습니다.')
    }
  }, [isAdmin, selectedStoreId, user?.store_id, toast, createProduct, refetch])

  // 상품 수정
  const handleUpdateProduct = useCallback(async (productData: ProductFormData) => {
    if (!editingProduct) return
    try {
      const result = await updateProduct.mutateAsync({ id: editingProduct.id, productData })
      if (result.error) {
        toast.error('상품 수정 실패', result.error)
      } else {
        setEditingProduct(null)
        setIsFormOpen(false)
        toast.success('상품 수정 완료', '상품 정보가 성공적으로 수정되었습니다.')
        refetch()
      }
    } catch {
      toast.error('상품 수정 오류', '예상치 못한 오류가 발생했습니다.')
    }
  }, [editingProduct, updateProduct, toast, refetch])

  // 상품 삭제
  const handleDeleteProduct = useCallback(async (id: number) => {
    try {
      const result = await deleteProduct.mutateAsync(id)
      if (result.error) {
        toast.error('상품 삭제 실패', result.error)
      } else {
        toast.success('상품 삭제 완료', '상품이 성공적으로 삭제되었습니다.')
        refetch()
      }
    } catch {
      toast.error('상품 삭제 오류', '예상치 못한 오류가 발생했습니다.')
    }
  }, [deleteProduct, toast, refetch])

  // 품절 상태 토글
  const handleToggleSoldOut = useCallback(async (id: number, isSoldOut: boolean) => {
    try {
      const result = await toggleSoldOut.mutateAsync({ id, isSoldOut })
      if (result.error) {
        toast.error('상태 변경 실패', result.error)
      } else {
        toast.success('상태 변경 완료', `상품이 ${isSoldOut ? '품절' : '판매 재개'} 상태로 변경되었습니다.`)
        refetch()
      }
    } catch {
      toast.error('상태 변경 오류', '예상치 못한 오류가 발생했습니다.')
    }
  }, [toggleSoldOut, toast, refetch])

  // 수정 버튼
  const handleEditClick = useCallback((product: Product) => {
    setEditingProduct(product)
    setIsFormOpen(true)
  }, [])

  // 새 상품 등록 버튼
  const handleNewProductClick = useCallback(() => {
    setEditingProduct(null)
    setIsFormOpen(true)
  }, [])

  // 폼 닫기
  const handleFormClose = useCallback(() => {
    setIsFormOpen(false)
    setEditingProduct(null)
  }, [])

  // 에러 상태 처리
  if (error) {
    return (
      <AdminLayout>
        <div className="dalkomne-card p-6 text-center max-w-md mx-auto mt-10">
          <div className="text-6xl mb-4">😵</div>
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--error)' }}>
            데이터를 불러올 수 없습니다
          </h3>
          <p className="text-gray-600 mb-6">
            네트워크 연결을 확인하고 다시 시도해주세요.
          </p>
          <button
            onClick={() => {
              checkConnection()
              refetch()
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <ErrorBoundary>
        {/* 점포 선택 및 액션 버튼 */}
        <div className="dalkomne-card p-4 mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)' }}
              >
                <span className="text-white text-sm">🏪</span>
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--gray-900)' }}>점포 선택 및 상품 등록</h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <div>
                  <select
                    className="border rounded-lg px-3 py-2 text-sm min-w-[180px] focus:outline-none focus:ring-2 focus:ring-orange-500"
                    style={{ borderColor: 'var(--gray-300)' }}
                    value={selectedStoreId ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      handleStoreChange(v ? Number(v) : undefined)
                    }}
                  >
                    <option value="">전체 점포 ({stores.length}개)</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.id}번 — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleNewProductClick}
                disabled={createProduct.isPending || (isAdmin && !selectedStoreId)}
                className="dalkomne-button-primary flex items-center space-x-1"
                style={{ fontSize: '14px' }}
              >
                <span>➕</span>
                <span>새 상품</span>
              </button>

              {/* 순서 관리 버튼 - 점포가 선택되었을 때만 표시 */}
              {selectedStoreId && (
                <button
                  onClick={() => setIsOrderManagerOpen(true)}
                  className="px-4 py-2 rounded-lg border-2 font-semibold transition-all duration-300 flex items-center space-x-1"
                  style={{
                    borderColor: 'var(--dalkomne-orange)',
                    color: 'var(--dalkomne-orange)',
                    background: 'var(--white)',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--dalkomne-orange)'
                    e.currentTarget.style.color = 'var(--white)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--white)'
                    e.currentTarget.style.color = 'var(--dalkomne-orange)'
                  }}
                >
                  <span>🔄</span>
                  <span>순서 관리</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 카테고리 필터 섹션 */}
        <div className="dalkomne-card p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-xl">🏷️</div>
              <h3 className="text-base font-bold" style={{ color: 'var(--gray-900)' }}>카테고리 필터</h3>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={categoryFilter === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleCategoryFilterChange('all')}
              >
                전체
              </Button>
              <Button
                variant={categoryFilter === 'today' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleCategoryFilterChange('today')}
              >
                🍎 오늘의 과일
              </Button>
              <Button
                variant={categoryFilter === 'gift' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleCategoryFilterChange('gift')}
              >
                🎁 과일선물
              </Button>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="dalkomne-card p-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="dalkomne-card p-4 text-center">
              <p className="text-2xl font-bold text-black">
                {filteredProducts.length}
              </p>
              <p className="text-sm" style={{ color: 'var(--gray-600)' }}>총 상품 수</p>
            </div>
            <div className="dalkomne-card p-4 text-center">
              <p className="text-2xl font-bold text-black">
                {filteredProducts.filter(p => !p.is_soldout).length}
              </p>
              <p className="text-sm" style={{ color: 'var(--gray-600)' }}>판매 중</p>
            </div>
            <div className="dalkomne-card p-4 text-center">
              <p className="text-2xl font-bold text-black">
                {filteredProducts.filter(p => p.is_soldout).length}
              </p>
              <p className="text-sm" style={{ color: 'var(--gray-600)' }}>품절</p>
            </div>
          </div>
        )}

        {/* 상품 목록 */}
        <div className="dalkomne-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🛍️</div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--gray-900)' }}>
                  등록된 상품
                  {categoryFilter !== 'all' && (
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      ({categoryFilter === 'today' ? '🍎 오늘의 과일' : '🎁 과일선물'})
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  전체 {filteredProducts.length}개 중 {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)}개 표시
                </p>
              </div>
            </div>
            
            {/* 현재 페이지 정보 */}
            {totalPages > 1 && (
              <div className="text-sm text-gray-600">
                {currentPage} / {totalPages} 페이지
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <ProductList
                products={currentPageProducts}
                isLoading={isLoading}
                onEdit={handleEditClick}
                onDelete={handleDeleteProduct}
                onToggleSoldOut={handleToggleSoldOut}
                onRefresh={refetch}
                onPageReset={() => setCurrentPage(1)}
              />
              
              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between">
                    {/* 정보 표시 */}
                    <div className="text-sm text-gray-600">
                      <span>
                        전체 <span className="font-medium text-gray-900">{filteredProducts.length}</span>개 중{' '}
                        <span className="font-medium text-gray-900">
                          {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length)}
                        </span>
                        -
                        <span className="font-medium text-gray-900">
                          {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                        </span>
                        개 표시
                      </span>
                    </div>

                    {/* 페이지 버튼 */}
                    <nav className="flex items-center space-x-1">
                      {/* 이전 페이지 */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        이전
                      </button>

                      {/* 페이지 번호 */}
                      <span className="px-4 py-2 text-sm font-medium">
                        {currentPage} / {totalPages}
                      </span>

                      {/* 다음 페이지 */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        다음
                      </button>
                    </nav>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gray-900)' }}>
                {categoryFilter === 'all' 
                  ? '등록된 상품이 없습니다'
                  : categoryFilter === 'gift'
                  ? '과일선물 상품이 없습니다'
                  : '오늘의 과일 상품이 없습니다'
                }
              </h3>
              <p className="text-gray-600 mb-4">
                새 상품을 등록해보세요!
              </p>
              <button
                onClick={handleNewProductClick}
                className="dalkomne-button-primary"
              >
                ➕ 새 상품 등록
              </button>
            </div>
          )}
        </div>

        {/* 상품 등록/수정 폼 */}
        <ProductForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
          isLoading={createProduct.isPending || updateProduct.isPending}
          initialData={editingProduct}
          title={editingProduct ? '상품 수정' : '새 상품 등록'}
        />

      </ErrorBoundary>
    </AdminLayout>
  )
}

export default ProductManagePage