import React, { useEffect, useState } from 'react'
import Button from './Button'
import { Toast as ToastType } from '../../types/toast'

interface ToastComponentProps {
  toast: ToastType
  onRemove: (id: string) => void
}

const ToastComponent: React.FC<ToastComponentProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // 등장 애니메이션
    setTimeout(() => setIsVisible(true), 50)
  }, [])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onRemove(toast.id), 300)
  }

  const getToastStyles = () => {
    const baseStyles = "flex items-start space-x-3 p-4 rounded-lg shadow-lg border max-w-md w-full transition-all duration-300"
    
    if (isExiting) {
      return `${baseStyles} transform translate-x-full opacity-0`
    }
    
    if (!isVisible) {
      return `${baseStyles} transform translate-x-full opacity-0`
    }

    const typeStyles = {
      success: "bg-green-50 border-green-200 text-green-800",
      error: "bg-red-50 border-red-200 text-red-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      info: "bg-blue-50 border-blue-200 text-blue-800"
    }

    return `${baseStyles} transform translate-x-0 opacity-100 ${typeStyles[toast.type]}`
  }

  const getIcon = () => {
    const icons = {
      success: "✅",
      error: "❌", 
      warning: "⚠️",
      info: "ℹ️"
    }
    return icons[toast.type]
  }

  return (
    <div className={getToastStyles()}>
      <div className="flex-shrink-0 text-lg">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium">{toast.title}</p>
        {toast.message && (
          <p className="text-sm mt-1 opacity-90">{toast.message}</p>
        )}
        
        {toast.action && (
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={toast.action.onClick}
              className="text-xs"
            >
              {toast.action.label}
            </Button>
          </div>
        )}
      </div>

      <button
        onClick={handleClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
      >
        <span className="sr-only">닫기</span>
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}

export default ToastComponent