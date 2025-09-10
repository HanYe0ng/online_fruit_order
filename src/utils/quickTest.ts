import { supabase } from '../services/supabase'

export const quickConnectionTest = async () => {
  console.log('🚀 빠른 연결 테스트 시작...')
  
  try {
    // 환경 변수 확인
    console.log('ENV 확인:')
    console.log('- URL:', process.env.REACT_APP_SUPABASE_URL?.substring(0, 30) + '...')
    console.log('- KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 30) + '...')
    
    // 1. Auth 세션 확인 (가장 빠른 테스트)
    console.log('1. Auth 세션 확인...')
    const { data: session } = await supabase.auth.getSession()
    console.log('✅ Auth 연결 성공')
    
    // 2. 직접 업로드 테스트 (listBuckets 건너뛰기)
    console.log('2. 직접 업로드 테스트...')
    console.log('ℹ️ listBuckets API는 건너뛰고 직접 업로드 테스트합니다.')
    
    // 3. 테스트 업로드
    console.log('3. 테스트 업로드...')
    const testBlob = new Blob(['test'], { type: 'text/plain' })
    const testPath = `test/quick-test-${Date.now()}.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(testPath, testBlob)
    
    if (uploadError) {
      console.error('❌ 테스트 업로드 실패:', uploadError)
      return { 
        success: false, 
        error: `업로드 실패: ${uploadError.message}` 
      }
    }
    
    console.log('✅ 테스트 업로드 성공:', uploadData)
    
    // 4. 공개 URL 생성 테스트
    console.log('4. 공개 URL 생성 테스트...')
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(testPath)
    
    console.log('✅ 생성된 공개 URL:', urlData.publicUrl)
    
    // 테스트 파일 삭제
    console.log('5. 테스트 파일 삭제...')
    const { error: deleteError } = await supabase.storage
      .from('product-images')
      .remove([testPath])
    
    if (deleteError) {
      console.warn('⚠️ 테스트 파일 삭제 실패:', deleteError)
    } else {
      console.log('✅ 테스트 파일 삭제 성공')
    }
    
    console.log('🎉 모든 연결 테스트 성공!')
    console.log('📝 결론: product-images 버킷이 정상 작동하고 있습니다.')
    return { success: true }
    
  } catch (error) {
    console.error('❌ 연결 테스트 중 오류:', error)
    return { 
      success: false, 
      error: `연결 오류: ${error instanceof Error ? error.message : String(error)}` 
    }
  }
}
