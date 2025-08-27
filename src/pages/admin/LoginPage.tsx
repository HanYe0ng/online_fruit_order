import React from 'react'
import { LoginForm } from '../../components/admin/LoginForm'

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow">
        <LoginForm />
      </div>
    </div>
  )
}
export default LoginPage
