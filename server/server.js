const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const InstagramAPI = require('./instagram-api');
const FirebaseDatabase = require('./firebase-database');

const app = express();
const port = process.env.PORT || 3001;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Multer 설정 for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'))
  },
  filename: function (req, file, cb) {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// 데이터베이스 및 API 초기화
const db = new FirebaseDatabase();
const instagramAPI = new InstagramAPI(
  process.env.INSTAGRAM_ACCESS_TOKEN || 'demo_token',
  process.env.INSTAGRAM_APP_ID || 'demo_app_id'
);

// 라우트: Instagram 이미지 메타데이터 가져오기
app.post('/api/images/fetch', async (req, res) => {
  try {
    const { url, userId } = req.body;

    if (!url || !userId) {
      return res.status(400).json({ 
        error: 'URL and userId are required' 
      });
    }

    // Instagram URL 유효성 검사
    if (!instagramAPI.isValidInstagramUrl(url)) {
      return res.status(400).json({ 
        error: 'Invalid Instagram URL format' 
      });
    }

    // DB에서 기존 이미지 확인
    let image = await db.getImageByUrl(url);
    
    if (!image) {
      // 새로운 이미지 메타데이터 가져오기
      console.log('Fetching new Instagram metadata...');
      const metadata = await instagramAPI.fetchPostMetadata(url);
      
      // DB에 저장
      image = await db.saveImageMetadata(metadata);
      console.log('Image metadata saved to database');
    }

    // 라이선스 검증
    const validation = await db.validateLicense(userId, url);
    
    if (!validation.allowed) {
      return res.status(403).json({
        error: 'License validation failed',
        reason: validation.reason
      });
    }

    res.json({
      success: true,
      image: {
        id: image.id,
        original_url: image.original_url,
        embed_html: image.embed_html,
        attribution_text: image.attribution_text,
        author_name: image.author_name,
        author_url: image.author_url,
        image_url: image.image_url,
        thumbnail_url: image.thumbnail_url,
        title: image.title,
        description: image.description,
        license_type: image.license_type,
        commercial_allowed: image.commercial_allowed
      },
    });

  } catch (error) {
    console.error('Error fetching image metadata:', error);
    res.status(500).json({ 
      error: 'Failed to fetch image metadata',
      details: error.message 
    });
  }
});

// 라우트: 캔버스에 이미지 임베드
app.post('/api/canvas/embed', async (req, res) => {
  try {
    const { canvasId, imageId, userId, position, note } = req.body;

    if (!canvasId || !imageId || !userId) {
      return res.status(400).json({ 
        error: 'canvasId, imageId, and userId are required' 
      });
    }

    // 임베드 기록 저장
    const embed = await db.saveCanvasEmbed(
      canvasId, 
      imageId, 
      userId, 
      position || { x: 0, y: 0 }, 
      note || ''
    );

    res.json({
      success: true,
      embed: embed
    });

  } catch (error) {
    console.error('Error saving canvas embed:', error);
    res.status(500).json({ 
      error: 'Failed to save canvas embed',
      details: error.message 
    });
  }
});

// 라우트: 갤러리용 최근 이미지들 조회
app.get('/api/gallery/images', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const images = await db.getRecentImages(
      parseInt(limit), 
      parseInt(offset)
    );

    res.json({
      success: true,
      images: images,
    });

  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({ 
      error: 'Failed to fetch gallery images',
      details: error.message 
    });
  }
});

// 라우트: 대량 Instagram URL 배치 처리
app.post('/api/images/batch-fetch', async (req, res) => {
  try {
    const { urls, userId } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ 
        error: 'URLs array is required' 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        error: 'userId is required' 
      });
    }

    // 배치 크기 제한 (한 번에 최대 50개)
    const batchSize = Math.min(urls.length, 50);
    const results = [];
    const errors = [];

    console.log(`Processing batch of ${batchSize} Instagram URLs...`);

    // 병렬 처리 (동시에 최대 10개)
    const concurrency = 10;
    for (let i = 0; i < batchSize; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (url) => {
        try {
          // URL 유효성 검사
          if (!instagramAPI.isValidInstagramUrl(url)) {
            throw new Error('Invalid Instagram URL format');
          }

          // DB에서 기존 이미지 확인
          let image = await db.getImageByUrl(url);
          
          if (!image) {
            // 새로운 이미지 메타데이터 가져오기
            const metadata = await instagramAPI.fetchPostMetadata(url);
            
            // DB에 저장
            image = await db.saveImageMetadata(metadata);
            console.log(`Image metadata saved: ${url}`);
          }

          // 라이선스 검증
          const validation = await db.validateLicense(userId, url);
          
          if (!validation.allowed) {
            throw new Error(`License validation failed: ${validation.reason}`);
          }

          return {
            success: true,
            image: {
              id: image.id,
              original_url: image.original_url,
              embed_html: image.embed_html,
              attribution_text: image.attribution_text,
              author_name: image.author_name,
              author_url: image.author_url,
              image_url: image.image_url,
              thumbnail_url: image.thumbnail_url,
              title: image.title,
              description: image.description,
              license_type: image.license_type,
              commercial_allowed: image.commercial_allowed
            }
          };
        } catch (error) {
          console.error(`Error processing URL ${url}:`, error.message);
          return {
            success: false,
            url: url,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      // 결과 분류
      batchResults.forEach(result => {
        if (result.success) {
          results.push(result.image);
        } else {
          errors.push({
            url: result.url,
            error: result.error
          });
        }
      });

      // 배치 간 지연 (API 제한 방지)
      if (i + concurrency < batchSize) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.json({
      success: true,
      processed: batchSize,
      successful: results.length,
      failed: errors.length,
      images: results,
      errors: errors,
    });

  } catch (error) {
    console.error('Error in batch fetch:', error);
    res.status(500).json({ 
      error: 'Failed to process batch fetch',
      details: error.message 
    });
  }
});

// 라우트: 사용자 생성 (테스트용)
app.post('/api/users/create', async (req, res) => {
  try {
    const { username, isBusiness = false } = req.body;

    if (!username) {
      return res.status(400).json({ 
        error: 'Username is required' 
      });
    }

    const query = `
      INSERT INTO users (id, username, is_business) 
      VALUES (gen_random_uuid(), $1, $2) 
      RETURNING *
    `;

    const result = await db.pool.query(query, [username, isBusiness]);
    
    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      error: 'Failed to create user',
      details: error.message 
    });
  }
});

