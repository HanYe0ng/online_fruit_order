-- =====================================
-- 재고 차감 함수 (Supabase RPC)
-- =====================================
-- 이 SQL을 Supabase 대시보드의 SQL Editor에서 실행해주세요

CREATE OR REPLACE FUNCTION decrease_product_quantity(
  product_id bigint,
  decrease_amount integer
) RETURNS void AS $$
BEGIN
  -- 재고 차감
  UPDATE products 
  SET quantity = quantity - decrease_amount,
      is_soldout = CASE 
        WHEN quantity - decrease_amount <= 0 THEN true 
        ELSE is_soldout 
      END
  WHERE id = product_id;
  
  -- 업데이트된 행이 없으면 에러
  IF NOT FOUND THEN
    RAISE EXCEPTION '상품을 찾을 수 없습니다. ID: %', product_id;
  END IF;
  
  -- 재고가 음수가 되는 경우 에러
  IF (SELECT quantity FROM products WHERE id = product_id) < 0 THEN
    RAISE EXCEPTION '재고가 부족합니다. 상품 ID: %', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 주문 취소 시 재고 복구 함수
-- =====================================
CREATE OR REPLACE FUNCTION increase_product_quantity(
  product_id bigint,
  increase_amount integer
) RETURNS void AS $$
BEGIN
  -- 재고 증가
  UPDATE products 
  SET quantity = quantity + increase_amount,
      is_soldout = false  -- 재고가 증가하면 품절 상태 해제
  WHERE id = product_id;
  
  -- 업데이트된 행이 없으면 에러
  IF NOT FOUND THEN
    RAISE EXCEPTION '상품을 찾을 수 없습니다. ID: %', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;