-- 인앱브라우저용 이미지 Base64 저장 컬럼 추가
-- products 테이블에 Base64 이미지 데이터 저장용 컬럼 추가

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_base64 TEXT,
ADD COLUMN IF NOT EXISTS image_mime_type TEXT,
ADD COLUMN IF NOT EXISTS image_original_name TEXT;

-- 컬럼 설명 추가
COMMENT ON COLUMN public.products.image_base64 IS '인앱브라우저용 Base64 인코딩된 이미지 데이터';
COMMENT ON COLUMN public.products.image_mime_type IS '이미지 MIME 타입 (image/jpeg, image/png 등)';
COMMENT ON COLUMN public.products.image_original_name IS '원본 이미지 파일명';

-- 기존 image_url 컬럼과 새로운 Base64 컬럼 중 하나는 항상 있어야 함
-- (둘 다 NULL이면 안됨, 하지만 둘 다 있어도 됨)
