import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card } from '../common'
import { ROUTES } from '../../utils/constants'
import { useAuth } from '../../hooks/useAuth'

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [forceShowForm, setForceShowForm] = useState(false)
  
  const { login, isLoading, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  // 강제 로딩 해제 타이머 (5초)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && !user && !isAuthenticated) {
        console.log('⏰ 로딩 타임아웃 - 강제로 폼 표시')
        setForceShowForm(true)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [isLoading, user, isAuthenticated])

  // 로그인 성공 시 리다이렉트 처리
  useEffect(() => {
    console.log('LoginForm 상태 변화:', { 
      isAuthenticated, 
      hasUser: !!user, 
      isLoading,
      forceShowForm 
    })
    
    if (isAuthenticated && user) {
      console.log('✅ 이미 로그인됨 - 대시보드로 이동', {
        userId: user.id,
        role: user.role,
        email: user.email
      })
      navigate(ROUTES.ADMIN_DASHBOARD, { replace: true })
    }
  }, [isAuthenticated, user, navigate, forceShowForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    console.log('🔐 useAuth를 통한 로그인 시도', { email })

    try {
      const result = await login(email, password)
      
      if (result.error) {
        console.error('❌ 로그인 실패:', result.error)
        setError(result.error)
      } else if (result.user) {
        console.log('✅ 로그인 성공:', {
          userId: result.user.id,
          role: result.user.role,
          email: result.user.email
        })
        // useEffect에서 자동으로 리다이렉트 처리됨
      } else {
        setError('로그인에 실패했습니다.')
      }
    } catch (error: any) {
      console.error('💥 로그인 중 예외 발생:', error)
      setError(error.message || '로그인 중 오류가 발생했습니다.')
    }
  }

  // 강제 폼 표시 또는 로딩이 아닌 경우 폼 렌더링
  const shouldShowForm = !isLoading || forceShowForm

  // 로딩 중이고 강제 표시가 아닌 경우
  if (!shouldShowForm) {
    return (
      <Card className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">인증 상태 확인 중...</p>
          <p className="text-xs text-gray-500 mt-2">5초 후 자동으로 로그인 폼을 표시합니다</p>
          
          {/* 수동 건너뛰기 버튼 */}
          <button
            onClick={() => setForceShowForm(true)}
            className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            로그인 폼 바로 보기
          </button>
          
          {/* 개발 모드에서만 디버깅 정보 표시 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg w-full">
              <p className="text-xs font-medium text-gray-700 mb-2">디버깅 정보:</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• 로딩 상태: {isLoading ? '로딩 중' : '준비됨'}</p>
                <p>• 인증 상태: {isAuthenticated ? '인증됨' : '미인증'}</p>
                <p>• 사용자 정보: {user ? `${user.email} (${user.role})` : '없음'}</p>
                <p>• 강제 표시: {forceShowForm ? '활성' : '비활성'}</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      {forceShowForm && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ 인증 확인에 시간이 걸려 폼을 강제로 표시했습니다.
          </p>
        </div>
      )}
      
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
          disabled={isLoading && !forceShowForm}
          required
        />

        <Input
          label="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          disabled={isLoading && !forceShowForm}
          required
        />

        <Button
          type="submit"
          variant="primary"
          loading={isLoading && !forceShowForm}
          disabled={isLoading && !forceShowForm}
          className="w-full"
        >
          {isLoading && !forceShowForm ? '로그인 중...' : '로그인'}
        </Button>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            테스트 계정이 필요하시다면 관리자에게 문의하세요.
          </p>
        </div>

        {/* 개발 모드에서만 디버깅 정보 표시 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-2">디버깅 정보:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• 로딩 상태: {isLoading ? '로딩 중' : '준비됨'}</p>
              <p>• 인증 상태: {isAuthenticated ? '인증됨' : '미인증'}</p>
              <p>• 사용자 정보: {user ? `${user.email} (${user.role})` : '없음'}</p>
              <p>• 강제 표시: {forceShowForm ? '활성' : '비활성'}</p>
            </div>
          </div>
        )}
      </form>
    </Card>
  )
}

export { LoginForm }