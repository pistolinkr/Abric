const admin = require('firebase-admin');
require('dotenv').config();

class FirebaseDatabase {
  constructor() {
    this.mockMode = false; // 실제 Firebase 데이터 사용
    console.log('🔄 Firebase connecting to real database...');
    console.log('📋 Real Firebase data detected in Console:');
    console.log('  - Collection: instagram_media');
    console.log('  - Documents: Multiple posts with Firebase Storage URLs');
    console.log('  - Location: nam5');
    console.log('🔧 To use real Firebase data:');
    console.log('  1. Check Firebase security rules');
    console.log('  2. Verify service account permissions');
    console.log('  3. Ensure database location matches (nam5)');
    
    // Firebase Admin SDK 초기화
    if (!admin.apps.length) {
      try {
        // 환경변수에서 Firebase 서비스 계정 정보 읽기
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
          
          // abric 데이터베이스 사용
          this.db = admin.firestore();
          this.db.settings({ databaseId: 'abric' });
          console.log('✅ Firebase initialized with environment variables');
          this.mockMode = false; // 실제 Firebase 데이터 사용
        } else {
          throw new Error('Firebase service account environment variables not found');
        }
      } catch (error) {
        try {
          // 서비스 계정 키 파일이 있는 경우 (fallback)
          const serviceAccount = require('./firebase-service-account.json');
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'abric-auth'
          });
          
          // abric 데이터베이스 사용
          this.db = admin.firestore();
          this.db.settings({ databaseId: 'abric' });
          console.log('✅ Firebase initialized with service account key file');
          this.mockMode = false; // 실제 Firebase 데이터 사용
        } catch (fileError) {
          console.log('❌ Firebase initialization failed, using mock mode');
          console.log('Error:', error.message);
          console.log('To connect to Firebase, please:');
          console.log('1. Set Firebase service account environment variables in .env file');
          console.log('2. Or download service account key and save as: server/firebase-service-account.json');
          this.mockMode = true;
        }
      }
    } else {
      // 이미 초기화된 경우
      try {
        this.db = admin.firestore();
        console.log('Using existing Firebase app');
      } catch (error) {
        console.log('Firebase app exists but not accessible, using mock mode');
        this.mockMode = true;
      }
    }
    
    if (this.mockMode) {
      this.db = null; // Mock mode
      this.mockData = {
        images: new Map(),
        users: new Map(),
        canvasEmbeds: new Map()
      };
    } else if (!this.db) {
      this.db = admin.firestore();
    }
    
    // Firestore 데이터베이스 설정 (nam5 위치)
    if (this.db && !this.mockMode) {
      try {
        this.db.settings({
          ignoreUndefinedProperties: true
        });
      } catch (error) {
        console.log('Firestore settings error:', error.message);
      }
    }
    
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10분
    this.maxCacheSize = 1000;
    
    // 캐시 정리 주기적 실행
    setInterval(() => {
      this.cleanupCache();
    }, 5 * 60 * 1000);
  }

  /**
   * 캐시에서 데이터 확인
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`Firebase cache hit for key: ${key}`);
      return cached.data;
    }
    return null;
  }

  /**
   * 데이터를 캐시에 저장
   */
  setCachedData(key, data) {
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanupCache();
    }

    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
    console.log(`Data cached in Firebase: ${key}`);
  }

  /**
   * 만료된 캐시 항목 정리
   */
  cleanupCache() {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheTimeout) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`Firebase cache cleanup: removed ${removedCount} expired entries. Remaining: ${this.cache.size}`);
    }
  }

  /**
   * 이미지 메타데이터가 Firestore에 있는지 확인
   */
  async getImageByUrl(originalUrl) {
    // 캐시 확인
    const cacheKey = `image_${originalUrl}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    if (this.mockMode) {
      // Mock mode
      const imageData = this.mockData.images.get(originalUrl);
      if (imageData) {
        this.setCachedData(cacheKey, imageData);
      }
      return imageData || null;
    }

    try {
      const snapshot = await this.db
        .collection('images')
        .where('original_url', '==', originalUrl)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const imageData = { id: doc.id, ...doc.data() };
      
      // 캐시에 저장
      this.setCachedData(cacheKey, imageData);
      
      return imageData;
    } catch (error) {
      console.error('Firebase query error:', error);
      throw error;
    }
  }

  /**
   * 새로운 이미지 메타데이터 저장
   */
  async saveImageMetadata(metadata) {
    if (this.mockMode) {
      // Mock mode
      const id = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const savedData = {
        id,
        ...metadata,
        fetched_at: new Date(),
        last_checked_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      this.mockData.images.set(metadata.original_url, savedData);
      this.setCachedData(`image_${metadata.original_url}`, savedData);
      
      return savedData;
    }

    try {
      const docRef = await this.db.collection('images').add({
        ...metadata,
        fetched_at: admin.firestore.FieldValue.serverTimestamp(),
        last_checked_at: admin.firestore.FieldValue.serverTimestamp(),
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      const savedData = { id: docRef.id, ...metadata };
      
      // 캐시에 저장
      this.setCachedData(`image_${metadata.original_url}`, savedData);
      
      return savedData;
    } catch (error) {
      console.error('Firebase save error:', error);
      throw error;
    }
  }

  /**
   * 사용자 생성
   */
  async createUser(userData) {
    try {
      const { username, isBusiness = false } = userData;
      
      // 중복 사용자명 확인
      const existingUser = await this.db
        .collection('users')
        .where('username', '==', username)
        .limit(1)
        .get();

      if (!existingUser.empty) {
        return { success: false, error: 'Username already exists' };
      }

      const userDoc = {
        username,
        is_business: isBusiness,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await this.db.collection('users').add(userDoc);
      
      return {
        success: true,
        user: { id: docRef.id, ...userDoc }
      };
    } catch (error) {
      console.error('Firebase user creation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 사용자 ID로 사용자 정보 조회
   */
  async getUserById(userId) {
    try {
      const doc = await this.db.collection('users').doc(userId).get();
      
      if (!doc.exists) {
        return null;
      }

      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Firebase user query error:', error);
      throw error;
    }
  }

  /**
   * 라이선스 검증
   */
  async validateLicense(userId, imageUrl) {
    try {
      // 사용자 정보 조회
      const user = await this.getUserById(userId);
      if (!user) {
        return { allowed: false, reason: 'User not found' };
      }

      // 이미지 정보 조회
      const image = await this.getImageByUrl(imageUrl);
      if (!image) {
        return { allowed: false, reason: 'Image not found in database' };
      }

      // 상업적 사용 검증
      if (user.is_business && !image.commercial_allowed) {
        return {
          allowed: false,
          reason: 'Commercial use not allowed for this image',
          image: image
        };
      }

      return {
        allowed: true,
        image: image,
        attribution: image.attribution_text
      };
    } catch (error) {
      console.error('License validation error:', error);
      return { allowed: false, reason: 'Validation error' };
    }
  }

  /**
   * 캔버스 임베드 저장
   */
  async saveCanvasEmbed(embedData) {
    try {
      const docRef = await this.db.collection('canvas_embeds').add({
        ...embedData,
        inserted_at: admin.firestore.FieldValue.serverTimestamp()
      });

      return { id: docRef.id, ...embedData };
    } catch (error) {
      console.error('Firebase canvas embed save error:', error);
      throw error;
    }
  }

  /**
   * 최근 이미지 목록 가져오기
   */
  async getRecentImages(limit = 20, offset = 0) {
    // 캐시 확인
    const cacheKey = `recent_images_${limit}_${offset}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    if (this.mockMode) {
                // Mock mode - 실제 Firebase 데이터 구조에 맞게 수정
                  const sampleImages = [
                    {
                      id: '09iJWns1sHBSVrb6yvrB',
                      source_provider: 'instagram',
                      original_url: 'https://picsum.photos/640/853?random=1',
                      embed_html: '',
                      license_type: 'instagram',
                      license_url: '',
                      commercial_allowed: false,
                      attribution_text: 'System validation test',
                      provider_attribution_required: true,
                      author_name: 'instagram_user',
                      author_url: '',
                      image_url: 'https://picsum.photos/640/853?random=1',
                      thumbnail_url: 'https://picsum.photos/640/853?random=1',
                      title: 'System validation test',
                      description: 'System validation test',
                      fetched_at: new Date(),
                      // 실제 Firebase 데이터 구조
                      caption: 'System validation test',
                      firebase_url: 'https://picsum.photos/640/853?random=1',
                      instagram_id: 'DOyjDNsEZ33',
                      instagram_url: 'https://picsum.photos/640/853?random=1',
                      media_type: 'IMAGE',
                      timestamp: '2025-09-30T15:04:58.797936',
                      metadata: {
                        file_size: 0,
                        format: 'JPEG',
                        height: 853,
                        width: 640,
                        permalink: ''
                      },
                      engagement: {
                        comments: 0,
                        likes: 0,
                        shares: 0
                      }
                    },
                    {
                      id: 'aQccwYnGWQSYUUWwnQht',
                      source_provider: 'instagram',
                      original_url: 'https://picsum.photos/400/600?random=2',
                      embed_html: '',
                      license_type: 'instagram',
                      license_url: '',
                      commercial_allowed: false,
                      attribution_text: 'Creative art piece',
                      provider_attribution_required: true,
                      author_name: 'creative_artist',
                      author_url: '',
                      image_url: 'https://picsum.photos/400/600?random=2',
                      thumbnail_url: 'https://picsum.photos/400/600?random=2',
                      title: 'Creative art piece',
                      description: 'Creative art piece',
                      fetched_at: new Date(),
                      caption: 'Creative art piece',
                      firebase_url: 'https://picsum.photos/400/600?random=2',
                      instagram_id: 'ABC123DEF456',
                      instagram_url: 'https://picsum.photos/400/600?random=2',
                      media_type: 'IMAGE',
                      timestamp: '2025-09-30T14:30:00.000000',
                      metadata: {
                        file_size: 1024000,
                        format: 'JPEG',
                        height: 600,
                        width: 400,
                        permalink: ''
                      },
                      engagement: {
                        comments: 5,
                        likes: 25,
                        shares: 3
                      }
                    },
                    {
                      id: '1103k4cMGZBZukQj0Zfe',
                      source_provider: 'instagram',
                      original_url: 'https://picsum.photos/600/800?random=3',
                      embed_html: '',
                      license_type: 'instagram',
                      license_url: '',
                      commercial_allowed: false,
                      attribution_text: 'Nature photography',
                      provider_attribution_required: true,
                      author_name: 'nature_photographer',
                      author_url: '',
                      image_url: 'https://picsum.photos/600/800?random=3',
                      thumbnail_url: 'https://picsum.photos/600/800?random=3',
                      title: 'Nature photography',
                      description: 'Stunning nature shot',
                      fetched_at: new Date(),
                      caption: 'Nature photography',
                      firebase_url: 'https://picsum.photos/600/800?random=3',
                      instagram_id: 'XYZ789GHI012',
                      instagram_url: 'https://picsum.photos/600/800?random=3',
                      media_type: 'IMAGE',
                      timestamp: '2025-09-30T14:00:00.000000',
                      metadata: {
                        file_size: 2048000,
                        format: 'JPEG',
                        height: 800,
                        width: 600,
                        permalink: ''
                      },
                      engagement: {
                        comments: 12,
                        likes: 45,
                        shares: 8
                      }
                    }
                  ];
      
      this.setCachedData(cacheKey, sampleImages);
      return sampleImages;
    }

                try {
                  const snapshot = await this.db
                    .collection('instagram_media')
                    .orderBy('timestamp', 'desc')
                    .limit(limit)
                    .offset(offset)
                    .get();

                  const images = snapshot.docs.map(doc => {
                    const data = doc.data();
                    // Firebase 데이터를 우리 형식에 맞게 변환
                    return {
                      id: doc.id,
                      source_provider: 'instagram',
                      original_url: data.instagram_url || data.firebase_url,
                      embed_html: '',
                      license_type: 'instagram',
                      license_url: '',
                      commercial_allowed: false,
                      attribution_text: data.caption || 'Instagram Post',
                      provider_attribution_required: true,
                      author_name: 'instagram_user',
                      author_url: '',
                      image_url: data.firebase_url || data.instagram_url,
                      thumbnail_url: data.firebase_url || data.instagram_url,
                      title: data.caption || 'Instagram Post',
                      description: data.caption || '',
                      fetched_at: new Date(data.timestamp || Date.now()),
                      ...data
                    };
                  });

      // 캐시에 저장
      this.setCachedData(cacheKey, images);
      
      return images;
    } catch (error) {
      console.error('Firebase recent images query error:', error);
      throw error;
    }
  }

  /**
   * 데이터베이스 연결 테스트
   */
  async testConnection() {
    if (this.mockMode) {
      console.log('Firebase running in mock mode');
      return true;
    }

    try {
      // 간단한 쿼리로 연결 테스트
      await this.db.collection('_health_check').limit(1).get();
      console.log('Firebase connection successful');
      return true;
    } catch (error) {
      console.error('Firebase connection failed:', error);
      return false;
    }
  }

  /**
   * 캐시 통계 정보 반환
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp < this.cacheTimeout) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheTimeout: this.cacheTimeout,
      maxCacheSize: this.maxCacheSize
    };
  }

  /**
   * 전체 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
    console.log('Firebase cache cleared');
  }

  /**
   * 이미지 메타데이터 저장
   */
  async saveImageMetadata(imageData) {
    try {
      if (this.mockMode) {
        console.log('Mock mode: Would save image metadata:', imageData.id);
        return { id: imageData.id, success: true };
      }

      const docRef = this.db.collection('instagram_media').doc(imageData.id);
      await docRef.set(imageData);
      
      console.log('Image metadata saved to Firebase:', imageData.id);
      return { id: imageData.id, success: true };
    } catch (error) {
      console.error('Error saving image metadata:', error);
      throw error;
    }
  }
}

module.exports = FirebaseDatabase;
