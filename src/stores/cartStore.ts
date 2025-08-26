import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem } from '../types/order'
import { Product } from '../types/product'

interface CartStore {
  items: CartItem[]
  selectedStoreId: number | null
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
  setSelectedStore: (storeId: number) => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      selectedStoreId: null,

      addItem: (product: Product, quantity = 1) => {
        const { items, selectedStoreId } = get()
        
        // 다른 점포의 상품이면 장바구니 초기화
        if (selectedStoreId && selectedStoreId !== product.store_id) {
          set({ 
            items: [{ product, quantity }],
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

      removeItem: (productId: number) => {
        const { items } = get()
        const newItems = items.filter(item => item.product.id !== productId)
        
        set({
          items: newItems,
          selectedStoreId: newItems.length > 0 ? get().selectedStoreId : null
        })
      },

      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set({
          items: get().items.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          )
        })
      },

      clearCart: () => set({ items: [], selectedStoreId: null }),

      getTotalPrice: () => {
        return get().items.reduce((total, item) => 
          total + (item.product.price * item.quantity), 0
        )
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      setSelectedStore: (storeId: number) => set({ selectedStoreId: storeId })
    }),
    {
      name: 'cart-storage'
    }
  )
)