// 라우트: 라이선스 검증 테스트
app.post('/api/license/validate', async (req, res) => {
  try {
    const { userId, imageUrl } = req.body;

    if (!userId || !imageUrl) {
      return res.status(400).json({ 
        error: 'userId and imageUrl are required' 
      });
    }

    const validation = await db.validateLicense(userId, imageUrl);
    
    res.json({
      success: true,
      validation: validation
    });

  } catch (error) {
    console.error('Error validating license:', error);
    res.status(500).json({ 
      error: 'Failed to validate license',
      details: error.message 
    });
  }
});

// 라우트: 서버 상태 확인
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await db.testConnection();
    
    res.json({
      status: 'ok',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 라우트: 캐시 통계 확인
app.get('/api/cache/stats', (req, res) => {
  try {
    const instagramStats = instagramAPI.getCacheStats();
    const dbStats = db.getCacheStats();
    
    res.json({
      success: true,
      instagram: instagramStats,
      database: dbStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get cache stats' 
    });
  }
});

// 라우트: 캐시 초기화
app.post('/api/cache/clear', (req, res) => {
  try {
    instagramAPI.clearCache();
    db.clearCache();
    
    res.json({
      success: true,
      message: 'All caches cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear caches' 
    });
  }
});

// 이미지 업로드 API
app.post('/api/images/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No image file provided' 
      });
    }

    const { userId } = req.body;
    const uploadedFile = req.file;

    // 이미지 메타데이터 생성
    const imageData = {
      id: uuidv4(),
      original_url: `/uploads/${uploadedFile.filename}`,
      thumbnail_url: `/uploads/${uploadedFile.filename}`,
      image_url: `/uploads/${uploadedFile.filename}`,
      title: uploadedFile.originalname,
      description: `Uploaded by user: ${userId}`,
      author_name: userId || 'Anonymous',
      author_url: '#',
      license_type: 'uploaded',
      attribution_text: `Uploaded by ${userId || 'Anonymous'}`,
      timestamp: new Date(),
      metadata: {
        filename: uploadedFile.originalname,
        size: uploadedFile.size,
        mimetype: uploadedFile.mimetype,
        uploadDate: new Date().toISOString()
      },
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0
      },
      media_type: 'image',
      firebase_url: `/uploads/${uploadedFile.filename}`
    };

    // Firebase에 저장
    await db.saveImageMetadata(imageData);

    console.log('Image uploaded successfully:', imageData.id);

    res.json({
      success: true,
      image: imageData,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      message: error.message 
    });
  }
});

// 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 서버 시작
app.listen(port, async () => {
  console.log(`🚀 Abric Image Server running on port ${port}`);
  
  // Firebase 연결 테스트
  await db.testConnection();
  
  console.log('📋 Available endpoints:');
  console.log('  POST /api/images/fetch - Fetch Instagram image metadata');
  console.log('  POST /api/images/batch-fetch - Batch fetch multiple Instagram URLs');
  console.log('  POST /api/images/upload - Upload user images');
  console.log('  POST /api/canvas/embed - Save canvas embed record');
  console.log('  GET  /api/gallery/images - Get recent images for gallery');
  console.log('  POST /api/users/create - Create test user');
  console.log('  POST /api/license/validate - Validate image license');
  console.log('  GET  /api/health - Server health check');
  console.log('  GET  /api/cache/stats - Get cache statistics');
  console.log('  POST /api/cache/clear - Clear all caches');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});
