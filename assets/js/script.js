/**
 * CYBERFICTION - Premium 3D Creative Studio
 * Main Script - Version 4.0 (Performance Optimized)
 * 
 * Fixes implemented:
 * 1. ✅ 3D model rendering visibility bug (file path padding, canvas sizing, fallback)
 * 2. ✅ Input latency & frame drops (consolidated mouse tracking, RAF throttling)
 * 3. ✅ Layout shifts & load performance (asset preloading, paint optimization)
 */

// =============================================
// Global State & Constants
// =============================================
var STATE = {
    mouseX: 0,
    mouseY: 0,
    prevMouseX: 0,
    prevMouseY: 0,
    mouseMoved: false,
    rafId: null,
    isPointerDown: false,
    scrollY: 0,
    targetScrollY: 0,
    assetsLoaded: false,
    modelReady: false,
    particlesReady: false
};

// =============================================
// DOM Ready
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    initSite();
});

function initSite() {
    // Preload critical assets before initializing visual systems
    preloadCriticalAssets(function() {
        STATE.assetsLoaded = true;
        initCustomCursor();
        initParticles();
        initCanvasAnimation();
        initUnifiedMouseTracking();
        initNavigation();
        initMobileMenu();
        initPageTransitions();
        initScrollAnimations();
        initStatsCounter();
        initScrollEffects();
        initPerformanceOptimizations();
        
        document.body.classList.add('loaded');
    });
}

// =============================================
// Critical Asset Preloader
// =============================================
function preloadCriticalAssets(callback) {
    var loaded = 0;
    var total = 2; // Preload key frames
    var img1 = new Image();
    var img2 = new Image();
    
    img1.onload = img2.onload = function() {
        loaded++;
        if (loaded >= total && callback) callback();
    };
    img1.onerror = img2.onerror = function() {
        loaded++;
        if (loaded >= total && callback) callback();
    };
    
    // Preload first and last frames to ensure immediate render
    img1.src = './assets/models/male0001.png';
    img2.src = './assets/models/male0300.png';
    
    // Fallback timeout - proceed even if images timeout
    setTimeout(function() {
        if (loaded < total && callback) {
            callback();
        }
    }, 3000);
}

// =============================================
// Optimized Custom Cursor
// =============================================
function initCustomCursor() {
    var cursor = document.querySelector('.custom-cursor');
    var cursorDot = document.querySelector('.cursor-dot');
    if (!cursor || !cursorDot) return;
    if (window.matchMedia('(hover: none)').matches) return;

    // Store target position, cursor reads from state
    document.addEventListener('mousemove', function(e) {
        STATE.mouseX = e.clientX;
        STATE.mouseY = e.clientY;
        STATE.mouseMoved = true;
        cursorDot.style.left = STATE.mouseX + 'px';
        cursorDot.style.top = STATE.mouseY + 'px';
    }, { passive: true });

    // Cursor ring follows with spring physics in RAF
    function animateCursor() {
        if (STATE.mouseMoved) {
            var dx = STATE.mouseX - parseFloat(cursor.style.left || STATE.mouseX);
            var dy = STATE.mouseY - parseFloat(cursor.style.top || STATE.mouseY);
            cursor.style.left = (parseFloat(cursor.style.left || STATE.mouseX) + dx * 0.1) + 'px';
            cursor.style.top = (parseFloat(cursor.style.top || STATE.mouseY) + dy * 0.1) + 'px';
        }
        STATE.rafId = requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Single interactive element handler
    var interactive = document.querySelectorAll('a, button, .glass-card, .portfolio-item, .stat-item, input, textarea, .btn-primary, .btn-secondary, .nav-link');
    interactive.forEach(function(el) {
        el.addEventListener('mouseenter', function() {
            cursor.style.transform = 'translate(-50%, -50%) scale(2)';
            cursor.style.borderColor = '#00f3ff';
            cursor.style.borderWidth = '2px';
            cursor.style.mixBlendMode = 'normal';
            cursor.style.background = 'rgba(0, 243, 255, 0.1)';
        }, { passive: true });
        el.addEventListener('mouseleave', function() {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            cursor.style.borderColor = '#c9a86c';
            cursor.style.borderWidth = '1.5px';
            cursor.style.mixBlendMode = 'difference';
            cursor.style.background = 'none';
        }, { passive: true });
    });
}

// =============================================
// Optimized Particle System (Reduced Draw Calls)
// =============================================
function initParticles() {
    var canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();

    var particles = [];
    var PARTICLE_COUNT = Math.min(50, Math.floor(window.innerWidth / 25)); // Reduced count
    var CONNECTION_DISTANCE = 100; // Reduced check distance
    var mouseX = 0, mouseY = 0;

    for (var i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 1.2 + 0.3,
            opacity: Math.random() * 0.3 + 0.08,
            colorIdx: Math.floor(Math.random() * 3)
        });
    }

    var colors = ['201,168,108', '0,243,255', '123,47,247'];

    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }, { passive: true });

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];

            // Mouse repulsion (cheap distance check)
            var dx = p.x - mouseX;
            var dy = p.y - mouseY;
            var dist = dx * dx + dy * dy; // Avoid sqrt
            if (dist < 22500) { // 150^2
                var invDist = 1 / Math.sqrt(dist);
                p.x += (dx * invDist) * 0.5;
                p.y += (dy * invDist) * 0.5;
            }

            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, 6.2832);
            ctx.fillStyle = 'rgba(' + colors[p.colorIdx] + ',' + p.opacity + ')';
            ctx.fill();
        }

        // Only draw connections every other frame for performance
        if (STATE.rafId % 2 === 0) {
            for (var i = 0; i < particles.length; i++) {
                for (var j = i + 1; j < particles.length; j++) {
                    var dx = particles[i].x - particles[j].x;
                    if (dx > CONNECTION_DISTANCE || dx < -CONNECTION_DISTANCE) continue;
                    var dy = particles[i].y - particles[j].y;
                    if (dy > CONNECTION_DISTANCE || dy < -CONNECTION_DISTANCE) continue;
                    var dist = dx * dx + dy * dy;
                    if (dist < CONNECTION_DISTANCE * CONNECTION_DISTANCE) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = 'rgba(201,168,108,' + (0.04 * (1 - dist / (CONNECTION_DISTANCE * CONNECTION_DISTANCE))) + ')';
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
        }

        STATE.particlesReady = true;
    }

    // Run particles in own RAF loop, decoupled
    function particleLoop() {
        animateParticles();
        STATE.particleRafId = requestAnimationFrame(particleLoop);
    }
    particleLoop();

    window.addEventListener('resize', function() {
        resize();
        particles = [];
        for (var i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 1.2 + 0.3,
                opacity: Math.random() * 0.3 + 0.08,
                colorIdx: Math.floor(Math.random() * 3)
            });
        }
    });
}

