import { Database } from './database'

// Supabase 자동 생성 타입 사용
export type Store = Database['public']['Tables']['stores']['Row']
export type StoreInsert = Database['public']['Tables']['stores']['Insert']  
export type StoreUpdate = Database['public']['Tables']['stores']['Update']
