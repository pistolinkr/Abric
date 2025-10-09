# Abric Image Server

Instagram 이미지를 안전하게 가져오고 라이선스를 관리하는 서버입니다.

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
cd server
npm install
```

### 2. 환경 변수 설정
`.env.example` 파일을 `.env`로 복사하고 실제 값으로 수정하세요:

```bash
cp .env.example .env
```

### 3. 데이터베이스 설정
PostgreSQL을 설치하고 데이터베이스를 생성한 후 스키마를 적용하세요:

```bash
# PostgreSQL 설치 (macOS)
brew install postgresql
brew services start postgresql

# 데이터베이스 생성
createdb abric_images

# 스키마 적용
psql abric_images < database/schema.sql
```

### 4. 서버 시작
```bash
npm start
# 또는 개발 모드
npm run dev
```

서버가 `http://localhost:3001`에서 실행됩니다.

## 📋 API 엔드포인트

### 이미지 관련
- `POST /api/images/fetch` - Instagram 이미지 메타데이터 가져오기
- `GET /api/gallery/images` - 갤러리용 최근 이미지들 조회

### 캔버스 관련
- `POST /api/canvas/embed` - 캔버스에 이미지 임베드 기록

### 사용자 관련
- `POST /api/users/create` - 테스트용 사용자 생성
- `POST /api/license/validate` - 라이선스 검증

### 기타
- `GET /api/health` - 서버 상태 확인

## 🔧 Instagram API 설정

Instagram oEmbed API를 사용하려면 Facebook Developer 계정이 필요합니다:

1. [Facebook Developers](https://developers.facebook.com/)에서 앱 생성
2. Instagram Basic Display 제품 추가
3. 앱 ID와 액세스 토큰을 `.env` 파일에 설정

## 📊 데이터베이스 스키마

### images 테이블
- 이미지 메타데이터 및 라이선스 정보 저장
- Instagram, Unsplash, Flickr 등 다양한 소스 지원

### canvas_embeds 테이블
- 캔버스에 임베드된 이미지 기록
- 사용자별 사용 이력 추적

### users 테이블
- 사용자 정보 및 상업적 사용 여부 저장

## 🛡️ 라이선스 관리

시스템은 다음과 같은 라이선스 검증을 수행합니다:

1. **상업적 사용 검증**: 비즈니스 계정은 `commercial_allowed: true`인 이미지만 사용 가능
2. **저작자 표시**: 모든 이미지에 적절한 attribution 표시
3. **라이선스 추적**: 이미지 사용 이력을 데이터베이스에 기록

## 🔍 사용 예시

### Instagram 이미지 가져오기
```javascript
const response = await fetch('http://localhost:3001/api/images/fetch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.instagram.com/p/C1xYzQbN2KX/',
    userId: 'user_123'
  })
});

const data = await response.json();
if (data.success) {
  console.log('Image data:', data.image);
  console.log('Attribution:', data.image.attribution_text);
}
```

### 갤러리 이미지 로드
```javascript
const response = await fetch('http://localhost:3001/api/gallery/images?limit=20');
const data = await response.json();
if (data.success) {
  console.log('Gallery images:', data.images);
}
```

## ⚠️ 주의사항

1. **Instagram API 제한**: Instagram API는 요청 제한이 있으므로 적절한 캐싱 전략 필요
2. **라이선스 준수**: 모든 이미지에 적절한 저작자 표시 필수
3. **상업적 사용**: 비즈니스 계정은 라이선스가 허용하는 이미지만 사용 가능
4. **개인정보**: 사용자 데이터는 GDPR 등 개인정보 보호법 준수

## 🐛 문제 해결

### 서버 연결 실패
- PostgreSQL 서비스가 실행 중인지 확인
- `.env` 파일의 데이터베이스 설정 확인
- 방화벽 설정 확인

### Instagram API 오류
- 액세스 토큰이 유효한지 확인
- Instagram URL 형식이 올바른지 확인
- API 요청 제한 확인

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
