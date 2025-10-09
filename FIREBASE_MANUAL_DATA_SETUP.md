# Firebase Console에서 직접 데이터 추가하기

## 1. Firestore Console 접속
- https://console.firebase.google.com/project/abric-auth/firestore/data
- 직접 링크로 이동

## 2. 컬렉션 생성
1. **"시작 컬렉션"** 클릭
2. **컬렉션 ID**: `images` 입력
3. **"다음"** 클릭

## 3. 첫 번째 문서 추가
1. **문서 ID**: 자동 생성 (그대로 두기)
2. **필드 추가** (각 필드를 하나씩 추가):

### 필드 목록:
```
source_provider (string): firebase
original_url (string): https://picsum.photos/400/600?random=1
embed_html (string): (빈 문자열)
license_type (string): creative_commons
license_url (string): https://creativecommons.org/licenses/
commercial_allowed (boolean): true
attribution_text (string): Photo by User 1
provider_attribution_required (boolean): false
author_name (string): user1
author_url (string): (빈 문자열)
image_url (string): https://picsum.photos/400/600?random=1
thumbnail_url (string): https://picsum.photos/200/300?random=1
title (string): Beautiful sunset view
description (string): Amazing sunset captured today
fetched_at (timestamp): 현재 시간
created_at (timestamp): 현재 시간
updated_at (timestamp): 현재 시간
```

3. **"저장"** 클릭

## 4. 추가 문서들 생성
위와 같은 방식으로 5-10개의 문서를 더 추가하되, 다음 값들만 변경:

### 문서 2:
- original_url: https://picsum.photos/400/500?random=2
- image_url: https://picsum.photos/400/500?random=2
- thumbnail_url: https://picsum.photos/200/250?random=2
- title: Artistic composition
- description: Creative art piece
- author_name: creative_artist
- attribution_text: Photo by Creative Artist

### 문서 3:
- original_url: https://picsum.photos/400/700?random=3
- image_url: https://picsum.photos/400/700?random=3
- thumbnail_url: https://picsum.photos/200/350?random=3
- title: Nature photography
- description: Stunning nature shot
- author_name: nature_photographer
- attribution_text: Photo by Nature Photographer

### 문서 4:
- original_url: https://picsum.photos/400/550?random=4
- image_url: https://picsum.photos/400/550?random=4
- thumbnail_url: https://picsum.photos/200/275?random=4
- title: Urban exploration
- description: City life captured
- author_name: urban_explorer
- attribution_text: Photo by Urban Explorer

### 문서 5:
- original_url: https://picsum.photos/400/650?random=5
- image_url: https://picsum.photos/400/650?random=5
- thumbnail_url: https://picsum.photos/200/325?random=5
- title: Delicious food
- description: Amazing culinary experience
- author_name: food_lover
- attribution_text: Photo by Food Lover

## 5. 데이터 확인
모든 문서가 추가되면 서버에서 테스트:
```bash
curl -s "http://localhost:3001/api/gallery/images"
```

## 6. 갤러리 페이지 테스트
- http://localhost:3001/Gallery-Booth/
- 실제 Firebase 데이터베이스에서 이미지가 표시되는지 확인

## 문제 해결

### 데이터가 표시되지 않는 경우:
1. Firestore 보안 규칙 확인
2. 서비스 계정 키 파일 경로 확인
3. Firebase 프로젝트 ID 확인

### 보안 규칙 설정:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
