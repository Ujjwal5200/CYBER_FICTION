/**
 * CYBERFICTION - Premium 3D Creative Studio
 * Main Script - Version 5.0 (3D Model Hero Centerpiece)
 * 
 * 3D Model: 300-frame PNG sequence (male0001.png - male0300.png)
 * Location: assets/models/
 * Renders on: #hero-model-canvas (hero centerpiece)
 * Background canvas: #model-canvas (ambient glow)
 */

var STATE = {
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,
    heroModelReady: false,
    heroImagesLoaded: 0,
    bgModelReady: false,
    bgImagesLoaded: 0,
    totalFrames: 300,
    heroCurrentFrame: 1,
    bgCurrentFrame: 1,
    heroRafId: null
};

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
     dismissLoader();
     initAll();
});

function dismissLoader() {
     var loader = document.getElementById('loader');
     if (!loader) return;
     // Wait a brief moment so the loader is visible, then fade out
     setTimeout(function() {
         loader.classList.add('hidden');
         // Remove from DOM after transition completes
         setTimeout(function() {
             if (loader.parentNode) loader.parentNode.removeChild(loader);
         }, 700);
     }, 400);
 }

function initAll() {
     try { if (document.querySelector('.custom-cursor')) initCursor(); } catch(e) { console.error('Cursor init error:', e); }
     try { initHeroModel(); } catch(e) { console.error('Hero model init error:', e); }
     try { initParticles(); } catch(e) { console.error('Particles init error:', e); }
     try { initNav(); } catch(e) { console.error('Nav init error:', e); }
     try { initMobileMenu(); } catch(e) { console.error('Mobile menu init error:', e); }
     try { initStats(); } catch(e) { console.error('Stats init error:', e); }
     try { initScrollReveal(); } catch(e) { console.error('Scroll reveal init error:', e); }
 }

// ==========================================
// CURSOR
// ==========================================
function initCursor() {
    if (window.matchMedia('(hover: none)').matches) return;
    document.addEventListener('mousemove', function(e) {
        var d = document.querySelector('.cursor-dot');
        var c = document.querySelector('.custom-cursor');
        if (d) { d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; }
        if (c) { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }
    }, { passive: true });
}

// ==========================================
// DETECT PATH PREFIX FOR 3D MODEL FILES
// ==========================================
function getModelPrefix() {
     var path = window.location.pathname;
     // If we're in /pages/ directory, go up one level
     if (path.indexOf('/pages/') !== -1) {
         return '../assets/models/';
     }
     return 'assets/models/';
 }

function isFileProtocol() {
     return window.location.protocol === 'file:';
 }

