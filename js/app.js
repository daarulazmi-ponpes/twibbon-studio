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
    return basePath + '/' + relPath + '?v=' + Date.now();
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
    } else if (path.includes('detail-kampanye.html')) {
      initDetailPage();
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
      if (featured.length > 0) {
        featuredContainer.innerHTML = featured.map(c => CampaignsModule.renderCampaignCard(c)).join('');
      } else {
        featuredContainer.innerHTML = '<p class="text-center text-gray">Belum ada kampanye aktif.</p>';
      }
    }

    // Load latest campaigns (active only)
    const latestContainer = document.getElementById('latest-campaigns');
    if (latestContainer) {
      const campaigns = await CampaignsModule.getActiveCampaigns();
      if (campaigns.length > 0) {
        latestContainer.innerHTML = campaigns.map(c => CampaignsModule.renderCampaignCard(c)).join('');
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

    // Initial render
    await renderCampaigns();

    // Search handler
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          currentSearch = e.target.value.trim();
          renderCampaigns();
        }, 300);
      });
    }
  }

  // Format date helper
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(dateStr);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  // Detail page initialization
  async function initDetailPage() {
    console.log('Initializing detail page...');
    const urlParams = new URLSearchParams(window.location.search);
    const campaignId = urlParams.get('id');
    
    if (!campaignId) {
      showNotFound();
      return;
    }

    const campaign = await CampaignsModule.getCampaignById(campaignId);
    
    if (!campaign) {
      console.log('Campaign not found:', campaignId);
      showNotFound();
      return;
    }

    console.log('Loaded campaign:', campaign.title);

    // Hide loading, show content
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('detail-content').style.display = 'block';

    // Update page title
    document.title = `${campaign.title} - DAARUL AZMI TWIBBON STUDIO`;

    // Update Open Graph tags for WhatsApp sharing
    if (window.updateOGTags) {
      let ogImage = 'https://twibbon.daarulazmi.ponpes.id/assets/logo/Darul-azmi-icon.png';
      
      if (campaign.cover) {
        if (campaign.cover.startsWith('data:')) {
          ogImage = 'https://twibbon.daarulazmi.ponpes.id/assets/logo/Darul-azmi-icon.png';
        } else if (campaign.cover.startsWith('http://') || campaign.cover.startsWith('https://')) {
          ogImage = campaign.cover;
        } else {
          ogImage = 'https://twibbon.daarulazmi.ponpes.id/' + campaign.cover;
        }
      }
      
      const setOG = (prop, content) => {
        let meta = document.querySelector(`meta[property="${prop}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', prop);
          document.head.appendChild(meta);
        }
        meta.content = content;
      };
      
      setOG('og:url', window.location.href);
      window.updateOGTags(
        campaign.title,
        campaign.description,
        ogImage
      );
    }

    // Fill detail content
    document.getElementById('breadcrumb-campaign').textContent = campaign.title;
    document.getElementById('detail-title').textContent = campaign.title;
    document.getElementById('detail-description').textContent = campaign.description;
    
    // Set cover image with error handling
    const coverImg = document.getElementById('detail-cover');
    let coverUrl = campaign.cover || 'assets/images/placeholder-cover.png';
    coverUrl = getImageUrl(coverUrl);
    
    if (coverUrl && coverUrl.includes('i.ibb.co')) {
      coverUrl = coverUrl + (coverUrl.includes('?') ? '&' : '?') + 'cors=true';
    }
    
    coverImg.src = coverUrl;
    coverImg.onerror = function() { 
      console.warn('Cover image failed to load, using placeholder');
      this.src = getImageUrl('assets/images/placeholder-cover.png'); 
    };
    
    // Status
    const statusEl = document.getElementById('detail-status');
    if (campaign.status === 'active') {
      statusEl.textContent = 'Aktif';
      statusEl.className = 'badge badge-success';
    } else {
      statusEl.textContent = 'Tidak Aktif';
      statusEl.className = 'badge badge-warning';
    }

    // Meta
    document.getElementById('detail-date').textContent = `${formatDate(campaign.startDate)} - ${formatDate(campaign.endDate)}`;
    document.getElementById('detail-category').textContent = campaign.category.charAt(0).toUpperCase() + campaign.category.slice(1);
    document.getElementById('detail-popularity').textContent = `${campaign.popularity || 0}% populer`;

    // Frame selector
    const frameSelector = document.getElementById('frame-selector');
    if (campaign.frames && campaign.frames.length > 0) {
      console.log('Loading frames:', campaign.frames.length);
      frameSelector.innerHTML = campaign.frames.map((frame, index) => {
        let frameUrl = getImageUrl(frame.thumbnail || frame.image);
        if (frameUrl && frameUrl.includes('i.ibb.co')) {
          frameUrl = frameUrl + (frameUrl.includes('?') ? '&' : '?') + 'cors=true';
        }
        return `
        <div class="frame-option ${index === 0 ? 'selected' : ''}" data-index="${index}">
          <img src="${frameUrl}" alt="${frame.name}" onerror="this.src='${getImageUrl('assets/images/placeholder-frame.png')}'">
          <p style="font-size: var(--font-size-xs); text-align: center; margin-top: var(--spacing-xs);">${frame.name}</p>
        </div>
      `;
      }).join('');

      // Add click handlers
      frameSelector.querySelectorAll('.frame-option').forEach(option => {
        option.addEventListener('click', () => {
          frameSelector.querySelectorAll('.frame-option').forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
        });
      });
    }

    // Update start button with campaign and frame info
    const startBtn = document.getElementById('btn-start-create');
    const basePath = getBasePath();
    startBtn.href = `${basePath}/editor.html?campaign=${campaignId}&frame=0`;
    
    // Update start button when frame is selected
    if (frameSelector) {
      frameSelector.querySelectorAll('.frame-option').forEach(option => {
        option.addEventListener('click', () => {
          const index = option.dataset.index;
          startBtn.href = `${basePath}/editor.html?campaign=${campaignId}&frame=${index}`;
        });
      });
    }
  }

  // Show not found state
  function showNotFound() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('not-found').style.display = 'block';
  }

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
