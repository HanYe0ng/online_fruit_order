-- Supabase Storage 버킷 및 정책 설정
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

-- 1. product-images 버킷을 위한 RLS 정책 설정 (필요한 경우)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 공개 읽기 정책
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 3. 인증된 사용자 업로드 정책 
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- 4. 인증된 사용자 업데이트 정책
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- 5. 인증된 사용자 삭제 정책
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');