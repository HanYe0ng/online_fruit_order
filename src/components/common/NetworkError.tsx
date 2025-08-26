import React from 'react'
import { Button, Card } from './index'

interface NetworkErrorProps {
  onRetry?: () => void
  title?: string
  message?: string
}

const NetworkError: React.FC<NetworkErrorProps> = ({
  onRetry,
  title = "네트워크 연결 오류",
  message = "인터넷 연결을 확인하고 다시 시도해주세요."
}) => {
  return (
    <Card className="text-center py-12">
      <div className="text-6xl mb-4">📡</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{message}</p>
      
      {onRetry && (
        <Button onClick={onRetry} variant="primary">
          다시 시도
        </Button>
      )}
    </Card>
  )
}

export default NetworkError