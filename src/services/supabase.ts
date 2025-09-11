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
  try { localStorage.setItem('__p','1'); localStorage.removeItem('__p'); return localStorage } catch {}
  try { sessionStorage.setItem('__p','1'); sessionStorage.removeItem('__p'); return sessionStorage } catch {}
  return new MemoryStorage()
}

/* ---------- CRA 환경변수(정확한 치환 패턴) ---------- */
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY as string | undefined
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // 빌드/주입이 안 됐으면 경고만 남기고 진행 (네트워크에서 바로 에러 확인)
  // eslint-disable-next-line no-console
  console.warn('[Supabase] ENV 누락: REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY')
}

/* ---------- IAB 대응: Abort 없이 하드 타임아웃 ---------- */
/** AbortController 없이 Promise.race만으로 끊는다(요청은 백그라운드에 남을 수 있음). */
function hardTimeoutFetch(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 10000) {
  const nativeFetch = (globalThis as any)._nativeFetch ?? fetch
  // 디버깅 로그 (필요 없으면 주석 처리)
  // console.debug('[fetch]', typeof input === 'string' ? input : (input as any)?.url)
  return Promise.race([
    nativeFetch(input as any, {
      // 인앱에서 CORS/keepalive가 꼬이는 경우가 있어 보수적으로 지정
      keepalive: false,
      redirect: 'follow',
      credentials: 'omit',
      ...init,
    }),
    new Promise<Response>((_, rej) => {
      setTimeout(() => rej(new Error('timeout')), timeoutMs)
    }),
  ])
}

/** 1회 재시도(첫 시도가 timeout일 때만) */
async function fetchWithRetryNoAbort(input: RequestInfo | URL, init?: RequestInit) {
  try {
    return await hardTimeoutFetch(input, init, 10000) // 10초
  } catch (e: any) {
    if (e && e.message === 'timeout') {
      // 한번만 재시도
      return hardTimeoutFetch(input, init, 10000)
    }
    throw e
  }
}

/* ---------- Supabase client ---------- */
export const supabase = createClient<Database>(
  SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY ?? '',
  {
    // ✅ IAB에서 "끝없이 대기" 방지: 전역 fetch를 하드 타임아웃 래퍼로 교체
    global: { fetch: fetchWithRetryNoAbort },
    auth: {
      storage: safeStorage(),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // 인앱 초기 파싱 대기/루프 방지
    },
  }
)
