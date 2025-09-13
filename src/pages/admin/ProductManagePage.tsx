import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Button, Card, ErrorBoundary, ProductCardSkeleton, NetworkError } from '../../components/common'
import { AdminLayout, ProductForm, ProductList } from '../../components/admin'
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useToggleSoldOut } from '../../hooks/useProducts'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { Product, ProductFormData } from '../../types/product'
import { supabase } from '../../services/supabase'

type StoreLite = { id: number; name: string }

const ProductManagePage: React.FC = () => {
  const { user } = useAuth()
  const toast = useToast()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const isAdmin = user?.role === 'admin'
  const [stores, setStores] = useState<StoreLite[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>(undefined)

  // 디버깅을 위한 사용자 정보 출력
  useEffect(() => {
    console.log('=== 사용자 정보 디버깅 ===', {
      전체_user_객체: user,
      role: user?.role,
      store_id: user?.store_id,
      email: user?.email,
      isAdmin_계산결과: isAdmin,
      user가_존재하는가: !!user,
      role_타입: typeof user?.role,
      role_값: user?.role,
      'admin과_일치': user?.role === 'admin'
    })
  }, [user, isAdmin])

  // 관리자: 점포 목록 로드 + 초기 선택값(없음=전체)
  useEffect(() => {
    if (!isAdmin) {
      console.log('비관리자 - 사용자 점포 ID로 설정:', user?.store_id)
      setSelectedStoreId(user?.store_id ?? undefined)
      return
    }
    
    console.log('관리자 - 점포 목록 로드 시작')
    let mounted = true
    
    ;(async () => {
      try {
        console.log('🏪 Supabase에서 점포 목록 요청 시작...')
        const { data, error } = await supabase
          .from('stores')
          .select('id, name')
          .order('id', { ascending: true })
        
        console.log('📊 Supabase 응답:', { data, error })
        
        if (!mounted) {
          console.log('컴포너트가 언마운트됨 - 요청 취소')
          return
        }
        
        if (error) {
          console.error('❌ 점포 목록 로드 실패:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          setStores([])
        } else {
          console.log('✅ 점포 목록 로드 성공:', data)
          const storesData = (data as StoreLite[]) ?? []
          console.log('파싱된 점포 데이터:', storesData)
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
      console.log('점포 로드 useEffect 정리')
    }
  }, [isAdmin, user?.store_id])

  // 쿼리 및 뮤테이션 (관리자는 선택 점포 기준; 선택 없으면 전체)
  const queryKey = useMemo(() => ({ store_id: selectedStoreId }), [selectedStoreId])
  const { data: productsResponse, isLoading, error, refetch: originalRefetch } = useProducts(queryKey)
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()
  const toggleSoldOut = useToggleSoldOut()
  
  // refetch 함수도 메모이제이션
  const refetch = useCallback(() => {
    console.log('🔄 refetch 호출')
    return originalRefetch()
  }, [originalRefetch])

  const products = useMemo(() => productsResponse?.data || [], [productsResponse?.data])

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
        console.log('✅ 상품 등록 성공 - 모달 닫기 및 상태 정리')
        
        // 성공 후 상태 정리
        setIsFormOpen(false)
        setEditingProduct(null) // 편집 상태 초기화
        
        toast.success('상품 등록 완료', '새 상품이 성공적으로 등록되었습니다.')
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
    if (!window.confirm('정말로 이 상품을 삭제하시겠습니까?\n삭제된 상품은 복구할 수 없습니다.')) return
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
    console.log('🆕 새 상품 등록 버튼 클릭 - 상태 초기화')
    setEditingProduct(null) // 이전 편집 데이터 제거
    setIsFormOpen(true)
  }, [])

  // 폼 닫기
  const handleFormClose = useCallback(() => {
    console.log('❌ 폼 닫기 - 상태 초기화')
    setIsFormOpen(false)
    setEditingProduct(null) // 편집 데이터 제거
  }, [])

  // 에러 상태 처리
  if (error) {
    return (
      <AdminLayout>
        <NetworkError
          title="데이터를 불러올 수 없습니다"
          message="네트워크 연결을 확인하고 다시 시도해주세요."
          onRetry={() => refetch()}
        />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <ErrorBoundary>

        {/* 점포 선택 및 액션 버튼 - 더 작게 수정 */}
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
                      console.log('점포 선택 변경:', v)
                      setSelectedStoreId(v ? Number(v) : undefined)
                    }}
                  >
                    <option value="">전체 점포 ({stores.length}개)</option>
                    {stores.map(s => {
                      console.log('점포 옵션 렌더링:', s)
                      return (
                        <option key={s.id} value={s.id}>
                          {s.id}번 — {s.name}
                        </option>
                      )
                    })}
                  </select>
                  {/* 디버깅 정보 */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-500 mt-1">
                      점포 수: {stores.length}, 선택된 ID: {selectedStoreId ?? '없음'}
                    </div>
                  )}
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
            </div>
          </div>

          {/* 관리자 안내 배너 (점포 미선택 시) */}
          {isAdmin && !selectedStoreId && (
            <div 
              className="mt-3 p-3 rounded-lg"
              style={{ background: 'var(--dalkomne-orange-soft)', borderColor: 'var(--dalkomne-orange-light)' }}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">💡</span>
                <div className="text-sm" style={{ color: 'var(--dalkomne-orange-dark)' }}>
                  점포를 선택하면 해당 점포의 상품만 관리할 수 있습니다.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 통계 카드 */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="dalkomne-card p-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="dalkomne-card p-4 text-center">
              <div className="text-3xl mb-2">📦</div>
              <p className="text-2xl font-bold" style={{ color: 'var(--dalkomne-orange)' }}>{products.length}</p>
              <p className="text-sm" style={{ color: 'var(--gray-600)' }}>총 상품 수</p>
            </div>
            <div className="dalkomne-card p-4 text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
                {products.filter(p => !p.is_soldout).length}
              </p>
              <p className="text-sm" style={{ color: 'var(--gray-600)' }}>판매 중</p>
            </div>
            <div className="dalkomne-card p-4 text-center">
              <div className="text-3xl mb-2">❌</div>
              <p className="text-2xl font-bold" style={{ color: 'var(--error)' }}>
                {products.filter(p => p.is_soldout).length}
              </p>
              <p className="text-sm" style={{ color: 'var(--gray-600)' }}>품절</p>
            </div>
            <div className="dalkomne-card p-4 text-center">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-2xl font-bold" style={{ color: 'var(--dalkomne-orange)' }}>
                {products.reduce((sum, p) => sum + p.quantity, 0)}
              </p>
              <p className="text-sm" style={{ color: 'var(--gray-600)' }}>총 재고</p>
            </div>
          </div>
        )}

        {/* 상품 목록 */}
        <div className="dalkomne-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="text-2xl">🛍️</div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--gray-900)' }}>등록된 상품</h3>
              <p className="text-sm" style={{ color: 'var(--gray-600)' }}>상품을 클릭하여 수정하거나 상태를 변경하세요</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              onRefresh={refetch}
            />
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