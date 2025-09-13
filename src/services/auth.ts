import { supabase } from './supabase'
import { User, LoginCredentials } from '../types/auth'
import { Database } from '../types/database'

// Supabase 프로필 타입
type Profile = Database['public']['Tables']['profiles']['Row']

// Supabase 클라이언트 상태 확인 함수
const checkSupabaseClient = () => {
  console.log('=== Supabase 클라이언트 상태 확인 ===')
  console.log('Supabase 객체 존재:', !!supabase)
  console.log('Auth 객체 존재:', !!supabase?.auth)
  console.log('From 메서드 존재:', typeof supabase?.from)
  
  // supabase 객체의 구성 확인 (내부 속성 접근 없이)
  try {
    // 환경변수에서 URL 확인 (만약 사용 가능하다면)
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    
    console.log('환경변수 URL 존재:', !!supabaseUrl)
    console.log('환경변수 Key 존재:', !!supabaseKey)
    
    if (supabaseUrl) {
      console.log('Supabase URL:', supabaseUrl)
      const url = new URL(supabaseUrl)
      console.log('URL 호스트:', url.host)
      console.log('URL 프로토콜:', url.protocol)
    }
  } catch (e) {
    console.log('환경변수 접근 실패 또는 URL 파싱 에러:', e)
  }
  
  console.log('=====================================')
}

// 네트워크 연결 테스트 함수
const testNetworkConnection = async (url: string) => {
  console.log(`=== 네트워크 연결 테스트: ${url} ===`)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'cors'
    })
    
    clearTimeout(timeoutId)
    console.log('연결 성공:', response.status, response.statusText)
    return true
  } catch (error: any) {
    console.error('연결 실패:', error.message)
    if (error.name === 'AbortError') {
      console.error('→ 타임아웃 발생')
    } else if (error.message.includes('CORS')) {
      console.error('→ CORS 정책 문제')
    } else if (error.message.includes('fetch')) {
      console.error('→ 네트워크 연결 불가')
    }
    return false
  }
}

