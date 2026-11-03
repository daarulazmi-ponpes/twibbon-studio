/* ============================================
   DAARUL AZMI TWIBBON STUDIO - App Module
   ============================================ */

const AppModule = (function() {
  'use strict';

  // Show notification
  function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = 'notification show';
    
    if (type === 'error') {
      notification.classList.add('error');
    }
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  // Mobile menu toggle
  function initMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('main-nav');
    
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        nav.classList.toggle('show');
        toggle.textContent = nav.classList.contains('show') ? '✕' : '☰';
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && e.target !== toggle) {
          nav.classList.remove('show');
          toggle.textContent = '☰';
        }
      });
    }
  }

  // Category filter click handler
  function initCategoryFilters() {
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
      card.addEventListener('click', () => {
        const category = card.getAttribute('data-category');
        if (category) {
          window.location.href = `kampanye.html?filter=${category}`;
        }
      });
    });
  }

  // Search and filter handler for kampanye page
  function initSearchFilter() {
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.getElementById('filter-buttons');
    
    if (!searchInput || !filterButtons) return;
    
    let currentFilter = 'all';
    let searchTimeout;
    
    // Check URL params for filter
    const urlParams = new URLSearchParams(window.location.search);
    const urlFilter = urlParams.get('filter');
    if (urlFilter) {
      currentFilter = urlFilter;
      // Update active button
      filterButtons.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === currentFilter);
      });
    }
    
    // Render initial campaigns
    CampaignsModule.renderCampaigns('campaigns-list', currentFilter, '');
    
    // Search handler
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        CampaignsModule.renderCampaigns('campaigns-list', currentFilter, e.target.value);
      }, 300);
    });
    
    // Filter handler
    filterButtons.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      
      currentFilter = btn.getAttribute('data-filter');
      filterButtons.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      CampaignsModule.renderCampaigns('campaigns-list', currentFilter, searchInput.value);
    });
  }

  // Initialize homepage
  function initHomepage() {
    CampaignsModule.renderFeaturedCampaigns('featured-campaigns', 3);
    CampaignsModule.renderCampaigns('all-campaigns');
    initCategoryFilters();
  }

  // Initialize service worker
  function initServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
          .then(reg => {
            console.log('Service Worker registered:', reg.scope);
          })
          .catch(err => {
            console.log('Service Worker registration failed:', err);
          });
      });
    }
  }

  // Main init
  function init() {
    initMobileMenu();
    initServiceWorker();
    
    // Detect page and initialize accordingly
    const path = window.location.pathname;
    
    if (path.includes('kampanye.html') || path.endsWith('/kampanye')) {
      initSearchFilter();
    } else if (path.includes('index.html') || path.endsWith('/') || path === '' || path === '/') {
      initHomepage();
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    showNotification,
    init
  };
})();
