// Gallery Booth JavaScript Module with SimpleCursorCanvasOverride functionality

// Traditional Scroll Gallery implementation
export class TraditionalScrollGallery {
    constructor() {
        this.canvas = null;
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
        `;
        document.head.appendChild(style);
        
        // Store cleanup function
        this.cleanup = () => {
            style.remove();
        };
    }

    destroy() {
        if (this.cleanup) {
            this.cleanup();
        }
    }
}

// Gallery Items Creator with Pinterest-style Masonry Layout
export class GalleryItemsCreator {
    static async createGalleryItems(canvas) {
        const itemWidth = 280; // Pinterest-style width
        const spacing = 60; // Doubled spacing between items (same for all directions)
        const containerPadding = 60; // Same as spacing for complete uniformity
        
        // Generate more image sources for all database content
        const imageSources = [];
        
        // Create 1000+ unique image sources with varied aspect ratios
        for (let i = 1; i <= 1000; i++) {
            const aspectRatios = [
                { w: 400, h: 300 }, // Wide
                { w: 400, h: 400 }, // Square
                { w: 400, h: 500 }, // Portrait
                { w: 400, h: 600 }, // Tall
                { w: 400, h: 700 }, // Very tall
                { w: 400, h: 800 }, // Extra tall
                { w: 400, h: 900 }, // Super tall
                { w: 400, h: 1000 }, // Ultra tall
                { w: 400, h: 1200 }, // Maximum tall
                { w: 400, h: 250 }, // Very wide
                { w: 400, h: 350 }, // Wide
                { w: 400, h: 450 }, // Slightly wide
                { w: 400, h: 550 }, // Slightly tall
                { w: 400, h: 650 }, // Medium tall
                { w: 400, h: 750 }, // Tall
                { w: 400, h: 850 }, // Very tall
                { w: 400, h: 950 }, // Extra tall
                { w: 400, h: 1100 }, // Super tall
                { w: 400, h: 1300 }, // Ultra tall
                { w: 400, h: 1400 }  // Maximum tall
            ];
            
            const ratio = aspectRatios[i % aspectRatios.length];
            imageSources.push(`https://picsum.photos/${ratio.w}/${ratio.h}?random=${i}`);
        }
        
        // Calculate number of columns based on viewport width
        const viewportWidth = window.innerWidth;
        
        // Use uniform spacing for all directions (like cosmos.so)
        const uniformSpacing = spacing; // Same spacing everywhere
        
        // Calculate how many columns can fit with uniform spacing
        let cols = Math.floor((viewportWidth + uniformSpacing) / (itemWidth + uniformSpacing));
        if (cols < 2) cols = 2; // Minimum 2 columns
        
        // Calculate total width needed for uniform spacing
        const totalWidth = cols * (itemWidth + uniformSpacing) - uniformSpacing;
        
        // Center the grid horizontally with uniform spacing on both sides
        const startX = (viewportWidth - totalWidth) / 2;
        
        // Calculate total items needed (load all database content)
        const totalItems = 1000; // Load all database content without limit
        
        // Initialize column heights with uniform spacing
        const columnHeights = new Array(cols).fill(uniformSpacing);
        
        
        // Create Pinterest-style masonry layout
        const createAllImages = async () => {
            for (let i = 0; i < totalItems; i++) {
                const imageSrc = imageSources[i % imageSources.length];
                
                await new Promise((resolve) => {
                    const img = document.createElement('img');
                    img.style.cssText = `
                        position: relative;
                        width: 100%;
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
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        -webkit-user-drag: none;
                        -khtml-user-drag: none;
                        -moz-user-drag: none;
                        -o-user-drag: none;
                        user-drag: none;
                        -webkit-user-select: none;
                        -moz-user-select: none;
                        -ms-user-select: none;
                    `;
                    
                    // Find shortest column for masonry layout
                    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
                    const x = startX + shortestColumnIndex * (itemWidth + uniformSpacing);
                    const y = columnHeights[shortestColumnIndex];
                    
                    img.onload = () => {
                        // Calculate actual height
                        const aspectRatio = img.naturalHeight / img.naturalWidth;
                        const actualHeight = itemWidth * aspectRatio;
                        
                        // Update dimensions
                        img.style.height = actualHeight + 'px';
                        
                        // Create container for image and overlay
                        const container = document.createElement('div');
                        container.style.cssText = `
                            position: absolute;
                            left: ${x}px;
                            top: ${y}px;
                            width: ${itemWidth}px;
                            height: ${actualHeight}px;
                            overflow: hidden;
                            border-radius: 0px;
                            cursor: pointer;
                        `;
                        
                        // Create hover overlay
                        const overlay = document.createElement('div');
                        overlay.className = 'gallery-overlay';
                        overlay.style.cssText = `
                            position: absolute;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            background: linear-gradient(transparent, rgba(0,0,0,0.8));
                            color: white;
                            padding: 12px;
                            font-size: 12px;
                            line-height: 1.3;
                            opacity: 0;
                            transition: opacity 0.3s ease;
                            pointer-events: none;
                            z-index: 10;
                        `;
                        
                        // Generate sample data for overlay
                        const sampleUsers = ['@photographer_jane', '@creative_mike', '@art_lover_sam', '@designer_anna', '@visual_story'];
                        const sampleSources = ['Instagram', 'Unsplash', 'Pexels', 'Pixabay', 'Flickr'];
                        const randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
                        const randomSource = sampleSources[Math.floor(Math.random() * sampleSources.length)];
                        
                        overlay.innerHTML = `
                            <div style="font-weight: 500; margin-bottom: 4px;">
                                ${randomUser}
                            </div>
                            <div style="font-size: 10px; opacity: 0.8;">
                                Source: ${randomSource}
                            </div>
                        `;
                        
                        // Add hover effect
                        container.addEventListener('mouseenter', () => {
                            overlay.style.opacity = '1';
                            img.style.transform = 'scale(1.02)';
                        });
                        
                        container.addEventListener('mouseleave', () => {
                            overlay.style.opacity = '0';
                            img.style.transform = 'scale(1)';
                        });

                        // Add click event to open modal
                        container.addEventListener('click', () => {
                            const imageData = {
                                src: img.src,
                                user: randomUser,
                                date: new Date().toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                }).toUpperCase(),
                                description: 'Letter O mark for a tech brand. Interested in working with me send a dm or email to...',
                                source: randomSource
                            };
                            
                            // Get all images for navigation
                            const allImages = Array.from(canvas.querySelectorAll('img')).map(img => ({
                                src: img.src,
                                user: randomUser,
                                date: new Date().toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                }).toUpperCase(),
                                description: 'Letter O mark for a tech brand. Interested in working with me send a dm or email to...',
                                source: randomSource
                            }));
                            
                            const currentIndex = allImages.findIndex(imgData => imgData.src === img.src);
                            
                            if (window.imageModal) {
                                window.imageModal.open(imageData, currentIndex, allImages);
                            }
                        });
                        
                        // Add image to container
                        container.appendChild(img);
                        container.appendChild(overlay);
                        
                        // Update column height
                        columnHeights[shortestColumnIndex] += actualHeight + uniformSpacing;
                        
                        // Add to canvas
                        canvas.appendChild(container);
                        
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
                        
                        // Fade in
                        setTimeout(() => {
                            img.style.opacity = '1';
                        }, 50);
                        
                        resolve();
                    };
                    
