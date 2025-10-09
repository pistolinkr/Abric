// Instagram Gallery with License Management
export class InstagramGallery {
    constructor() {
        this.canvas = null;
        this.apiBase = 'http://localhost:3001/api';
        this.userId = this.generateUserId(); // 임시 사용자 ID 생성
        this.loadedImages = new Map(); // 캐시된 이미지들
        this.isLoading = false;
        this.collections = this.loadCollections();
    }

    // 임시 사용자 ID 생성 (실제로는 로그인 시스템에서 가져와야 함)
    generateUserId() {
        let userId = localStorage.getItem('abric_user_id');
        if (!userId) {
            // UUID v4 형식으로 생성
            userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            localStorage.setItem('abric_user_id', userId);
        }
        return userId;
    }

    initialize(canvas) {
        this.canvas = canvas;
        
        // Enable hardware acceleration
        canvas.style.transform = 'translateZ(0)';
        canvas.style.willChange = 'auto';
        canvas.style.backfaceVisibility = 'hidden';
        
        // Enable normal scrolling
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        
        // Apply smooth scrolling and hardware acceleration
        const style = document.createElement('style');
        style.textContent = `
            html { 
                scroll-behavior: smooth;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            * { 
                -webkit-backface-visibility: hidden;
                backface-visibility: hidden;
            }
            .gallery-canvas {
                -webkit-transform: translateZ(0);
                -moz-transform: translateZ(0);
                -ms-transform: translateZ(0);
                -o-transform: translateZ(0);
                transform: translateZ(0);
            }
            .image-attribution { display: none; }
            .image-attribution a {
                color: #ffffff;
                text-decoration: none;
            }
            .image-attribution a:hover {
                text-decoration: underline;
            }
        `;
        document.head.appendChild(style);
        
        // Inject collection modal once
        this.ensureCollectionModal();

        // keyboard shortcuts
        this.bindShortcuts();

        // Store cleanup function
        this.cleanup = () => {
            style.remove();
        };

        // Load initial images
        this.loadGalleryImages();
    }

    // ----- Collections (local) -----
    loadCollections() {
        try {
            return JSON.parse(localStorage.getItem('abric_collections') || '[]');
        } catch { return []; }
    }

    saveCollections() {
        localStorage.setItem('abric_collections', JSON.stringify(this.collections));
    }

    ensureCollectionModal() {
        if (document.getElementById('collection-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'collection-modal';
        modal.className = 'collection-modal';
        modal.innerHTML = `
          <div class="collection-modal-content">
            <div class="collection-modal-header">
              <div style="color:#fff;font-size:16px;">Connect</div>
              <button id="collection-modal-close" style="background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer;">×</button>
            </div>
            <div class="collection-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input id="collection-search-input" placeholder="Search" />
            </div>
            <div id="collection-list" class="collection-list"></div>
            <div class="collection-modal-footer">
              <div>Shortcut: S save • / search • N create</div>
              <button id="collection-create" class="collection-add-btn">+ Create</button>
            </div>
          </div>`;
        document.body.appendChild(modal);
        document.getElementById('collection-modal-close').onclick = () => modal.classList.remove('active');
        modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.classList.remove('active'); });
        document.getElementById('collection-search-input').addEventListener('input', (e)=> this.renderCollectionList(e.target.value));
        document.getElementById('collection-create').addEventListener('click', ()=> this.createCollection());
        this.renderCollectionList('');
    }

