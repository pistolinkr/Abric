# Abric - Find Your Favorite Instantly

A modern web application for discovering and managing your favorite items with Firebase authentication and Instagram image integration.

## 🆕 New Features

### Instagram Image Integration
- **Safe Image Fetching**: Instagram oEmbed API를 통한 안전한 이미지 가져오기
- **License Management**: 자동 라이선스 검증 및 저작자 표시 시스템
- **Database Tracking**: 모든 이미지 사용 이력을 데이터베이스에 기록
- **Commercial Use Protection**: 비즈니스 계정의 상업적 사용 제한

### Gallery Booth with Instagram
- **Real Content**: Picsum 대신 실제 Instagram 이미지 사용
- **Attribution Display**: 이미지 하단에 저작자 정보 자동 표시
- **License Badges**: 라이선스 타입 표시
- **Hardware Acceleration**: 부드러운 스크롤링과 렌더링

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Firebase project with Authentication enabled
- PostgreSQL (for image license management)
- Instagram/Facebook Developer account (for Instagram API)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd abric-fig
   ```

2. **Install dependencies** (if using a bundler)
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   **Option A: Using .env file (Recommended for development)**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your Firebase configuration
   nano .env
   ```
   
   **Option B: Using build process (Recommended for production)**
   - Set environment variables in your hosting platform
   - The application will automatically detect and use them
   
   **Option C: Direct configuration**
   - Edit `js/env-config.js` to update the default configuration
   - This method is suitable for simple deployments

4. **Firebase Configuration**
   
   Get your Firebase config from the Firebase Console:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click on your web app or create a new one
   - Copy the config values to your `.env` file

   Required environment variables:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Firebase Authentication Setup**
   
   In your Firebase Console:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password" authentication
   - Enable "Google" authentication (optional)
   - Configure authorized domains

### 🏃‍♂️ Running the Application

Simply open `index.html` in your browser or serve it with a local server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .

# Using Live Server (VS Code extension)
# Right-click on index.html and select "Open with Live Server"
```

Then visit: `http://localhost:8000`

## 📁 Project Structure

```
abric-fig/
├── index.html              # Root redirect page
├── main/                   # Main landing page
│   ├── index.html
│   └── styles.css
├── auth/                   # Authentication pages
│   ├── signin.html
│   ├── signup.html
│   ├── auth.css
│   └── auth-utils.js       # Firebase auth utilities
├── dashboard/              # User dashboard
│   ├── index.html
│   └── dashboard.css
├── logo/                   # Logo assets
│   └── light.png
├── .env                    # Environment variables (gitignored)
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🔐 Authentication Features

- **Email/Password Authentication**: Traditional signup and signin
- **Google OAuth**: Sign in with Google account
- **Protected Routes**: Automatic redirection based on auth state
- **User Dashboard**: Personalized user experience
- **Session Management**: Persistent login state

## 🎨 Design Features

- **Responsive Design**: Works on desktop and mobile
- **Dark Theme**: Modern dark UI with Apple-style minimal aesthetic
- **Mobile Navigation**: Bottom slide-up menu for mobile devices
- **Smooth Animations**: CSS transitions and hover effects

## 🛠️ Development

### Environment Variables

All sensitive configuration is managed through environment variables:

- `.env` - Your actual configuration (gitignored)
- `.env.example` - Template for other developers

### Firebase Security Rules

Make sure to configure proper Firebase Security Rules for production:

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Add your rules here
  }
}
```

## 🖼️ Instagram Image Server

### Quick Start
```bash
# 서버 시작
./start-server.sh

# 또는 수동으로
cd server
npm install
cp .env.example .env
# .env 파일을 실제 값으로 수정
npm start
```

### 서버 설정
1. **PostgreSQL 설치 및 설정**
   ```bash
   brew install postgresql
   brew services start postgresql
   createdb abric_images
   psql abric_images < server/database/schema.sql
   ```

2. **Instagram API 설정**
   - [Facebook Developers](https://developers.facebook.com/)에서 앱 생성
   - Instagram Basic Display 제품 추가
   - 앱 ID와 액세스 토큰을 `.env` 파일에 설정

3. **환경 변수 설정**
   ```bash
   # server/.env
   INSTAGRAM_APP_ID=your_app_id
   INSTAGRAM_ACCESS_TOKEN=your_access_token
   DB_HOST=localhost
   DB_NAME=abric_images
   ```

### API 엔드포인트
- `POST /api/images/fetch` - Instagram 이미지 메타데이터 가져오기
- `GET /api/gallery/images` - 갤러리용 이미지들 조회
- `POST /api/license/validate` - 라이선스 검증

## 🚀 Deployment

1. **Build for production** (if using a bundler)
2. **Set production environment variables**
3. **Configure Firebase hosting** (optional)
4. **Deploy image server** (PostgreSQL + Node.js)
5. **Deploy to your preferred hosting service**

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support or questions, please contact the development team.