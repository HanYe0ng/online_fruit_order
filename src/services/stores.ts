import { supabase } from './supabase'
import { StoreInfo } from '../types/product'

// Supabase에서 매장 정보 조회
export const fetchStores = async (): Promise<StoreInfo[]> => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, location')
      .order('name')

    if (error) {
      console.error('매장 정보 조회 오류:', error)
      throw error
    }

    // DB의 location을 address로 매핑
    return data.map(store => ({
      id: store.id,
      name: store.name,
      address: store.location || '',
      phone: '' // DB에 phone 필드가 없으므로 빈 문자열
    }))
  } catch (error) {
    console.error('fetchStores 에러:', error)
    throw error
  }
}

// 특정 매장 정보 조회
export const fetchStoreById = async (storeId: number): Promise<StoreInfo | null> => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, location')
      .eq('id', storeId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 데이터를 찾을 수 없음
        return null
      }
      console.error('매장 정보 조회 오류:', error)
      throw error
    }

    return {
      id: data.id,
      name: data.name,
      address: data.location || '',
      phone: ''
    }
  } catch (error) {
    console.error('fetchStoreById 에러:', error)
    throw error
  }
}
