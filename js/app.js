/* ============================================
   DAARUL AZMI TWIBBON STUDIO - App Controller
   ============================================ */

const AppController = (function() {
  // Detect base path for subpath deployment (e.g., /twibbon/)
  function getBasePath() {
    const hostname = window.location.hostname;
    if (hostname.includes('twibbon.daarulazmi')) {
      return '';
    }
    const path = window.location.pathname;
    if (path.includes('/twibbon/')) {
      return '/twibbon';
    }
    return '';
  }

  // Prepend base path to image URLs if needed
  function getImageUrl(relPath) {
    if (!relPath) return '';
    if (relPath.startsWith('http') || relPath.startsWith('data:')) {
      return relPath;
    }
    const basePath = getBasePath();
    const cleanPath = basePath ? basePath + '/' + relPath : relPath;
    return cleanPath + '?v=' + Date.now();
  }

  // Initialize based on current page
  function init() {
    const path = window.location.pathname;
    
    // Mobile menu toggle
    initMobileMenu();

    // Route to page-specific initialization
    if (path.includes('index.html') || path === '/' || path.endsWith('/twibbon/')) {
      initHomePage();
    } else if (path.includes('kampanye.html')) {
      initCampaignsPage();
    }
    // Editor page is handled by editor.js
  }

  // Mobile menu toggle
  function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const menu = document.querySelector('.nav-menu');
    
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        menu.classList.toggle('open');
        toggle.textContent = menu.classList.contains('open') ? '✕' : '☰';
      });

      // Close menu on link click
      menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          menu.classList.remove('open');
          toggle.textContent = '☰';
        });
      });
    }
  }

  // Home page initialization
  async function initHomePage() {
    console.log('Initializing home page...');
    // Load featured campaigns (active only)
    const featuredContainer = document.getElementById('featured-campaigns');
    if (featuredContainer) {
      const featured = await CampaignsModule.getActiveCampaigns();
      console.log('Featured campaigns:', featured.length);
      featuredContainer.innerHTML = '';
      if (featured.length > 0) {
        featured.forEach(campaign => {
          const card = CampaignsModule.renderCampaignCard(campaign);
          featuredContainer.appendChild(card);
        });
      } else {
        featuredContainer.innerHTML = '<p class="text-center text-gray">Belum ada kampanye aktif.</p>';
      }
    }

    // Load all campaigns for home page
    const allContainer = document.getElementById('all-campaigns');
    if (allContainer) {
      const campaigns = await CampaignsModule.getActiveCampaigns();
      console.log('All campaigns on home:', campaigns.length);
      allContainer.innerHTML = '';
      if (campaigns.length > 0) {
        campaigns.forEach(campaign => {
          const card = CampaignsModule.renderCampaignCard(campaign);
          allContainer.appendChild(card);
        });
      }
    }

    // Load categories
    const categoriesContainer = document.getElementById('categories');
    if (categoriesContainer) {
      const data = await CampaignsModule.loadCampaigns();
      const categories = [...new Set(data.campaigns.map(c => c.category))];
      if (categories.length > 0) {
        const categoryIcons = {
          'harlah': '🎉',
          'maulid': '🌙',
          'wisuda': '🎓',
          'islam': '☪️',
          'ramadan': '🕌',
          'ppdb': '📚'
        };
        categoriesContainer.innerHTML = categories.map(cat => `
          <div class="category-card" data-category="${cat}" style="cursor:pointer;padding:1rem;text-align:center;border:1px solid #ddd;border-radius:8px;">
            <div style="font-size:2rem;">${categoryIcons[cat] || '📌'}</div>
            <div style="margin-top:0.5rem;">${cat.charAt(0).toUpperCase() + cat.slice(1)}</div>
          </div>
        `).join('');
        
        // Add click handler for category cards
        categoriesContainer.querySelectorAll('.category-card').forEach(card => {
          card.addEventListener('click', () => {
            const category = card.dataset.category;
            window.location.href = `kampanye.html?category=${category}`;
          });
        });
      }
    }
  }

  // Campaigns page initialization
  async function initCampaignsPage() {
    console.log('Initializing campaigns page...');
    const campaignsList = document.getElementById('campaigns-list');
    const noResults = document.getElementById('no-results');
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.getElementById('filter-buttons');
    
    // Guard: only run if this is the campaigns page with required elements
    if (!campaignsList) {
      console.log('Campaigns list container not found');
      return;
    }
    
    let currentFilter = 'all';
    let currentSearch = '';

    // Load URL params
    const urlParams = new URLSearchParams(window.location.search);
    const urlCategory = urlParams.get('category');
    if (urlCategory) {
      currentFilter = urlCategory;
    }

    // Filter buttons click handlers
    if (filterButtons) {
      filterButtons.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          currentFilter = btn.dataset.filter;
          filterButtons.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          renderCampaigns();
        });
      });
    }

    // Render campaigns
    async function renderCampaigns() {
      let campaigns;
      
      if (currentSearch) {
        campaigns = await CampaignsModule.searchCampaigns(currentSearch);
      } else {
        campaigns = await CampaignsModule.loadCampaigns();
        campaigns = campaigns.campaigns || [];
      }

      // Filter by status - only show active campaigns by default
      if (currentFilter === 'active') {
        campaigns = campaigns.filter(c => c.status === 'active');
      } else if (currentFilter !== 'all') {
        // Filter by category
        campaigns = campaigns.filter(c => c.category === currentFilter);
      }

      console.log('Rendering campaigns:', campaigns.length);
      campaignsList.innerHTML = '';
      
      if (campaigns.length === 0) {
        if (noResults) noResults.style.display = 'block';
        return;
      }
      
      if (noResults) noResults.style.display = 'none';
      
      campaigns.forEach(campaign => {
        const card = CampaignsModule.renderCampaignCard(campaign);
        campaignsList.appendChild(card);
      });
    }

    // Search input handler
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(timeout);
        currentSearch = searchInput.value.trim();
        timeout = setTimeout(() => {
          renderCampaigns();
        }, 300);
      });
    }

    // Initial render
    renderCampaigns();
  }

  // Format date helper
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(dateStr);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  // Detail page removed - users go directly to editor.html

  // Notification helper
  function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification notification-${type} show`;
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  // Register service worker
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed:', err));
    }
  }

  return {
    init,
    showNotification,
    registerServiceWorker
  };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  AppController.init();
  
  // Register service worker (called inside init() now, but kept for compatibility)
  if (typeof AppController.registerServiceWorker === 'function') {
    AppController.registerServiceWorker();
  }
});