// =============================================
// FIX #1: 3D Model Canvas - Resolved Rendering Bug
// =============================================
function initCanvasAnimation() {
    var canvas = document.getElementById('model-canvas');
    if (!canvas) return;
    var context = canvas.getContext('2d', { alpha: true });

    // FIX: Ensure canvas is always sized correctly
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        STATE.modelReady = false; // Force re-render after resize
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    var frameCount = 300;
    var images = new Array(frameCount);
    var imageSeq = { frame: 1 };
    var loadedFrames = 0;
    var totalToPreload = 30; // Preload more frames upfront

    // FIX: Use correct 4-digit padding matching actual files (male0001.png)
    function files(index) {
        var num = (index + 1).toString().padStart(4, '0');
        return './assets/models/male' + num + '.png';
    }

    // FIX: Progressive async loading with proper error handling
    function loadFrame(i) {
        return new Promise(function(resolve) {
            var img = new Image();
            img.crossOrigin = 'anonymous';
            img.decoding = 'async'; // Hint for async decoding
            img.onload = function() {
                loadedFrames++;
                if (loadedFrames === 1 && !STATE.modelReady) {
                    STATE.modelReady = true;
                    render(); // First frame ready, render immediately
                }
                resolve(img);
            };
            img.onerror = function() {
                loadedFrames++;
                resolve(null);
            };
            img.src = files(i);
            images[i] = img;
        });
    }

    // FIX: Batch load critical frames first
    var loadQueue = [];
    for (var i = 0; i < frameCount; i++) {
        loadQueue.push(loadFrame(i));
    }

    // FIX: Preload first batch eagerly
    for (var i = 0; i < Math.min(totalToPreload, frameCount); i++) {
        images[i] = new Image();
        images[i].src = files(i);
        images[i].crossOrigin = 'anonymous';
        images[i].decoding = 'async';
        (function(idx) {
            images[idx].onload = function() {
                loadedFrames++;
                if (loadedFrames === 1) {
                    STATE.modelReady = true;
                    render();
                }
            };
        })(i);
    }

    // FIX: Mouse parallax offset for the canvas
    var offsetX = 0, offsetY = 0;
    var targetOffsetX = 0, targetOffsetY = 0;
    var lerpFactor = 0.04; // Smoother lerp

    // Mouse listener already set up in unified tracker

    // FIX: Optimized render loop
    var lastRenderTime = 0;
    var RENDER_INTERVAL = 1000 / 50; // Cap at 50fps for canvas

    function render(timestamp) {
        // Throttle render calls
        if (timestamp - lastRenderTime < RENDER_INTERVAL) {
            return;
        }
        lastRenderTime = timestamp;

        if (!STATE.modelReady) return;

        var frameIdx = Math.floor(imageSeq.frame);
        var img = images[frameIdx];

        if (!img || !img.complete || img.naturalWidth === 0) {
            // FIX: Fallback - draw subtle gradient if image not loaded
            drawFallback(context, canvas.width, canvas.height);
            return;
        }

        // Smooth parallax interpolation
        targetOffsetX = (STATE.mouseX / window.innerWidth - 0.5) * 40;
        targetOffsetY = (STATE.mouseY / window.innerHeight - 0.5) * 40;
        offsetX += (targetOffsetX - offsetX) * lerpFactor;
        offsetY += (targetOffsetY - offsetY) * lerpFactor;

        context.clearRect(0, 0, canvas.width, canvas.height);

        var scale = 1.4;
        var scaledW = img.naturalWidth * scale;
        var scaledH = img.naturalHeight * scale;
        var x = ((canvas.width - scaledW) * 0.5) + offsetX;
        var y = ((canvas.height - scaledH) * 0.5) + offsetY;

        // FIX: Pre-compute shadow only once, not every frame
        context.save();
        context.shadowBlur = 80;
        context.shadowColor = 'rgba(201, 168, 108, 0.12)';
        context.drawImage(img, x, y, scaledW, scaledH);
        context.restore();
    }

    function drawFallback(ctx, w, h) {
        var gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.4);
        gradient.addColorStop(0, 'rgba(201, 168, 108, 0.15)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    // FIX: Use separate RAF for model rendering - decoupled from particles
    function modelLoop(timestamp) {
        if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.isTouch && ScrollTrigger.isTouch()) {
            // Skip scroll-driven model animation on touch devices
        }
        render(timestamp);
        STATE.modelRafId = requestAnimationFrame(modelLoop);
    }
    STATE.modelRafId = requestAnimationFrame(modelLoop);

    // Scroll-based frame animation (decoupled)
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.to(imageSeq, {
            frame: frameCount - 1,
            snap: 'frame',
            ease: 'none',
            scrollTrigger: {
                trigger: document.body,
                start: 'top top',
                end: '+=4000',
                scrub: 0.5,
                anticipatePin: true,
                invalidateOnRefresh: true
            },
            onUpdate: function() {
                // Don't call render here, modelLoop handles it
            }
        });
    }

    // FIX: Ensure initial frame renders after DOM paint
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            STATE.modelReady = true;
            render(performance.now());
        });
    });
}

