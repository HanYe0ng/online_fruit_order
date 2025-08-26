import { supabase } from './supabase'

export const testSupabaseConnection = async () => {
  try {
    // 점포 목록 조회 테스트
    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
    
    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }
    
    console.log('Supabase connected successfully!')
    console.log('Stores data:', stores)
    return true
  } catch (error) {
    console.error('Connection test failed:', error)
    return false
  }
}