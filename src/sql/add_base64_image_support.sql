-- Base64 이미지 지원을 위한 products 테이블 확장
-- 선택사항: Base64 이미지 데이터를 저장하고 싶다면 실행

-- 1. image_base64 컬럼 추가 (Base64 인코딩된 이미지 데이터)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'image_base64') THEN
        ALTER TABLE public.products 
        ADD COLUMN image_base64 text;
    END IF;
END $$;

-- 2. image_mime_type 컬럼 추가 (이미지 MIME 타입)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'image_mime_type') THEN
        ALTER TABLE public.products 
        ADD COLUMN image_mime_type text;
    END IF;
END $$;

-- 3. image_original_name 컬럼 추가 (원본 파일명)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'image_original_name') THEN
        ALTER TABLE public.products 
        ADD COLUMN image_original_name text;
    END IF;
END $$;

-- 4. 인덱스 추가 (성능 최적화 - 필요시)
CREATE INDEX IF NOT EXISTS products_image_mime_type_idx ON public.products(image_mime_type);

-- 5. 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('image_base64', 'image_mime_type', 'image_original_name')
ORDER BY column_name;
