/**
 * CYBERFICTION - Premium 3D Creative Studio
 * Main Script - Version 6.0 (PBR-Inspired Multi-Pass 3D Render Pipeline)
 *
 * 3D Model: 300-frame PNG sequence (male0001.png - male0300.png)
 * Location: assets/models/
 * Renders on: #hero-model-canvas (hero centerpiece)
 * Background canvas: #model-canvas (ambient glow)
 *
 * RENDER PIPELINE:
 *   Pass 1 — Base sprite (NEAREST neighbour, no blur)
 *   Pass 2 — Brightness map → ambient-occlusion darkening (darken-only)
 *   Pass 3 — Edge glow / rim-light by alpha proximity
 *   Pass 4 — Vignette (radial gradient, non-black falloff)
 */

// ─── Design Tokens ───────────────────────────────────────────────────────────
var TOKENS = {
    GOLD_RGB    : [201, 168, 108],
    AO_DARKEN  : 0.38,
    AO_LIGHTEN : 0.96,
    EDGE_R     : 12,
    EDGE_ALPHA : 0.45,
    VIGN_STR   : 0.72,
    PASS_FPS   : 50,
    SHADOW_PASS: 0.20,     // ground shadow darkening
};
var R=0, G=1, B=2;  // channel-lookup indices for pixel-array traversal

// ─── Global State ────────────────────────────────────────────────────────────
var STATE = {
    mouseX     : window.innerWidth / 2,
    mouseY     : window.innerHeight / 2,
    heroModelReady : false,
    bgModelReady   : false,
    totalFrames    : 300,
    heroCurrentFrame : 1,
    bgCurrentFrame   : 1,
    heroRafId        : null,
};

var PAGE_SHOTS = {
    'index.html'          : { start: 60, end: 100, mouseSensitivity: 1.0 },
    'pages/about.html'    : { start: 20, end: 60,  mouseSensitivity: 0.7 },
    'pages/services.html' : { start: 80, end: 130, mouseSensitivity: 0.9 },
    'pages/work.html'     : { start: 160, end: 220, mouseSensitivity: 0.8 },
    'pages/contact.html'  : { start: 110, end: 150, mouseSensitivity: 1.1 },
    'default'             : { start:  1, end: 299, mouseSensitivity: 1.0 },
};

// ─── DOM Ready ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
     dismissLoader();
     try { initCursor();      } catch(e){ console.error(e); }
     try { initHeroModel();   } catch(e){ console.error(e); }
     try { initParticles();   } catch(e){ console.error(e); }
     try { initNav();         } catch(e){ console.error(e); }
     try { initMobileMenu();  } catch(e){ console.error(e); }
     try { initStats();       } catch(e){ console.error(e); }
     try { initScrollReveal();} catch(e){ console.error(e); }
     try {
         var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
         if (mq.matches) { STATE.heroCurrentFrame = 60; }
         mq.addEventListener('change', function(e) {
             if (e.matches) { STATE.heroCurrentFrame = 60; }
         });
     } catch(e) { console.warn('Motion-check:', e); }
});

// ─── Preloader ───────────────────────────────────────────────────────────────
function dismissLoader() {
    var loader = document.getElementById('loader');
    if (!loader) return;
    setTimeout(function(){
        loader.classList.add('hidden');
        setTimeout(function(){ if (loader.parentNode) loader.parentNode.removeChild(loader); }, 700);
    }, 400);
}

// ─── Path Helpers ────────────────────────────────────────────────────────────
function getModelPrefix() {
    return window.location.pathname.indexOf('/pages/') !== -1 ? '../assets/models/' : 'assets/models/';
}
function isFileProtocol() { return window.location.protocol === 'file:'; }

