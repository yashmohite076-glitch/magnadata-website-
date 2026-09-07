/* ==========================================================================
   CHRONOFRAME - 360° Scroll Animation Engine
   ========================================================================== */

// Configuration Constants
const TOTAL_FRAMES = 240;
const FRAME_PATH_TEMPLATE = (i) => `/frames/frame_${String(i - 1).padStart(6, '0')}.jpg`;

// Application State
const state = {
  images: [],
  loadedCount: 0,
  isLoaded: false,
  currentFrameIndex: 1, // 1-based (1 to 300)
  targetFrameIndex: 1,
  themeIndex: 0,
  themes: ['dark', 'cyber', 'light', 'space', 'amber'],
  coreTargetProgress: [0, 0, 0, 0],
  coreCurrentProgress: [0, 0, 0, 0]
};

// DOM Element References
const DOM = {
  preloader: document.getElementById('preloader'),
  ringProgress: document.getElementById('ring-progress'),
  loaderPercent: document.getElementById('loader-percent'),
  loaderStatus: document.getElementById('loader-status'),
  loaderBarFill: document.getElementById('loader-bar-fill'),
  loaderCount: document.getElementById('loader-count'),
  
  appHeader: document.getElementById('app-header'),
  hdrFrameIndicator: document.getElementById('hdr-frame-indicator'),
  headerProgressFill: document.getElementById('header-progress-fill'),
  themeBtn: document.getElementById('theme-btn'),
  
  scrollTrack: document.getElementById('scroll-track'),
  canvas: document.getElementById('animation-canvas'),
  
  // Narrative Cards
  card1: document.getElementById('card-1'),
  card2: document.getElementById('card-2'),
  card3: document.getElementById('card-3'),
  card4: document.getElementById('card-4'),
  
  // Core Capabilities
  coreCapsSection: document.getElementById('core-caps'),
  coreCards: [
    document.getElementById('cc-1'),
    document.getElementById('cc-2'),
    document.getElementById('cc-3'),
    document.getElementById('cc-4')
  ],

  // Cursor Tracker
  cursorTracker: document.getElementById('cursor-tracker'),
  cursorDot: document.getElementById('cursor-dot'),
  cursorRing: document.getElementById('cursor-ring')
};

const ctx = DOM.canvas.getContext('2d');

/* ==========================================================================
   1. Frame Preloader Logic
   ========================================================================== */
function initPreloader() {
  const alreadyLoaded = sessionStorage.getItem('magnaFramesLoaded');
  if (alreadyLoaded && DOM.preloader) {
    DOM.preloader.style.display = 'none';
  }

  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = FRAME_PATH_TEMPLATE(i);
    
    img.onload = () => {
      state.loadedCount++;
      if (!alreadyLoaded) updatePreloaderProgress();
      if (state.loadedCount === TOTAL_FRAMES) {
        onPreloaderComplete(alreadyLoaded);
      }
    };
    
    img.onerror = () => {
      state.loadedCount++;
      if (!alreadyLoaded) updatePreloaderProgress();
      if (state.loadedCount === TOTAL_FRAMES) {
        onPreloaderComplete(alreadyLoaded);
      }
    };

    state.images.push(img);
  }
}

function updatePreloaderProgress() {
  const percent = Math.min(100, Math.floor((state.loadedCount / TOTAL_FRAMES) * 100));
  
  const offset = 264 - (264 * percent) / 100;
  if (DOM.ringProgress) DOM.ringProgress.style.strokeDashoffset = offset;
  if (DOM.loaderPercent) DOM.loaderPercent.textContent = `${percent}%`;
  if (DOM.loaderBarFill) DOM.loaderBarFill.style.width = `${percent}%`;
  if (DOM.loaderCount) DOM.loaderCount.textContent = `${state.loadedCount} / ${TOTAL_FRAMES} Frames`;
}

function onPreloaderComplete(alreadyLoaded) {
  state.isLoaded = true;
  sessionStorage.setItem('magnaFramesLoaded', 'true');

  if (!alreadyLoaded && DOM.loaderStatus) {
    DOM.loaderStatus.textContent = 'All 240 frames preloaded!';
  }
  
  const delay = alreadyLoaded ? 0 : 300;
  
  setTimeout(() => {
    if (DOM.preloader && !alreadyLoaded) {
      DOM.preloader.classList.add('fade-out');
      setTimeout(() => DOM.preloader.style.display = 'none', 800);
    }
    
    setupCanvasDimensions();
    calculateTargetFrameFromScroll();
    state.currentFrameIndex = state.targetFrameIndex;
    renderCurrentFrame();
    
    // Initialize Core Capabilities Cards visually hidden initially
    for (let i = 0; i < 4; i++) {
      renderCoreCard(i, 0);
    }
    
    startRenderLoop();
  }, delay);
}

/* ==========================================================================
   2. Canvas High-DPI Auto-Resize & Rendering
   ========================================================================== */
