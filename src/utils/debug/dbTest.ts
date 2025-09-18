import { supabase } from '../../services/supabase'

// 데이터베이스 상태 확인 함수
export const debugDatabase = async () => {
  console.log('=== 데이터베이스 디버깅 시작 ===')
  
  try {
    // 1. Supabase 연결 상태 확인
    console.log('1. Supabase client:', supabase ? '✅ OK' : '❌ NULL')
    
    // 2. 환경 변수 확인
    console.log('2. 환경 변수:')
    console.log('   SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음')
    console.log('   SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음')
    
    // 3. 단순 연결 테스트
    console.log('3. 연결 테스트...')
    const { data: stores, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .limit(3)
    
    if (storeError) {
      console.error('❌ 점포 조회 실패:', storeError)
      return false
    }
    
    console.log('✅ 점포 조회 성공:', stores)
    
    // 4. Products 테이블 구조 확인 (PostgreSQL 정보 스키마 조회)
    console.log('4. Products 테이블 컬럼 확인...')
    try {
      const { data: columns, error: columnError } = await (supabase as any)
        .rpc('get_table_columns', { table_name: 'products' } as any)
        .single()
      
      if (!columnError && columns) {
        console.log('✅ 테이블 컬럼 정보:', columns)
      } else {
        throw new Error('RPC 함수 없음')
      }
    } catch (rpcError) {
      console.log('RPC 함수가 없음. 직접 테스트...')
      
      // 5. 직접 products 테이블 조회로 컬럼 확인
      const { data: sampleProduct, error: productError } = await supabase
        .from('products')
        .select('*')
        .limit(1)
      
      if (productError) {
        console.error('❌ 상품 조회 실패:', productError)
        return false
      }
      
      console.log('✅ 샘플 상품 데이터:', sampleProduct?.[0])
      
      if (sampleProduct?.[0]) {
        const keys = Object.keys(sampleProduct[0])
        console.log('📋 현재 컬럼들:', keys)
        console.log('🔍 display_order 컬럼 존재:', keys.includes('display_order') ? '✅ 있음' : '❌ 없음')
      }
    }
    
    // 6. 특정 점포의 상품 조회 테스트
    console.log('5. 점포 1의 상품 조회 테스트...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, display_order, created_at')
      .eq('store_id', 1)
      .limit(5)
    
    if (productsError) {
      console.error('❌ 상품 조회 실패:', productsError)
      return false
    }
    
    console.log('✅ 점포 1 상품들:', products)
    
    console.log('=== 데이터베이스 디버깅 완료 ===')
    return true
    
  } catch (error) {
    console.error('❌ 디버깅 중 예외 발생:', error)
    return false
  }
}

// 브라우저 콘솔에서 사용할 수 있도록 window에 추가
if (typeof window !== 'undefined') {
  (window as any).debugDatabase = debugDatabase
}
