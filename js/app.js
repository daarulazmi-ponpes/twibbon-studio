/* ============================================
   DAARUL AZMI TWIBBON STUDIO - App Controller
   ============================================ */

const AppController = (function() {
  // Detect base path for subpath deployment (e.g., /twibbon/)
  function getBasePath() {
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
    return basePath + '/' + relPath;
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
    // Load featured campaigns
    const featuredContainer = document.getElementById('featured-campaigns');
    if (featuredContainer) {
      const featured = await CampaignsManager.getFeaturedCampaigns();
      if (featured.length > 0) {
        featuredContainer.innerHTML = featured.map(c => CampaignsManager.renderCampaignCard(c)).join('');
      } else {
        featuredContainer.innerHTML = '<p class="text-center text-gray">Belum ada kampanye unggulan.</p>';
      }
    }

    // Load latest campaigns
    const latestContainer = document.getElementById('latest-campaigns');
    if (latestContainer) {
      const campaigns = await CampaignsManager.getAllCampaigns();
      if (campaigns.length > 0) {
        latestContainer.innerHTML = campaigns.map(c => CampaignsManager.renderCampaignCard(c)).join('');
      }
    }

    // Load categories
    const categoriesContainer = document.getElementById('categories');
    if (categoriesContainer) {
      const categories = await CampaignsManager.getCategories();
      if (categories.length > 0) {
        categoriesContainer.innerHTML = categories.map(c => CampaignsManager.renderCategoryCard(c)).join('');
        
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
    const campaignsList = document.getElementById('campaigns-list');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const filterTagsContainer = document.getElementById('filter-tags');
    
    // Guard: only run if this is the campaigns page with required elements
    if (!campaignsList || !emptyState) {
      return;
    }
    
    let currentCategory = 'all';
    let currentSearch = '';

    // Load URL params
    const urlParams = new URLSearchParams(window.location.search);
    const urlCategory = urlParams.get('category');
    if (urlCategory) {
      currentCategory = urlCategory;
    }

    // Load categories for filter tags
    if (filterTagsContainer) {
      const categories = await CampaignsManager.getCategories();
      const tagsHTML = categories.map(c => 
        `<button class="filter-tag ${currentCategory === c.id ? 'active' : ''}" data-category="${c.id}">${c.icon} ${c.name}</button>`
      ).join('');
      filterTagsContainer.innerHTML = `<button class="filter-tag ${currentCategory === 'all' ? 'active' : ''}" data-category="all">Semua</button>` + tagsHTML;

      // Add click handlers
      filterTagsContainer.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', () => {
          currentCategory = tag.dataset.category;
          filterTagsContainer.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
          tag.classList.add('active');
          renderCampaigns();
        });
      });
    }

    // Render campaigns
    async function renderCampaigns() {
      let campaigns;
      
      if (currentSearch) {
        campaigns = await CampaignsManager.searchCampaigns(currentSearch);
        // Also filter by category
        if (currentCategory !== 'all') {
          campaigns = campaigns.filter(c => c.category === currentCategory);
        }
      } else {
        campaigns = await CampaignsManager.getCampaignsByCategory(currentCategory);
      }

      if (campaigns.length > 0) {
        campaignsList.innerHTML = campaigns.map(c => CampaignsManager.renderCampaignCard(c)).join('');
        campaignsList.style.display = 'grid';
        emptyState.style.display = 'none';
      } else {
        campaignsList.style.display = 'none';
        emptyState.style.display = 'block';
      }
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

  // Detail page initialization
  async function initDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const campaignId = urlParams.get('id');
    
    if (!campaignId) {
      showNotFound();
      return;
    }

    const campaign = await CampaignsManager.getCampaignById(campaignId);
    
    if (!campaign) {
      showNotFound();
      return;
    }

    // Hide loading, show content
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('detail-content').style.display = 'block';

    // Update page title
    document.title = `${campaign.title} - DAARUL AZMI TWIBBON STUDIO`;

    // Update Open Graph tags for WhatsApp sharing
    if (window.updateOGTags) {
      // For OG image, use the cover URL
      // Priority: ImgBB URL > relative path > logo fallback
      let ogImage = 'https://twibbon.daarulazmi.ponpes.id/assets/logo/Darul-azmi-icon.png';
      
      if (campaign.cover) {
        if (campaign.cover.startsWith('data:')) {
          // Base64 image - can't use in OG tags, use fallback
          ogImage = 'https://twibbon.daarulazmi.ponpes.id/assets/logo/Darul-azmi-icon.png';
        } else if (campaign.cover.startsWith('http://') || campaign.cover.startsWith('https://')) {
          // External URL (ImgBB) - use directly
          ogImage = campaign.cover;
        } else {
          // Relative path (campaigns/harlah/cover.png) - convert to full URL
          ogImage = 'https://twibbon.daarulazmi.ponpes.id/' + campaign.cover;
        }
      }
      
      // Also update og:url for this specific campaign
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
    
    // Apply base path for subpath deployment
    coverUrl = getImageUrl(coverUrl);
    
    // For ImgBB URLs, add cors parameter
    if (coverUrl && coverUrl.includes('i.ibb.co')) {
      coverUrl = coverUrl + (coverUrl.includes('?') ? '&' : '?') + 'cors=true';
    }
    // Cache bust for local images to avoid stale service worker cache
    if (coverUrl && !coverUrl.startsWith('http')) {
      coverUrl = coverUrl + (coverUrl.includes('?') ? '&' : '?') + 'v=' + Date.now();
    }
    
    coverImg.src = coverUrl;
    coverImg.onerror = function() { 
      console.warn('Cover image failed to load, using placeholder');
      this.src = getImageUrl('assets/images/placeholder-cover.png') + '?v=' + Date.now(); 
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
    document.getElementById('detail-date').textContent = `${CampaignsManager.formatDate(campaign.startDate)} - ${CampaignsManager.formatDate(campaign.endDate)}`;
    
    const categoryName = await CampaignsManager.getCategoryName(campaign.category);
    document.getElementById('detail-category').textContent = categoryName;
    document.getElementById('detail-popularity').textContent = `${campaign.popularity || 0}% populer`;

    // Frame selector
    const frameSelector = document.getElementById('frame-selector');
    if (campaign.frames && campaign.frames.length > 0) {
      frameSelector.innerHTML = campaign.frames.map((frame, index) => {
        // Apply base path for subpath deployment
        let frameUrl = getImageUrl(frame.thumbnail || frame.image);
        // For ImgBB URLs, add cors parameter
        if (frameUrl && frameUrl.includes('i.ibb.co')) {
          frameUrl = frameUrl + (frameUrl.includes('?') ? '&' : '?') + 'cors=true';
        }
        // Cache bust for local images to avoid stale service worker cache
        if (frameUrl && !frameUrl.startsWith('http')) {
          frameUrl = frameUrl + (frameUrl.includes('?') ? '&' : '?') + 'v=' + Date.now();
        }
        return `
        <div class="frame-option ${index === 0 ? 'selected' : ''}" data-index="${index}">
          <img src="${frameUrl}" alt="${frame.name}" onerror="this.src='${getImageUrl('assets/images/placeholder-frame.png')}?v=' + Date.now()">
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
