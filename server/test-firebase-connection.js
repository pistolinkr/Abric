// Firebase 연결 테스트 스크립트
const admin = require('firebase-admin');
require('dotenv').config();

console.log('🔍 Testing Firebase connection...');

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

async function testFirebaseConnection() {
  try {
    console.log('🔍 Testing Firestore connection...');
    
    // 1. 컬렉션 목록 확인
    console.log('📁 Checking collections...');
    const collections = await db.listCollections();
    console.log(`Found ${collections.length} collections:`);
    
    collections.forEach(collection => {
      console.log(`  - ${collection.id}`);
    });
    
    // 2. instagram_media 컬렉션 확인
    console.log('📸 Checking instagram_media collection...');
    const instagramRef = db.collection('instagram_media');
    const instagramSnapshot = await instagramRef.limit(3).get();
    
    if (instagramSnapshot.empty) {
      console.log('❌ No documents found in instagram_media collection');
    } else {
      console.log(`✅ Found ${instagramSnapshot.size} documents in instagram_media collection`);
      instagramSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${doc.id}: ${data.caption || 'No caption'} (${data.media_type || 'No type'})`);
        console.log(`    Image URL: ${data.firebase_url || data.instagram_url || 'No URL'}`);
      });
    }
    
    // 3. 특정 문서 조회 테스트
    console.log('🔍 Testing specific document query...');
    try {
      const testDoc = await instagramRef.limit(1).get();
      if (!testDoc.empty) {
        const doc = testDoc.docs[0];
        const data = doc.data();
        console.log('✅ Document query successful:');
        console.log(`  ID: ${doc.id}`);
        console.log(`  Caption: ${data.caption}`);
        console.log(`  Firebase URL: ${data.firebase_url}`);
        console.log(`  Instagram URL: ${data.instagram_url}`);
        console.log(`  Media Type: ${data.media_type}`);
        console.log(`  Timestamp: ${data.timestamp}`);
      }
    } catch (error) {
      console.log('❌ Document query failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing Firebase connection:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error.details);
  }
}

testFirebaseConnection().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
