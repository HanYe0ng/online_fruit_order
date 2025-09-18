-- =====================================
-- Products 테이블에 할인가 컬럼 추가
-- =====================================

-- 1. 할인가 컬럼 추가 (nullable, 할인이 없으면 null)
ALTER TABLE public.products 
ADD COLUMN discount_price integer;

-- 2. 할인율 컬럼도 함께 추가 (선택사항)
ALTER TABLE public.products 
ADD COLUMN discount_rate integer;

-- 3. 컬럼에 주석 추가
COMMENT ON COLUMN public.products.discount_price IS '할인가 (원 단위, 할인이 없으면 null)';
COMMENT ON COLUMN public.products.discount_rate IS '할인율 (%, 할인이 없으면 null)';

-- 4. 할인가 유효성 검증을 위한 체크 제약조건 추가
ALTER TABLE public.products 
ADD CONSTRAINT check_discount_price_valid 
CHECK (discount_price IS NULL OR (discount_price > 0 AND discount_price < price));

-- 5. 할인율 유효성 검증을 위한 체크 제약조건 추가
ALTER TABLE public.products 
ADD CONSTRAINT check_discount_rate_valid 
CHECK (discount_rate IS NULL OR (discount_rate > 0 AND discount_rate <= 100));
