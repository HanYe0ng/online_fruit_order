-- 테스트용 관리자 계정 생성
-- 실제로는 Supabase Auth를 통해 사용자 생성 후 이 정보를 profiles 테이블에 추가

-- 1. 먼저 Supabase Auth Dashboard에서 사용자 생성:
--    Email: admin@test.com
--    Password: test123456
--    User ID가 생성됨 (예: 12345678-1234-1234-1234-123456789abc)

-- 2. profiles 테이블에 관리자 정보 추가 (실제 생성된 UUID 사용)
INSERT INTO profiles (id, email, role, store_id) VALUES 
('12345678-1234-1234-1234-123456789abc', 'admin@test.com', 'admin', 1)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  store_id = EXCLUDED.store_id;

-- 참고: 실제 UUID는 Supabase Auth에서 사용자 생성 시 확인 가능