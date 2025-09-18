import { GiftProduct, StoreInfo } from '../types/product'

export const mockStores: StoreInfo[] = [
  {
    id: 1,
    name: "달콤네 강남점",
    address: "서울특별시 강남구 역삼동 123-45",
    phone: "02-1234-5678"
  },
  {
    id: 2,
    name: "달콤네 홍대점", 
    address: "서울특별시 마포구 홍대동 67-89",
    phone: "02-9876-5432"
  },
  {
    id: 3,
    name: "달콤네 신촌점",
    address: "서울특별시 서대문구 신촌동 12-34",
    phone: "02-5555-7777"
  }
]

export const mockGiftProducts: GiftProduct[] = [
  {
    id: 999,
    store_id: 1, // 실제 DB의 첫 번째 점포 ID에 대응 (동적으로 대체 가능)
    name: "달콤네 추천 실속세트 9과",
    price: 53000,
    discount_price: 47700, // 할인가 (10% 할인)
    discount_rate: 10, // 할인율
    display_order: 1, // 표시 순서
    originalPrice: 59000,
    discount: 10,
    quantity: 15,
    image_url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400",
    is_soldout: false,
    category: 'gift',
    description: "사과, 배 혼합세트로 당도가 높아서 맛있는 과일들로만 구성된 9과 상품입니다. 심혈을 기울여 준비한 추석 과일 세트입니다.",
    tags: ["추석특가", "혼합세트", "실속형"],
    rating: 4.8,
    reviewCount: 34,
    images: [
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600",
      "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=600",
      "https://images.unsplash.com/photo-1595475038665-8940bdb3d83a?w=600"
    ],
    nutritionInfo: "사과 5개, 배 4개 구성 - 비타민C, 식이섬유 풍부",
    storageInfo: "서늘하고 통풍이 잘 되는 곳에 보관, 냉장보관 권장",
    origin: "국내산",
    created_at: "2024-01-01T00:00:00Z"
  }
]
