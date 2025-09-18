import React from 'react'

interface PaginationProps {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number
}

function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  maxVisiblePages = 5
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const half = Math.floor(maxVisiblePages / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisiblePages - 1)
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const visiblePages = getVisiblePages()
  const showFirstPage = visiblePages[0] > 1
  const showLastPage = visiblePages[visiblePages.length - 1] < totalPages
  const showFirstEllipsis = visiblePages[0] > 2
  const showLastEllipsis = visiblePages[visiblePages.length - 1] < totalPages - 1

  const getButtonStyle = (isActive: boolean, isDisabled?: boolean) => {
    if (isDisabled) {
      return {
        background: 'var(--gray-100)',
        color: 'var(--gray-400)',
        cursor: 'not-allowed'
      }
    }
    
    if (isActive) {
      return {
        background: 'linear-gradient(135deg, var(--dalkomne-orange) 0%, var(--dalkomne-orange-dark) 100%)',
        color: 'var(--white)',
        boxShadow: 'var(--shadow-orange)'
      }
    }
    
    return {
      background: 'var(--white)',
      color: 'var(--gray-700)',
      border: '1px solid var(--gray-200)'
    }
  }

  const baseButtonClass = "min-w-[40px] h-10 flex items-center justify-center rounded-lg font-medium text-sm transition-all duration-200"

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* 페이지 정보 */}
      <div className="text-sm" style={{ color: 'var(--gray-600)' }}>
        전체 {totalItems}개 중 {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}개 표시
      </div>
      
      {/* 페이지네이션 버튼들 */}
      <div className="flex items-center space-x-1">
        {/* 이전 페이지 버튼 */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${baseButtonClass} ${currentPage === 1 ? '' : 'hover:bg-gray-50 hover:border-orange-400'}`}
          style={getButtonStyle(false, currentPage === 1)}
          aria-label="이전 페이지"
        >
          ←
        </button>

        {/* 첫 페이지 */}
        {showFirstPage && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className={`${baseButtonClass} ${currentPage === 1 ? '' : 'hover:bg-gray-50 hover:border-orange-400'}`}
              style={getButtonStyle(currentPage === 1)}
            >
              1
            </button>
            {showFirstEllipsis && (
              <span className="px-2" style={{ color: 'var(--gray-400)' }}>…</span>
            )}
          </>
        )}

        {/* 가시적인 페이지들 */}
        {visiblePages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`${baseButtonClass} ${currentPage === page ? '' : 'hover:bg-gray-50 hover:border-orange-400'}`}
            style={getButtonStyle(currentPage === page)}
          >
            {page}
          </button>
        ))}

        {/* 마지막 페이지 */}
        {showLastPage && (
          <>
            {showLastEllipsis && (
              <span className="px-2" style={{ color: 'var(--gray-400)' }}>…</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className={`${baseButtonClass} ${currentPage === totalPages ? '' : 'hover:bg-gray-50 hover:border-orange-400'}`}
              style={getButtonStyle(currentPage === totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        {/* 다음 페이지 버튼 */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${baseButtonClass} ${currentPage === totalPages ? '' : 'hover:bg-gray-50 hover:border-orange-400'}`}
          style={getButtonStyle(false, currentPage === totalPages)}
          aria-label="다음 페이지"
        >
          →
        </button>
      </div>

      {/* 모바일에서 빠른 페이지 이동 */}
      <div className="flex sm:hidden items-center space-x-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm rounded-lg hover:bg-gray-50"
          style={getButtonStyle(false, currentPage === 1)}
        >
          처음
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm rounded-lg hover:bg-gray-50"
          style={getButtonStyle(false, currentPage === totalPages)}
        >
          마지막
        </button>
      </div>
    </div>
  )
}

export default Pagination