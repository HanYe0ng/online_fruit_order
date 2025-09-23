import imageCompression from 'browser-image-compression'
import { detectInAppBrowser, isWebWorkerSupported } from './browserDetection'

interface ImageCompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  initialQuality?: number
  onProgress?: (progress: number) => void
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

// 인앱브라우저에서 이미지 처리를 우회할지 결정
const shouldSkipImageProcessing = (file: File, browserInfo: any): boolean => {
  // 카카오톡 인앱브라우저에서는 항상 우회
  if (browserInfo.browser === 'kakao') {
    console.log('🟡 카카오톡 인앱브라우저: 이미지 처리 우회')
    return true
  }
  
  // 다른 인앱브라우저에서는 파일 크기에 따라 결정
  if (browserInfo.isInApp) {
    const fileSizeMB = file.size / (1024 * 1024)
    
    // 5MB 이상의 파일은 우회
    if (fileSizeMB > 5) {
      console.log(`🟡 인앱브라우저: 파일 크기 ${fileSizeMB.toFixed(2)}MB > 5MB, 이미지 처리 우회`)
      return true
    }
  }
  
  return false
}

// 단계별 압축 전략
const getCompressionStrategy = (fileSize: number, browserInfo: any) => {
  const sizeMB = fileSize / (1024 * 1024);
  
  if (browserInfo.needsSpecialHandling) {
    // 카카오톡 등 특별 처리가 필요한 브라우저
    return {
      maxSizeMB: sizeMB > 6 ? 1.6 : 1.1,
      maxWidthOrHeight: sizeMB > 6 ? 1500 : 1200,
      useWebWorker: false,
      initialQuality: 0.9
    };
  } else if (browserInfo.isInApp) {
    // 일반 인앱브라우저
    return {
      maxSizeMB: sizeMB > 8 ? 1.6 : 1.2,
      maxWidthOrHeight: sizeMB > 8 ? 1500 : 1300,
      useWebWorker: false, // 안전을 위해 비활성화
      initialQuality: 0.9
    };
  } else {
    // 일반 브라우저
    return {
      maxSizeMB: sizeMB > 5 ? 1.4 : 1,
      maxWidthOrHeight: sizeMB > 5 ? 1600 : 1400,
      useWebWorker: isWebWorkerSupported(),
      initialQuality: 0.88
    };
  }
};

