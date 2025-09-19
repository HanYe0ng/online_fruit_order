-- 과일선물 상품에 상세페이지 이미지 추가를 위한 SQL
-- Supabase 콘솔의 SQL Editor에서 실행하세요

-- 1. gift_product_details 테이블에 detail_image_url 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'gift_product_details' AND column_name = 'detail_image_url') THEN
        ALTER TABLE public.gift_product_details 
        ADD COLUMN detail_image_url text;
        
        -- 컬럼에 주석 추가
        COMMENT ON COLUMN public.gift_product_details.detail_image_url IS '상세페이지 이미지 URL (모바일 크기에 맞춤)';
    END IF;
END $$;

-- 2. products 테이블의 image_url을 썸네일 이미지로 명확히 구분
COMMENT ON COLUMN public.products.image_url IS '썸네일 이미지 URL (홈 화면 표시용)';

-- 3. gift_products_view 뷰 업데이트 (상세페이지 이미지 포함)
CREATE OR REPLACE VIEW public.gift_products_view AS
SELECT 
    p.id,
    p.store_id,
    s.name as store_name,
    p.name,
    p.price,
    gpd.original_price,
    gpd.discount_rate,
    p.quantity,
    p.image_url as thumbnail_image_url,  -- 썸네일 이미지 (홈 화면용)
    gpd.detail_image_url,                -- 상세페이지 이미지 (상세페이지용)
    p.is_soldout,
    gpd.tags,
    gpd.rating,
    gpd.review_count,
    gpd.nutrition_info,
    gpd.storage_info,
    gpd.origin,
    gpd.description_detail,
    p.created_at
FROM public.products p
JOIN public.stores s ON p.store_id = s.id
LEFT JOIN public.gift_product_details gpd ON p.id = gpd.product_id
WHERE p.category = 'gift'
ORDER BY p.display_order ASC, p.created_at DESC;

-- 4. 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'gift_product_details' 
  AND column_name IN ('detail_image_url', 'product_id')
ORDER BY ordinal_position;
