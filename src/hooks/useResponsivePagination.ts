import { useState, useEffect, useCallback } from 'react'

interface ResponsivePaginationConfig {
  currentPage: number
  totalItems: number
  itemsPerPage: number
}

/**
 * 반응형 페이지네이션을 위한 커스텀 훅
 * 화면 크기에 따라 적절한 상품 표시 개수를 자동으로 계산합니다.
 */
export function useResponsivePagination(totalItems: number) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(8) // 기본값

  const calculateItemsPerPage = useCallback(() => {
    if (typeof window === 'undefined') return
    
    const width = window.innerWidth
    const height = window.innerHeight
    
    // 화면 크기별 기본 그리드 설정
    let cols: number
    let rows: number
    
    if (width < 640) {
      // 모바일: 2열
      cols = 2
      rows = Math.floor((height - 400) / 280) // 상품 카드 높이 약 280px + 여백 고려
      rows = Math.max(2, Math.min(rows, 4)) // 최소 2행, 최대 4행
    } else if (width < 768) {
      // 작은 태블릿: 2-3열
      cols = 2
      rows = Math.floor((height - 400) / 320)
      rows = Math.max(2, Math.min(rows, 3))
    } else if (width < 1024) {
      // 태블릿: 3열
      cols = 3
      rows = Math.floor((height - 400) / 340)
      rows = Math.max(2, Math.min(rows, 3))
    } else if (width < 1280) {
      // 작은 데스크탑: 3-4열
      cols = 3
      rows = Math.floor((height - 400) / 360)
      rows = Math.max(2, Math.min(rows, 3))
    } else {
      // 큰 데스크탑: 4열
      cols = 4
      rows = Math.floor((height - 400) / 380)
      rows = Math.max(2, Math.min(rows, 3))
    }
    
    const calculatedItemsPerPage = cols * rows
    
    // 최소 4개, 최대 24개로 제한
    const finalItemsPerPage = Math.max(4, Math.min(calculatedItemsPerPage, 24))
    
    setItemsPerPage(finalItemsPerPage)
  }, [])

  useEffect(() => {
    // 초기 계산
    calculateItemsPerPage()

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', calculateItemsPerPage)
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('resize', calculateItemsPerPage)
    }
  }, [calculateItemsPerPage])

  // 페이지 유효성 검사
  useEffect(() => {
    if (totalItems > 0) {
      const maxPage = Math.ceil(totalItems / itemsPerPage)
      if (currentPage > maxPage) {
        setCurrentPage(Math.max(1, maxPage))
      }
    }
  }, [totalItems, itemsPerPage, currentPage])

  // 현재 페이지의 아이템들 계산
  const getCurrentPageItems = useCallback(<T,>(items: T[]): T[] => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return items.slice(startIndex, endIndex)
  }, [currentPage, itemsPerPage])

  // 페이지 변경
  const handlePageChange = useCallback((page: number) => {
    const maxPage = Math.ceil(totalItems / itemsPerPage)
    const validPage = Math.max(1, Math.min(page, maxPage))
    setCurrentPage(validPage)
    
    // 페이지 변경 시 맨 위로 스크롤
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [totalItems, itemsPerPage])

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    getCurrentPageItems,
    handlePageChange,
    paginationConfig: {
      currentPage,
      totalItems,
      itemsPerPage
    }
  }
}