# 🍎 달콤네 - 무인 과일가게 온라인 주문 웹앱

## 📋 프로젝트 개요

카카오 오픈채팅보다 더 편리한 상품 등록 및 주문 시스템을 구축하여 고객 유입률 및 편의성 향상을 목표로 하는 무인 과일가게 온라인 주문 웹앱입니다.

### 🎯 주요 목표
- **MVP 목표**: 별도 로그인 없이도 주문 가능, 관리자/고객 페이지 분리, 주문 DB 기록 및 확인 가능
- **편의성**: 사진만 찍으면 곧바로 상품 등록 가능, 제목/가격/수량만 입력
- **매장 관리**: 매장별 관리가 가능해야 함

## 👥 대상 사용자

1. **본사 관리자** - 모든 점포 데이터 접근 가능한 마스터 계정
2. **가맹점 관리자** - 점포별 ID, 비밀번호로 해당 점포 상품 등록/관리
3. **일반 고객** - 별도 로그인 없이 주문 가능

## 🚀 주요 기능

### 🔵 관리자 페이지
- **로그인(필수)**: 점포별 ID, 비밀번호로 로그인, 로그인 유지 기능
- **상품 등록**: 사진 촬영/업로드 시 자동 업로드, 상품명/가격/수량/카테고리 입력
- **상품 관리**: 등록된 상품 목록 확인, 수량 수정, 품절 처리, 카테고리별 필터링
- **주문 확인**: 고객 주문 목록, 주문 상태 처리 (배달완료, 접수완료)

### 🟢 고객 페이지  
- **상품 보기**: 등록된 상품 리스트, 사진/상품명/가격/잔여수량 표시
- **카테고리 탭**: '오늘의 과일'과 '과일선물' 두 카테고리 분류
- **상품 상세**: 수량 선택, 장바구니 담기
- **장바구니**: 상품 수량 변경/삭제, 고객 정보 입력(이름, 연락처, 아파트/동/호)
- **계좌이체**: 입금 계좌 안내
- **주문 완료**: 주문 접수 완료 메시지 및 유의사항 표시
- **점포 선택**: 사용자 위치 기반 가장 가까운 점포 자동 선택, 점포 변경 가능

## 🏗️ 기술 스택

### Frontend
- **React 19.1.1** with TypeScript
- **React Router DOM** - 클라이언트 사이드 라우팅
- **Tailwind CSS** - 스타일링
- **Zustand** - 상태 관리 (장바구니 등)
- **React Query** - 서버 상태 관리
- **React Hook Form** - 폼 관리

### Backend & Database  
- **Supabase** - Database, Authentication, Storage
- **PostgreSQL** - 데이터베이스

### 기타 라이브러리
- **browser-image-compression** - 이미지 압축
- **date-fns** - 날짜 처리
- **zod** - 스키마 검증

## 📊 데이터베이스 설계

### 주요 테이블
1. **stores** - 점포 정보
2. **apartments** - 아파트 단지 정보  
3. **apartment_units** - 아파트 세대 정보 (동/호)
4. **products** - 상품 정보
5. **orders** - 주문 정보
6. **order_items** - 주문 상세 항목
7. **profiles** - 관리자 사용자 정보

### 주요 뷰
- **order_view** - 주문 정보 + 아파트 정보 조인 뷰

## 🚦 시작하기

### 필수 조건
- Node.js 16.x 이상
- npm 또는 yarn

### 설치 및 실행

1. **저장소 클론**
```bash
git clone [repository-url]
cd fruit-store-app
```

2. **패키지 설치**
```bash
npm install
```

3. **환경변수 설정**
`.env` 파일 생성 후 Supabase 설정:
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **개발 서버 실행**
```bash
npm start
```

앱이 개발 모드로 실행되며 [http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 📱 사용 방법

### 고객 사용법
1. 메인 페이지에서 점포 선택
2. 원하는 상품을 장바구니에 담기
3. 장바구니에서 고객 정보 및 배송지(아파트/동/호) 입력
4. 주문 완료 후 배달 대기

### 관리자 사용법
1. **브라우저에서 직접 접속**: `http://localhost:3000/admin/login` 또는 `https://yourdomain.com/admin/login`
2. 점포별 계정으로 로그인
3. 상품 등록: 사진 촬영 + 간단한 정보 입력
4. 주문 관리: 들어온 주문 확인 및 상태 변경

> **보안**: 관리자 페이지는 메인 페이지에서 버튼으로 노출되지 않으며, 직접 URL로만 접속 가능합니다.

## 🔧 주요 스크립트

```bash
# 개발 서버 실행
npm start

# 테스트 실행  
npm test

# 프로덕션 빌드
npm run build

# 빌드 분석 (eject 후)
npm run analyze
```

## 📁 프로젝트 구조

```
src/
├── components/         # 재사용 가능한 컴포넌트
│   ├── admin/         # 관리자 전용 컴포넌트
│   ├── customer/      # 고객 전용 컴포넌트
│   └── common/        # 공통 컴포넌트
├── pages/             # 페이지 컴포넌트
│   ├── admin/         # 관리자 페이지
│   └── customer/      # 고객 페이지
├── hooks/             # 커스텀 훅
├── services/          # API 서비스
├── stores/            # Zustand 스토어
├── types/             # TypeScript 타입 정의
└── utils/             # 유틸리티 함수
```

## 🔐 보안 고려사항

- 관리자 페이지는 직접 URL 접근만 가능 (메인에서 버튼 노출 안함)
- Supabase Row Level Security 적용
- 이미지 파일 크기 및 형식 제한
- 입력값 검증 및 XSS 방지

## 🚀 배포

```bash
# 프로덕션 빌드 생성
npm run build

# 빌드 폴더가 생성되면 정적 서버에 배포
```

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

**무인 과일가게의 디지털 전환을 위한 첫걸음 🍎**