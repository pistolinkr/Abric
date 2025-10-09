# Firebase Firestore 보안 규칙

## 현재 상황
- **프로젝트**: abric-auth
- **컬렉션**: instagram_media
- **데이터베이스 위치**: nam5
- **문제**: 서비스 계정으로 접근 시 "5 NOT_FOUND" 오류

## 권장 보안 규칙

### 1. 개발/테스트용 (모든 접근 허용)
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

### 2. 프로덕션용 (인증된 사용자만)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // instagram_media 컬렉션 - 모든 사용자 읽기 허용
    match /instagram_media/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 기타 컬렉션들
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. 완전한 프로덕션 규칙 (사용자 요청)
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 데이터 접근 규칙
    match /users/{userId} {
      // 읽기: 본인 데이터만 읽기 가능
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // 쓰기: 본인 데이터만 쓰기 가능 (회원가입 시에만)
      allow create: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.data.keys().hasAll(['email', 'username', 'createdAt'])
        && request.resource.data.email == request.auth.token.email
        && request.resource.data.username is string
        && request.resource.data.username.size() >= 2
        && request.resource.data.username.size() <= 50;
      
      // 업데이트: 본인 데이터만 업데이트 가능 (일부 필드만)
      allow update: if request.auth != null 
        && request.auth.uid == userId
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['email', 'createdAt'])
        && request.resource.data.username is string
        && request.resource.data.username.size() >= 2
        && request.resource.data.username.size() <= 50;
      
      // 삭제: 본인 데이터만 삭제 가능
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Instagram 미디어 데이터 - 모든 사용자가 읽기 가능, 서비스 계정만 쓰기 가능
    match /instagram_media/{document} {
      // 읽기: 모든 인증된 사용자 허용 (갤러리 표시용)
      allow read: if request.auth != null;
      
      // 쓰기: 서비스 계정만 허용 (Admin SDK)
      allow write: if request.auth != null 
        && (request.auth.token.firebase.sign_in_provider == 'custom' 
            || request.auth.token.admin == true);
    }
    
    // 공개 데이터 (모든 인증된 사용자가 읽기 가능)
    match /public/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // 공개 데이터는 수정 불가
    }
    
    // 관리자 전용 컬렉션
    match /admin/{document=**} {
      allow read, write: if request.auth != null 
        && request.auth.token.admin == true;
    }
    
    // 기본 규칙: 모든 다른 문서는 접근 불가
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. 서비스 계정용 (Admin SDK 접근)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // instagram_media 컬렉션 - 서비스 계정과 인증된 사용자 모두 허용
    match /instagram_media/{document} {
      allow read: if true;
      allow write: if request.auth != null || 
                     request.auth.token.firebase.sign_in_provider == 'custom';
    }
    
    // 기타 컬렉션들
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🔐 Firebase 보안 규칙 설정 방법

### **1단계: Firebase Console 접속**
- **링크**: https://console.firebase.google.com/project/abric-auth/firestore/rules
- 직접 링크로 이동

### **2단계: 규칙 선택 및 적용**

#### **옵션 1: 간단한 규칙 (권장 - 즉시 적용)**
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

#### **옵션 2: 개발용 (모든 접근 허용)**
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

#### **옵션 3: 완전한 프로덕션 규칙**
`firestore.rules` 파일의 내용을 복사하여 사용 (더 엄격한 검증 포함)

### **3단계: 규칙 게시**
1. 위의 규칙 중 하나를 복사하여 Firebase Console의 규칙 편집기에 붙여넣기
2. **"게시"** 버튼 클릭
3. 규칙이 적용될 때까지 잠시 대기 (보통 몇 초)

## 문제 해결

### 현재 오류: "5 NOT_FOUND"
이 오류는 보안 규칙 문제일 가능성이 높습니다. 위의 개발용 규칙을 적용하면 해결될 것입니다.

### 서비스 계정 권한 확인
1. **IAM & Admin**: https://console.cloud.google.com/iam-admin/iam?project=abric-auth
2. **서비스 계정**: firebase-adminsdk-fbsvc@abric-auth.iam.gserviceaccount.com
3. **역할**: Cloud Datastore User 또는 Firestore User 역할 확인

### 데이터베이스 위치 확인
- **현재 위치**: nam5
- **Firebase Console**: Project Settings > General에서 확인
- **서버 코드**: 데이터베이스 위치를 명시적으로 지정하지 않음 (기본값 사용)

## 테스트 방법

### 1. 규칙 적용 후 서버 재시작
```bash
pkill -f "node server.js" && sleep 2 && cd "/Users/robinhood/Abric Fig/server" && node server.js
```

### 2. API 테스트
```bash
curl -s "http://localhost:3001/api/gallery/images" | head -5
```

### 3. 갤러리 테스트
- http://localhost:3001/Gallery-Booth/

## 다음 단계
1. **개발용 보안 규칙 적용** (모든 접근 허용)
2. **서버 재시작 및 테스트**
3. **실제 Firebase 데이터 확인**
4. **필요시 프로덕션용 규칙으로 변경**
