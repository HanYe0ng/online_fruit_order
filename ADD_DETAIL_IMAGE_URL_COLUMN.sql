-- products 테이블에 detail_image_url 컬럼 추가
ALTER TABLE public.products 
ADD COLUMN detail_image_url TEXT;

-- 컬럼에 코멘트 추가
COMMENT ON COLUMN public.products.detail_image_url IS '상세페이지 이미지 URL (과일선물 카테고리용)';