export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: number
          name: string
          location: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          location?: string | null
          created_at?: string
        }
      }
      apartments: {
        Row: {
          id: number
          name: string
          address: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          address?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          address?: string | null
          created_at?: string
        }
      }
      apartment_units: {
        Row: {
          id: number
          apartment_id: number
          dong: string
          ho: string
          created_at: string
        }
        Insert: {
          id?: number
          apartment_id: number
          dong: string
          ho: string
          created_at?: string
        }
        Update: {
          id?: number
          apartment_id?: number
          dong?: string
          ho?: string
          created_at?: string
        }
      }
      products: {
        Row: {
          id: number
          store_id: number
          name: string
          price: number
          discount_price: number | null
          discount_rate: number | null
          quantity: number
          image_url: string | null
          is_soldout: boolean
          category: string // 필수로 변경
          display_order: number
          created_at: string
        }
        Insert: {
          id?: number
          store_id: number
          name: string
          price: number
          discount_price?: number | null
          discount_rate?: number | null
          quantity: number
          image_url?: string | null
          is_soldout?: boolean
          category: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: number
          store_id?: number
          name?: string
          price?: number
          discount_price?: number | null
          discount_rate?: number | null
          quantity?: number
          image_url?: string | null
          is_soldout?: boolean
          category?: string
          display_order?: number
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: number
          store_id: number
          apartment_unit_id: number
          customer_name: string | null
          customer_phone: string | null
          is_paid: boolean
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          store_id: number
          apartment_unit_id: number
          customer_name?: string | null
          customer_phone?: string | null
          is_paid?: boolean
          status?: string
          created_at?: string
        }
        Update: {
          id?: number
          store_id?: number
          apartment_unit_id?: number
          customer_name?: string | null
          customer_phone?: string | null
          is_paid?: boolean
          status?: string
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: number
          order_id: number
          product_id: number
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: number
          order_id: number
          product_id: number
          quantity: number
          unit_price: number
        }
        Update: {
          id?: number
          order_id?: number
          product_id?: number
          quantity?: number
          unit_price?: number
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          role: string
          store_id: number | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role: string
          store_id?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          store_id?: number | null
          created_at?: string
        }
      }
      gift_product_details: {
        Row: {
          id: number
          product_id: number
          original_price?: number | null
          discount_rate?: number | null
          tags?: string[] | null
          rating?: number | null
          review_count?: number | null
          nutrition_info?: string | null
          storage_info?: string | null
          origin?: string | null
          description_detail?: string | null
          created_at: string
        }
        Insert: {
          id?: number
          product_id: number
          original_price?: number | null
          discount_rate?: number | null
          tags?: string[] | null
          rating?: number | null
          review_count?: number | null
          nutrition_info?: string | null
          storage_info?: string | null
          origin?: string | null
          description_detail?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          product_id?: number
          original_price?: number | null
          discount_rate?: number | null
          tags?: string[] | null
          rating?: number | null
          review_count?: number | null
          nutrition_info?: string | null
          storage_info?: string | null
          origin?: string | null
          description_detail?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      order_view: {
        Row: {
          order_id: number
          store_id: number
          apartment_name: string
          apartment_dong: string
          apartment_ho: string
          customer_name: string | null
          customer_phone: string | null
          is_paid: boolean
          status: string
          created_at: string
        }
      }
      gift_products_view: {
        Row: {
          id: number
          store_id: number
          store_name: string
          name: string
          price: number
          original_price?: number | null
          discount_rate?: number | null
          quantity: number
          image_url: string | null
          is_soldout: boolean
          tags?: string[] | null
          rating?: number | null
          review_count?: number | null
          nutrition_info?: string | null
          storage_info?: string | null
          origin?: string | null
          description_detail?: string | null
          created_at: string
        }
      }
    }
  }
}