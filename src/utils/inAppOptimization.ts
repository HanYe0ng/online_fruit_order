import { detectInAppBrowser } from './browserDetection'

export const createTimeoutPromise = <T>(
  promise: Promise<T>,
  timeout: number,
  errorMessage: string
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeout);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // 지수 백오프: 1초, 2초, 4초
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`재시도 ${attempt + 1}/${maxRetries} (${delay}ms 후)`);
    }
  }
  
  throw lastError!;
};

// 카카오톡 인앱브라우저 감지 및 최적화 설정
export const getInAppOptimizationSettings = () => {
  const browserInfo = detectInAppBrowser();
  
  if (browserInfo.browser === 'kakao') {
    return {
      uploadTimeout: 60000, // 60초
      dbTimeout: 30000, // DB 작업 30초
      maxRetries: 2,
      chunkSize: 1024 * 1024, // 1MB 청크
      useFormData: true, // FormData 사용 강제
      disableWebWorker: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      enableSequentialRequests: true, // 순차 요청으로 변경
      connectionPooling: false // 연결 풀링 비활성화
    };
  } else if (browserInfo.isInApp) {
    return {
      uploadTimeout: 45000, // 45초
      dbTimeout: 25000, // DB 작업 25초
      maxRetries: 2,
      chunkSize: 2 * 1024 * 1024, // 2MB 청크
      useFormData: false,
      disableWebWorker: true,
      maxFileSize: 15 * 1024 * 1024, // 15MB
      enableSequentialRequests: true,
      connectionPooling: false
    };
  } else {
    return {
      uploadTimeout: 30000, // 30초
      dbTimeout: 15000, // DB 작업 15초
      maxRetries: 1,
      chunkSize: 5 * 1024 * 1024, // 5MB 청크
      useFormData: false,
      disableWebWorker: false,
      maxFileSize: 25 * 1024 * 1024, // 25MB
      enableSequentialRequests: false,
      connectionPooling: true
    };
  }
};

// 인앱브라우저 전용 DB 클라이언트 생성
export const createOptimizedSupabaseClient = () => {
  const settings = getInAppOptimizationSettings();
  
  if (settings.enableSequentialRequests) {
    // 인앱브라우저용 설정: 단일 연결, 순차 처리
    return {
      timeout: settings.dbTimeout,
      retryPolicy: {
        maxRetries: settings.maxRetries,
        baseDelay: 2000 // 2초 간격으로 재시도
      },
      connectionLimit: 1, // 단일 연결만 사용
      keepAlive: false // Keep-Alive 비활성화
    };
  }
  
  return {
    timeout: settings.dbTimeout,
    retryPolicy: {
      maxRetries: settings.maxRetries,
      baseDelay: 1000
    },
    connectionLimit: 5,
    keepAlive: true
  };
};
