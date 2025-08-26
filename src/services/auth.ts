import { supabase } from './supabase'
import { User, LoginCredentials } from '../types/auth'

export const authService = {
  // 로그인
  async login(credentials: LoginCredentials): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (!data.user) {
        return { user: null, error: '로그인에 실패했습니다.' }
      }

      // 프로필 정보 가져오기
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        return { user: null, error: '사용자 정보를 가져올 수 없습니다.' }
      }

      const user: User = {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        store_id: profile.store_id
      }

      return { user, error: null }
    } catch (error) {
      return { user: null, error: '로그인 중 오류가 발생했습니다.' }
    }
  },

  // 로그아웃
  async logout(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      return { error: error?.message || null }
    } catch (error) {
      return { error: '로그아웃 중 오류가 발생했습니다.' }
    }
  },

  // 현재 사용자 정보 가져오기
  async getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        return { user: null, error: null }
      }

      // 프로필 정보 가져오기
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        return { user: null, error: '사용자 정보를 가져올 수 없습니다.' }
      }

      const currentUser: User = {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        store_id: profile.store_id
      }

      return { user: currentUser, error: null }
    } catch (error) {
      return { user: null, error: '사용자 정보 확인 중 오류가 발생했습니다.' }
    }
  },

  // 회원가입 (관리자용)
  async signUp(credentials: LoginCredentials & { role: 'admin' | 'manager'; store_id?: number }): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (!data.user) {
        return { user: null, error: '회원가입에 실패했습니다.' }
      }

      // 프로필 생성
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          email: credentials.email,
          role: credentials.role,
          store_id: credentials.store_id
        }])

      if (profileError) {
        return { user: null, error: '프로필 생성에 실패했습니다.' }
      }

      const user: User = {
        id: data.user.id,
        email: credentials.email,
        role: credentials.role,
        store_id: credentials.store_id
      }

      return { user, error: null }
    } catch (error) {
      return { user: null, error: '회원가입 중 오류가 발생했습니다.' }
    }
  }
}