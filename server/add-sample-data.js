// Firebase에 샘플 게시물 데이터를 추가하는 스크립트
// 사용법: node add-sample-data.js

const admin = require('firebase-admin');
require('dotenv').config();

// Firebase Admin SDK 초기화
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    // 환경변수에서 Firebase 서비스 계정 정보 읽기
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
    // 서비스 계정 키 파일 사용 (fallback)
    const serviceAccount = require('./firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'abric-auth'
    });
    console.log('✅ Firebase initialized with service account key file');
  }
} catch (error) {
  console.log('❌ Firebase service account key not found');
  console.log('Please download the service account key from Firebase Console and save as:');
  console.log('./server/firebase-service-account.json');
  process.exit(1);
}

const db = admin.firestore();

// 샘플 게시물 데이터
const samplePosts = [
  {
    source_provider: 'firebase',
    original_url: 'https://picsum.photos/400/600?random=1',
    embed_html: '',
    license_type: 'creative_commons',
    license_url: 'https://creativecommons.org/licenses/',
    commercial_allowed: true,
    attribution_text: 'Photo by User 1',
    provider_attribution_required: false,
    author_name: 'user1',
    author_url: '',
    image_url: 'https://picsum.photos/400/600?random=1',
    thumbnail_url: 'https://picsum.photos/200/300?random=1',
    title: 'Beautiful sunset view',
    description: 'Amazing sunset captured today',
    fetched_at: admin.firestore.FieldValue.serverTimestamp(),
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    source_provider: 'firebase',
    original_url: 'https://picsum.photos/400/500?random=2',
    embed_html: '',
    license_type: 'creative_commons',
    license_url: 'https://creativecommons.org/licenses/',
    commercial_allowed: true,
    attribution_text: 'Photo by Creative Artist',
    provider_attribution_required: false,
    author_name: 'creative_artist',
    author_url: '',
    image_url: 'https://picsum.photos/400/500?random=2',
    thumbnail_url: 'https://picsum.photos/200/250?random=2',
    title: 'Artistic composition',
    description: 'Creative art piece',
    fetched_at: admin.firestore.FieldValue.serverTimestamp(),
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    source_provider: 'firebase',
    original_url: 'https://picsum.photos/400/700?random=3',
    embed_html: '',
    license_type: 'creative_commons',
    license_url: 'https://creativecommons.org/licenses/',
    commercial_allowed: true,
    attribution_text: 'Photo by Nature Photographer',
    provider_attribution_required: false,
    author_name: 'nature_photographer',
    author_url: '',
    image_url: 'https://picsum.photos/400/700?random=3',
    thumbnail_url: 'https://picsum.photos/200/350?random=3',
    title: 'Nature photography',
    description: 'Stunning nature shot',
    fetched_at: admin.firestore.FieldValue.serverTimestamp(),
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    source_provider: 'firebase',
    original_url: 'https://picsum.photos/400/550?random=4',
    embed_html: '',
    license_type: 'creative_commons',
    license_url: 'https://creativecommons.org/licenses/',
    commercial_allowed: true,
    attribution_text: 'Photo by Urban Explorer',
    provider_attribution_required: false,
    author_name: 'urban_explorer',
    author_url: '',
    image_url: 'https://picsum.photos/400/550?random=4',
    thumbnail_url: 'https://picsum.photos/200/275?random=4',
    title: 'Urban exploration',
    description: 'City life captured',
    fetched_at: admin.firestore.FieldValue.serverTimestamp(),
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    source_provider: 'firebase',
    original_url: 'https://picsum.photos/400/650?random=5',
    embed_html: '',
    license_type: 'creative_commons',
    license_url: 'https://creativecommons.org/licenses/',
    commercial_allowed: true,
    attribution_text: 'Photo by Food Lover',
    provider_attribution_required: false,
    author_name: 'food_lover',
    author_url: '',
    image_url: 'https://picsum.photos/400/650?random=5',
    thumbnail_url: 'https://picsum.photos/200/325?random=5',
    title: 'Delicious food',
    description: 'Amazing culinary experience',
    fetched_at: admin.firestore.FieldValue.serverTimestamp(),
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  }
];

async function addSampleData() {
  try {
    console.log('🚀 Adding sample posts to Firebase Firestore...');
    
    const batch = db.batch();
    
    for (let i = 0; i < samplePosts.length; i++) {
      const postRef = db.collection('images').doc();
      batch.set(postRef, samplePosts[i]);
      console.log(`📝 Prepared post ${i + 1}: ${samplePosts[i].title}`);
    }
    
    await batch.commit();
    console.log('✅ Successfully added 5 sample posts to Firebase!');
    
    // 데이터 확인
    const snapshot = await db.collection('images').get();
    console.log(`📊 Total posts in database: ${snapshot.size}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    process.exit(1);
  }
}

addSampleData();
