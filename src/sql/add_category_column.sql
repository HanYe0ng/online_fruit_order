-- =====================================
-- products 테이블에 category 컬럼 추가
-- =====================================

-- 1. category 컬럼 추가 (기본값: 'today')
ALTER TABLE public.products 
ADD COLUMN category text DEFAULT 'today' CHECK (category IN ('today', 'gift'));

-- 2. 기존 데이터 업데이트 (선물 관련 키워드가 있는 상품은 'gift'로 설정)
UPDATE public.products 
SET category = 'gift' 
WHERE lower(name) LIKE '%선물%' 
   OR lower(name) LIKE '%기프트%' 
   OR lower(name) LIKE '%gift%';

-- 3. 나머지는 'today'로 설정 (이미 기본값이므로 생략 가능)
UPDATE public.products 
SET category = 'today' 
WHERE category IS NULL;

-- 4. NOT NULL 제약 조건 추가
ALTER TABLE public.products 
ALTER COLUMN category SET NOT NULL;

-- 5. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);
CREATE INDEX IF NOT EXISTS products_store_category_idx ON public.products(store_id, category);

-- 6. 확인용 쿼리
SELECT 
    category,
    COUNT(*) as count,
    array_agg(name ORDER BY name) as sample_products
FROM public.products 
GROUP BY category;