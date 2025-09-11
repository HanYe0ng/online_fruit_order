import React, { useRef, useState, useCallback, useEffect } from 'react'
import Button from './Button'

interface CameraCaptureProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
  onError?: (error: string) => void
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  isOpen,
  onClose,
  onCapture,
  onError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment') // 후면 카메라가 기본

  // 카메라 스트림 시작
  const startCamera = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 기존 스트림이 있다면 종료
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // 카메라 권한 요청 및 스트림 시작
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err) {
      console.error('카메라 접근 오류:', err)
      let errorMessage = '카메라에 접근할 수 없습니다.'
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = '카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.'
        } else if (err.name === 'NotFoundError') {
          errorMessage = '카메라 장치를 찾을 수 없습니다.'
        } else if (err.name === 'NotReadableError') {
          errorMessage = '카메라가 다른 앱에서 사용 중입니다.'
        } else {
          errorMessage = `카메라 오류: ${err.message}`
        }
      }
      
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [facingMode, onError])

  // 카메라 스트림 정지
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  // 사진 촬영
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) {
      return
    }

    setIsCapturing(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Canvas context를 가져올 수 없습니다.')
      }

      // 비디오 크기에 맞춰 캔버스 크기 설정
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // 비디오 프레임을 캔버스에 그리기
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // 캔버스를 Blob으로 변환
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8)
      })

      if (!blob) {
        throw new Error('이미지 생성에 실패했습니다.')
      }

      // Blob을 File 객체로 변환
      const timestamp = new Date().getTime()
      const file = new File([blob], `camera_photo_${timestamp}.jpg`, {
        type: 'image/jpeg',
        lastModified: timestamp
      })

      // 촬영 완료 콜백 호출
      onCapture(file)
      
      // 카메라 정지 및 모달 닫기
      stopCamera()
      onClose()

    } catch (err) {
      console.error('사진 촬영 오류:', err)
      const errorMessage = err instanceof Error ? err.message : '사진 촬영 중 오류가 발생했습니다.'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsCapturing(false)
    }
  }, [isCapturing, onCapture, onClose, stopCamera, onError])

  // 카메라 전환 (전면/후면)
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }, [])

  // 모달이 열릴 때 카메라 시작
  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    // 컴포넌트 언마운트 시 카메라 정지
    return () => {
      stopCamera()
    }
  }, [isOpen, startCamera, stopCamera])

  // 카메라 전환 시 재시작
  useEffect(() => {
    if (isOpen && !isLoading) {
      startCamera()
    }
  }, [facingMode, isOpen, isLoading, startCamera])

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">사진 촬영</h3>
          <button
            onClick={() => {
              stopCamera()
              onClose()
            }}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {error ? (
          // 오류 표시
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-900 font-medium mb-2">카메라 오류</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button
                onClick={startCamera}
                variant="primary"
                disabled={isLoading}
              >
                {isLoading ? '재시도 중...' : '다시 시도'}
              </Button>
              <Button
                onClick={() => {
                  stopCamera()
                  onClose()
                }}
                variant="secondary"
              >
                닫기
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* 카메라 프리뷰 */}
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              {isLoading ? (
                <div className="aspect-video flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm">카메라를 시작하는 중...</p>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-video object-cover"
                />
              )}
              
              {/* 카메라 전환 버튼 */}
              {!isLoading && !error && (
                <button
                  onClick={switchCamera}
                  disabled={isCapturing}
                  className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>

            {/* 숨겨진 캔버스 */}
            <canvas ref={canvasRef} className="hidden" />

            {/* 안내 메시지 */}
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                상품 사진을 촬영해주세요. 조명이 밝은 곳에서 촬영하면 더 좋은 품질의 사진을 얻을 수 있습니다.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                현재 카메라: {facingMode === 'user' ? '전면' : '후면'}
              </p>
            </div>

            {/* 버튼들 */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => {
                  stopCamera()
                  onClose()
                }}
                variant="secondary"
                disabled={isCapturing}
              >
                취소
              </Button>
              <Button
                onClick={capturePhoto}
                variant="primary"
                disabled={isLoading || isCapturing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCapturing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    촬영 중...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    촬영하기
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CameraCapture