                    img.onerror = () => {
                        // Fallback with fixed height
                        const fallbackHeight = 300;
                        img.style.height = fallbackHeight + 'px';
                        img.style.background = '#333';
                        img.style.display = 'flex';
                        img.style.alignItems = 'center';
                        img.style.justifyContent = 'center';
                        img.style.color = 'white';
                        img.textContent = 'Failed to load';
                        
                        // Create container for fallback image
                        const container = document.createElement('div');
                        container.style.cssText = `
                            position: absolute;
                            left: ${x}px;
                            top: ${y}px;
                            width: ${itemWidth}px;
                            height: ${fallbackHeight}px;
                            overflow: hidden;
                            border-radius: 0px;
                        `;
                        
                        // Create hover overlay for fallback
                        const overlay = document.createElement('div');
                        overlay.className = 'gallery-overlay';
                        overlay.style.cssText = `
                            position: absolute;
                            bottom: 0;
                            left: 0;
                            right: 0;
                            background: linear-gradient(transparent, rgba(0,0,0,0.8));
                            color: white;
                            padding: 12px;
                            font-size: 12px;
                            line-height: 1.3;
                            opacity: 0;
                            transition: opacity 0.3s ease;
                            pointer-events: none;
                            z-index: 10;
                        `;
                        
                        overlay.innerHTML = `
                            <div style="font-weight: 500; margin-bottom: 4px;">
                                @system_user
                            </div>
                            <div style="font-size: 10px; opacity: 0.8;">
                                Source: Local
                            </div>
                        `;
                        
                        // Add hover effect
                        container.addEventListener('mouseenter', () => {
                            overlay.style.opacity = '1';
                            img.style.transform = 'scale(1.02)';
                        });
                        
                        container.addEventListener('mouseleave', () => {
                            overlay.style.opacity = '0';
                            img.style.transform = 'scale(1)';
                        });

                        // Add click event to open modal
                        container.addEventListener('click', () => {
                            const imageData = {
                                src: img.src,
                                user: '@local_user',
                                date: new Date().toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                }).toUpperCase(),
                                description: 'Local gallery image. No description available.',
                                source: 'Local'
                            };
                            
                            // Get all images for navigation
                            const allImages = Array.from(canvas.querySelectorAll('img')).map(img => ({
                                src: img.src,
                                user: '@local_user',
                                date: new Date().toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                }).toUpperCase(),
                                description: 'Local gallery image. No description available.',
                                source: 'Local'
                            }));
                            
                            const currentIndex = allImages.findIndex(imgData => imgData.src === img.src);
                            
                            if (window.imageModal) {
                                window.imageModal.open(imageData, currentIndex, allImages);
                            }
                        });
                        
                        // Add image to container
                        container.appendChild(img);
                        container.appendChild(overlay);
                        
                        // Update column height
                        columnHeights[shortestColumnIndex] += fallbackHeight + uniformSpacing;
                        
                        // Add to canvas
                        canvas.appendChild(container);
                        
                        resolve();
                    };
                    
                    img.src = imageSrc;
                    img.alt = `Gallery Image ${i + 1}`;
                });
                
                // Small delay every 20 images for smooth loading
                if (i % 20 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
        };
        
        // Start creating images
        createAllImages();
        
        // Update canvas height dynamically as images load
        const updateCanvasHeight = () => {
            const maxHeight = Math.max(...columnHeights) + uniformSpacing; // Add bottom spacing
            // Set canvas height to accommodate all images
            canvas.style.height = maxHeight + 'px';
        };
        
        // Update canvas height after all images are processed
        setTimeout(updateCanvasHeight, 2000);
    }
}

// Gallery Booth Manager
export class GalleryBoothManager {
    constructor() {
        this.scrollGallery = new TraditionalScrollGallery();
    }

    async initialize(canvas) {
        // Initialize scroll gallery
        this.scrollGallery.initialize(canvas);
        
        // Create gallery items with images
        await GalleryItemsCreator.createGalleryItems(canvas);
    }

    destroy() {
        this.scrollGallery.destroy();
    }
}