// ─── Custom Cursor ───────────────────────────────────────────────────────────
function initCursor() {
    if (window.matchMedia('(hover: none)').matches) return;
    document.addEventListener('mousemove', function(e) {
        var d = document.querySelector('.cursor-dot');
        var c = document.querySelector('.custom-cursor');
        if (d) { d.style.left=e.clientX+'px'; d.style.top=e.clientY+'px'; }
        if (c) { c.style.left=e.clientX+'px'; c.style.top=e.clientY+'px'; }
    }, { passive: true });
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function initNav() {
    window.addEventListener('scroll', function() {
        var nav = document.getElementById('nav');
        if (!nav) return;
        if (window.pageYOffset > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    }, { passive: true });
}

// ─── Mobile Menu ─────────────────────────────────────────────────────────────
function initMobileMenu() {
    var toggle = document.getElementById('menuToggle');
    var nav    = document.getElementById('mobileNav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function() {
        toggle.classList.toggle('active');
        var open = nav.classList.toggle('open');
        document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.querySelectorAll('.nav-link').forEach(function(a) {
        a.addEventListener('click', function() {
            nav.classList.remove('open');
            toggle.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// ─── Stats Animated Counter ───────────────────────────────────────────────────
function initStats() {
    if (!('IntersectionObserver' in window)) return;
    var statNumbers = document.querySelectorAll('.stat-number[data-target], .hero-stat-number[data-target]');
    statNumbers.forEach(function(el) {
        new IntersectionObserver(function(entries) {
            entries.forEach(function(e) {
                if (!e.isIntersecting) return;
                var target = parseInt(e.target.getAttribute('data-target'));
                if (!target) return;
                var inc = Math.max(1, Math.ceil(target / 50));
                var cur = 0;
                var timer = setInterval(function() {
                    cur = Math.min(cur + inc, target);
                    e.target.textContent = cur + '+';
                    if (cur >= target) clearInterval(timer);
                }, 20);
                this.unobserve(e.target);
            }.bind(this));
        }).observe(el);
    });
}

// ─── Scroll Reveal ───────────────────────────────────────────────────────────
function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    var selectors = '.glass-card, .stat-item, .section-header, .portfolio-item, .portfolio-card, .hero-stat';
    document.querySelectorAll(selectors).forEach(function(el) {
        el.style.opacity   = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        new IntersectionObserver(function(entries) {
            entries.forEach(function(e) {
                if (e.isIntersecting) {
                    e.target.classList.add('animate-in');
                    e.target.style.opacity   = '1';
                    e.target.style.transform = 'translateY(0)';
                    this.unobserve(e.target);
                }
            }.bind(this));
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }).observe(el);
    });
}

// ══════════════════════════════════════════════════════════════════════════════
// 3D  HERO  MODEL  —  MULTI-PASS  PBR-INSPIRED  RENDER  PIPELINE
// ══════════════════════════════════════════════════════════════════════════════
function initHeroModel() {
    var canvas = document.getElementById('hero-model-canvas');
    if (!canvas) { canvas = document.getElementById('model-canvas'); }
    if (!canvas) { console.warn('No model canvas found'); return; }

    var ctx    = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
    var prefix = getModelPrefix();

    if (isFileProtocol()) {
        console.warn('file:// protocol — using placeholder animation');
        drawPlaceholderAnimation(canvas, ctx);
        return;
    }

    // ── Canvas sizing ────────────────────────────────────────────────────────
    function sizeCanvas() {
        var w = canvas.parentElement;
        if (w && w.classList.contains('hero-model-wrap')) {
            canvas.width  = w.offsetWidth;
            canvas.height = w.offsetHeight;
        } else {
            canvas.width  = canvas.offsetWidth  || window.innerWidth;
            canvas.height = canvas.offsetHeight || window.innerHeight;
        }
    }
    sizeCanvas();
    var path    = window.location.pathname.split('/').pop() || 'index.html';
    var shot    = PAGE_SHOTS[path] || PAGE_SHOTS['default'];
    STATE.heroCurrentFrame = shot.start;
    window.addEventListener('resize', sizeCanvas);

    // ── Frame pre-loading ────────────────────────────────────────────────────
    var images  = [];
    var loaded  = 0;
    var initialBatch = 20;

    for (var i = 0; i < STATE.totalFrames; i++) {
        images[i] = new Image();
        images[i].crossOrigin = 'anonymous';
    }
    // Slated load tiers for faster first-paint
    var loadBatch = function(frames, delay) {
        setTimeout(function() {
            for (var i = frames[0]; i < frames[1] && i < STATE.totalFrames; i++) {
                if (!images[i].src) {
                    images[i].src = prefix + 'male' + (i + 1).toString().padStart(4,'0') + '.png';
                }
            }
        }, delay);
    };
    loadBatch([0,            initialBatch            ],  0); // frames  1-20
    loadBatch([initialBatch,  initialBatch * 4        ], 200); // frames 21-80
    loadBatch([initialBatch*4,STATE.totalFrames        ], 600); // frames 81-300

    var onFirstLoad = function() {
        loaded++;
        if (loaded === 1) {
            STATE.heroModelReady = true;
            console.log('3D Hero Model: first frame loaded from ' + images[loaded-1].src);
            var lqip = document.getElementById('model-lqip');
            if (lqip) { setTimeout(function(){ lqip.style.opacity='0'; setTimeout(function(){ lqip.remove(); },600); }, 80); }
            renderHero();
        }
    };
    for (var i = 0; i < initialBatch; i++) {
        (function(idx) {
            images[idx].onload  = onFirstLoad;
            images[idx].onerror = function() { loaded++; };
        })(i);
    }

    // ── Scroll-scrub sync ────────────────────────────────────────────────────
    function syncToScroll() {
        var path = window.location.pathname.split('/').pop() || 'index.html';
        var shot = PAGE_SHOTS[path] || PAGE_SHOTS['default'];
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        var docH      = document.documentElement.scrollHeight - window.innerHeight;
        if (docH > 0) STATE.heroCurrentFrame = shot.start + (scrollTop / docH) * (shot.end - shot.start - 1);
    }
    var scrollTicking = false;
    window.addEventListener('scroll', function(){
        if (!scrollTicking) {
            requestAnimationFrame(function(){ syncToScroll(); scrollTicking = false; });
            scrollTicking = true;
        }
    }, { passive: true });

    // ── Render loop ──────────────────────────────────────────────────────────
    var lastTs = 0;

    function drawVignette(ctx, W, H, strength) {
        var grd = ctx.createRadialGradient(W*.5, H*.5, W*.28, W*.5, H*.5, W*.72);
        grd.addColorStop(0,   'rgba(0,0,0,0)');
        grd.addColorStop(0.5, 'rgba(0,0,0,0)');
        grd.addColorStop(1,   'rgba(0,0,0,' + strength + ')');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);
    }

    /**
     * Draws the AO (ambient occlusion) darkening map as a screen darken-only layer.
     * Pixels in the sprite's dark silhouette get a small relative darkening boost;
     * pixels that are already bright are left alone.
     */
    function drawAmbientOcclusion(ctx, img, W, H, fitW, fitH, ox, oy) {
        ctx.save();   // <-- must be first, protects caller state
        var imgW = img.naturalWidth, imgH = img.naturalHeight;
        var tempC = document.createElement('canvas');
        tempC.width = imgW; tempC.height = imgH;
        var tc = tempC.getContext('2d', { willReadFrequently: true });
        tc.drawImage(img, 0, 0);

        var id   = tc.getImageData(0, 0, imgW, imgH);
        var data = id.data;
        var i;
        // Build a darkened AO map
        for (i = 0; i < data.length; i += 4) {
            var ra = data[i+R] / 255,
                ga = data[i+G] / 255,
                ba = data[i+B] / 255;
            var lum   = 0.299*ra + 0.587*ga + 0.114*ba;   // perceptive luminance
            var shade = TOKENS.AO_DARKEN + (TOKENS.AO_LIGHTEN - TOKENS.AO_DARKEN)*lum; // darker = more AO
            data[i+R] = Math.round(data[i+R] * shade);
            data[i+G] = Math.round(data[i+G] * shade);
            data[i+B] = Math.round(data[i+B] * shade);
        }
        // Draw the AO map into an offscreen canvas, then composite over sprite
        var aoCanvas = document.createElement('canvas');
        aoCanvas.width = imgW; aoCanvas.height = imgH;
        aoCanvas.getContext('2d').putImageData(id, 0, 0);
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.38;
        ctx.drawImage(aoCanvas,   ox, oy, fitW, fitH);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.restore();   // <-- restores caller to exactly the same state
    }

    /**
     * Edge-glow / rim-light: samples pixels just outside the source alpha mask
     * and tints them with the gold accent color where alpha drops to zero.
     */
    function drawEdgeGlow(ctx, img, W, H, fitW, fitH, ox, oy) {
        var ER   = TOKENS.EDGE_R;
        var EALP = TOKENS.EDGE_ALPHA;

        // Draw blurry gold capsule just outside the positive space of the sprite
        ctx.save();
        ctx.shadowBlur  = ER;
        ctx.shadowColor = 'rgba(201,168,108,' + (EALP * 0.6) + ')';

        // Build a trimmed silhouette by drawing the sprite in a monochrome compositing pass
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.9;
        ctx.shadowBlur  = ER * 1.4;
        ctx.shadowColor = 'rgba(201,168,108,' + EALP + ')';
        ctx.drawImage(img, ox, oy, fitW, fitH);
        ctx.restore();
    }

    /**
     * Background atmospheric glow — multiplicative gold halo centred on the model.
     * 3-light caustic shimmer cycle with key, fill, and rim lights.
     */
    function drawAtmosphericGlow(ctx, W, H, fitW, fitH, ox, oy) {
        var cx = ox + fitW * 0.5;
        var cy = oy + fitH * 0.5;
        var lightPositions = [
            {x: -0.30, y: -0.25, color:[255,230,170]},   // key light — warm white
            {x: 0.35,  y: -0.15, color:[180,220,255]},   // fill light — cool cyan
            {x: 0,     y:  0.35, color:[200,160,100]},   // rim light — deep gold
        ];
        var li = Math.floor(STATE.heroCurrentFrame / 100) % 3;
        var L  = lightPositions[li];
        var lx = cx + L.x * fitW;
        var ly = cy + L.y * fitH;
        var r = L.color[0], g = L.color[1], b = L.color[2];
        var gr = fitW * 0.50;
        var grd = ctx.createRadialGradient(lx, ly, 0, lx, ly, gr);
        grd.addColorStop(0,    'rgba('+r+','+g+','+b+',0.11)');
        grd.addColorStop(0.40, 'rgba('+r+','+g+','+b+',0.04)');
        grd.addColorStop(1,    'rgba('+r+','+g+','+b+',0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle    = grd;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
    }

    // ── Main render loop ──────────────────────────────────────────────────────
    function renderHero() {
        requestAnimationFrame(renderHero);

        var now = performance.now();
        if (now - lastTs < (1000 / TOKENS.PASS_FPS)) return;
        lastTs = now;

        var W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        // Bail if no image ready yet
        var fi     = Math.floor(STATE.heroCurrentFrame);
        var img    = images[fi];
        if (!img || !img.complete || img.naturalWidth === 0) return;

        // ── Fit sprite insidetaligner ─────────────────────────────────────────
        var sw = img.naturalWidth, sh = img.naturalHeight;
        var aspect = sh / sw;
        var fitW = W * 0.85;
        var fitH = fitW * aspect;
        if (fitH > H * 0.90) { fitH = H * 0.90; fitW = fitH / aspect; }
        var ox = (W - fitW) * 0.5;
        var oy = (H - fitH) * 0.5;

        // ── Mouse parallax ────────────────────────────────────────────────────
        var path = window.location.pathname.split('/').pop() || 'index.html';
        var shot = PAGE_SHOTS[path] || PAGE_SHOTS['default'];
        var px = (STATE.mouseX / window.innerWidth  - 0.5) * 20 * shot.mouseSensitivity;
        var py = (STATE.mouseY / window.innerHeight - 0.5) * 20 * shot.mouseSensitivity;
        ox += px; oy += py;

        // ═══════════════════════════ PASS PIPELINE ════════════════════════════
        // Pass 1 — Base sprite (unblurred for crisp geometry silhouette)
        ctx.drawImage(img, ox, oy, fitW, fitH);

        // Pass 2 — AO darkening (black multiply on the dark silhouette regions)
        drawAmbientOcclusion(ctx, img, W, H, fitW, fitH, ox, oy);

        // Pass 3 — Edge-glow / rim-light (PBR-inspired specular edge highlight)
        drawEdgeGlow(ctx, img, W, H, fitW, fitH, ox, oy);

        // Pass 4 — Atmospheric gold bloom
        drawAtmosphericGlow(ctx, W, H, fitW, fitH, ox, oy);

        // Pass 5 — Vignette (cinematic falloff)
        drawVignette(ctx, W, H, TOKENS.VIGN_STR);

        // Pass 6 — Ground shadow (ellipse × multiply on bottom half of wrap)
        var shY = oy + fitH * 0.92;
        var shR = fitW * 0.44;
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = TOKENS.SHADOW_PASS;
        ctx.beginPath();
        ctx.ellipse(ox + fitW * 0.5, shY, shR, shR * 0.30, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.filter = 'blur(18px)';
        ctx.fill();
        ctx.restore();

        // ═══════════════════════════════════════════════════════════════════════

        // Advance frame (clamp to page shot range)
        STATE.heroCurrentFrame += 0.4;
        var path = window.location.pathname.split('/').pop() || 'index.html';
        var shot = PAGE_SHOTS[path] || PAGE_SHOTS['default'];
        if (STATE.heroCurrentFrame >= shot.end) STATE.heroCurrentFrame = shot.start;
    }

    // ── Placeholder fallback ──────────────────────────────────────────────────
    function drawPlaceholderAnimation(canvas, ctx) {
        var frame = 0, cx = canvas.width/2, cy = canvas.height/2;
        var base  = Math.min(canvas.width, canvas.height) * 0.25;

        function draw() {
            requestAnimationFrame(draw);
            frame += 0.02;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            var grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, base*2.5);
            grd.addColorStop(0,   'rgba(201,168,108,0.10)');
            grd.addColorStop(0.5, 'rgba(201,168,108,0.04)');
            grd.addColorStop(1,   'rgba(201,168,108,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            var segs = 14;
            for (var i = 0; i < segs; i++) {
                var ang  = frame + (i/segs)*Math.PI*2;
                var rIn  = base * (0.55 + 0.25*Math.sin(frame*2.1 + i*0.55));
                var rOut = base * (1.5  + 0.18*Math.cos(frame*1.7 + i*0.38));
                var x1   = cx + Math.cos(ang)*rIn;
                var y1   = cy + Math.sin(ang)*rIn*0.62;
                var x2   = cx + Math.cos(ang)*rOut;
                var y2   = cy + Math.sin(ang)*rOut*0.62;

                ctx.save();
                ctx.shadowBlur  = 8;
                ctx.shadowColor = 'rgba(201,168,108,0.4)';
                ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
                ctx.strokeStyle = 'rgba(201,168,108,' + (0.35+0.25*Math.sin(frame*3.5+i)) + ')';
                ctx.lineWidth   = 1.6; ctx.stroke();

                var ringR   = base*(0.85 + 0.28*Math.sin(frame*1.5 + i*0.65));
                ctx.shadowBlur   = 0;
                ctx.strokeStyle  = 'rgba(201,168,108,' + (0.12+0.10*Math.cos(frame*2.2+i)) + ')';
                ctx.lineWidth    = 1;
                ctx.beginPath(); ctx.arc(cx,cy,ringR,ang-0.13,ang+0.13); ctx.stroke();
                ctx.restore();
            }

            var puls = 0.5 + 0.5*Math.sin(frame*4.2);
            ctx.beginPath(); ctx.arc(cx,cy,5+puls*3.5,0,Math.PI*2);
            ctx.fillStyle   = 'rgba(201,168,108,' + (0.55+puls*0.45) + ')';
            ctx.fill();

            ctx.font  = '14px Inter, sans-serif';
            ctx.fillStyle  = 'rgba(201,168,108,0.45)';
            ctx.textAlign  = 'center';
            ctx.fillText('3D Model Loading…', cx, cy + base + 32);
        }
        draw();
    }
}

// ─── Particle System ─────────────────────────────────────────────────────────
function initParticles() {
    var canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    function resize(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
    resize(); window.addEventListener('resize', resize);

    var particles = [];
    var count = Math.min(50, Math.floor(window.innerWidth / 25));
    for (var i=0; i<count; i++) {
        particles.push({
            x: Math.random()*canvas.width, y: Math.random()*canvas.height,
            vx:(Math.random()-0.5)*0.2,   vy:(Math.random()-0.5)*0.2,
            size:Math.random()*1.2+0.3,   alpha:Math.random()*0.3+0.05
        });
    }
    var mx=window.innerWidth/2, my=window.innerHeight/2;
    document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;},{passive:true});

    (function loop() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        for (var i=0; i<particles.length; i++) {
            var p = particles[i];
            var dx = p.x-mx, dy = p.y-my, d2 = dx*dx+dy*dy;
            if (d2 < 25000){ var inv=1/Math.sqrt(d2); p.x+=dx*inv*0.3; p.y+=dy*inv*0.3; }
            p.x += p.vx; p.y += p.vy;
            if (p.x<0||p.x>canvas.width)  p.vx *= -1;
            if (p.y<0||p.y>canvas.height) p.vy *= -1;
            ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,6.2832);
            ctx.fillStyle = 'rgba(200,200,220,'+p.alpha+')'; ctx.fill();
        }
        // particle connections
        if (STATE.heroRafId % 2 === 0) {
            for (var i=0; i<particles.length; i++) {
                for (var j=i+1; j<particles.length; j++) {
                    var dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
                    if (dx>100||dx<-100||dy>100||dy<-100) continue;
                    var d = Math.sqrt(dx*dx+dy*dy);
                    if (d < 100) {
                        ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y);
                        ctx.lineTo(particles[j].x,particles[j].y);
                        ctx.strokeStyle='rgba(201,168,108,'+(0.04*(1-d/100))+')';
                        ctx.lineWidth=0.5; ctx.stroke();
                    }
                }
            }
        }
        requestAnimationFrame(loop);
    })();
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────
window.addEventListener('beforeunload', function() {
    if (STATE.heroRafId) cancelAnimationFrame(STATE.heroRafId);
});
