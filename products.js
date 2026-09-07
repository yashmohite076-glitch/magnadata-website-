/* ==========================================================================
   Products Page JS - MagnaData
   ========================================================================== */

const DOM = {
  themeBtn: document.getElementById('theme-btn'),
  cursorTracker: document.getElementById('cursor-tracker'),
  cursorDot: document.getElementById('cursor-dot'),
  cursorRing: document.getElementById('cursor-ring'),
  reveals: document.querySelectorAll('.scroll-reveal'),
  anchorLinks: document.querySelectorAll('a[href^="#"]')
};

const state = {
  themeIndex: 0,
  themes: ['dark', 'cyber', 'light', 'space', 'amber']
};

/* ==========================================================================
   Theme Customization
   ========================================================================== */
function cycleTheme() {
  state.themeIndex = (state.themeIndex + 1) % state.themes.length;
  const newTheme = state.themes[state.themeIndex];
  document.documentElement.setAttribute('data-theme', newTheme);
}

/* ==========================================================================
   Cursor Tracker Logic
   ========================================================================== */
const cursorState = {
  mouseX: window.innerWidth / 2,
  mouseY: window.innerHeight / 2,
  ringX: window.innerWidth / 2,
  ringY: window.innerHeight / 2,
  dotX: window.innerWidth / 2,
  dotY: window.innerHeight / 2,
  isActive: true // Always active on products page
};

function updateCursorTracker() {
  if (!DOM.cursorTracker) return;

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
  
  requestAnimationFrame(updateCursorTracker);
}

/* ==========================================================================
   Scroll Reveal Observer
   ========================================================================== */
function initScrollReveal() {
  const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  };

  const revealOnScroll = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, revealOptions);

  DOM.reveals.forEach(reveal => {
    revealOnScroll.observe(reveal);
  });
}

/* ==========================================================================
   Product Category Filtering ("Sort & Filter")
   ========================================================================== */
function initProductFilters() {
  const filterTabs = document.querySelectorAll('.filter-tab');
  const showcaseCards = document.querySelectorAll('.product-showcase-card');

  if (!filterTabs.length || !showcaseCards.length) return;

  filterTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');

      // Update active tab styling
      filterTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      // Filter product cards
      showcaseCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.classList.remove('is-hidden');
          setTimeout(() => {
            card.classList.add('visible');
          }, 30);
        } else {
          card.classList.add('is-hidden');
        }
      });
    });
  });
}

/* ==========================================================================
   Smooth Scrolling
   ========================================================================== */
function initSmoothScroll() {
  DOM.anchorLinks.forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId.startsWith('#')) return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();

        // If card was hidden by active filter, reset to all
        if (targetElement.classList.contains('is-hidden')) {
          const allTab = document.querySelector('.filter-tab[data-filter="all"]');
          if (allTab) allTab.click();
        }

        // Calculate header offset if fixed header exists
        const headerOffset = document.getElementById('app-header') ? document.getElementById('app-header').offsetHeight + 20 : 20;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    });
  });
}

/* ==========================================================================
   Event Binding & Initialization
   ========================================================================== */
function bindEvents() {
  window.addEventListener('mousemove', (e) => {
    cursorState.mouseX = e.clientX;
    cursorState.mouseY = e.clientY;
  }, { passive: true });

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('a, button, .product-grid-card, .product-showcase-card, .filter-tab');
    if (target) {
      DOM.cursorTracker?.classList.add('hovered');
    } else {
      DOM.cursorTracker?.classList.remove('hovered');
    }
  }, { passive: true });

  if (DOM.themeBtn) {
    DOM.themeBtn.addEventListener('click', cycleTheme);
  }
  
  // Start cursor tracker loop immediately
  DOM.cursorTracker.classList.add('active');
  requestAnimationFrame(updateCursorTracker);
  
  initScrollReveal();
  initSmoothScroll();
  initProductFilters();
}

// Start Application
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
});
