export type Role = 'admin' | 'manager'

export interface User {
  id: string
  email: string
  role: Role
  store_id?: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}
