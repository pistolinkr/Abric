const { Pool } = require('pg');
require('dotenv').config();

class Database {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'abric_images',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });

    // 캐시 설정
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10분
    this.maxCacheSize = 1000; // 최대 캐시 항목 수

    // 캐시 정리 주기적 실행
    setInterval(() => {
      this.cleanupCache();
    }, 5 * 60 * 1000); // 5분마다
  }

  /**
   * 캐시에서 데이터 확인
   * @param {string} key - 캐시 키
   * @returns {Object|null} 캐시된 데이터 또는 null
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`Cache hit for key: ${key}`);
      return cached.data;
    }
    return null;
  }

  /**
   * 데이터를 캐시에 저장
   * @param {string} key - 캐시 키
   * @param {Object} data - 저장할 데이터
   */
  setCachedData(key, data) {
    // 캐시 크기 제한
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanupCache();
    }

    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
    console.log(`Data cached for key: ${key}`);
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
      console.log(`Cache cleanup: removed ${removedCount} expired entries. Remaining: ${this.cache.size}`);
    }
  }

  /**
   * 이미지 메타데이터가 DB에 있는지 확인 (캐시 포함)
   * @param {string} originalUrl - 원본 이미지 URL
   * @returns {Object|null} 이미지 데이터 또는 null
   */
  async getImageByUrl(originalUrl) {
    // 캐시 확인
    const cacheKey = `image_${originalUrl}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    const query = `
      SELECT id, source_provider, original_url, embed_html, license_type, 
             license_url, commercial_allowed, attribution_text, 
             provider_attribution_required, author_name, author_url,
             image_url, thumbnail_url, title, description,
             fetched_at, last_checked_at
      FROM images 
      WHERE original_url = $1
    `;
    
    try {
      const result = await this.pool.query(query, [originalUrl]);
      const imageData = result.rows[0] || null;
      
      // 캐시에 저장
      if (imageData) {
        this.setCachedData(cacheKey, imageData);
      }
      
      return imageData;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * 새로운 이미지 메타데이터 저장
   * @param {Object} metadata - 이미지 메타데이터
   * @returns {Object} 저장된 이미지 데이터
   */
  async saveImageMetadata(metadata) {
    const query = `
      INSERT INTO images (
        source_provider, original_url, embed_html, license_type, license_url,
        commercial_allowed, attribution_text, provider_attribution_required,
        author_name, author_url, image_url, thumbnail_url, title, description,
        last_checked_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now()
      ) RETURNING *
    `;

    const values = [
      metadata.provider,
      metadata.original_url,
      metadata.embed_html,
      metadata.license_type,
      metadata.license_url,
      metadata.commercial_allowed,
      metadata.attribution_text,
      metadata.provider_attribution_required,
      metadata.author_name,
      metadata.author_url,
      metadata.image_url,
      metadata.thumbnail_url,
      metadata.title,
      metadata.description
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Database insert error:', error);
      throw error;
    }
  }

  /**
   * 사용자의 상업적 사용 여부 확인
   * @param {string} userId - 사용자 ID
   * @returns {Object|null} 사용자 데이터 또는 null
   */
  async getUserById(userId) {
    const query = 'SELECT id, username, is_business FROM users WHERE id = $1';
    
    try {
      const result = await this.pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * 캔버스에 이미지 임베드 기록
   * @param {string} canvasId - 캔버스 ID
   * @param {number} imageId - 이미지 ID
   * @param {string} userId - 사용자 ID
   * @param {Object} embedPosition - 임베드 위치 정보
   * @param {string} note - 메모
   * @returns {Object} 저장된 임베드 데이터
   */
  async saveCanvasEmbed(canvasId, imageId, userId, embedPosition, note = '') {
    const query = `
      INSERT INTO canvas_embeds (canvas_id, image_id, owner_user_id, embed_position, note)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [canvasId, imageId, userId, JSON.stringify(embedPosition), note];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Database insert error:', error);
      throw error;
    }
  }

  /**
   * 라이선스 검증: 사용자가 이미지를 사용할 수 있는지 확인
   * @param {string} userId - 사용자 ID
   * @param {string} imageUrl - 이미지 URL
   * @returns {Object} 검증 결과
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
   * 최근 추가된 이미지들 조회 (갤러리용, 캐시 포함)
   * @param {number} limit - 조회할 이미지 수
   * @param {number} offset - 오프셋
   * @returns {Array} 이미지 배열
   */
  async getRecentImages(limit = 20, offset = 0) {
    // 캐시 확인
    const cacheKey = `recent_images_${limit}_${offset}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    const query = `
      SELECT id, source_provider, original_url, embed_html, license_type,
             attribution_text, author_name, author_url, image_url, 
             thumbnail_url, title, description, fetched_at
      FROM images 
      ORDER BY fetched_at DESC
      LIMIT $1 OFFSET $2
    `;

    try {
      const result = await this.pool.query(query, [limit, offset]);
      const images = result.rows;
      
      // 캐시에 저장 (짧은 TTL)
      this.setCachedData(cacheKey, images);
      
      return images;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * 데이터베이스 연결 테스트
   * @returns {boolean} 연결 성공 여부
   */
  async testConnection() {
    try {
      await this.pool.query('SELECT 1');
      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  /**
   * 캐시 통계 정보 반환
   * @returns {Object} 캐시 통계
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
    console.log('Database cache cleared');
  }

  /**
   * 연결 종료
   */
  async close() {
    await this.pool.end();
  }
}

module.exports = Database;
