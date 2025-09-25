// Gallery Booth JavaScript Module with SimpleCursorCanvasOverride functionality

// SimpleCursorCanvasOverride implementation
export class SimpleCursorCanvasOverride {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.animationId = null;
        this.frameWidth = 10758;
        this.frameHeight = 7590;
    }

    initialize(canvas) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Set canvas size
        canvas.style.width = this.frameWidth + 'px';
        canvas.style.height = this.frameHeight + 'px';
        
        // Enable hardware acceleration
        canvas.style.transform = 'translateZ(0)';
        canvas.style.willChange = 'transform';
        canvas.style.backfaceVisibility = 'hidden';
        canvas.style.perspective = '1000px';
        canvas.style.transformStyle = 'preserve-3d';
        
        // Hide scrollbars
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // Apply scrollbar hiding styles and hardware acceleration
        const style = document.createElement('style');
        style.textContent = `
            body, html { 
                overflow: hidden !important; 
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            *::-webkit-scrollbar { display: none !important; }
            * { 
                scrollbar-width: none !important; 
                -ms-overflow-style: none !important;
                -webkit-backface-visibility: hidden;
                backface-visibility: hidden;
            }
            canvas {
                -webkit-transform: translateZ(0);
                -moz-transform: translateZ(0);
                -ms-transform: translateZ(0);
                -o-transform: translateZ(0);
                transform: translateZ(0);
                -webkit-perspective: 1000px;
                perspective: 1000px;
            }
        `;
        document.head.appendChild(style);
        
        // Mouse move handler
        const handleMouseMove = (e) => {
            const normalizedX = e.clientX / viewportWidth;
            const normalizedY = e.clientY / viewportHeight;
            
            const maxScrollX = Math.max(0, this.frameWidth - viewportWidth);
            const maxScrollY = Math.max(0, this.frameHeight - viewportHeight);
            
            this.targetX = -normalizedX * maxScrollX;
            this.targetY = -normalizedY * maxScrollY;
            
            this.animatePosition(canvas);
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        
        // Initial center position - start from center of canvas
        const maxScrollX = Math.max(0, this.frameWidth - viewportWidth);
        const maxScrollY = Math.max(0, this.frameHeight - viewportHeight);
        this.x = -maxScrollX / 2;
        this.y = -maxScrollY / 2;
        canvas.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
        
        // Store cleanup function
        this.cleanup = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
            style.remove();
        };
    }

    animatePosition(canvas) {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        const animate = () => {
            const diffX = this.targetX - this.x;
            const diffY = this.targetY - this.y;
            
            // 0.35초 지연을 위한 보간 (속도 절반으로 감소)
            this.x += diffX * 0.04;
            this.y += diffY * 0.04;
            
            // Use hardware-accelerated transform with translate3d for GPU acceleration
            canvas.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
            
            if (Math.abs(diffX) > 0.1 || Math.abs(diffY) > 0.1) {
                this.animationId = requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    destroy() {
        if (this.cleanup) {
            this.cleanup();
        }
    }
}

// Gallery Items Creator with Masonry Layout
export class GalleryItemsCreator {
    static async createGalleryItems(canvas) {
        const itemWidth = 240; // 1.2배 크기 (200 * 1.2)
        const spacing = 15; // Tighter spacing for full coverage
        
        // Pinterest/COSMOS style image sources with varied aspect ratios
        const imageSources = [
            // Wide images (landscape)
            'https://picsum.photos/400/300?random=1',
            'https://picsum.photos/400/250?random=2',
            'https://picsum.photos/400/350?random=3',
            
            // Square images
            'https://picsum.photos/400/400?random=4',
            'https://picsum.photos/400/400?random=5',
            'https://picsum.photos/400/400?random=6',
            
            // Tall images (portrait)
            'https://picsum.photos/400/600?random=7',
            'https://picsum.photos/400/800?random=8',
            'https://picsum.photos/400/700?random=9',
            'https://picsum.photos/400/900?random=10',
            'https://picsum.photos/400/550?random=11',
            'https://picsum.photos/400/750?random=12',
            'https://picsum.photos/400/650?random=13',
            'https://picsum.photos/400/580?random=14',
            
            // Very tall images
            'https://picsum.photos/400/1200?random=15',
            'https://picsum.photos/400/1100?random=16',
            'https://picsum.photos/400/1000?random=17',
            
            // Medium aspect ratios
            'https://picsum.photos/400/500?random=18',
            'https://picsum.photos/400/450?random=19',
            'https://picsum.photos/400/520?random=20',
            
            // Additional variety for full coverage
            'https://picsum.photos/400/300?random=21',
            'https://picsum.photos/400/400?random=22',
            'https://picsum.photos/400/600?random=23',
            'https://picsum.photos/400/800?random=24',
            'https://picsum.photos/400/700?random=25',
            'https://picsum.photos/400/900?random=26',
            'https://picsum.photos/400/550?random=27',
            'https://picsum.photos/400/750?random=28',
            'https://picsum.photos/400/650?random=29',
            'https://picsum.photos/400/580?random=30',
            'https://picsum.photos/400/1200?random=31',
            'https://picsum.photos/400/1100?random=32',
            'https://picsum.photos/400/1000?random=33',
            'https://picsum.photos/400/500?random=34',
            'https://picsum.photos/400/450?random=35',
            'https://picsum.photos/400/520?random=36',
            'https://picsum.photos/400/350?random=37',
            'https://picsum.photos/400/380?random=38',
            'https://picsum.photos/400/420?random=39',
            'https://picsum.photos/400/480?random=40'
        ];
        
        // Full canvas coverage with maximum image density
        const canvasWidth = 10758;
        const canvasHeight = 7590;
        
        // Calculate maximum number of columns to fill entire canvas width
        const cols = Math.floor((canvasWidth + spacing) / (itemWidth + spacing));
        
        // Calculate total items needed for full coverage
        const estimatedItemsPerColumn = Math.ceil(canvasHeight / (itemWidth * 0.6)); // More items per column
        const totalItems = cols * estimatedItemsPerColumn * 3; // Even more items for complete coverage
        
        // Simple full canvas coverage starting from top-left
        const contentWidth = cols * (itemWidth + spacing) - spacing;
        const startX = (canvasWidth - contentWidth) / 2; // Center horizontally
        
        // Initialize column heights from top of canvas
        const columnHeights = new Array(cols).fill(0);
        
        
        // Create images with proper masonry layout - wait for each image to load completely
        const createAllImages = async () => {
            for (let i = 0; i < totalItems; i++) {
                const imageSrc = imageSources[i % imageSources.length];
                
                // Wait for each image to be fully processed before moving to next
                await new Promise((resolve) => {
                    const img = document.createElement('img');
                    img.style.cssText = `
                        position: absolute;
                        width: ${itemWidth}px;
                        height: auto;
                        border-radius: 0px;
                        cursor: pointer;
                        user-select: none;
                        transition: transform 0.3s ease, opacity 0.3s ease;
                        display: block;
                        opacity: 0;
                        transform: translateZ(0);
                        will-change: transform, opacity;
                        backface-visibility: hidden;
                    `;
                    
                    // Find shortest column
                    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
                    const x = startX + shortestColumnIndex * (itemWidth + spacing);
                    const y = columnHeights[shortestColumnIndex];
                    
                    // Update column height immediately
                    columnHeights[shortestColumnIndex] += 200 + spacing; // Placeholder height
                    
                    // Set initial position
                    img.style.left = x + 'px';
                    img.style.top = y + 'px';
                    
                    img.onload = () => {
                        // Calculate actual height
                        const aspectRatio = img.naturalHeight / img.naturalWidth;
                        const actualHeight = itemWidth * aspectRatio;
                        
                        // Update dimensions
                        img.style.height = actualHeight + 'px';
                        
                        // Adjust position and column height
                        const correctTop = columnHeights[shortestColumnIndex] - (200 + spacing);
                        img.style.top = correctTop + 'px';
                        columnHeights[shortestColumnIndex] = correctTop + actualHeight + spacing;
                        
                        // Add to canvas
                        canvas.appendChild(img);
                        
                        // Fade in
                        setTimeout(() => {
                            img.style.opacity = '1';
                        }, 50);
                        
                        // Add hover effect with hardware acceleration
                        img.addEventListener('mouseenter', () => {
                            img.style.transform = 'translateZ(0) scale3d(1.02, 1.02, 1)';
                            img.style.opacity = '0.9';
                        });
                        
                        img.addEventListener('mouseleave', () => {
                            img.style.transform = 'translateZ(0) scale3d(1, 1, 1)';
                            img.style.opacity = '1';
                        });
                        
                        resolve();
                    };
                    
                    img.onerror = () => {
                        // Fallback with fixed height
                        const fallbackHeight = 300;
                        const correctTop = columnHeights[shortestColumnIndex] - (200 + spacing);
                        img.style.height = fallbackHeight + 'px';
                        img.style.top = correctTop + 'px';
                        img.style.background = '#333';
                        img.style.display = 'flex';
                        img.style.alignItems = 'center';
                        img.style.justifyContent = 'center';
                        img.style.color = 'white';
                        img.textContent = 'Failed to load';
                        
                        columnHeights[shortestColumnIndex] = correctTop + fallbackHeight + spacing;
                        canvas.appendChild(img);
                        resolve();
                    };
                    
                    img.src = imageSrc;
                    img.alt = `Gallery Image ${i + 1}`;
                });
                
                // Small delay every 20 images
                if (i % 20 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        };
        
        // Start creating images
        createAllImages();
        
        // Update canvas height dynamically as images load
        const updateCanvasHeight = () => {
            const maxHeight = Math.max(...columnHeights) + spacing;
            // Ensure canvas height is at least the original size
            canvas.style.height = Math.max(maxHeight, 7590) + 'px';
        };
        
        // Update canvas height after all images are processed
        setTimeout(updateCanvasHeight, 1000);
    }
}

// Gallery Booth Manager
export class GalleryBoothManager {
    constructor() {
        this.cursorCanvas = new SimpleCursorCanvasOverride();
    }

    async initialize(canvas) {
        // Create gallery items with images
        await GalleryItemsCreator.createGalleryItems(canvas);
        
        // Initialize cursor canvas
        this.cursorCanvas.initialize(canvas);
    }

    destroy() {
        this.cursorCanvas.destroy();
    }
}