function setupCanvasDimensions() {
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  DOM.canvas.width = width * dpr;
  DOM.canvas.height = height * dpr;
  DOM.canvas.style.width = `${width}px`;
  DOM.canvas.style.height = `${height}px`;
  
  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

function renderFrameIndex(frameIdx) {
  const roundedIdx = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(frameIdx)));
  const img = state.images[roundedIdx - 1];
  
  if (!img || !img.complete || img.naturalWidth === 0) return;
  
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  
  ctx.clearRect(0, 0, viewportW, viewportH);
  
  // Aspect ratio fitting ("cover")
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const scale = Math.max(viewportW / imgW, viewportH / imgH);
  
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const drawX = (viewportW - drawW) / 2;
  const drawY = (viewportH - drawH) / 2;
  
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  
  // Update Header Info & Narrative Cards
  updateHUDInfo(roundedIdx);
  updateNarrativeCards(roundedIdx);
}

function renderCurrentFrame() {
  renderFrameIndex(state.currentFrameIndex);
}

/* ==========================================================================
   3. Scroll Synchronization & Smooth Render Loop
   ========================================================================== */
function calculateTargetFrameFromScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  
  // Modify maxScroll calculation to only consider the scroll track area
  let maxScroll = 1;
  if (DOM.scrollTrack) {
    maxScroll = DOM.scrollTrack.offsetHeight - window.innerHeight;
  }
  
  if (maxScroll <= 0) return;
  
  const scrollFraction = Math.min(1, Math.max(0, scrollTop / maxScroll));
  state.targetFrameIndex = Math.min(TOTAL_FRAMES, Math.max(1, Math.round(scrollFraction * (TOTAL_FRAMES - 1)) + 1));
}

function calculateCoreCapsScroll() {
  if (!DOM.coreCapsSection) return;
  
  const rect = DOM.coreCapsSection.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  
  let scrollProgress = 0;
  
  if (rect.top > 0) {
    scrollProgress = 0;
  } else if (rect.bottom < windowHeight) {
    scrollProgress = 1;
  } else {
    const scrollDistance = rect.height - windowHeight;
    scrollProgress = Math.min(1, Math.max(0, -rect.top / scrollDistance));
  }
  
  // Distribute progress across the 4 cards — all visible by 60% of scroll
  state.coreTargetProgress[0] = Math.min(1, Math.max(0, (scrollProgress - 0.0) / 0.15));
  state.coreTargetProgress[1] = Math.min(1, Math.max(0, (scrollProgress - 0.15) / 0.15));
  state.coreTargetProgress[2] = Math.min(1, Math.max(0, (scrollProgress - 0.30) / 0.15));
  state.coreTargetProgress[3] = Math.min(1, Math.max(0, (scrollProgress - 0.45) / 0.15));
}

function renderCoreCard(index, progress) {
  const card = DOM.coreCards[index];
  if (!card) return;
  
  const opacity = progress;
  const scale = 0.85 + (0.15 * progress);
  const translateY = 50 * (1 - progress);
  
  card.style.opacity = opacity;
  // Use a CSS variable or directly apply inline styles without overriding hover transforms
  // Because hover requires !important to override inline transform, we're safe here.
  card.style.transform = `translateY(${translateY}px) scale(${scale})`;
}

