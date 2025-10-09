// Firebase Firestore 데이터 확인 스크립트
const admin = require('firebase-admin');
require('dotenv').config();

// Firebase Admin SDK 초기화
if (process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY) {
  const serviceAccount = {
    type: process.env.FIREBASE_SERVICE_ACCOUNT_TYPE,
    project_id: process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID,
    private_key_id: process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_ID,
    auth_uri: process.env.FIREBASE_SERVICE_ACCOUNT_AUTH_URI,
    token_uri: process.env.FIREBASE_SERVICE_ACCOUNT_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_SERVICE_ACCOUNT_UNIVERSE_DOMAIN
  };
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'abric-auth'
  });
  console.log('✅ Firebase initialized with environment variables');
} else {
  console.log('❌ Firebase service account environment variables not found');
  process.exit(1);
}

const db = admin.firestore();

async function checkFirestoreData() {
  try {
    console.log('🔍 Checking Firestore database...');
    
    // 컬렉션 목록 확인
    const collections = await db.listCollections();
    console.log(`📁 Found ${collections.length} collections:`);
    
    collections.forEach(collection => {
      console.log(`  - ${collection.id}`);
    });
    
    // images 컬렉션이 있는지 확인
    const imagesRef = db.collection('images');
    const imagesSnapshot = await imagesRef.limit(5).get();
    
    if (imagesSnapshot.empty) {
      console.log('📸 No images found in "images" collection');
      console.log('💡 You need to add some images to Firestore first');
      console.log('   Go to: https://console.firebase.google.com/project/abric-auth/firestore/data');
      console.log('   Create collection "images" and add some documents');
    } else {
      console.log(`📸 Found ${imagesSnapshot.size} images in "images" collection`);
      imagesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${doc.id}: ${data.title || 'No title'} (${data.source_provider || 'No provider'})`);
      });
    }
    
    // posts 컬렉션도 확인
    const postsRef = db.collection('posts');
    const postsSnapshot = await postsRef.limit(5).get();
    
    if (!postsSnapshot.empty) {
      console.log(`📝 Found ${postsSnapshot.size} posts in "posts" collection`);
      postsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${doc.id}: ${data.title || 'No title'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking Firestore:', error.message);
  }
}

checkFirestoreData().then(() => process.exit(0)).catch(() => process.exit(1));
