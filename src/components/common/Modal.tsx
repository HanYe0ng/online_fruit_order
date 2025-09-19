import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  confirmLoading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  confirmText,
  cancelText = '취소',
  onConfirm,
  confirmLoading = false,
  size = 'md'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      
      // ESC 키로 모달 닫기
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }
      
      document.addEventListener('keydown', handleKeyDown)
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'unset'
      }
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  }
  
  const modalContent = (
    <div 
      className="fixed inset-0 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // 배경 클릭 시 모달 닫기
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      style={{ 
        zIndex: 99999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col relative`}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 100000,
          maxWidth: size === 'sm' ? '28rem' : size === 'md' ? '32rem' : '48rem'
        }}
      >
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex-shrink-0 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between min-h-[24px]">
            {title ? (
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 pr-4 flex-1 truncate">{title}</h3>
            ) : (
              <div className="flex-1"></div>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0 rounded-full hover:bg-gray-100"
              aria-label="닫기"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1">
          {children}
        </div>
        
        {(confirmText || onConfirm) && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
            <Button variant="secondary" onClick={onClose}>
              {cancelText}
            </Button>
            {confirmText && onConfirm && (
              <Button 
                variant="primary" 
                onClick={onConfirm}
                loading={confirmLoading}
              >
                {confirmText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
  
  // Portal을 사용하여 body에 직접 렌더링
  return createPortal(modalContent, document.body)
}

export default Modal