export const compressImage = async (
  file: File,
  options: ImageCompressionOptions = {},
  onProgress?: (progress: number) => void
): Promise<CompressionResult> => {
  const browserInfo = detectInAppBrowser();
  
  // 🚨 인앱브라우저에서 이미지 처리 완전 우회 옵션
  if (browserInfo.isInApp && shouldSkipImageProcessing(file, browserInfo)) {
    console.log('🚨 인앱브라우저 이미지 처리 우회 모드 활성화');
    onProgress?.(100);
    
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0
    };
  }
  
  const strategy = getCompressionStrategy(file.size, browserInfo);
  
  console.log('이미지 압축 시작:', {
    browser: browserInfo.browser,
    isInApp: browserInfo.isInApp,
    needsSpecialHandling: browserInfo.needsSpecialHandling,
    originalSize: (file.size / 1024 / 1024).toFixed(2) + 'MB',
    strategy
  });

  // 옵션 병합 (사용자 옵션이 우선)
  const finalOptions = {
    maxSizeMB: options.maxSizeMB ?? strategy.maxSizeMB,
    maxWidthOrHeight: options.maxWidthOrHeight ?? strategy.maxWidthOrHeight,
    useWebWorker: options.useWebWorker ?? strategy.useWebWorker,
    initialQuality: options.initialQuality ?? strategy.initialQuality
  };

  try {
    onProgress?.(10);
    
    // 첫 번째 압축 시도
    let compressedFile = await imageCompression(file, {
      ...finalOptions,
      onProgress: (progress: number) => {
        onProgress?.(10 + (progress * 60));
      }
    });
    
    onProgress?.(70);
    
    // 결과 확인 및 필요시 추가 압축
    const targetSize = finalOptions.maxSizeMB * 1024 * 1024;
    
    if (compressedFile.size > targetSize * 1.2) { // 20% 여유
      console.log('추가 압축 필요, 두 번째 시도...');
      
      // 더 강한 압축 설정
      const secondAttempt = await imageCompression(file, {
        maxSizeMB: finalOptions.maxSizeMB * 0.8,
        maxWidthOrHeight: finalOptions.maxWidthOrHeight * 0.9,
        useWebWorker: false, // 두 번째 시도에서는 항상 비활성화
        initialQuality: 0.7,
        onProgress: (progress: number) => {
          onProgress?.(70 + (progress * 25));
        }
      });
      
      // 더 나은 결과라면 사용
      if (secondAttempt.size < compressedFile.size) {
        compressedFile = secondAttempt;
      }
    }
    
    onProgress?.(100);
    
    const compressionRatio = Math.round((1 - compressedFile.size / file.size) * 100);
    
    console.log('이미지 압축 완료:', {
      original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      compressed: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
      ratio: `${compressionRatio}% 절약`,
      browser: browserInfo.browser,
      success: true
    });
    
    return {
      file: compressedFile,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio
    };
    
  } catch (error) {
    console.error('이미지 압축 실패:', error);
    
    // 인앱브라우저에서 압축 실패 시 최후의 수단
    if (browserInfo.isInApp) {
      try {
        console.log('폴백 압축 시도...');
        onProgress?.(50);
        
        // 매우 단순한 압축 시도
        const fallbackFile = await imageCompression(file, {
          maxSizeMB: Math.min(5, file.size / (1024 * 1024) * 0.5), // 원본의 50% 또는 5MB 중 작은 것
          maxWidthOrHeight: 1200,
          useWebWorker: false,
          initialQuality: 0.9
        });
        
        onProgress?.(100);
        
        const compressionRatio = Math.round((1 - fallbackFile.size / file.size) * 100);
        
        console.log('폴백 압축 성공:', {
          original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          compressed: `${(fallbackFile.size / 1024 / 1024).toFixed(2)}MB`,
          ratio: `${compressionRatio}% 절약`
        });
        
        return {
          file: fallbackFile,
          originalSize: file.size,
          compressedSize: fallbackFile.size,
          compressionRatio
        };
        
      } catch (fallbackError) {
        console.error('폴백 압축도 실패:', fallbackError);
      }
    }
    
    onProgress?.(100);
    
    // 최종적으로 압축에 실패하면 원본을 그대로 사용 (단, 크기 제한 확인)
    if (file.size > 10 * 1024 * 1024) { // 10MB 초과시 에러
      throw new Error('파일이 너무 큽니다. 10MB 이하의 이미지를 선택해주세요.');
    }
    
    console.log('원본 파일 사용 (압축 실패)');
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0
    };
  }
};

export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const browserInfo = detectInAppBrowser();
  
  // 브라우저별 최대 크기 설정
  const maxSize = browserInfo.needsSpecialHandling ? 
    15 * 1024 * 1024 : // 특별 처리 필요: 15MB
    browserInfo.isInApp ? 
      20 * 1024 * 1024 : // 일반 인앱: 20MB  
      25 * 1024 * 1024;   // 일반 브라우저: 25MB
  
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / 1024 / 1024);
    return { 
      isValid: false, 
      error: `이미지 파일은 ${maxSizeMB}MB 이하만 업로드 가능합니다.` 
    };
  }

  // HEIC/HEIF 안내
  const heicTypes = ['image/heic', 'image/heif', 'image/heic-sequence'];
  if (heicTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'HEIC/HEIF 이미지는 아직 지원하지 않습니다. iPhone 설정에서 JPEG/PNG로 저장하거나 변환 후 다시 업로드해주세요.'
    };
  }

  // MIME 타입 체크
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: 'JPG, PNG, WEBP 파일만 업로드 가능합니다.' 
    };
  }

  // 파일 이름 체크 (특수문자 등)
  if (!/^[a-zA-Z0-9._-]+$/i.test(file.name.replace(/\s+/g, '_'))) {
    console.warn('파일명에 특수문자 포함, 자동 변환됨');
  }

  return { isValid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
