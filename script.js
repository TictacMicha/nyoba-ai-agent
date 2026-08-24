document.addEventListener('DOMContentLoaded', function() {
    // Setup Canvas and Frame Animation
    const canvas = document.getElementById('hero-canvas');
    const context = canvas.getContext('2d');

    // Detect if mobile device
    const isMobile = window.innerWidth <= 768;
    
    // Reduce frames on mobile for performance
    const totalFrames = 56;
    const frameStep = isMobile ? 2 : 1; // Load every 2nd frame on mobile
    const frameCount = Math.ceil(totalFrames / frameStep);
    
    // Function to get image path for a frame (1-indexed files)
    const currentFrame = index => {
        const actualFrameIndex = (index * frameStep) + 1;
        const frameNumber = actualFrameIndex.toString().padStart(3, '0');
        return `bgliquid/ezgif-frame-${frameNumber}.jpg`;
    };

    // Preload frame images with lazy loading
    const images = [];
    let imagesLoaded = 0;
    let currentFrameIndex = 0;

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        // Reduce canvas resolution on mobile
        const scale = isMobile ? 0.75 : 1;
        
        canvas.width = rect.width * dpr * scale;
        canvas.height = rect.height * dpr * scale;
        
        context.scale(dpr * scale, dpr * scale);
        
        if (imagesLoaded > 0) {
            renderFrame(currentFrameIndex);
        }
    }

    // Load images progressively
    function loadImage(index) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = currentFrame(index);
            img.onload = () => {
                imagesLoaded++;
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load frame: ${currentFrame(index)}`);
                imagesLoaded++;
                resolve(null);
            };
            images[index] = img;
        });
    }

    // Load first few frames immediately, rest progressively
    async function loadFrames() {
        const priorityFrames = Math.min(10, frameCount);
        
        // Load priority frames first
        for (let i = 0; i < priorityFrames; i++) {
            await loadImage(i);
            if (i === 0) {
                resizeCanvas();
            }
        }
        
        // Load remaining frames
        for (let i = priorityFrames; i < frameCount; i++) {
            loadImage(i);
        }
    }

    loadFrames();

    // Render frame function - draws actual image from bgliquid folder
    function renderFrame(index) {
        if (!images[index] || !images[index].complete) return;
        
        currentFrameIndex = index;
        const img = images[index];
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate dimensions to fill canvas while maintaining aspect ratio
        const imgRatio = img.width / img.height;
        const canvasRatio = width / height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imgRatio > canvasRatio) {
            drawHeight = height;
            drawWidth = height * imgRatio;
            offsetX = (width - drawWidth) / 2;
            offsetY = 0;
        } else {
            drawWidth = width;
            drawHeight = width / imgRatio;
            offsetX = 0;
            offsetY = (height - drawHeight) / 2;
        }
        
        // Draw the frame image
        context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeCanvas, 100);
    });
    
    // Scroll handling for frame animation - optimized version
    let scrollTimeout = null;
    let lastScrollY = window.scrollY;
    let lastFrameIndex = -1;
    
    function updateFrameOnScroll() {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(() => {
            const scrollTop = window.scrollY;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            
            // Skip if minimal scroll movement
            if (Math.abs(scrollTop - lastScrollY) < 5) {
                lastScrollY = scrollTop;
                return;
            }
            
            const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScroll));
            
            // Calculate frame index based on scroll progress
            const frameIndex = Math.min(
                frameCount - 1,
                Math.floor(scrollFraction * frameCount)
            );
            
            // Only update if frame changed
            if (frameIndex !== lastFrameIndex) {
                lastFrameIndex = frameIndex;
                requestAnimationFrame(() => renderFrame(frameIndex));
            }
            
            lastScrollY = scrollTop;
        }, isMobile ? 50 : 16);
    }
    
    // Add scroll listener with passive flag
    window.addEventListener('scroll', updateFrameOnScroll, { passive: true });
    
    // Smooth scroll for navbar with touch support
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const navHeight = isMobile ? 80 : 100;
                const offsetTop = targetSection.offsetTop - navHeight;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for card animations - optimized
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.glass-card, .skill-card, .portfolio-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Reduce animations on mobile for better performance
    if (isMobile) {
        document.querySelectorAll('.glass-card').forEach(card => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        });
    }

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        images.length = 0;
        if (scrollTimeout) clearTimeout(scrollTimeout);
        if (resizeTimeout) clearTimeout(resizeTimeout);
    });
});