    renderCollectionList(query) {
        const list = document.getElementById('collection-list');
        if (!list) return;
        const q = (query||'').toLowerCase();
        const items = this.collections.filter(c => !q || c.name.toLowerCase().includes(q));
        if (items.length === 0) {
            list.innerHTML = `
              <div style="padding:24px; text-align:center; color: rgba(255,255,255,0.6);">
                <div style="margin-bottom:8px;">No collections yet</div>
                <button id="empty-create-btn" class="collection-add-btn">+ Create your first collection</button>
              </div>`;
            const btn = document.getElementById('empty-create-btn');
            if (btn) btn.addEventListener('click', ()=> this.createCollection());
            return;
        }
        list.innerHTML = items.map(c => `
          <div class="collection-item-row" data-id="${c.id}">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:28px;height:28px;background:${c.color||'#444'}"></div>
              <div>
                <div style="color:#fff;font-size:14px;">${c.name}</div>
                <div class="collection-meta">${(c.count||0)} elements</div>
              </div>
            </div>
            <button class="collection-add-btn" data-id="${c.id}">Add</button>
          </div>
        `).join('');
        list.querySelectorAll('.collection-add-btn').forEach(btn => {
            btn.addEventListener('click', (e)=>{
                const id = e.currentTarget.getAttribute('data-id');
                this.onChooseCollection && this.onChooseCollection(id);
                document.getElementById('collection-modal').classList.remove('active');
            });
        });
    }

    openCollectionModal(onChoose, anchorRect) {
        this.onChooseCollection = onChoose;
        const modal = document.getElementById('collection-modal');
        if (!modal) return;
        // switch to popover mode and position under the image
        modal.classList.add('active');
        modal.classList.add('popover');
        const content = modal.querySelector('.collection-modal-content');
        if (anchorRect && content) {
            const margin = 8;
            const top = Math.min(window.innerHeight - content.offsetHeight - margin, anchorRect.bottom + margin);
            const left = Math.min(window.innerWidth - content.offsetWidth - margin, anchorRect.left);
            content.style.top = `${Math.max(10, top)}px`;
            content.style.left = `${Math.max(10, left)}px`;
        }
        const input = document.getElementById('collection-search-input');
        if (input) { input.value=''; this.renderCollectionList(''); setTimeout(()=>input.focus(), 0); }
    }

    createCollection() {
        const name = prompt('New collection name');
        if (!name) return;
        const newC = { id: 'c_' + Date.now(), name, color: '#555', count: 0 };
        this.collections.unshift(newC);
        this.saveCollections();
        this.renderCollectionList('');
    }

    bindShortcuts() {
        window.addEventListener('keydown', (e)=>{
            if (e.key === '/') {
                const input = document.getElementById('collection-search-input');
                const modal = document.getElementById('collection-modal');
                if (modal && modal.classList.contains('active')) {
                    e.preventDefault();
                    input && input.focus();
                }
            }
        });
    }

    destroy() {
        if (this.cleanup) {
            this.cleanup();
        }
    }

    // 서버에서 갤러리 이미지들 로드
    async loadGalleryImages() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();

        try {
            // 먼저 사용자 생성 시도
            await this.ensureUserExists();
            
            console.log('Fetching all gallery images from server...');
            const response = await fetch(`${this.apiBase}/gallery/images?limit=1000&offset=0`);
            const data = await response.json();

            console.log('Gallery API response:', data);

            if (data.success && data.images.length > 0) {
                console.log(`Found ${data.images.length} images, rendering...`);
                await this.renderImages(data.images);
            } else {
                console.log('No images found, loading all database images...');
                // 서버에서 이미지가 없으면 모든 데이터베이스 이미지 로드
                await this.loadAllDatabaseImages();
            }
        } catch (error) {
            console.error('Failed to load gallery images:', error);
            console.log('Falling back to all database images...');
            await this.loadAllDatabaseImages();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    // 사용자가 존재하는지 확인하고 없으면 생성
    async ensureUserExists() {
        try {
            const response = await fetch(`${this.apiBase}/users/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: `gallery_user_${this.userId.substring(0, 8)}`,
                    isBusiness: false
                })
            });
            
            const data = await response.json();
            if (data.success) {
                console.log('User created/verified:', data.user.id);
                this.userId = data.user.id; // 서버에서 생성된 UUID 사용
                localStorage.setItem('abric_user_id', this.userId);
            }
        } catch (error) {
            console.error('Failed to ensure user exists:', error);
        }
    }

    // 모든 데이터베이스 이미지 로드 (리밋 없이)
    async loadAllDatabaseImages() {
        try {
            console.log('Loading all images from database...');
            
            // 모든 이미지를 가져오기 위해 큰 limit 설정
            const response = await fetch(`${this.apiBase}/gallery/images?limit=10000&offset=0`);
            const data = await response.json();

            if (data.success && data.images.length > 0) {
                console.log(`Found ${data.images.length} images in database, rendering all...`);
                await this.renderImages(data.images);
            } else {
                console.log('No images found in database');
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Failed to load database images:', error);
            this.showErrorState();
        }
    }

    // Instagram 이미지 메타데이터 가져오기
    async fetchImageMetadata(instagramUrl) {
        try {
            const response = await fetch(`${this.apiBase}/images/fetch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: instagramUrl,
                    userId: this.userId
                })
            });

