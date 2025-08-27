# 무인 과일가게 주문 시스템 - 구현 가이드

## 구현된 주문 기능

### ✅ 핵심 구현 사항

#### 1. 주문 생성 시 재고 관리
- **재고 확인**: 주문 전 모든 상품의 재고 상태를 확인
- **원자적 처리**: 주문 생성과 재고 차감을 트랜잭션처럼 처리
- **롤백 처리**: 오류 발생 시 주문 데이터 자동 롤백
- **품절 처리**: 재고 0일 때 자동으로 `is_soldout` 플래그 업데이트

#### 2. 실시간 재고 확인
```typescript
// 장바구니에서 주문하기 전 실시간 재고 확인
const handleCheckoutClick = async () => {
  const stockResult = await checkCartItemsStock(items)
  if (stockResult.isAvailable) {
    // 주문 진행
  } else {
    // 재고 부족 알림
  }
}
```

#### 3. 향상된 에러 처리
- 재고 부족 에러
- 품절 상품 에러  
- 네트워크 오류
- 데이터베이스 제약 조건 위반

### 📁 수정된 파일들

#### `src/services/order.ts`
```typescript
async createOrder(orderData: CreateOrderData) {
  // 1. 재고 확인
  // 2. 주문 생성  
  // 3. 주문 상세 생성
  // 4. 재고 차감 (Supabase RPC 사용)
  // 5. 오류 시 롤백
}

async cancelOrder(orderId: number) {
  // 주문 취소 시 재고 복구
}
```

#### `src/utils/stockCheck.ts`
```typescript
export const checkCartItemsStock = async (cartItems) => {
  // 실시간 재고 상태 확인
  // 부족한 상품 목록 반환
}
```

#### `src/components/customer/Cart.tsx`
```typescript
const handleCheckoutClick = async () => {
  // 주문 전 실시간 재고 확인
  // 사용자 친화적인 에러 메시지
}
```

## 🗄️ 데이터베이스 함수 설정

Supabase 대시보드의 SQL Editor에서 다음 함수들을 실행하세요:

```sql
-- 재고 차감 함수
CREATE OR REPLACE FUNCTION decrease_product_quantity(
  product_id bigint,
  decrease_amount integer
) RETURNS void AS $$
BEGIN
  UPDATE products 
  SET quantity = quantity - decrease_amount,
      is_soldout = CASE 
        WHEN quantity - decrease_amount <= 0 THEN true 
        ELSE is_soldout 
      END
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- 재고 복구 함수 (주문 취소용)
CREATE OR REPLACE FUNCTION increase_product_quantity(
  product_id bigint,
  increase_amount integer
) RETURNS void AS $$
BEGIN
  UPDATE products 
  SET quantity = quantity + increase_amount,
      is_soldout = false
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;
```

## 🔄 주문 프로세스 플로우

```
1. 고객이 장바구니에서 "주문하기" 클릭
   ↓
2. 실시간 재고 확인 (checkCartItemsStock)
   ↓
3. 재고 충분 → 주문 폼 표시
   재고 부족 → 경고 메시지 + 수량 조정 요청
   ↓
4. 주문 폼 제출
   ↓
5. 아파트 세대 찾기/생성 (findOrCreateApartmentUnit)
   ↓
6. 주문 생성 프로세스:
   - 재고 재확인
   - 주문 테이블 생성
   - 주문 상세 테이블 생성
   - 재고 차감 (decrease_product_quantity RPC)
   ↓
7. 성공 시:
   - 장바구니 비우기
   - 상품 목록 새로고침 (재고 업데이트 반영)
   - 주문 완료 페이지로 이동
```

## 🎯 추가 개선 가능 사항

### 1. 동시성 제어
현재는 기본적인 재고 확인만 하므로, 높은 동시성이 필요한 경우 다음을 고려:
- PostgreSQL의 `SELECT ... FOR UPDATE` 사용
- 낙관적 락킹 구현
- Redis를 이용한 분산 락

### 2. 주문 상태 관리
```typescript
enum OrderStatus {
  PENDING = '접수됨',
  PREPARING = '준비중', 
  DELIVERING = '배달중',
  COMPLETED = '완료',
  CANCELLED = '취소됨'
}
```

### 3. 알림 시스템
- 주문 접수 알림 (관리자용)
- 주문 상태 변경 알림 (고객용)
- WebSocket 또는 Server-Sent Events 활용

### 4. 결제 연동
- PG사 연동 (토스페이, 카카오페이 등)
- 무통장입금 확인 시스템

## 🚀 다음 단계 구현 순서

1. **관리자 상품 등록 기능** 개선
2. **주문 관리 대시보드** 완성
3. **실시간 알림 시스템** 구현
4. **결제 시스템** 연동
5. **배달 추적** 기능

## 📝 테스트 시나리오

### 재고 관리 테스트
1. 상품 재고를 1개로 설정
2. 2개 주문 시도 → 재고 부족 에러 확인
3. 1개 주문 성공 → 품절 상태로 변경 확인
4. 주문 취소 → 재고 복구 확인

### 동시 주문 테스트
1. 같은 상품에 대해 동시에 여러 주문
2. 재고보다 많은 주문이 들어올 때 처리 확인

이제 주문 시스템의 핵심 기능이 완성되었습니다! 🎉