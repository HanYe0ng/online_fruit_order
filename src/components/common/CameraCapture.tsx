import React, { useRef, useState, useCallback, useEffect } from 'react'
import Button from './Button'
import { detectInAppBrowser } from '../../utils/browserDetection' // 인앱/브라우저 감지

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [isInitialized, setIsInitialized] = useState(false)
  const [useFallback, setUseFallback] = useState(false)

  const { browser, isInApp } = detectInAppBrowser()
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isSecure = typeof window !== 'undefined'
    ? (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
    : true
  const mediaSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia

  // ✅ 공통: 스트림 정리
  const stopCamera = useCallback(() => {
    try {
      if (videoRef.current) {
        try { videoRef.current.pause() } catch {}
        try { (videoRef.current as any).srcObject = null } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    } finally {
      setIsInitialized(false)
      setIsCapturing(false)
    }
  }, [])

  // ✅ 카메라 시작 (표시 후 약간 지연)
  const startCamera = useCallback(async () => {
    if (!isOpen || isCapturing) return

    // 환경 체크 → 불가하면 fallback
    if (!isSecure || !mediaSupported) {
      setUseFallback(true)
      setError(null)
      // 모달 열리자마자 파일선택 트리거 (선호)
      setTimeout(() => fileInputRef.current?.click(), 200)
      return
    }

    setUseFallback(false)
    setIsLoading(true)
    setError(null)
    setIsInitialized(false)

    // 이전 스트림 정리
    stopCamera()

    try {
      // 사파리 안정화를 위한 소폭 지연
      await new Promise(r => setTimeout(r, 100))

      // 🔧 더 강건한 카메라 제약 조건
      const baseConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        } as MediaTrackConstraints
      }

      let stream: MediaStream | null = null
      
      // 첫 번째 시도: 이상적인 설정
      try {
        stream = await navigator.mediaDevices.getUserMedia(baseConstraints)
        console.log('✅ 카메라 첫 번째 시도 성공:', facingMode)
      } catch (firstError: any) {
        console.warn('⚠️ 카메라 첫 번째 시도 실패:', firstError.name, firstError.message)
        
        // 두 번째 시도: exact 제약 조건으로 강제
        try {
          const exactConstraints = {
            audio: false,
            video: {
              facingMode: { exact: facingMode }
            } as MediaTrackConstraints
          }
          stream = await navigator.mediaDevices.getUserMedia(exactConstraints)
          console.log('✅ 카메라 두 번째 시도 성공 (exact):', facingMode)
        } catch (secondError: any) {
          console.warn('⚠️ 카메라 두 번째 시도 실패:', secondError.name, secondError.message)
          
          // 세 번째 시도: 기본 카메라 (facingMode 없이)
          try {
            const basicConstraints = {
              audio: false,
              video: true
            }
            stream = await navigator.mediaDevices.getUserMedia(basicConstraints)
            console.log('✅ 카메라 세 번째 시도 성공 (기본 카메라)')
          } catch (thirdError: any) {
            console.error('❌ 모든 카메라 시도 실패:', thirdError.name, thirdError.message)
            throw thirdError // 마지막 에러를 throw
          }
        }
      }

      if (!stream) {
        throw new Error('카메라 스트림을 얻을 수 없습니다.')
      }

      if (!isOpen) { 
        stream.getTracks().forEach(t => t.stop()) 
        return 
      }
      
      streamRef.current = stream

      const video = videoRef.current
      if (!video) {
        stream.getTracks().forEach(t => t.stop())
        return
      }
      
      // 비디오 요소 설정
      ;(video as any).srcObject = stream
      
      // 🔧 더 강건한 비디오 로드 처리
      await new Promise<void>((resolve, reject) => {
        let resolved = false
        
        const onLoadedMetadata = () => {
          if (resolved) return
          resolved = true
          cleanup()
          console.log('✅ 비디오 메타데이터 로드 완료')
          resolve()
        }
        
        const onCanPlay = () => {
          if (resolved) return
          resolved = true
          cleanup()
          console.log('✅ 비디오 재생 준비 완료')
          resolve()
        }
        
        const onVideoError = (e: Event) => {
          if (resolved) return
          resolved = true
          cleanup()
          console.error('❌ 비디오 로드 에러:', e)
          reject(new Error('비디오 로드 실패'))
        }
        
        const cleanup = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('canplay', onCanPlay)
          video.removeEventListener('error', onVideoError)
        }
        
        video.addEventListener('loadedmetadata', onLoadedMetadata)
        video.addEventListener('canplay', onCanPlay)
        video.addEventListener('error', onVideoError)
        
        // 안전 타임아웃 (더 길게)
        setTimeout(() => {
          if (resolved) return
          resolved = true
          cleanup()
          console.warn('⚠️ 비디오 로드 타임아웃')
          reject(new Error('비디오 로드 타임아웃 (8초)'))
        }, 8000)
      })

      // 비디오 재생 시도 (여러 번 시도)
      let playAttempts = 0
      const maxPlayAttempts = 3
      
      while (playAttempts < maxPlayAttempts) {
        try {
          await video.play()
          console.log('✅ 비디오 재생 시작됨')
          break
        } catch (playError: any) {
          playAttempts++
          console.warn(`⚠️ 비디오 재생 시도 ${playAttempts} 실패:`, playError.name, playError.message)
          
          if (playAttempts >= maxPlayAttempts) {
            console.warn('⚠️ 비디오 재생 실패하지만 계속 진행 (사용자 상호작용 필요할 수 있음)')
            // iOS/자동재생 정책으로 실패할 수 있으나 계속 진행
          } else {
            // 잠시 대기 후 재시도
            await new Promise(r => setTimeout(r, 500))
          }
        }
      }

      // 초기화 완료
      setIsInitialized(true)
      console.log('✅ 카메라 초기화 완전 완료')
      
    } catch (err: any) {
      console.error('❌ 카메라 시작 실패:', err)
      
      // 권한/장치/제약 에러 메시지 가공
      const msg =
        err?.name === 'NotAllowedError' ? '카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.'
      : err?.name === 'NotFoundError' ? '사용 가능한 카메라를 찾지 못했습니다.'
      : err?.name === 'NotReadableError' ? '카메라가 다른 앱에서 사용 중입니다.'
      : err?.name === 'OverconstrainedError' ? `${facingMode === 'environment' ? '후면' : '전면'} 카메라를 찾을 수 없습니다. 다른 카메라를 시도해보세요.`
      : !isSecure ? '보안 연결(HTTPS)에서만 카메라 사용이 가능합니다.'
      : !mediaSupported ? '이 브라우저에서는 카메라 사용을 지원하지 않습니다.'
      : err?.message?.includes('타임아웃') ? '카메라 로딩 시간이 초과되었습니다. 다시 시도해주세요.'
      : err?.message || '카메라를 시작할 수 없습니다.'

      setError(msg)
      onError?.(msg)
      
      // OverconstrainedError (특정 카메라를 찾을 수 없음)의 경우 자동으로 전환하지 않고 사용자가 선택하도록
      if (err?.name === 'OverconstrainedError') {
        console.log('⚠️ OverconstrainedError - 사용자가 카메라 전환하도록 안내')
      } else {
        // 다른 에러의 경우 파일 fallback으로 전환
        setTimeout(() => {
          setUseFallback(true)
          setError(null)
          setTimeout(() => fileInputRef.current?.click(), 100)
        }, 2000)
      }
    } finally {
      setIsLoading(false)
    }
  }, [facingMode, isOpen, isCapturing, isSecure, mediaSupported, onError, stopCamera])

  // ✅ 촬영
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing || !isInitialized) return

    setIsCapturing(true)
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context를 가져올 수 없습니다.')
      if (video.videoWidth === 0 || video.videoHeight === 0) throw new Error('비디오가 준비되지 않았습니다.')

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9))
      if (!blob) throw new Error('이미지 생성에 실패했습니다.')

      const ts = Date.now()
      const file = new File([blob], `camera_photo_${ts}.jpg`, { type: 'image/jpeg', lastModified: ts })
      onCapture(file)

      stopCamera()
      onClose()
    } catch (e: any) {
      const msg = e?.message || '사진 촬영 중 오류가 발생했습니다.'
      setError(msg)
      onError?.(msg)
    } finally {
      setIsCapturing(false)
    }
  }, [isCapturing, isInitialized, onCapture, onClose, stopCamera, onError])

  // ✅ 카메라 전환
  const switchCamera = useCallback(() => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'))
  }, [])

  // ✅ 파일 fallback 선택 처리
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onCapture(file)
      onClose()
    }
  }

  // ✅ 모달 열림/닫힘 감지
  useEffect(() => {
    let t: any
    if (isOpen) {
      // 열리면 시작
      t = setTimeout(() => startCamera(), 150)
    } else {
      // 닫히면 정리
      setError(null)
      stopCamera()
      setUseFallback(false)
    }
    return () => { clearTimeout(t) }
  }, [isOpen, startCamera, stopCamera])

  // ✅ 전면/후면 전환 시 재시작
  useEffect(() => {
    if (!isOpen) return
    // 스트림이 있거나 초기화된 상태에서만 재시작
    if (streamRef.current || isInitialized) {
      console.log(`🔄 카메라 전환: ${facingMode} 모드로 재시작`)
      setIsInitialized(false)
      setError(null) // 이전 에러 초기화
      const t = setTimeout(() => startCamera(), 300)
      return () => clearTimeout(t)
    }
  }, [facingMode]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">사진 촬영</h3>
          <button
            onClick={() => { setError(null); setIsCapturing(false); stopCamera(); onClose() }}
            disabled={isCapturing}
            className="text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>

        {/* 개발용 디버그 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
            <div>상태: {JSON.stringify({
              isLoading, isInitialized, isCapturing, hasError: !!error, facingMode,
              hasStream: !!streamRef.current, hasVideo: !!videoRef.current,
              isIOS, isInApp, isSecure, mediaSupported, browser, useFallback
            }, null, 2)}</div>
          </div>
        )}

        {/* Fallback: 파일 선택/촬영 */}
        {useFallback ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-700 mb-3">
              {(!isSecure && '보안 연결(HTTPS)에서만 카메라 사용이 가능합니다.') ||
               (isIOS && 'iOS 환경에서는 브라우저 제약으로 파일 선택 방식이 더 안정적입니다.') ||
               (isInApp && '인앱 브라우저에서는 파일 선택 방식이 더 안정적입니다.') ||
               '현재 환경에서는 파일 선택 방식이 더 안정적입니다.'}
            </p>
            <div className="space-y-3">
              <Button onClick={() => fileInputRef.current?.click()} variant="primary">
                사진 선택/촬영
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                // iOS/안드로이드 인앱에서 카메라 앱을 직접 띄우도록 힌트
                accept="image/*;capture=camera"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button onClick={() => { setUseFallback(false); setTimeout(() => startCamera(), 50) }} variant="secondary">
                브라우저 카메라 시도
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
                  controls={false}
                  preload="none"
                  className="w-full aspect-video object-cover"
                  onError={(e) => {
                    setError('비디오 재생 중 오류가 발생했습니다.')
                    setIsInitialized(false)
                  }}
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget
                    if (v.videoWidth > 0 && v.videoHeight > 0 && !isInitialized && !isLoading) {
                      setIsInitialized(true)
                    }
                  }}
                  onCanPlay={() => {
                    if (!isInitialized && !isLoading && videoRef.current) {
                      const v = videoRef.current
                      if (v.videoWidth > 0 && v.videoHeight > 0) setIsInitialized(true)
                    }
                  }}
                />
              )}

              {/* 카메라 전환 버튼 */}
              {!isLoading && !error && (
                <button
                  onClick={switchCamera}
                  disabled={isCapturing}
                  className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 disabled:opacity-50"
                  title="전면/후면 전환"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
            </div>

            {/* 숨겨진 캔버스 */}
            <canvas ref={canvasRef} className="hidden" />

            {/* 안내 */}
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">상품 사진을 촬영해주세요. 밝은 곳에서 촬영하면 품질이 좋아집니다.</p>
              <p className="text-xs text-gray-500 mt-1">현재 카메라: {facingMode === 'user' ? '전면' : '후면'}</p>
            </div>

            {/* 버튼들 */}
            <div className="flex justify-center space-x-4">
              <Button onClick={() => { stopCamera(); onClose() }} variant="secondary" disabled={isCapturing}>
                취소
              </Button>
              <Button
                onClick={capturePhoto}
                variant="primary"
                disabled={isLoading || isCapturing || !isInitialized}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCapturing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    촬영 중...
                  </>
                ) : !isInitialized ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    카메라 준비중...
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
