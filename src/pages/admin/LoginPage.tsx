import React from 'react'

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow">
        <h1>로그인 페이지 (useAuth 없음)</h1>
        <p>이 메시지가 보이고 콘솔에 로그가 없다면 useAuth가 문제</p>
      </div>
    </div>
  )
}

export default LoginPage