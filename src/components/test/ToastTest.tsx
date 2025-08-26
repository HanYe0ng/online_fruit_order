import React from 'react'
import { Button, Card } from '../common'
import { useToast } from '../../hooks/useToast'

const ToastTest: React.FC = () => {
  const toast = useToast()

  return (
    <Card className="max-w-md mx-auto mt-8">
      <h3 className="text-lg font-semibold mb-4">🍞 토스트 테스트</h3>
      <div className="space-y-2">
        <Button 
          variant="primary" 
          onClick={() => toast.success('성공!', '작업이 완료되었습니다.')}
          className="w-full"
        >
          성공 토스트
        </Button>
        
        <Button 
          variant="danger" 
          onClick={() => toast.error('오류 발생!', '다시 시도해주세요.')}
          className="w-full"
        >
          에러 토스트
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => toast.warning('주의!', '확인이 필요합니다.')}
          className="w-full"
        >
          경고 토스트
        </Button>
        
        <Button 
          variant="secondary" 
          onClick={() => toast.info('정보', '새로운 업데이트가 있습니다.')}
          className="w-full"
        >
          정보 토스트
        </Button>

        <Button 
          variant="outline" 
          onClick={() => toast.success('액션 토스트', '버튼이 있는 토스트입니다.', {
            action: {
              label: '확인',
              onClick: () => alert('액션 버튼 클릭!')
            }
          })}
          className="w-full"
        >
          액션 버튼 토스트
        </Button>
      </div>
    </Card>
  )
}

export default ToastTest