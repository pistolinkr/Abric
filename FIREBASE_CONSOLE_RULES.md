# Firebase Console에서 바로 사용할 보안 규칙

## 🔥 Firebase Console 접속
**링크**: https://console.firebase.google.com/project/abric-auth/firestore/rules

---

## 📋 규칙 1: 간단한 규칙 (권장 - 즉시 적용)

아래 코드를 복사해서 Firebase Console 규칙 편집기에 붙여넣으세요:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Instagram 미디어 - 모든 인증된 사용자가 읽기 가능, 서비스 계정만 쓰기 가능
    match /instagram_media/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      (request.auth.token.firebase.sign_in_provider == 'custom' || 
                       request.auth.token.admin == true);
    }
    
    // 사용자 데이터 - 본인 데이터만 접근 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 공개 데이터 - 읽기만 허용
    match /public/{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    
    // 관리자 전용
    match /admin/{document=**} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // 나머지 모든 문서는 접근 불가
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 📋 규칙 2: 개발용 (모든 접근 허용)

만약 위 규칙으로도 문제가 있다면, 임시로 이 규칙을 사용하세요:

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

---

## 📋 규칙 3: 완전한 프로덕션 규칙

더 엄격한 보안이 필요한 경우:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // 사용자 인증 확인 함수
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && request.auth.token.admin == true;
    }
    
    function isServiceAccount() {
      return isAuthenticated() && 
             (request.auth.token.firebase.sign_in_provider == 'custom' ||
              request.auth.token.admin == true);
    }
    
    // Instagram 미디어 데이터
    match /instagram_media/{mediaId} {
      allow read: if isAuthenticated();
      allow create: if isServiceAccount();
      allow update: if isServiceAccount();
      allow delete: if isAdmin();
    }
    
    // 사용자 데이터
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // 공개 데이터
    match /public/{document=**} {
      allow read: if isAuthenticated();
      allow write: if isServiceAccount();
    }
    
    // 관리자 전용
    match /admin/{document=**} {
      allow read, write: if isAdmin();
    }
    
    // 기본 규칙: 모든 다른 문서는 접근 불가
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🚀 적용 방법

1. **Firebase Console 접속**: https://console.firebase.google.com/project/abric-auth/firestore/rules
2. **규칙 편집기**에서 기존 규칙을 모두 삭제
3. **위의 규칙 중 하나를 복사**하여 붙여넣기
4. **"게시"** 버튼 클릭
5. **잠시 대기** (규칙 적용까지 보통 몇 초)

---

## ✅ 적용 후 테스트

규칙 적용 후 서버를 재시작하여 실제 Firebase 데이터에 접근해보세요:

```bash
# 서버 재시작
pkill -f "node server.js" && sleep 2 && cd "/Users/robinhood/Abric Fig/server" && node server.js
```

그러면 갤러리에서 실제 Firebase 데이터베이스의 이미지들이 표시될 것입니다! 🎉
