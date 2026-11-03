/* ============================================
   DAARUL AZMI TWIBBON STUDIO - Campaigns Module
   ============================================ */

const CampaignsModule = (function() {
  'use strict';

  let campaignsData = null;

  // Load campaigns from JSON
  async function loadCampaigns() {
    if (campaignsData) return campaignsData;
    
    try {
      const response = await fetch('data/campaigns.json?' + Date.now());
      if (!response.ok) throw new Error('Failed to load campaigns');
      campaignsData = await response.json();
      return campaignsData;
    } catch (error) {
      console.error('Error loading campaigns:', error);
      return { campaigns: [] };
    }
  }

  // Get campaign by ID
  async function getCampaignById(id) {
    const data = await loadCampaigns();
    return data.campaigns.find(c => c.id === id) || null;
  }

  // Get active campaigns
  async function getActiveCampaigns() {
    const data = await loadCampaigns();
    return data.campaigns.filter(c => c.status === 'active');
  }

  // Get campaigns by category
  async function getCampaignsByCategory(category) {
    const data = await loadCampaigns();
    return data.campaigns.filter(c => c.category === category);
  }

  // Search campaigns
  async function searchCampaigns(query) {
    const data = await loadCampaigns();
    const lowerQuery = query.toLowerCase();
    return data.campaigns.filter(c => 
      c.title.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery)
    );
  }

  // Render campaign card
  function renderCampaignCard(campaign) {
    const card = document.createElement('div');
    card.className = 'campaign-card';
    
    const statusBadge = campaign.status === 'active' 
      ? '<span class="badge badge-active">Aktif</span>'
      : '<span class="badge badge-inactive">Tidak Aktif</span>';
    
    const coverHtml = campaign.cover 
      ? `<img src="${campaign.cover}" alt="${campaign.title}" onerror="this.parentElement.innerHTML='<div class=\\'placeholder\\'>Cover belum tersedia</div>'">`
      : '<div class="placeholder">Cover belum tersedia</div>';
    
    card.innerHTML = `
      <div class="campaign-card-img">
        ${coverHtml}
      </div>
      <div class="campaign-card-body">
        <div style="margin-bottom: 0.5rem;">${statusBadge}</div>
        <h3 class="campaign-card-title">${campaign.title}</h3>
        <p class="campaign-card-text">${campaign.description}</p>
        <div class="campaign-card-footer">
          <span style="font-size: 0.85rem; color: #666;">${campaign.frames ? campaign.frames.length : 0} bingkai</span>
          <a href="editor.html?campaign=${campaign.id}" class="btn btn-primary btn-sm">Gunakan Bingkai</a>
        </div>
      </div>
    `;
    
    return card;
  }

  // Render campaigns to container
  async function renderCampaigns(containerId, filter = 'all', searchQuery = '') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<div class="spinner"></div>';
    
    let campaigns = (await loadCampaigns()).campaigns;
    
    // Apply filter
    if (filter === 'active') {
      campaigns = campaigns.filter(c => c.status === 'active');
    } else if (filter !== 'all') {
      campaigns = campaigns.filter(c => c.category === filter);
    }
    
    // Apply search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      campaigns = campaigns.filter(c => 
        c.title.toLowerCase().includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery)
      );
    }
    
    container.innerHTML = '';
    
    if (campaigns.length === 0) {
      const noResults = document.getElementById('no-results');
      if (noResults) noResults.style.display = 'block';
      return;
    }
    
    const noResults = document.getElementById('no-results');
    if (noResults) noResults.style.display = 'none';
    
    campaigns.forEach(campaign => {
      container.appendChild(renderCampaignCard(campaign));
    });
  }

  // Render featured campaigns (active only, limited)
  async function renderFeaturedCampaigns(containerId, limit = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const activeCampaigns = await getActiveCampaigns();
    container.innerHTML = '';
    
    if (activeCampaigns.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">Belum ada kampanye aktif.</p>';
      return;
    }
    
    activeCampaigns.slice(0, limit).forEach(campaign => {
      container.appendChild(renderCampaignCard(campaign));
    });
  }

  return {
    loadCampaigns,
    getCampaignById,
    getActiveCampaigns,
    getCampaignsByCategory,
    searchCampaigns,
    renderCampaignCard,
    renderCampaigns,
    renderFeaturedCampaigns
  };
})();