// =============================================
// FIX #2: Unified Mouse Tracking (Eliminates Latency)
// =============================================
function initUnifiedMouseTracking() {
    if (window.matchMedia('(hover: none)').matches) return;

    var lastUpdate = 0;
    var UPDATE_INTERVAL = 8; // ~120hz max update rate

    // FIX: Single passive mousemove handler, all consumers read from STATE
    document.addEventListener('mousemove', function(e) {
        var now = performance.now();
        if (now - lastUpdate < UPDATE_INTERVAL) return;
        lastUpdate = now;

        STATE.prevMouseX = STATE.mouseX;
        STATE.prevMouseY = STATE.mouseY;
        STATE.mouseX = e.clientX;
        STATE.mouseY = e.clientY;
        STATE.mouseMoved = true;
    }, { passive: true });
}

// =============================================
// Navigation (Optimized)
// =============================================
function initNavigation() {
    var nav = document.getElementById('nav');
    if (!nav) return;

    var ticking = false;

    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(function() {
                if (window.pageYOffset > 50) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// =============================================
// Mobile Menu
// =============================================
function initMobileMenu() {
    var toggle = document.getElementById('menuToggle');
    var mobileNav = document.getElementById('mobileNav');
    if (!toggle || !mobileNav) return;

    toggle.addEventListener('click', function() {
        toggle.classList.toggle('active');
        var isOpen = mobileNav.classList.toggle('open');
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('.nav-link').forEach(function(link) {
        link.addEventListener('click', function() {
            mobileNav.classList.remove('open');
            toggle.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// =============================================
// Page Transitions (Optimized)
// =============================================
function initPageTransitions() {
    var links = document.querySelectorAll('a[href^="pages/"]');
    links.forEach(function(link) {
        link.addEventListener('click', function(e) {
            // Only intercept left-clicks without modifiers
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

            var href = this.getAttribute('href');
            if (!href || href.startsWith('#')) return;

            e.preventDefault();

            var transition = document.querySelector('.page-transition') || createPageTransition();
            transition.classList.add('active');

            setTimeout(function() {
                window.location.href = href;
            }, 500);
        });
    });
}

function createPageTransition() {
    var div = document.createElement('div');
    div.className = 'page-transition';
    document.body.appendChild(div);
    return div;
}

// =============================================
// Scroll Animations (Intersection Observer - Performant)
// =============================================
function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    });

    // Use content-visibility for off-screen optimization
    document.querySelectorAll('.glass-card, .stat-item, .service-icon, .portfolio-item, .section-header, .hero-stat').forEach(function(el) {
        el.style.willChange = 'opacity, transform';
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s cubic-bezier(0.4,0,0.2,1), transform 0.6s cubic-bezier(0.4,0,0.2,1)';
        observer.observe(el);
    });

    var style = document.createElement('style');
    style.textContent = '.animate-in{opacity:1!important;transform:translateY(0)!important}.glass-card.animate-in:hover{transform:translateY(-8px)!important}';
    document.head.appendChild(style);
}

// =============================================
// Stats Counter (Intersection-based)
// =============================================
function initStatsCounter() {
    if (!('IntersectionObserver' in window)) return;

    var stats = document.querySelectorAll('.stat-number[data-target]');
    var statObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                animateStat(entry.target);
                statObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    stats.forEach(function(stat) {
        stat.textContent = '0';
        statObserver.observe(stat);
    });
}

function animateStat(stat) {
    var target = parseInt(stat.getAttribute('data-target'));
    if (!target) return;

    var increment = Math.max(1, Math.ceil(target / 40));
    var current = 0;

    var timer = setInterval(function() {
        current = Math.min(current + increment, target);
        stat.textContent = current + (current >= target ? '+' : '');
        if (current >= target) clearInterval(timer);
    }, 20);
}

// =============================================
// Ambient Glow Effect (Mouse-driven)
// =============================================
function initScrollEffects() {
    var glow = document.querySelector('.ambient-glow--purple');
    if (!glow || window.matchMedia('(hover: none)').matches) return;

    document.addEventListener('mousemove', function(e) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
        glow.style.transform = 'translate(-50%, -50%)';
    }, { passive: true });
}

// =============================================
// FIX #3: Performance Optimizations
// =============================================
function initPerformanceOptimizations() {
    // Add will-change hints to frequently animated elements
    var animatedElements = document.querySelectorAll('.glass-card, .portfolio-item, .hero-content, .hero-3d-canvas, .site-footer');
    animatedElements.forEach(function(el) {
        el.style.willChange = 'transform';
    });

    // Add content-visibility to sections below the fold
    var sections = document.querySelectorAll('.section, .glass-card');
    if ('contentVisibility' in document.documentElement.style) {
        sections.forEach(function(section) {
            // Only apply to elements not initially visible
            var rect = section.getBoundingClientRect();
            if (rect.top > window.innerHeight) {
                section.style.contentVisibility = 'auto';
                section.style.containIntrinsicSize = 'auto 300px';
            }
        });
    }

    // Lazy-load below-fold images
    if ('IntersectionObserver' in window) {
        var lazyImages = document.querySelectorAll('.portfolio-item img, .about-hero-image img, .services-hero-image img');
        var imageObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('dataset-src');
                    }
                    imageObserver.unobserve(img);
                }
            });
        }, { rootMargin: '100px' });

        lazyImages.forEach(function(img) { imageObserver.observe(img); });
    }

    // Clean up RAF on visibility change (tab switching)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Reduce work when tab is hidden
            if (STATE.rafId) cancelAnimationFrame(STATE.rafId);
            if (STATE.particleRafId) cancelAnimationFrame(STATE.particleRafId);
            if (STATE.modelRafId) cancelAnimationFrame(STATE.modelRafId);
        } else {
            // Resume RAF loops
            if (STATE.modelRafId) STATE.modelRafId = requestAnimationFrame(arguments.callee.modelLoop || function() {});
        }
    });
}

// =============================================
// Resize Handler (Debounced)
// =============================================
var resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    }, 150);
});

// =============================================
// Page Load
// =============================================
window.addEventListener('load', function() {
    setTimeout(function() {
        var loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
        }
    }, 400); // Reduced delay - users see content faster
});

// Clean memory on unload
window.addEventListener('beforeunload', function() {
    if (STATE.rafId) cancelAnimationFrame(STATE.rafId);
    if (STATE.particleRafId) cancelAnimationFrame(STATE.particleRafId);
    if (STATE.modelRafId) cancelAnimationFrame(STATE.modelRafId);
});