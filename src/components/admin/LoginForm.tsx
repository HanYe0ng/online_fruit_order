import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card } from '../common'
import { ROUTES } from '../../utils/constants'
import { supabase } from '../../services/supabase'

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setIsLoading(true)

    try {
      console.log('직접 로그인 시도 시작')
      
      // useAuth 우회하고 직접 Supabase 호출
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      console.log('로그인 결과:', { hasUser: !!data.user, error: loginError?.message })

      if (loginError) {
        setError(loginError.message)
        return
      }

      if (data.user) {
        console.log('로그인 성공, 대시보드로 이동')
        
        // 세션 확인
        const { data: session } = await supabase.auth.getSession()
        console.log('현재 세션:', !!session.session)

        // 직접 리디렉션 (useAuth 상태 관리 우회)
        window.location.href = ROUTES.ADMIN_DASHBOARD
      } else {
        setError('로그인에 실패했습니다.')
      }
    } catch (error: any) {
      console.error('로그인 중 예외 발생:', error)
      setError(error.message || '로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">관리자 로그인</h2>
          <p className="text-gray-600 mt-2">과일가게 관리 시스템</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <Input
          label="이메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
        />

        <Input
          label="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          required
        />

        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          className="w-full"
        >
          로그인
        </Button>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            테스트 계정이 필요하시다면 관리자에게 문의하세요.
          </p>
        </div>
      </form>
    </Card>
  )
}

export { LoginForm }