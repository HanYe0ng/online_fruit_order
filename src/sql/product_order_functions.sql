-- 배치 업데이트를 위한 RPC 함수 생성
-- 이 함수는 Supabase 데이터베이스에서 실행되어 트랜잭션으로 상품 순서를 일괄 업데이트합니다.

-- 1. 상품 순서 배치 업데이트 함수
CREATE OR REPLACE FUNCTION update_products_order_batch(product_updates jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    update_record jsonb;
    product_id bigint;
    display_order_val integer;
    affected_rows integer := 0;
BEGIN
    -- 트랜잭션 시작 (함수 내에서 자동으로 트랜잭션 처리됨)
    
    -- JSON 배열의 각 업데이트 항목을 순회
    FOR update_record IN SELECT * FROM jsonb_array_elements(product_updates)
    LOOP
        -- JSON에서 값 추출
        product_id := (update_record->>'id')::bigint;
        display_order_val := (update_record->>'display_order')::integer;
        
        -- 상품 존재 여부 확인
        IF EXISTS(SELECT 1 FROM products WHERE id = product_id) THEN
            -- 순서 업데이트 실행
            UPDATE products 
            SET display_order = display_order_val, 
                updated_at = now()
            WHERE id = product_id;
            
            -- 영향받은 행 수 카운트
            GET DIAGNOSTICS affected_rows = ROW_COUNT;
            
            -- 로그 출력 (개발 환경에서만)
            RAISE NOTICE '상품 ID % 순서를 %로 업데이트 완료 (영향받은 행: %)', 
                product_id, display_order_val, affected_rows;
        ELSE
            -- 상품이 존재하지 않으면 경고
            RAISE WARNING '상품 ID %가 존재하지 않습니다', product_id;
        END IF;
    END LOOP;
    
    RAISE NOTICE '배치 순서 업데이트 완료: % 개 항목 처리됨', 
        jsonb_array_length(product_updates);
        
EXCEPTION
    WHEN OTHERS THEN
        -- 오류 발생 시 롤백되고 에러 메시지 반환
        RAISE EXCEPTION '배치 업데이트 실패: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- 2. 상품 순서 재정렬 함수 (점포별)
CREATE OR REPLACE FUNCTION reorder_store_products(store_id_param bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    product_cursor CURSOR FOR 
        SELECT id FROM products 
        WHERE store_id = store_id_param 
        ORDER BY display_order ASC, created_at DESC;
    product_record RECORD;
    new_order integer := 1;
BEGIN
    -- 해당 점포의 모든 상품을 순서대로 재정렬
    FOR product_record IN product_cursor
    LOOP
        UPDATE products 
        SET display_order = new_order, 
            updated_at = now()
        WHERE id = product_record.id;
        
        new_order := new_order + 1;
    END LOOP;
    
    RAISE NOTICE '점포 % 상품 순서 재정렬 완료: % 개 상품', 
        store_id_param, (new_order - 1);
        
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '상품 순서 재정렬 실패: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- 3. 중복 순서 수정 함수
CREATE OR REPLACE FUNCTION fix_duplicate_display_orders(store_id_param bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    duplicate_cursor CURSOR FOR 
        SELECT display_order, array_agg(id ORDER BY created_at DESC) as product_ids
        FROM products 
        WHERE store_id = store_id_param 
            AND display_order IS NOT NULL
        GROUP BY display_order 
        HAVING COUNT(*) > 1;
    duplicate_record RECORD;
    product_id bigint;
    new_order integer;
    max_order integer;
BEGIN
    -- 현재 최대 순서 번호 조회
    SELECT COALESCE(MAX(display_order), 0) INTO max_order 
    FROM products 
    WHERE store_id = store_id_param;
    
    -- 중복된 순서를 가진 상품들 처리
    FOR duplicate_record IN duplicate_cursor
    LOOP
        -- 첫 번째 상품은 기존 순서 유지, 나머지는 새 순서 할당
        FOR i IN 2..array_length(duplicate_record.product_ids, 1)
        LOOP
            product_id := duplicate_record.product_ids[i];
            max_order := max_order + 1;
            
            UPDATE products 
            SET display_order = max_order, 
                updated_at = now()
            WHERE id = product_id;
            
            RAISE NOTICE '중복 순서 수정: 상품 ID % 순서를 %로 변경', 
                product_id, max_order;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '중복 순서 수정 완료';
        
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '중복 순서 수정 실패: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- 4. 함수들에 대한 권한 설정
GRANT EXECUTE ON FUNCTION update_products_order_batch TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_store_products TO authenticated;
GRANT EXECUTE ON FUNCTION fix_duplicate_display_orders TO authenticated;

-- 5. 실행 예제 주석
/*
-- 배치 업데이트 사용 예제:
SELECT update_products_order_batch('[
    {"id": 1, "display_order": 1},
    {"id": 2, "display_order": 2},
    {"id": 3, "display_order": 3}
]'::jsonb);

-- 점포별 순서 재정렬 사용 예제:
SELECT reorder_store_products(1);

-- 중복 순서 수정 사용 예제:
SELECT fix_duplicate_display_orders(1);
*/

-- 함수 생성 완료 알림
DO $$
BEGIN
    RAISE NOTICE '✅ 상품 순서 관리 RPC 함수들이 성공적으로 생성되었습니다!';
    RAISE NOTICE '- update_products_order_batch: 배치 순서 업데이트';
    RAISE NOTICE '- reorder_store_products: 점포별 순서 재정렬';
    RAISE NOTICE '- fix_duplicate_display_orders: 중복 순서 수정';
END $$;
