-- =====================================
-- products 테이블의 category 컬럼 수정
-- =====================================

-- 1. category 컬럼이 없다면 추가
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'category') THEN
        ALTER TABLE public.products 
        ADD COLUMN category text DEFAULT 'today' CHECK (category IN ('today', 'gift'));
    END IF;
END $$;

-- 2. NULL 값들을 'today'로 업데이트
UPDATE public.products 
SET category = 'today' 
WHERE category IS NULL;

-- 3. 선물 관련 상품들을 'gift'로 분류
UPDATE public.products 
SET category = 'gift' 
WHERE lower(name) LIKE '%선물%' 
   OR lower(name) LIKE '%기프트%' 
   OR lower(name) LIKE '%gift%'
   OR lower(name) LIKE '%box%'
   OR lower(name) LIKE '%세트%';

-- 4. NOT NULL 제약조건 추가 (없다면)
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.products 
        ALTER COLUMN category SET NOT NULL;
    EXCEPTION
        WHEN OTHERS THEN
            -- 이미 NOT NULL이면 무시
            NULL;
    END;
END $$;

-- 5. 인덱스 생성 (없다면)
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);
CREATE INDEX IF NOT EXISTS products_store_category_idx ON public.products(store_id, category);

-- 6. 확인
SELECT 
    category,
    COUNT(*) as count,
    array_agg(name ORDER BY name LIMIT 3) as sample_products
FROM public.products 
GROUP BY category;
