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
  // eslint-disable-next-line no-console
  console.warn('[Supabase] ENV 누락: REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY')
}

/* ---------- Abort 기반 타임아웃 fetch ---------- */
function abortableFetch(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 15000) {
  const nativeFetch = (globalThis as any)._nativeFetch ?? fetch
  const ac = new AbortController()
  const timer = setTimeout(() => {
    // Abort 발생 → 실제 네트워크 커넥션도 해제
    ac.abort(new Error('timeout'))
  }, timeoutMs)

  return nativeFetch(input as any, { ...init, signal: ac.signal })
    .finally(() => clearTimeout(timer))
}

/** timeout/Abort일 때에만 1회 재시도 */
async function fetchWithRetryAbort(input: RequestInfo | URL, init?: RequestInit) {
  try {
    return await abortableFetch(input, init, 15000)
  } catch (e: any) {
    if (e?.name === 'AbortError' || e?.message === 'timeout') {
      // 네트워크 일시 hiccup 대응: 1회만 재시도
      return abortableFetch(input, init, 15000)
    }
    throw e
  }
}

/* ---------- Supabase client ---------- */
export const supabase = createClient<Database>(
  SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY ?? '',
  {
    // ✅ Abort되는 fetch로 교체 (무한 pending/커넥션 고갈 방지)
    global: { fetch: fetchWithRetryAbort },
    auth: {
      storage: safeStorage(),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
)