export const authService = {
  // 로그인
  async login(credentials: LoginCredentials): Promise<{ user: User | null; error: string | null }> {
    console.log('🚀 로그인 프로세스 시작')
    console.log('입력된 이메일:', credentials.email)
    
    try {
      
      // 1. 입력값 검증
      if (!credentials.email || !credentials.password) {
        console.log('❌ 입력값 검증 실패: 이메일 또는 비밀번호가 비어있음')
        return { user: null, error: '이메일과 비밀번호를 모두 입력해주세요.' }
      }

      // 2. Supabase 클라이언트 상태 확인
      checkSupabaseClient()

      // 3. 네트워크 테스트 건너뛰기 (CORS 문제로 인해 실패하므로)
      console.log('ℹ️ 네트워크 테스트 건너뛰고 직접 인증 시도합니다')

      console.log('📡 Supabase 인증 요청 시작...')
      console.log('요청 시간:', new Date().toISOString())
      
      // 4. 직접 인증 요청 (타임아웃 제거)
      const startTime = Date.now()
      
      console.log('🔐 signInWithPassword 호출 직전')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })
      
      const elapsedTime = Date.now() - startTime
      console.log('✅ signInWithPassword 호출 완료 - 소요시간:', elapsedTime, 'ms')
      console.log('응답 데이터 분석:')
      console.log('- data 존재:', !!data)
      console.log('- data.user 존재:', !!data?.user)
      console.log('- error 존재:', !!error)
      console.log('- error 메시지:', error?.message)
      console.log('- error 상태:', error?.status)

      if (error) {
        console.log('❌ 인증 에러 발생')
        console.log('에러 전체 객체:', JSON.stringify(error, null, 2))
        return { user: null, error: error.message }
      }

      if (!data.user) {
        console.log('❌ 사용자 데이터 없음')
        console.log('data 전체 객체:', JSON.stringify(data, null, 2))
        return { user: null, error: '로그인에 실패했습니다.' }
      }

      console.log('✅ 인증 성공! 사용자 ID:', data.user.id)
      console.log('📋 프로필 정보 조회 시작...')
      
      // 7. 프로필 정보 가져오기
      const profileStartTime = Date.now()
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      console.log('📋 프로필 조회 완료 - 소요시간:', Date.now() - profileStartTime, 'ms')
      console.log('프로필 조회 결과:')
      console.log('- profile 존재:', !!profile)
      console.log('- profileError 존재:', !!profileError)
      
      if (profile) {
        const profileData = profile as Profile
        console.log('- 프로필 ID:', profileData.id)
        console.log('- 이메일:', profileData.email)
        console.log('- 역할:', profileData.role)
        console.log('- 스토어 ID:', profileData.store_id)
      }

      if (profileError) {
        console.log('❌ 프로필 조회 에러')
        console.log('프로필 에러 전체:', JSON.stringify(profileError, null, 2))
        return { user: null, error: '사용자 정보를 가져올 수 없습니다.' }
      }

      const profileData = profile as Profile
      const user: User = {
        id: profileData.id,
        email: profileData.email,
        role: profileData.role as 'admin' | 'manager',
        store_id: profileData.store_id || undefined
      }

      console.log('🎉 로그인 전체 프로세스 성공!')
      console.log('전체 소요시간:', Date.now() - startTime, 'ms')
      return { user, error: null }
      
    } catch (error: any) {
      console.error('💥💥💥 로그인 중 예상치 못한 예외 발생 💥💥💥')
      console.error('에러 타입:', typeof error)
      console.error('에러 이름:', error?.name)
      console.error('에러 메시지:', error?.message)
      console.error('에러 스택:', error?.stack)
      console.error('에러 전체 객체:', error)
      
      // 브라우저 환경 정보
      console.log('🌐 브라우저 환경 정보:')
      console.log('- User Agent:', navigator.userAgent)
      console.log('- Online 상태:', navigator.onLine)
      console.log('- 현재 URL:', window.location.href)
      
      let errorMessage = '로그인 중 오류가 발생했습니다.'
      
      if (error.message) {
        if (error.message.includes('timeout') || error.message.includes('시간이 초과') || error.message.includes('초과했습니다')) {
          errorMessage = '서버 응답 시간이 초과되었습니다. 네트워크 연결 상태를 확인해주세요.'
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = '서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.'
        } else if (error.message.includes('CORS')) {
          errorMessage = '브라우저 보안 정책 문제입니다. 관리자에게 문의하세요.'
        } else {
          errorMessage = `로그인 오류: ${error.message}`
        }
      }
      
      return { user: null, error: errorMessage }
    }
  },

  // 로그아웃
  async logout(): Promise<{ error: string | null }> {
    try {
      console.log('🚪 로그아웃 프로세스 시작')
      
      const { error } = await supabase.auth.signOut()
      
      console.log('🚪 로그아웃 완료:', { hasError: !!error })
      if (error) {
        console.log('로그아웃 에러:', error.message)
      }
      
      return { error: error?.message || null }
    } catch (error: any) {
      console.error('💥 로그아웃 중 예외 발생:', error)
      return { error: '로그아웃 중 오류가 발생했습니다.' }
    }
  },

  // 현재 사용자 정보 가져오기
  async getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
    try {
      console.log('👤 현재 사용자 조회 프로세스 시작')
      
      const { data: { user }, error } = await supabase.auth.getUser()

      console.log('👤 사용자 조회 완료:', { hasUser: !!user, hasError: !!error })

      if (error) {
        console.log('사용자 조회 에러:', error.message)
      }

      if (!user) {
        console.log('로그인된 사용자 없음')
        return { user: null, error: null }
      }

      console.log('📋 프로필 정보 조회 시작... (사용자 ID:', user.id, ')')
      
      // 프로필 정보 가져오기
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      console.log('📋 프로필 조회 완료:', { hasProfile: !!profile, hasError: !!profileError })

      if (profileError) {
        console.log('프로필 조회 에러:', profileError.message)
        return { user: null, error: '사용자 정보를 가져올 수 없습니다.' }
      }

      const profileData = profile as Profile
      const currentUser: User = {
        id: profileData.id,
        email: profileData.email,
        role: profileData.role as 'admin' | 'manager',
        store_id: profileData.store_id || undefined
      }

      console.log('✅ 현재 사용자 조회 성공')
      return { user: currentUser, error: null }
    } catch (error: any) {
      console.error('💥 사용자 정보 확인 중 예외 발생:', error)
      return { user: null, error: '사용자 정보 확인 중 오류가 발생했습니다.' }
    }
  },

  // 회원가입 (관리자용)
  async signUp(credentials: LoginCredentials & { role: 'admin' | 'manager'; store_id?: number }): Promise<{ user: User | null; error: string | null }> {
    try {
      console.log('📝 회원가입 프로세스 시작')
      console.log('가입 이메일:', credentials.email)
      console.log('역할:', credentials.role)
      console.log('스토어 ID:', credentials.store_id)
      
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password
      })

      console.log('📝 회원가입 요청 완료:', { hasUser: !!data.user, hasError: !!error })

      if (error) {
        console.log('❌ 회원가입 에러:', error.message)
        console.log('회원가입 에러 전체:', JSON.stringify(error, null, 2))
        return { user: null, error: error.message }
      }

      if (!data.user) {
        console.log('❌ 사용자 데이터 없음')
        console.log('회원가입 data 전체:', JSON.stringify(data, null, 2))
        return { user: null, error: '회원가입에 실패했습니다.' }
      }

      console.log('✅ 회원가입 성공! 사용자 ID:', data.user.id)
      console.log('📋 프로필 생성 시작...')
      
      // 프로필 생성
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .insert([{
          id: data.user.id,
          email: credentials.email,
          role: credentials.role,
          store_id: credentials.store_id || null
        }])

      console.log('📋 프로필 생성 완료:', { hasError: !!profileError })

      if (profileError) {
        console.log('❌ 프로필 생성 에러:', profileError.message)
        console.log('프로필 생성 에러 전체:', JSON.stringify(profileError, null, 2))
        return { user: null, error: '프로필 생성에 실패했습니다.' }
      }

      const user: User = {
        id: data.user.id,
        email: credentials.email,
        role: credentials.role,
        store_id: credentials.store_id
      }

      console.log('🎉 회원가입 전체 프로세스 성공!')
      return { user, error: null }
    } catch (error: any) {
      console.error('💥 회원가입 중 예외 발생:', error)
      console.error('에러 상세:', JSON.stringify(error, null, 2))
      return { user: null, error: '회원가입 중 오류가 발생했습니다.' }
    }
  },

  // 디버깅용 - Supabase 연결 테스트
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔍 Supabase 연결 테스트 시작')
      
      checkSupabaseClient()
      
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL
      if (supabaseUrl) {
        const isConnected = await testNetworkConnection(supabaseUrl)
        if (!isConnected) {
          return { success: false, message: '네트워크 연결 실패' }
        }
      }
      
      // 간단한 쿼리로 연결 테스트
      console.log('📡 DB 연결 테스트...')
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('DB 연결 테스트 실패:', error)
        return { success: false, message: `DB 연결 실패: ${error.message}` }
      }
      
      console.log('✅ 연결 테스트 성공')
      return { success: true, message: '연결 성공' }
      
    } catch (error: any) {
      console.error('💥 연결 테스트 중 예외:', error)
      return { success: false, message: `연결 테스트 실패: ${error.message}` }
    }
  }
}