export const detectInAppBrowser = (): {
  isInApp: boolean;
  browser: string;
  hasFileSupport: boolean;
  hasClipboardSupport: boolean;
  needsSpecialHandling: boolean;
} => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  const inAppBrowsers = {
    kakao: /kakaotalk/i.test(userAgent),
    naver: /naver/i.test(userAgent),
    line: /line/i.test(userAgent),
    facebook: /fban|fbav/i.test(userAgent),
    instagram: /instagram/i.test(userAgent),
    twitter: /twitter/i.test(userAgent),
    wechat: /micromessenger/i.test(userAgent)
  };
  
  const isInApp = Object.values(inAppBrowsers).some(Boolean);
  const browserName = Object.keys(inAppBrowsers).find(key => inAppBrowsers[key as keyof typeof inAppBrowsers]) || 'unknown';
  
  // 파일 입력 지원 여부 실제 테스트
  const hasFileSupport = (() => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      // 실제로 파일 선택이 가능한지 테스트
      const isSupported = input.type === 'file';
      
      // 대부분의 인앱브라우저는 실제로 파일 업로드를 지원함
      // 단지 Web Worker나 일부 API에서 문제가 발생할 뿐
      return isSupported;
    } catch {
      return false;
    }
  })();
  
  // 클립보드 지원 여부 체크 (올바른 방식)
  const hasClipboardSupport = (() => {
    try {
      return !!(
        navigator.clipboard && 
        typeof navigator.clipboard.writeText === 'function' && 
        window.isSecureContext
      );
    } catch {
      return false;
    }
  })();
  
  // 특별한 처리가 필요한 브라우저 (Web Worker 문제 등)
  const needsSpecialHandling = inAppBrowsers.kakao || inAppBrowsers.wechat;
  
  return {
    isInApp,
    browser: browserName,
    hasFileSupport,
    hasClipboardSupport,
    needsSpecialHandling
  };
};

export const isWebWorkerSupported = (): boolean => {
  try {
    return typeof Worker !== 'undefined' && 
           typeof window !== 'undefined' &&
           !detectInAppBrowser().needsSpecialHandling; // 특정 브라우저에서는 비활성화
  } catch {
    return false;
  }
};
