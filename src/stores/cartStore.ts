import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem } from '../types/order'
import { Product, GiftCartItem } from '../types/product'

interface CartStore {
  items: CartItem[]
  giftItems: GiftCartItem[]
  selectedStoreId: number | null
  addItem: (product: Product, quantity?: number) => void
  addGiftItem: (giftItem: GiftCartItem) => void
  removeItem: (productId: number) => void
  removeGiftItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  updateGiftQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
  setSelectedStore: (storeId: number) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      giftItems: [],
      selectedStoreId: null,

      addItem: (product: Product, quantity = 1) => {
        const { items, selectedStoreId } = get()
        
        // 다른 점포의 상품이면 장바구니 초기화
        if (selectedStoreId && selectedStoreId !== product.store_id) {
          set({ 
            items: [{ product, quantity }],
            giftItems: [],
            selectedStoreId: product.store_id
          })
          return
        }

        const existingItem = items.find(item => item.product.id === product.id)
        
        if (existingItem) {
          // 기존 상품 수량 증가
          set({
            items: items.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          })
        } else {
          // 새 상품 추가
          set({
            items: [...items, { product, quantity }],
            selectedStoreId: product.store_id
          })
        }
      },

      addGiftItem: (giftItem: GiftCartItem) => {
        const { giftItems, selectedStoreId } = get()
        
        // 다른 점포의 상품이면 장바구니 초기화
        if (selectedStoreId && selectedStoreId !== giftItem.product.store_id) {
          set({ 
            items: [],
            giftItems: [giftItem],
            selectedStoreId: giftItem.product.store_id
          })
          return
        }

        const existingItem = giftItems.find(item => 
          item.product.id === giftItem.product.id &&
          JSON.stringify(item.deliveryOption) === JSON.stringify(giftItem.deliveryOption)
        )
        
        if (existingItem) {
          // 기존 상품 수량 증가
          set({
            giftItems: giftItems.map(item =>
              item.product.id === giftItem.product.id &&
              JSON.stringify(item.deliveryOption) === JSON.stringify(giftItem.deliveryOption)
                ? { ...item, quantity: item.quantity + giftItem.quantity }
                : item
            )
          })
        } else {
          // 새 상품 추가
          set({
            giftItems: [...giftItems, giftItem],
            selectedStoreId: giftItem.product.store_id
          })
        }
      },

      removeItem: (productId: number) => {
        const { items, giftItems } = get()
        const newItems = items.filter(item => item.product.id !== productId)
        
        set({
          items: newItems,
          selectedStoreId: (newItems.length > 0 || giftItems.length > 0) ? get().selectedStoreId : null
        })
      },

      removeGiftItem: (productId: number) => {
        const { items, giftItems } = get()
        // 첫 번째 해당 상품만 제거
        const itemIndex = giftItems.findIndex(item => item.product.id === productId)
        if (itemIndex >= 0) {
          const newGiftItems = giftItems.filter((_, index) => index !== itemIndex)
          set({
            giftItems: newGiftItems,
            selectedStoreId: (items.length > 0 || newGiftItems.length > 0) ? get().selectedStoreId : null
          })
        }
      },

      updateQuantity: (productId: number, quantity: number) => {
        // 수량이 1보다 작아지지 않도록 제한
        const finalQuantity = Math.max(1, quantity)
        
        set({
          items: get().items.map(item =>
            item.product.id === productId
              ? { ...item, quantity: finalQuantity }
              : item
          )
        })
      },

      updateGiftQuantity: (productId: number, quantity: number) => {
        // 수량이 1보다 작아지지 않도록 제한
        const finalQuantity = Math.max(1, quantity)
        
        // 첫 번째 해당 상품의 수량 업데이트
        const giftItems = get().giftItems
        const itemIndex = giftItems.findIndex(item => item.product.id === productId)
        if (itemIndex >= 0) {
          const updatedGiftItems = [...giftItems]
          updatedGiftItems[itemIndex] = {
            ...updatedGiftItems[itemIndex],
            quantity: finalQuantity
          }
          set({ giftItems: updatedGiftItems })
        }
      },

      clearCart: () => set({ items: [], giftItems: [], selectedStoreId: null }),

      getTotalPrice: () => {
        const regularTotal = get().items.reduce((total, item) => 
          total + (item.product.price * item.quantity), 0
        )
        const giftTotal = get().giftItems.reduce((total, item) => 
          total + (item.product.price * item.quantity), 0
        )
        return regularTotal + giftTotal
      },

      getTotalItems: () => {
        const regularCount = get().items.reduce((total, item) => total + item.quantity, 0)
        const giftCount = get().giftItems.reduce((total, item) => total + item.quantity, 0)
        return regularCount + giftCount
      },

      setSelectedStore: (storeId: number) => set({ selectedStoreId: storeId })
    }),
    {
      name: 'cart-storage'
    }
  )
)
