-- =====================================
-- Products 테이블에 순서 컬럼 추가
-- =====================================

-- 1. 순서 컬럼 추가 (정수형, 기본값 0)
ALTER TABLE public.products 
ADD COLUMN display_order integer DEFAULT 0;

-- 2. 컬럼에 주석 추가
COMMENT ON COLUMN public.products.display_order IS '상품 표시 순서 (낮은 숫자가 우선)';

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX idx_products_display_order ON public.products(store_id, display_order);

-- 4. 기존 상품들에 기본 순서 설정 (생성일 기준)
UPDATE public.products 
SET display_order = (
  SELECT ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY created_at DESC)
  FROM (SELECT id, store_id, created_at FROM public.products) AS p
  WHERE p.id = products.id
);

-- 5. 상품 순서 업데이트 함수 생성
CREATE OR REPLACE FUNCTION update_product_order(
  product_ids integer[],
  new_orders integer[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- 배열 길이 확인
  IF array_length(product_ids, 1) != array_length(new_orders, 1) THEN
    RAISE EXCEPTION '상품 ID와 순서 배열의 길이가 일치하지 않습니다.';
  END IF;

  -- 각 상품의 순서 업데이트
  FOR i IN 1..array_length(product_ids, 1) LOOP
    UPDATE public.products 
    SET display_order = new_orders[i]
    WHERE id = product_ids[i];
  END LOOP;
END;
$$;

-- 6. 상품 조회 시 순서 적용된 뷰 생성
CREATE OR REPLACE VIEW public.products_ordered AS
SELECT *
FROM public.products
ORDER BY store_id, display_order ASC, created_at DESC;
