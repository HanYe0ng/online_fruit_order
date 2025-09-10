import { supabase } from '../services/supabase'

/**
 * Supabase 설정을 확인하는 유틸리티
 */
export const checkSupabaseSetup = async () => {
  console.log('🔍 Supabase 설정 확인 시작...')
  
  try {
    // 1. 기본 연결 테스트
    console.log('1️⃣ 기본 연결 테스트 중...')
    
    // Supabase URL 및 Key 확인
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY
    
    console.log('Supabase URL:', supabaseUrl ? '✅ 설정됨' : '❌ 비어있음')
    console.log('Supabase Key:', supabaseKey ? '✅ 설정됨' : '❌ 비어있음')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ 환경 변수가 설정되지 않았습니다!')
      return false
    }
    
    // 간단한 연결 테스트
    try {
      const { data: connectionTest, error: connectionError } = await supabase.auth.getSession()
      console.log('✅ Supabase 연결 성공')
    } catch (error) {
      console.error('❌ Supabase 연결 실패:', error)
      return false
    }
    
    // 2. Storage 버킷 목록 확인
    console.log('2️⃣ Storage 버킷 확인 중...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Storage 접근 실패:', bucketsError)
      return false
    }
    
    console.log('📂 사용 가능한 버킷들:', buckets?.map(b => b.name))
    
    const productImagesBucket = buckets?.find(b => b.name === 'product-images')
    if (!productImagesBucket) {
      console.error('❌ product-images 버킷이 없습니다!')
      console.log('💡 Supabase 대시보드에서 Storage > New bucket > "product-images" 생성이 필요합니다.')
      return false
    } else {
      console.log('✅ product-images 버킷 존재함')
      console.log('🔧 버킷 설정:', productImagesBucket)
    }
    
    // 3. 테스트 파일 업로드
    console.log('3️⃣ 테스트 업로드 시도...')
    const testFile = new Blob(['test'], { type: 'text/plain' })
    const testFileName = `test-${Date.now()}.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(`test/${testFileName}`, testFile)
    
    if (uploadError) {
      console.error('❌ 테스트 업로드 실패:', uploadError)
      console.log('💡 가능한 원인:')
      console.log('   - 버킷의 public 설정이 안되어 있음')
      console.log('   - RLS(Row Level Security) 정책 문제')
      console.log('   - 업로드 권한 부족')
      return false
    } else {
      console.log('✅ 테스트 업로드 성공:', uploadData)
      
      // 테스트 파일 삭제
      await supabase.storage
        .from('product-images')
        .remove([`test/${testFileName}`])
      console.log('🗑️ 테스트 파일 정리 완료')
    }
    
    // 4. products 테이블 구조 확인
    console.log('4️⃣ products 테이블 구조 확인...')
    const { data: tableData, error: tableError } = await supabase
      .from('products')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ products 테이블 접근 실패:', tableError)
      return false
    } else {
      console.log('✅ products 테이블 접근 성공')
    }
    
    console.log('🎉 모든 Supabase 설정이 정상입니다!')
    return true
    
  } catch (error) {
    console.error('❌ 전체 체크 중 오류:', error)
    return false
  }
}

/**
 * Storage 버킷 생성 가이드
 */
export const storageSetupGuide = () => {
  console.log(`
🛠️ Supabase Storage 설정 가이드:

1. Supabase 대시보드 접속
2. Storage 메뉴 클릭
3. "New bucket" 클릭
4. Bucket name: "product-images" 입력
5. Public bucket: ✅ 체크 (중요!)
6. "Create bucket" 클릭

7. 생성된 버킷 클릭 > Settings
8. "Public" 탭에서 다음 정책 추가:

SQL Policy:
CREATE POLICY "Anyone can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Anyone can view images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
`)
}
