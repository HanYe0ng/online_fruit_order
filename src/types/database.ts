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
          quantity: number
          image_url: string | null
          is_soldout: boolean
          created_at: string
        }
        Insert: {
          id?: number
          store_id: number
          name: string
          price: number
          quantity: number
          image_url?: string | null
          is_soldout?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          store_id?: number
          name?: string
          price?: number
          quantity?: number
          image_url?: string | null
          is_soldout?: boolean
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
    }
  }
}