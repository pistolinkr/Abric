const axios = require('axios');
const cheerio = require('cheerio');

class InstagramAPI {
  constructor(accessToken, appId) {
    this.accessToken = accessToken;
    this.appId = appId;
    this.baseURL = 'https://graph.facebook.com/v18.0';
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1초
    this.cache = new Map(); // 간단한 메모리 캐시
    this.cacheTimeout = 5 * 60 * 1000; // 5분
  }

  /**
   * 캐시에서 메타데이터 확인
   * @param {string} postUrl - Instagram 포스트 URL
   * @returns {Object|null} 캐시된 메타데이터 또는 null
   */
  getCachedMetadata(postUrl) {
    const cached = this.cache.get(postUrl);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('Using cached metadata for:', postUrl);
      return cached.data;
    }
    return null;
  }

  /**
   * 메타데이터를 캐시에 저장
   * @param {string} postUrl - Instagram 포스트 URL
   * @param {Object} metadata - 메타데이터 객체
   */
  setCachedMetadata(postUrl, metadata) {
    this.cache.set(postUrl, {
      data: metadata,
      timestamp: Date.now()
    });
  }

  /**
   * 재시도 로직이 포함된 HTTP 요청
   * @param {Function} requestFn - 요청 함수
   * @param {number} attempts - 재시도 횟수
   * @returns {Object} 응답 데이터
   */
  async retryRequest(requestFn, attempts = this.retryAttempts) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await requestFn();
      } catch (error) {
        console.log(`Request attempt ${i + 1} failed:`, error.message);
        if (i === attempts - 1) throw error;
        
        // 지수 백오프: 1초, 2초, 4초...
        const delay = this.retryDelay * Math.pow(2, i);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Instagram oEmbed API를 사용하여 포스트 메타데이터 가져오기
   * @param {string} postUrl - Instagram 포스트 URL
   * @returns {Object} 메타데이터 객체
   */
  async fetchPostMetadata(postUrl) {
    try {
      // 캐시 확인
      const cached = this.getCachedMetadata(postUrl);
      if (cached) return cached;

      console.log('Fetching Instagram metadata for:', postUrl);
      
      try {
        const publicOembedUrl = 'https://graph.facebook.com/v18.0/instagram_oembed';
        const params = {
          url: postUrl,
          access_token: this.accessToken
        };

        const response = await this.retryRequest(async () => {
          return await axios.get(publicOembedUrl, { 
            params,
            timeout: 10000 // 10초 타임아웃
          });
        });
        const data = response.data;

        // Instagram 메타데이터 파싱
        const metadata = {
          provider: 'instagram',
          original_url: postUrl,
          author_name: data.author_name || 'Unknown',
          author_url: data.author_url || '',
          title: data.title || '',
          embed_html: data.html || '',
          image_url: data.thumbnail_url || '',
          thumbnail_url: data.thumbnail_url || '',
          license_type: 'instagram',
          license_url: 'https://help.instagram.com/581066165581870',
          commercial_allowed: true,
          attribution_text: `Photo by ${data.author_name || 'Unknown'} on Instagram`,
          provider_attribution_required: true,
          description: data.title || ''
        };

        // 캐시에 저장
        this.setCachedMetadata(postUrl, metadata);
        return metadata;
      } catch (apiError) {
        console.log('Instagram API failed, trying public oEmbed...');
        
        // 공개 oEmbed API 시도 (토큰 없이)
        const publicOembedUrl = 'https://graph.facebook.com/v18.0/instagram_oembed';
        const publicParams = {
          url: postUrl
        };

        const publicResponse = await this.retryRequest(async () => {
          return await axios.get(publicOembedUrl, { 
            params: publicParams,
            timeout: 10000
          });
        });
        const publicData = publicResponse.data;

        const metadata = {
          provider: 'instagram',
          original_url: postUrl,
          author_name: publicData.author_name || 'Unknown',
          author_url: publicData.author_url || '',
          title: publicData.title || '',
          embed_html: publicData.html || '',
          image_url: publicData.thumbnail_url || '',
          thumbnail_url: publicData.thumbnail_url || '',
          license_type: 'instagram',
          license_url: 'https://help.instagram.com/581066165581870',
          commercial_allowed: true,
          attribution_text: `Photo by ${publicData.author_name || 'Unknown'} on Instagram`,
          provider_attribution_required: true,
          description: publicData.title || ''
        };

        // 캐시에 저장
        this.setCachedMetadata(postUrl, metadata);
        return metadata;
      }
    } catch (error) {
      console.error('Instagram API Error:', error.response?.data || error.message);
      
      // 최종 대체 방법: 직접 스크래핑
      const scrapedMetadata = await this.scrapeInstagramPost(postUrl);
      // 스크래핑 결과도 캐시에 저장
      this.setCachedMetadata(postUrl, scrapedMetadata);
      return scrapedMetadata;
    }
  }

  /**
   * Instagram 포스트를 직접 스크래핑하여 메타데이터 추출 (대체 방법)
   * @param {string} postUrl - Instagram 포스트 URL
   * @returns {Object} 메타데이터 객체
   */
  async scrapeInstagramPost(postUrl) {
    try {
      console.log('Scraping Instagram post:', postUrl);
      
      const response = await this.retryRequest(async () => {
        return await axios.get(postUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 15000 // 15초 타임아웃
        });
      });

      const $ = cheerio.load(response.data);
      
      // 메타 태그에서 정보 추출
      const title = $('meta[property="og:title"]').attr('content') || 
                   $('meta[name="description"]').attr('content') || '';
      
      const description = $('meta[property="og:description"]').attr('content') || '';
      const imageUrl = $('meta[property="og:image"]').attr('content') || '';
      const authorName = $('meta[property="article:author"]').attr('content') || 
                        $('meta[name="author"]').attr('content') || 'Unknown';

      // Instagram oEmbed API를 다시 시도 (토큰 없이)
      try {
        const oembedResponse = await this.retryRequest(async () => {
          return await axios.get('https://graph.facebook.com/v18.0/instagram_oembed', {
            params: {
              url: postUrl
            },
            timeout: 10000
          });
        });
        
        const oembedData = oembedResponse.data;
        console.log('oEmbed API success:', oembedData);
        
        return {
          provider: 'instagram',
          original_url: postUrl,
          author_name: oembedData.author_name || authorName,
          author_url: oembedData.author_url || '',
          title: oembedData.title || title,
          embed_html: oembedData.html || `<blockquote class="instagram-media" data-instgrm-permalink="${postUrl}" data-instgrm-version="14"></blockquote>`,
          image_url: oembedData.thumbnail_url || imageUrl,
          thumbnail_url: oembedData.thumbnail_url || imageUrl,
          license_type: 'instagram',
          license_url: 'https://help.instagram.com/581066165581870',
          commercial_allowed: true,
          attribution_text: `Photo by ${oembedData.author_name || authorName} on Instagram`,
          provider_attribution_required: true,
          description: oembedData.title || description
        };
      } catch (oembedError) {
        console.log('oEmbed API failed, using scraped data');
      }

      return {
        provider: 'instagram',
        original_url: postUrl,
        author_name: authorName,
        author_url: '',
        title: title,
        embed_html: `<blockquote class="instagram-media" data-instgrm-permalink="${postUrl}" data-instgrm-version="14"></blockquote>`,
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        license_type: 'instagram',
        license_url: 'https://help.instagram.com/581066165581870',
        commercial_allowed: true,
        attribution_text: `Photo by ${authorName} on Instagram`,
        provider_attribution_required: true,
        description: description
      };
    } catch (error) {
      console.error('Instagram scraping error:', error.message);
      
      // 최종 fallback: 기본 메타데이터 반환
      return {
        provider: 'instagram',
        original_url: postUrl,
        author_name: 'Unknown',
        author_url: '',
        title: 'Instagram Post',
        embed_html: `<blockquote class="instagram-media" data-instgrm-permalink="${postUrl}" data-instgrm-version="14"></blockquote>`,
        image_url: '',
        thumbnail_url: '',
        license_type: 'instagram',
        license_url: 'https://help.instagram.com/581066165581870',
        commercial_allowed: true,
        attribution_text: 'Photo by Unknown on Instagram',
        provider_attribution_required: true,
        description: 'Instagram post'
      };
    }
  }

  /**
   * Instagram 이미지 URL이 유효한지 확인
   * @param {string} url - 확인할 URL
   * @returns {boolean} 유효성 여부
   */
  isValidInstagramUrl(url) {
    const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?$/;
    return instagramRegex.test(url);
  }

  /**
   * Instagram 임베드 스크립트 HTML 생성
   * @returns {string} 스크립트 태그 HTML
   */
  getEmbedScript() {
    return `<script async src="//www.instagram.com/embed.js"></script>`;
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
      cacheTimeout: this.cacheTimeout
    };
  }

  /**
   * 만료된 캐시 항목 정리
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
    console.log(`Cache cleanup completed. Remaining entries: ${this.cache.size}`);
  }

  /**
   * 전체 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
    console.log('Cache cleared');
  }
}

module.exports = InstagramAPI;
