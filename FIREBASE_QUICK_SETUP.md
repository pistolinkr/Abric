# Firebase 빠른 설정 가이드

## 1. 서비스 계정 키 다운로드

1. **Firebase Console 접속**
   - https://console.firebase.google.com/project/abric-auth/settings/serviceaccounts/adminsdk
   - 직접 링크로 이동

2. **서비스 계정 키 생성**
   - "Generate new private key" 버튼 클릭
   - JSON 파일 다운로드

3. **키 파일 저장**
   ```bash
   # 다운로드한 JSON 파일을 다음 위치에 저장:
   /Users/robinhood/Abric Fig/server/firebase-service-account.json
   ```

## 2. Firestore에 샘플 데이터 추가

1. **Firestore Console 접속**
   - https://console.firebase.google.com/project/abric-auth/firestore/data
   - 직접 링크로 이동

2. **images 컬렉션 생성**
   - "시작 컬렉션" 클릭
   - 컬렉션 ID: `images`

3. **첫 번째 문서 추가**
   - 문서 ID: 자동 생성
   - 필드 추가:
     ```
     source_provider: string = "firebase"
     original_url: string = "https://picsum.photos/400/600?random=1"
     embed_html: string = ""
     license_type: string = "creative_commons"
     license_url: string = "https://creativecommons.org/licenses/"
     commercial_allowed: boolean = true
     attribution_text: string = "Photo by User 1"
     provider_attribution_required: boolean = false
     author_name: string = "user1"
     author_url: string = ""
     image_url: string = "https://picsum.photos/400/600?random=1"
     thumbnail_url: string = "https://picsum.photos/200/300?random=1"
     title: string = "Beautiful sunset view"
     description: string = "Amazing sunset captured today"
     fetched_at: timestamp = 현재 시간
     created_at: timestamp = 현재 시간
     updated_at: timestamp = 현재 시간
     ```

4. **추가 문서들 생성**
   - 위와 같은 방식으로 5-10개의 문서를 더 추가
   - `original_url`, `image_url`, `thumbnail_url`의 random 번호만 변경 (1, 2, 3, 4, 5...)
   - `title`, `description`, `author_name` 등도 다양하게 변경

## 3. 서버 재시작

```bash
cd "/Users/robinhood/Abric Fig/server"
pkill -f "node server.js"
node server.js
```

## 4. 확인

```bash
curl -s "http://localhost:3001/api/gallery/images"
```

## 5. 자동화된 데이터 추가 (선택사항)

서비스 계정 키가 설정되면 다음 명령으로 자동으로 샘플 데이터를 추가할 수 있습니다:

```bash
cd "/Users/robinhood/Abric Fig"
node add-sample-data.js
```

## 문제 해결

### 서비스 계정 키 오류
- 파일 경로 확인: `server/firebase-service-account.json`
- JSON 파일 형식 확인
- Firebase 프로젝트 ID 확인

### Firestore 권한 오류
- Firestore 보안 규칙 확인
- 서비스 계정 권한 확인