// ==========================================
// 3D HERO MODEL (CENTERPIECE)
// ==========================================
function initHeroModel() {
     var canvas = document.getElementById('hero-model-canvas');
     if (!canvas) { console.log('hero-model-canvas not found, trying model-canvas'); canvas = document.getElementById('model-canvas'); }
     if (!canvas) { console.warn('No model canvas found'); return; }

     var ctx = canvas.getContext('2d');
     var prefix = getModelPrefix();
     console.log('3D Model prefix:', prefix);

     // If running on file:// protocol, images will be blocked by CORS.
     // Draw an animated wireframe placeholder instead.
     if (isFileProtocol()) {
         console.warn('3D Hero Model: file:// protocol detected, using placeholder animation');
         drawPlaceholderAnimation(canvas, ctx);
         return;
     }

     // SIZE canvas to fill parent .hero-model-wrap
     function sizeCanvas() {
         var wrap = canvas.parentElement;
         if (wrap && wrap.classList && wrap.classList.contains('hero-model-wrap')) {
             canvas.width = wrap.offsetWidth;
             canvas.height = wrap.offsetHeight;
         } else {
             canvas.width = canvas.offsetWidth || window.innerWidth;
             canvas.height = canvas.offsetHeight || window.innerHeight;
         }
     }
     sizeCanvas();
     window.addEventListener('resize', sizeCanvas);

     // Create image array
     var images = [];
     var loaded = 0;
     var initialBatch = 20;

     for (var i = 0; i < STATE.totalFrames; i++) {
         images[i] = new Image();
         images[i].crossOrigin = 'anonymous';
     }

     // Load initial batch
     for (var i = 0; i < initialBatch; i++) {
         (function(idx) {
             images[idx].onload = function() {
                 loaded++;
                 if (loaded === 1) {
                     STATE.heroModelReady = true;
                     console.log('3D Hero Model: first frame loaded from ' + images[idx].src);
                     renderHero();
                 }
                 if (loaded === initialBatch) {
                     console.log('3D Hero Model: initial batch loaded (' + loaded + '/' + STATE.totalFrames + ')');
                 }
             };
             images[idx].onerror = function() {
                 loaded++;
                 console.warn('3D Hero Model: failed to load ' + images[idx].src);
             };
         })(i);
         var num = (i + 1).toString().padStart(4, '0');
         images[i].src = prefix + 'male' + num + '.png';
     }

     // Load next batch
     setTimeout(function() {
         for (var i = initialBatch; i < initialBatch * 4 && i < STATE.totalFrames; i++) {
             if (!images[i].src) {
                 images[i].src = prefix + 'male' + (i + 1).toString().padStart(4, '0') + '.png';
             }
         }
     }, 200);

     // Load remaining
     setTimeout(function() {
         for (var i = initialBatch * 4; i < STATE.totalFrames; i++) {
             if (!images[i].src) {
                 images[i].src = prefix + 'male' + (i + 1).toString().padStart(4, '0') + '.png';
             }
         }
     }, 600);

    // RENDER LOOP
    var lastTime = 0;

    function renderHero() {
        requestAnimationFrame(renderHero);

        var now = performance.now();
        if (now - lastTime < 20) return; // ~50fps cap
        lastTime = now;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Subtle radial glow background
        var grd = ctx.createRadialGradient(
            canvas.width * 0.5, canvas.height * 0.5, 0,
            canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.55
        );
        grd.addColorStop(0, 'rgba(201,168,108,0.06)');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw model frame
        if (STATE.heroModelReady && images[Math.floor(STATE.heroCurrentFrame)]) {
            var img = images[Math.floor(STATE.heroCurrentFrame)];
            if (img.complete && img.naturalWidth > 0) {
                var sw = img.naturalWidth, sh = img.naturalHeight;
                var aspect = sh / sw;
                var fitW = canvas.width * 0.85;
                var fitH = fitW * aspect;
                if (fitH > canvas.height * 0.9) {
                    fitH = canvas.height * 0.9;
                    fitW = fitH / aspect;
                }
                var x = (canvas.width - fitW) / 2;
                var y = (canvas.height - fitH) / 2;

                // Mouse parallax offset
                var px = (STATE.mouseX / window.innerWidth - 0.5) * 15;
                var py = (STATE.mouseY / window.innerHeight - 0.5) * 15;

                ctx.save();
                ctx.shadowBlur = 100;
                ctx.shadowColor = 'rgba(201,168,108,0.25)';
                ctx.drawImage(img, x + px, y + py, fitW, fitH);
                ctx.restore();
            }
        }

        // Auto-rotate through frames slowly (idle animation)
        STATE.heroCurrentFrame += 0.3;
        if (STATE.heroCurrentFrame >= STATE.totalFrames - 1) STATE.heroCurrentFrame = 1;
    }

    // Scroll-driven frame selection
    function onScroll() {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var docH = document.documentElement.scrollHeight - window.innerHeight;
        if (docH > 0) {
            var progress = scrollTop / docH;
            STATE.heroCurrentFrame = 1 + progress * (STATE.totalFrames - 2);
        }
    }

    var scrollTicking = false;
    window.addEventListener('scroll', function() {
        if (!scrollTicking) {
            requestAnimationFrame(function() { onScroll(); scrollTicking = false; });
            scrollTicking = true;
        }
    }, { passive: true });
}

// ==========================================
// PLACEHOLDER ANIMATION (file:// fallback)
// ==========================================
function drawPlaceholderAnimation(canvas, ctx) {
     var frame = 0;
     var cx = canvas.width / 2;
     var cy = canvas.height / 2;
     var baseRadius = Math.min(canvas.width, canvas.height) * 0.25;

     function draw() {
         requestAnimationFrame(draw);
         frame += 0.02;

         ctx.clearRect(0, 0, canvas.width, canvas.height);

         // Radial glow
         var grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 2.5);
         grd.addColorStop(0, 'rgba(201,168,108,0.08)');
         grd.addColorStop(1, 'transparent');
         ctx.fillStyle = grd;
         ctx.fillRect(0, 0, canvas.width, canvas.height);

         // Animated wireframe figure
         var segments = 12;
         for (var i = 0; i < segments; i++) {
             var angle = frame + (i / segments) * Math.PI * 2;
             var r1 = baseRadius * (0.6 + 0.2 * Math.sin(frame * 2 + i * 0.5));
             var r2 = baseRadius * (1.4 + 0.15 * Math.cos(frame * 1.5 + i * 0.3));

             var x1 = cx + Math.cos(angle) * r1;
             var y1 = cy + Math.sin(angle) * r1 * 0.6;
             var x2 = cx + Math.cos(angle) * r2;
             var y2 = cy + Math.sin(angle) * r2 * 0.6;

             ctx.beginPath();
             ctx.moveTo(x1, y1);
             ctx.lineTo(x2, y2);
             ctx.strokeStyle = 'rgba(201,168,108,' + (0.3 + 0.2 * Math.sin(frame * 3 + i)) + ')';
             ctx.lineWidth = 1.5;
             ctx.stroke();

             // Orbital rings
             var ringR = baseRadius * (0.8 + 0.3 * Math.sin(frame + i * 0.7));
             ctx.beginPath();
             ctx.arc(cx, cy, ringR, angle - 0.15, angle + 0.15);
             ctx.strokeStyle = 'rgba(201,168,108,' + (0.15 + 0.1 * Math.cos(frame * 2 + i)) + ')';
             ctx.lineWidth = 1;
             ctx.stroke();
         }

         // Center dot
         var pulse = 0.5 + 0.5 * Math.sin(frame * 4);
         ctx.beginPath();
         ctx.arc(cx, cy, 4 + pulse * 3, 0, Math.PI * 2);
         ctx.fillStyle = 'rgba(201,168,108,' + (0.5 + pulse * 0.5) + ')';
         ctx.fill();

         // Subtle text label
         ctx.font = '14px Inter, sans-serif';
         ctx.fillStyle = 'rgba(201,168,108,0.4)';
         ctx.textAlign = 'center';
         ctx.fillText('3D Model Loading...', cx, cy + baseRadius + 30);
     }
     draw();
 }

