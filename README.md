# Abric - Find Your Favorite Instantly

A modern web application for discovering and managing your favorite items with Firebase authentication.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Firebase project with Authentication enabled

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

## 🚀 Deployment

1. **Build for production** (if using a bundler)
2. **Set production environment variables**
3. **Configure Firebase hosting** (optional)
4. **Deploy to your preferred hosting service**

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