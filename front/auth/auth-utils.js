// Authentication Utility Functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    updateProfile,
    signInWithPopup,
    GoogleAuthProvider,
    setPersistence,
    browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Load environment variables
function loadFirebaseConfig() {
    // Try to get environment variables from different sources
    let config = {};
    
    // Method 1: Check if Vite is available (for development with Vite)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        config = {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID
        };
    }
    
    // Method 2: Check for environment variables in window object (for production)
    if (typeof window !== 'undefined' && window.env) {
        config = {
            apiKey: window.env.VITE_FIREBASE_API_KEY,
            authDomain: window.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: window.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: window.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: window.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: window.env.VITE_FIREBASE_APP_ID
        };
    }
    
    // Method 3: Fallback to hardcoded values for development (remove in production)
    if (!config.apiKey) {
        console.warn('⚠️ Environment variables not found, using fallback configuration');
        config = {
            apiKey: "AIzaSyAAda0icFc0V_x-wg_GDeD2SPto45Y5Z5M",
            authDomain: "abric-auth.firebaseapp.com",
            projectId: "abric-auth",
            storageBucket: "abric-auth.firebasestorage.app",
            messagingSenderId: "690879105172",
            appId: "1:690879105172:web:344c48d46aaf82eab84c81"
        };
    }
    
    // Validate configuration
    const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missingKeys = requiredKeys.filter(key => !config[key]);
    
    if (missingKeys.length > 0) {
        throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`);
    }
    
    console.log('✅ Firebase configuration loaded successfully');
    return config;
}

// Load Firebase configuration
const firebaseConfig = loadFirebaseConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Set auth persistence to LOCAL (keeps user signed in across browser sessions)
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn('Failed to set auth persistence:', error);
});

// Auth state management
let currentUser = null;
const authListeners = [];

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    console.log('🔄 Auth state changed:', user ? `User: ${user.email}` : 'No user');
    currentUser = user;
    authListeners.forEach(listener => listener(user));
});

// Auth utility functions
export const authUtils = {
    // Get current user
    getCurrentUser: () => currentUser,
    
    // Check if user is authenticated
    isAuthenticated: () => !!currentUser,
    
    // Get user display name
    getUserDisplayName: () => currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
    
    // Get user email
    getUserEmail: () => currentUser?.email || '',
    
    // Add auth state listener
    onAuthStateChange: (callback) => {
        authListeners.push(callback);
        // Immediately call with current state
        callback(currentUser);
    },
    
    // Simple auth state check without complex promises
    checkAuthState: () => {
        return currentUser;
    },
    
    // Wait for auth state with simple timeout
    waitForAuthState: (maxWait = 2000) => {
        return new Promise((resolve) => {
            if (currentUser !== null) {
                resolve(currentUser);
                return;
            }
            
            let attempts = 0;
            const maxAttempts = maxWait / 100;
            
            const checkInterval = setInterval(() => {
                attempts++;
                if (currentUser !== null || attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    resolve(currentUser);
                }
            }, 100);
        });
    },
    
    // Remove auth state listener
    removeAuthListener: (callback) => {
        const index = authListeners.indexOf(callback);
        if (index > -1) {
            authListeners.splice(index, 1);
        }
    },
    
    // Sign in with email and password
    signInWithEmail: async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Sign up with email and password
    signUpWithEmail: async (email, password, displayName) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update profile with display name
            if (displayName) {
                await updateProfile(userCredential.user, { displayName });
            }
            
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Sign in with Google
    signInWithGoogle: async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Sign out
    signOut: async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Get user profile data
    getUserProfile: () => {
        if (!currentUser) return null;
        
        return {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            emailVerified: currentUser.emailVerified,
            createdAt: currentUser.metadata.creationTime,
            lastSignIn: currentUser.metadata.lastSignInTime
        };
    },
    
    // Redirect based on auth state (simplified version)
    redirectIfAuthenticated: (redirectTo = '../main/') => {
        // Use a timeout to wait for auth state to be determined
        return new Promise((resolve) => {
            const checkAuth = () => {
                if (currentUser) {
                    console.log('🚀 Redirecting authenticated user to:', redirectTo);
                    window.location.href = redirectTo;
                    resolve(true);
                } else {
                    // Wait a bit more for auth state to be determined
                    setTimeout(checkAuth, 100);
                }
            };
            
            // Start checking after a short delay
            setTimeout(checkAuth, 50);
            
            // Timeout after 3 seconds to prevent infinite waiting
            setTimeout(() => {
                resolve(false);
            }, 3000);
        });
    },
    
    // Redirect if not authenticated (simplified version)
    redirectIfNotAuthenticated: (redirectTo = '../404.html') => {
        // Use a timeout to wait for auth state to be determined
        return new Promise((resolve) => {
            const checkAuth = () => {
                if (!currentUser) {
                    console.log('🚀 Redirecting unauthenticated user to:', redirectTo);
                    window.location.href = redirectTo;
                    resolve(true);
                } else {
                    // User is authenticated, no redirect needed
                    resolve(false);
                }
            };
            
            // Start checking after a short delay
            setTimeout(checkAuth, 50);
            
            // Timeout after 3 seconds to prevent infinite waiting
            setTimeout(() => {
                resolve(false);
            }, 3000);
        });
    },
    
    // Show loading state
    showLoading: (element) => {
        if (element) {
            element.disabled = true;
            const spinner = element.querySelector('.loading-spinner');
            const text = element.querySelector('.button-text');
            if (spinner) spinner.style.display = 'block';
            if (text) text.style.opacity = '0.5';
        }
    },
    
    // Hide loading state
    hideLoading: (element) => {
        if (element) {
            element.disabled = false;
            const spinner = element.querySelector('.loading-spinner');
            const text = element.querySelector('.button-text');
            if (spinner) spinner.style.display = 'none';
            if (text) text.style.opacity = '1';
        }
    },
    
    // Show message
    showMessage: (text, type = 'error', containerId = 'messageContainer') => {
        const container = document.getElementById(containerId);
        const message = container?.querySelector('.message');
        
        if (container && message) {
            message.textContent = text;
            message.className = `message ${type}`;
            container.style.display = 'block';
            
            setTimeout(() => {
                container.style.display = 'none';
            }, 5000);
        }
    },
    
    // Clear error messages
    clearErrors: () => {
        document.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
        });
    },
    
    // Validate email format
    validateEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Validate password strength
    validatePassword: (password) => {
        const minLength = 6;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        
        return {
            isValid: password.length >= minLength,
            minLength: password.length >= minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            strength: password.length >= 8 && hasUpperCase && hasLowerCase && hasNumbers ? 'strong' : 
                     password.length >= 6 ? 'medium' : 'weak'
        };
    }
};

// Export auth instance for direct access if needed
export { auth };