// ==========================================
// PARTICLE SYSTEM
// ==========================================
function initParticles() {
    var canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    var particles = [];
    var count = Math.min(50, Math.floor(window.innerWidth / 25));

    for (var i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            size: Math.random() * 1.2 + 0.3,
            alpha: Math.random() * 0.3 + 0.05
        });
    }

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    document.addEventListener('mousemove', function(e) { mx = e.clientX; my = e.clientY; }, { passive: true });

    (function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var dx = p.x - mx, dy = p.y - my;
            var d2 = dx * dx + dy * dy;
            if (d2 < 25000) { var inv = 1 / Math.sqrt(d2); p.x += dx * inv * 0.3; p.y += dy * inv * 0.3; }
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, 6.2832);
            ctx.fillStyle = 'rgba(200,200,220,' + p.alpha + ')';
            ctx.fill();
        }

        // Connections every other frame
        if (STATE.heroRafId % 2 === 0) {
            for (var i = 0; i < particles.length; i++) {
                for (var j = i + 1; j < particles.length; j++) {
                    var dx = particles[i].x - particles[j].x;
                    if (dx > 100 || dx < -100) continue;
                    var dy = particles[i].y - particles[j].y;
                    if (dy > 100 || dy < -100) continue;
                    var d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 100) {
                        ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = 'rgba(201,168,108,' + (0.04 * (1 - d / 100)) + ')';
                        ctx.lineWidth = 0.5; ctx.stroke();
                    }
                }
            }
        }

        requestAnimationFrame(loop);
    })();
}

// ==========================================
// NAVIGATION
// ==========================================
function initNav() {
    window.addEventListener('scroll', function() {
        var nav = document.getElementById('nav');
        if (!nav) return;
        if (window.pageYOffset > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    }, { passive: true });
}

// ==========================================
// MOBILE MENU
// ==========================================
function initMobileMenu() {
    var toggle = document.getElementById('menuToggle');
    var nav = document.getElementById('mobileNav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function() {
        toggle.classList.toggle('active');
        var open = nav.classList.toggle('open');
        document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.querySelectorAll('.nav-link').forEach(function(a) {
        a.addEventListener('click', function() { nav.classList.remove('open'); toggle.classList.remove('active'); document.body.style.overflow = ''; });
    });
}

// ==========================================
// STATS COUNTER
// ==========================================
function initStats() {
     if (!('IntersectionObserver' in window)) return;
     var statNumbers = document.querySelectorAll('.stat-number[data-target]');
     statNumbers.forEach(function(el) {
         new IntersectionObserver(function(entries) {
             entries.forEach(function(e) {
                 if (e.isIntersecting) {
                     var t = parseInt(e.target.getAttribute('data-target'));
                     if (!t) return;
                     var inc = Math.max(1, Math.ceil(t / 50));
                     var cur = 0;
                     var timer = setInterval(function() {
                         cur = Math.min(cur + inc, t);
                         e.target.textContent = cur + '+';
                         if (cur >= t) clearInterval(timer);
                     }, 20);
                     this.unobserve(e.target);
                 }
             }.bind(this));
         }).observe(el);
     });
 }

// ==========================================
// SCROLL REVEAL
// ==========================================
function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
            if (e.isIntersecting) { e.target.classList.add('animate-in'); this.unobserve(e.target); }
        }.bind(this));
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    // Observe all elements that should animate in
    document.querySelectorAll('.glass-card, .stat-item, .section-header, .portfolio-item, .hero-stat').forEach(function(el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        // Use individual observer
        new IntersectionObserver(function(entries) {
            entries.forEach(function(e) {
                if (e.isIntersecting) {
                    e.target.classList.add('animate-in');
                    this.unobserve(e.target);
                }
            }.bind(this));
        }.bind({})).observe(el);
    });
}

// Cleanup
window.addEventListener('beforeunload', function() {
    if (STATE.heroRafId) cancelAnimationFrame(STATE.heroRafId);
});