function startRenderLoop() {
  function loop() {
    calculateTargetFrameFromScroll();
    calculateCoreCapsScroll();
    
    // Canvas Sub-pixel LERP
    const diff = state.targetFrameIndex - state.currentFrameIndex;
    if (Math.abs(diff) > 0.001) {
      state.currentFrameIndex += diff * 0.3;
      renderCurrentFrame();
    }
    
    // Core Cards LERP
    for (let i = 0; i < 4; i++) {
      const cardDiff = state.coreTargetProgress[i] - state.coreCurrentProgress[i];
      if (Math.abs(cardDiff) > 0.001) {
        state.coreCurrentProgress[i] += cardDiff * 0.15; // smooth easing (roughly ~700-900ms feel)
        // ensure we snap to integer when very close to avoid infinity math
        if (Math.abs(state.coreTargetProgress[i] - state.coreCurrentProgress[i]) < 0.001) {
          state.coreCurrentProgress[i] = state.coreTargetProgress[i];
        }
        renderCoreCard(i, state.coreCurrentProgress[i]);
      }
    }
    
    // Cursor Tracker Loop
    updateCursorTracker();
    
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ==========================================================================
   Cursor Tracker Logic
   ========================================================================== */
const cursorState = {
  mouseX: -100,
  mouseY: -100,
  ringX: -100,
  ringY: -100,
  dotX: -100,
  dotY: -100,
  isActive: false
};

function updateCursorTracker() {
  if (!DOM.cursorTracker) return;

  const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
  const heroEndThreshold = DOM.scrollTrack ? (DOM.scrollTrack.offsetTop + DOM.scrollTrack.offsetHeight * 0.75) : (window.innerHeight * 2);

  // Activate cursor tracker ONLY after user scrolls past hero section
  if (scrollY > heroEndThreshold) {
    if (!cursorState.isActive) {
      cursorState.isActive = true;
      DOM.cursorTracker.classList.add('active');
    }
  } else {
    if (cursorState.isActive) {
      cursorState.isActive = false;
      DOM.cursorTracker.classList.remove('active');
      DOM.cursorTracker.classList.remove('hovered');
    }
  }

  if (!cursorState.isActive) return;

  // LERP easing for smooth fluid movement
  cursorState.dotX += (cursorState.mouseX - cursorState.dotX) * 0.65;
  cursorState.dotY += (cursorState.mouseY - cursorState.dotY) * 0.65;
  
  cursorState.ringX += (cursorState.mouseX - cursorState.ringX) * 0.18;
  cursorState.ringY += (cursorState.mouseY - cursorState.ringY) * 0.18;

  if (DOM.cursorDot) {
    DOM.cursorDot.style.transform = `translate3d(${cursorState.dotX}px, ${cursorState.dotY}px, 0) translate(-50%, -50%)`;
  }
  if (DOM.cursorRing) {
    DOM.cursorRing.style.transform = `translate3d(${cursorState.ringX}px, ${cursorState.ringY}px, 0) translate(-50%, -50%)`;
  }
}

/* ==========================================================================
   4. HUD Information & Narrative Cards
   ========================================================================== */
function updateHUDInfo(frameIdx) {
  const percentVal = Math.round((frameIdx / TOTAL_FRAMES) * 100);
  if (DOM.headerProgressFill) DOM.headerProgressFill.style.width = `${percentVal}%`;
}

function updateNarrativeCards(frameIdx) {
  setCardVisible(DOM.card1, frameIdx >= 96 && frameIdx <= 126);
  setCardVisible(DOM.card2, frameIdx >= 130 && frameIdx <= 160);
  setCardVisible(DOM.card3, frameIdx >= 164 && frameIdx <= 194);
  setCardVisible(DOM.card4, frameIdx >= 198 && frameIdx <= 228);
}

function setCardVisible(cardEl, isVisible) {
  if (!cardEl) return;
  if (isVisible) {
    cardEl.classList.remove('hidden-card');
  } else {
    cardEl.classList.add('hidden-card');
  }
}

/* ==========================================================================
   5. Theme Customization
   ========================================================================== */
function cycleTheme() {
  state.themeIndex = (state.themeIndex + 1) % state.themes.length;
  const newTheme = state.themes[state.themeIndex];
  document.documentElement.setAttribute('data-theme', newTheme);
}

/* ==========================================================================
   6. Event Binding & Initialization
   ========================================================================== */
function bindEvents() {
  window.addEventListener('resize', () => {
    setupCanvasDimensions();
    renderCurrentFrame();
  });

  window.addEventListener('scroll', () => {
    calculateTargetFrameFromScroll();
    calculateCoreCapsScroll();
    updateHeaderShrink();
  }, { passive: true });

  window.addEventListener('mousemove', (e) => {
    cursorState.mouseX = e.clientX;
    cursorState.mouseY = e.clientY;
  }, { passive: true });

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('a, button, .core-card, .stat-box, .product-card, .ind-badge, .nav-link, .icon-btn');
    if (target) {
      DOM.cursorTracker?.classList.add('hovered');
    } else {
      DOM.cursorTracker?.classList.remove('hovered');
    }
  }, { passive: true });

  if (DOM.themeBtn) {
    DOM.themeBtn.addEventListener('click', cycleTheme);
  }
}

/* ==========================================================================
   7. Navbar Shrink-on-Scroll Animation
   ========================================================================== */
const SHRINK_THRESHOLD = 30;  // px from top — always expand when near top
const EXPAND_RATIO = 0.20;    // 20% of viewport height to scroll back

let prevScrollY = 0;
let turnPoint = 0;       // scroll position where user changed direction to "up"
let scrollingUp = false;  // current scroll direction
let navShrunk = false;

function updateHeaderShrink() {
  const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
  if (!DOM.appHeader) return;

  const expandDist = window.innerHeight * EXPAND_RATIO;

  // Always expand when near the very top
  if (scrollY <= SHRINK_THRESHOLD) {
    if (navShrunk) {
      navShrunk = false;
      DOM.appHeader.classList.remove('header-shrunk');
    }
    prevScrollY = scrollY;
    return;
  }

  // Detect direction change
  if (scrollY < prevScrollY) {
    // Scrolling UP
    if (!scrollingUp) {
      // Just changed direction — record turn point
      scrollingUp = true;
      turnPoint = prevScrollY;
    }
    // Check if scrolled back 20% of viewport from the turn point
    if (navShrunk && (turnPoint - scrollY) >= expandDist) {
      navShrunk = false;
      DOM.appHeader.classList.remove('header-shrunk');
    }
  } else if (scrollY > prevScrollY) {
    // Scrolling DOWN
    if (scrollingUp) {
      // Just changed direction — reset
      scrollingUp = false;
      turnPoint = 0;
    }
    // Shrink when scrolling down (and past threshold)
    if (!navShrunk) {
      navShrunk = true;
      DOM.appHeader.classList.add('header-shrunk');
    }
  }

  prevScrollY = scrollY;
}

// Start Application
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  initPreloader();
});
