// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

/* ---------- Safe storage: local → session → memory ---------- */
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
class MemoryStorage implements StorageLike {
  private m = new Map<string, string>()
  getItem(k: string) { return this.m.has(k) ? (this.m.get(k) as string) : null }
  setItem(k: string, v: string) { this.m.set(k, v) }
  removeItem(k: string) { this.m.delete(k) }
}

function safeStorage(): StorageLike {
  if (typeof window === 'undefined') return new MemoryStorage()
  try { 
    localStorage.setItem('__test','1')
    localStorage.removeItem('__test')
    return localStorage 
  } catch {}
  try { 
    sessionStorage.setItem('__test','1')
    sessionStorage.removeItem('__test')
    return sessionStorage 
  } catch {}
  return new MemoryStorage()
}

/* ---------- 환경변수 확인 ---------- */
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY as string | undefined

console.log('🔧 Supabase 환경변수 확인:', {
  hasUrl: !!SUPABASE_URL,
  hasKey: !!SUPABASE_ANON_KEY,
  url: SUPABASE_URL?.substring(0, 30) + '...' // 보안을 위해 일부만 표시
})

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase 환경변수 누락!')
  console.error('- REACT_APP_SUPABASE_URL:', !!SUPABASE_URL)
  console.error('- REACT_APP_SUPABASE_ANON_KEY:', !!SUPABASE_ANON_KEY)
}

/* ---------- 단순화된 Supabase client ---------- */
const supabaseClient = createClient<Database>(
  SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY ?? '',
  {
    // 커스텀 fetch 제거 - 기본 fetch 사용
    auth: {
      storage: safeStorage(),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      // 실시간 구독 비활성화
      storageKey: 'fruit-store-auth'
    },
    db: {
      schema: 'public',
    },
    // realtime 설정 제거 (WebSocket 연결 문제 방지)
  }
)

console.log('✅ Supabase 클라이언트 생성 완료')

// 연결 테스트
supabaseClient.auth.getSession()
  .then(({ data, error }) => {
    console.log('🔍 초기 세션 확인 결과:', { 
      hasSession: !!data.session, 
      hasError: !!error,
      errorMessage: error?.message 
    })
  })
  .catch(err => {
    console.error('❌ 초기 세션 확인 실패:', err)
  })

// 타입 문제 해결을 위한 강력한 타입 단언
export const supabase = supabaseClient as any
