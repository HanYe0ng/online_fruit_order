-- orders 테이블 ID 시퀀스 문제 해결
-- Supabase SQL Editor에서 실행

-- 1. 현재 orders 테이블의 최대 ID 확인
SELECT MAX(id) FROM orders;

-- 2. 시퀀스 재설정 (MAX ID + 1로 설정)
-- 만약 테이블이 비어있다면 1부터 시작
SELECT setval('orders_id_seq', COALESCE(MAX(id), 0) + 1, false) FROM orders;

-- 3. 테스트용으로 기존 데이터 삭제 (필요한 경우에만)
-- DELETE FROM order_items;
-- DELETE FROM orders;

-- 4. 시퀀스 완전 재설정 (테이블을 비웠다면)
-- ALTER SEQUENCE orders_id_seq RESTART WITH 1;