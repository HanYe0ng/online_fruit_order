// 페이지 제목 관리 유틸리티

export const updatePageTitle = (pageTitle?: string) => {
  const baseTitle = '달콤네'
  const fullTitle = pageTitle ? `${pageTitle} - ${baseTitle}` : `${baseTitle} - 신선하고 달콤한 과일 온라인 주문`
  
  document.title = fullTitle
  
  // Open Graph 메타 태그도 업데이트
  const ogTitleMeta = document.querySelector('meta[property="og:title"]')
  if (ogTitleMeta) {
    ogTitleMeta.setAttribute('content', fullTitle)
  }
  
  const twitterTitleMeta = document.querySelector('meta[property="twitter:title"]')
  if (twitterTitleMeta) {
    twitterTitleMeta.setAttribute('content', fullTitle)
  }
}

export const updatePageDescription = (description: string) => {
  // Description 메타 태그 업데이트
  const descriptionMeta = document.querySelector('meta[name="description"]')
  if (descriptionMeta) {
    descriptionMeta.setAttribute('content', description)
  }
  
  const ogDescriptionMeta = document.querySelector('meta[property="og:description"]')
  if (ogDescriptionMeta) {
    ogDescriptionMeta.setAttribute('content', description)
  }
  
  const twitterDescriptionMeta = document.querySelector('meta[property="twitter:description"]')
  if (twitterDescriptionMeta) {
    twitterDescriptionMeta.setAttribute('content', description)
  }
}

// 페이지별 기본 제목과 설명
export const PAGE_TITLES = {
  HOME: '',
  PRODUCTS: '오늘의 과일',
  GIFT_PRODUCTS: '과일선물',
  PRODUCT_DETAIL: '상품 상세',
  GIFT_PRODUCT_DETAIL: '선물 상세',
  CART: '장바구니',
  ORDER_COMPLETE: '주문 완료',
  ADMIN: '관리자',
  ADMIN_LOGIN: '관리자 로그인'
}

export const PAGE_DESCRIPTIONS = {
  HOME: '신선하고 달콤한 과일을 온라인으로 주문하세요. 당일배송, 신선보장!',
  PRODUCTS: '매일 신선하게 준비된 오늘의 과일들을 만나보세요.',
  GIFT_PRODUCTS: '소중한 분에게 전하는 달콤한 과일 선물세트',
  PRODUCT_DETAIL: '신선하고 맛있는 과일의 상세 정보를 확인하세요.',
  GIFT_PRODUCT_DETAIL: '특별한 과일 선물세트의 상세 정보를 확인하세요.',
  CART: '선택하신 신선한 과일들을 확인하고 주문하세요.',
  ORDER_COMPLETE: '주문이 성공적으로 완료되었습니다.',
  ADMIN: '달콤네 관리자 페이지',
  ADMIN_LOGIN: '달콤네 관리자 로그인'
}
