# Firebase 실제 연결 가이드

## 1. Firebase Console에서 서비스 계정 키 생성

### 단계별 가이드:

1. **Firebase Console 접속**
   - https://console.firebase.google.com/ 접속
   - `abric-auth` 프로젝트 선택

2. **프로젝트 설정**
   - 좌측 메뉴에서 ⚙️ (설정) 클릭
   - "프로젝트 설정" 선택

3. **서비스 계정 탭**
   - "서비스 계정" 탭 클릭
   - "Firebase Admin SDK" 섹션에서 "Node.js" 선택

4. **새 비공개 키 생성**
   - "새 비공개 키 생성" 버튼 클릭
   - JSON 파일 다운로드

5. **키 파일 저장**
   ```bash
   # 다운로드한 JSON 파일을 다음 위치에 저장:
   /Users/robinhood/Abric Fig/server/firebase-service-account.json
   ```

## 2. Firestore 데이터베이스 활성화

1. **Firestore Database**
   - Firebase Console > Firestore Database
   - "데이터베이스 만들기" 클릭
   - 테스트 모드로 시작 (개발용)
   - 위치: asia-northeast1 (서울) 또는 us-central1

2. **보안 규칙 설정**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // 개발용 - 모든 읽기/쓰기 허용
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

## 3. 샘플 데이터 추가

Firestore에 `images` 컬렉션을 만들고 샘플 게시물을 추가합니다:

```javascript
// images 컬렉션에 추가할 문서 예시:
{
  "source_provider": "firebase",
  "original_url": "https://picsum.photos/400/600?random=1",
  "embed_html": "",
  "license_type": "creative_commons",
  "license_url": "https://creativecommons.org/licenses/",
  "commercial_allowed": true,
  "attribution_text": "Photo by User 1",
  "provider_attribution_required": false,
  "author_name": "user1",
  "author_url": "",
  "image_url": "https://picsum.photos/400/600?random=1",
  "thumbnail_url": "https://picsum.photos/200/300?random=1",
  "title": "Beautiful sunset view",
  "description": "Amazing sunset captured today",
  "fetched_at": "2025-09-30T12:54:53.502Z"
}
```

## 4. 서버 재시작

```bash
cd "/Users/robinhood/Abric Fig/server"
pkill -f "node server.js"
node server.js
```

## 5. 연결 확인

```bash
curl -s "http://localhost:3001/api/gallery/images"
```

## 문제 해결

### 인증 오류가 발생하는 경우:
1. 서비스 계정 키 파일 경로 확인
2. Firebase 프로젝트 ID 확인
3. Firestore API 활성화 확인

### 권한 오류가 발생하는 경우:
1. Firestore 보안 규칙 확인
2. 서비스 계정 권한 확인