            const data = await response.json();
            
            if (data.success) {
                return data.image;
            } else {
                console.error('Failed to fetch image metadata:', data.error);
                return null;
            }
        } catch (error) {
            console.error('Error fetching image metadata:', error);
            return null;
        }
    }

    // 이미지들 렌더링 (Pinterest 스타일)
    async renderImages(images) {
        console.log('Starting to render images:', images.length);
        
        // React MasonryLayout 스타일 설정 - 반응형 컬럼
        const containerWidth = window.innerWidth;
        let columns = 5; // 기본 데스크톱 컬럼 수
        let gap = '32px';
        
        // 반응형 컬럼 및 간격 조정
        if (containerWidth < 768) {
            columns = 2; // 모바일
            gap = '24px';
        } else if (containerWidth < 1024) {
            columns = 3; // 태블릿
            gap = '28px';
        } else if (containerWidth < 1440) {
            columns = 4; // 작은 데스크톱
            gap = '30px';
        } else {
            columns = 5; // 큰 데스크톱
            gap = '32px';
        }

        console.log('Using React MasonryLayout style: columns=', columns, 'gap=', gap, 'screen width=', containerWidth);

        // Clear existing content
        this.canvas.innerHTML = '';
        console.log('Canvas cleared, starting image rendering...');

        // Masonry container 설정 (CSS column 기반)
        this.canvas.style.cssText = `
            column-count: ${columns};
            column-gap: ${gap};
            width: 100%;
            position: relative;
        `;

        for (let i = 0; i < images.length; i++) {
            const imageData = images[i];
            console.log(`Rendering image ${i + 1}/${images.length}:`, imageData.original_url);
            
            // Create image container (React MasonryLayout 스타일)
            const container = document.createElement('div');
            container.style.cssText = `
                break-inside: avoid;
                margin-bottom: ${gap};
                display: inline-block;
                width: 100%;
                background: #2a2a2a;
                border-radius: 0px;
                overflow: hidden;
                box-shadow: none;
                position: relative;
            `;

            // Hover UI removed; keep minimal container for future chips if needed
            const hoverOverlay = document.createElement('div');
            hoverOverlay.className = 'image-hover-overlay';
            hoverOverlay.style.cssText = `display:none;`;

            // Attribution section
            const attribution = document.createElement('div');
            attribution.className = 'image-attribution';
            attribution.innerHTML = `
                <div style="font-weight: 500; margin-bottom: 4px;">
                    <a href="${imageData.author_url || imageData.original_url}" target="_blank" rel="noopener" style="color: white; text-decoration: none;">
                        ${imageData.author_name || '@unknown_user'}
                    </a>
                </div>
                <div style="font-size: 10px; opacity: 0.8;">
                    Source: ${imageData.license_type || 'Instagram'}
                </div>
            `;

            // Add to collection floating chip (top-right)
            const addButton = document.createElement('button');
            addButton.className = 'add-to-collection-btn';
            addButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
            `;
            addButton.title = 'Add to Collection (open modal)';
            addButton.style.cssText = `
                position: absolute;
                top: 0px;
                right: 0px;
                background: rgba(26,26,26,0.6);
                border: 1px solid rgba(255,255,255,0.35);
                color: #fff;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 0px;
                font-size: 12px;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.2s ease, background 0.2s ease;
                z-index: 5;
                backdrop-filter: blur(6px);
            `;

            hoverOverlay.appendChild(attribution);

            // Set image source - Instagram oEmbed에서 이미지 URL이 없으면 Instagram 임베드 사용
            if (imageData.thumbnail_url || imageData.image_url) {
                const img = document.createElement('img');
                img.className = 'gallery-image';
                img.src = imageData.thumbnail_url || imageData.image_url;
                img.alt = imageData.title || imageData.description || 'Instagram Image';
                
                // Apply hardware acceleration and React MasonryLayout 스타일
                img.style.cssText = `
                    position: relative;
                    width: 100%;
                    height: auto;
                    border-radius: 0px;
                    cursor: pointer;
                    user-select: none;
                    transition: filter 0.2s ease, opacity 0.2s ease;
                    display: block;
                    opacity: 1;
                    transform: translateZ(0);
                    will-change: transform, opacity;
                    backface-visibility: hidden;
                    -webkit-user-drag: none;
                    -khtml-user-drag: none;
                    -moz-user-drag: none;
                    -o-user-drag: none;
                    user-drag: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                `;

                container.appendChild(img);
                container.appendChild(hoverOverlay);
                container.appendChild(addButton);

                // Add drag prevention events
                img.addEventListener('dragstart', (e) => {
                    e.preventDefault();
                    return false;
                });
                
                img.addEventListener('drag', (e) => {
                    e.preventDefault();
                    return false;
                });
                
                img.addEventListener('dragend', (e) => {
                    e.preventDefault();
                    return false;
                });

                // Image load handler
                img.onload = () => {
                    console.log(`Image ${i + 1} loaded successfully`);
                };

                img.onerror = () => {
                    console.error(`Failed to load image ${i + 1}:`, imageData.image_url);
                };

                // Add hover effects
                container.addEventListener('mouseenter', () => {
                    img.style.filter = 'brightness(0.92)';
                    addButton.style.opacity = '1';
                });
                
                container.addEventListener('mouseleave', () => {
                    img.style.filter = 'none';
                    addButton.style.opacity = '0';
                });

                // Add to collection button click handler -> open modal
                addButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rect = addButton.getBoundingClientRect();
                    this.openCollectionModal((collectionId)=>{
                        this.addToCollection({ ...imageData, collectionId });
                    }, rect);
                });

                // Add click event to open modal
                container.addEventListener('click', (e) => {
                    if (e.target === addButton) return; // Don't open modal when clicking add button
                    
                    const modalImageData = {
                        src: img.src,
                        user: imageData.author_name || '@unknown_user',
                        date: new Date(imageData.created_at || Date.now()).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                        }).toUpperCase(),
                        description: imageData.caption || 'No description available',
                        source: imageData.license_type || 'Instagram'
                    };
                    
                    // Get all images for navigation
                    const allImages = Array.from(this.canvas.querySelectorAll('img')).map(img => {
                        const container = img.closest('.image-container');
                        const imageData = container ? container.imageData : null;
                        return {
                            src: img.src,
                            user: imageData?.author_name || '@unknown_user',
                            date: new Date(imageData?.created_at || Date.now()).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                            }).toUpperCase(),
                            description: imageData?.caption || 'No description available',
                            source: imageData?.license_type || 'Instagram'
                        };
                    });
                    
                    const currentIndex = allImages.findIndex(imgData => imgData.src === img.src);
                    
                    if (window.imageModal) {
                        window.imageModal.open(modalImageData, currentIndex, allImages);
                    }
                });

                // Add to canvas immediately (don't wait for load)
                this.canvas.appendChild(container);
                console.log(`Image ${i + 1} container added to canvas`);

            } else {
                // 이미지가 없는 경우 플레이스홀더
                const placeholder = document.createElement('div');
                placeholder.style.cssText = `
                    width: 100%;
                    height: 250px;
                    background: #333;
                    border-radius: 0px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-size: 14px;
                `;
                placeholder.textContent = 'No image available';
                
                container.appendChild(placeholder);
                container.appendChild(attribution);
                
                // Add to canvas
                this.canvas.appendChild(container);
                console.log(`Placeholder ${i + 1} added to canvas for: ${imageData.original_url}`);
            }
        }

        console.log('Image rendering completed with React MasonryLayout style');
    }

    // 로딩 상태 표시
    showLoadingState() {
        const loading = document.createElement('div');
        loading.id = 'gallery-loading';
        loading.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
        `;
        
        // Create loading spinner
        const loadingSpinner = document.createElement('div');
        loadingSpinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid #ffffff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        loading.appendChild(loadingSpinner);
        document.body.appendChild(loading);
    }

    hideLoadingState() {
        const loading = document.getElementById('gallery-loading');
        if (loading) {
            loading.remove();
        }
    }

    // Add image to user collection
    async addToCollection(imageData) {
        try {
            console.log('Adding to collection:', imageData);
            
            // Show success feedback
            this.showCollectionFeedback('Added to Collection!');
            
            // Here you would typically save to user's collection in database
            // For now, we'll just show a success message
            const collectionData = {
                userId: this.userId,
                imageUrl: imageData.thumbnail_url || imageData.image_url,
                originalUrl: imageData.original_url,
                authorName: imageData.author_name,
                authorUrl: imageData.author_url,
                title: imageData.title,
                description: imageData.description,
                licenseType: imageData.license_type,
                addedAt: new Date().toISOString()
            };
            
            console.log('Collection data:', collectionData);
            
            // Save to localStorage (temporary storage)
            this.saveToUserCollection(collectionData);
            
        } catch (error) {
            console.error('Error adding to collection:', error);
            this.showCollectionFeedback('Failed to add to collection', 'error');
        }
    }

    // Show collection feedback
    showCollectionFeedback(message, type = 'success') {
        const feedback = document.createElement('div');
        feedback.className = 'collection-feedback';
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 1001;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(feedback);
        
        // Animate in
        setTimeout(() => {
            feedback.style.opacity = '1';
            feedback.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            feedback.style.opacity = '0';
            feedback.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 3000);
    }

    // Save to user collection in localStorage
    saveToUserCollection(collectionData) {
        try {
            const existingCollection = JSON.parse(localStorage.getItem('user_collection') || '[]');
            
            // Check if item already exists (by imageUrl)
            const exists = existingCollection.some(item => item.imageUrl === collectionData.imageUrl);
            if (exists) {
                this.showCollectionFeedback('Item already in collection', 'info');
                return;
            }
            
            existingCollection.push(collectionData);
            localStorage.setItem('user_collection', JSON.stringify(existingCollection));
            
            console.log('Saved to user collection:', collectionData);
        } catch (error) {
            console.error('Error saving to collection:', error);
        }
    }

    // 새로운 Instagram URL 추가
    async addInstagramUrl(instagramUrl) {
        try {
            const imageData = await this.fetchImageMetadata(instagramUrl);
            if (imageData) {
                await this.renderImages([imageData]);
                return true;
            }
        } catch (error) {
            console.error('Failed to add Instagram URL:', error);
        }
        return false;
    }

    // 빈 상태 표시
    showEmptyState() {
        this.canvas.innerHTML = `
            <div style="
                text-align: center;
                padding: 60px 20px;
                color: rgba(255, 255, 255, 0.6);
                font-size: 16px;
                grid-column: 1 / -1;
            ">
                <p>No images found in database</p>
                <p style="font-size: 14px; margin-top: 8px;">Upload some images to get started</p>
            </div>
        `;
    }

    // 에러 상태 표시
    showErrorState() {
        this.canvas.innerHTML = `
            <div style="
                text-align: center;
                padding: 60px 20px;
                color: rgba(255, 100, 100, 0.8);
                font-size: 16px;
                grid-column: 1 / -1;
            ">
                <p>Failed to load images</p>
                <p style="font-size: 14px; margin-top: 8px;">Please try again later</p>
            </div>
        `;
    }
}
