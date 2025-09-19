import React from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  className?: string
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = ''
}) => {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const delta = 2 // 현재 페이지 앞뒤로 보여줄 페이지 수
    const range = []
    const rangeWithDots = []

    // 시작과 끝 계산
    const start = Math.max(2, currentPage - delta)
    const end = Math.min(totalPages - 1, currentPage + delta)

    for (let i = start; i <= end; i++) {
      range.push(i)
    }

    // 첫 페이지는 항상 표시
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    // 중간 범위 추가
    rangeWithDots.push(...range)

    // 마지막 페이지 처리
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  const visiblePages = getVisiblePages()

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* 정보 표시 */}
      <div className="text-sm text-gray-600">
        <span>
          전체 <span className="font-medium text-gray-900">{totalItems}</span>개 중{' '}
          <span className="font-medium text-gray-900">
            {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
          </span>
          -
          <span className="font-medium text-gray-900">
            {Math.min(currentPage * itemsPerPage, totalItems)}
          </span>
          개 표시
        </span>
      </div>

      {/* 페이지 버튼 */}
      <nav className="flex items-center space-x-1">
        {/* 이전 페이지 */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          이전
        </button>

        {/* 페이지 번호들 */}
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-gray-400">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-dalkomne-orange text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                style={
                  currentPage === page
                    ? { 
                        background: 'var(--dalkomne-orange)', 
                        color: 'white' 
                      }
                    : {}
                }
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* 다음 페이지 */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
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
  )
}

export default Pagination
