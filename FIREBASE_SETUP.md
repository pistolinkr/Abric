# Firebase Firestore 연결 설정 가이드

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

## 2. 환경변수 설정 (대안)

서비스 계정 키 대신 환경변수를 사용할 수도 있습니다:

```bash
# .env 파일에 추가
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## 3. Firebase Firestore 규칙 설정

Firebase Console > Firestore Database > 규칙:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 모든 읽기/쓰기 허용 (개발용)
    match /{document=**} {
      allow read, write: if true;
    }
  }
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
curl -s "http://localhost:3001/api/health"
curl -s "http://localhost:3001/api/gallery/images"
```

## 6. 데이터 구조

Firestore에 다음 컬렉션들이 생성됩니다:

- `images`: Instagram 이미지 메타데이터
- `users`: 사용자 정보
- `canvas_embeds`: 캔버스 임베드 기록

## 문제 해결

### 인증 오류가 발생하는 경우:
1. 서비스 계정 키 파일 경로 확인
2. Firebase 프로젝트 ID 확인
3. Firestore API 활성화 확인

### 권한 오류가 발생하는 경우:
1. Firestore 보안 규칙 확인
2. 서비스 계정 권한 확인
