// ============================================
// DAARUL AZMI TWIBBON STUDIO - Admin Panel
// ============================================

(function() {
  'use strict';

  // Check authentication
  function checkAuth() {
    if (sessionStorage.getItem('adminLoggedIn') !== 'true') {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  // Display admin email
  function displayAdminEmail() {
    const email = sessionStorage.getItem('adminEmail');
    const emailEl = document.getElementById('admin-email');
    if (email && emailEl) {
      emailEl.textContent = email;
    }
  }

  // Logout handler
  function setupLogout() {
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', function() {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
          sessionStorage.removeItem('adminLoggedIn');
          sessionStorage.removeItem('adminEmail');
          window.location.href = 'login.html';
        }
      });
    }
  }

  // Load campaigns from localStorage or fallback to JSON file
  function loadCampaigns() {
    const stored = localStorage.getItem('twibbon_campaigns');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  }

  // Save campaigns to localStorage
  function saveCampaigns(campaigns) {
    localStorage.setItem('twibbon_campaigns', JSON.stringify(campaigns));
  }

  // Fetch campaigns from JSON file
  async function fetchCampaignsFromJSON() {
    try {
      const response = await fetch('data/campaigns.json?' + Date.now());
      if (!response.ok) {
        throw new Error('Failed to load campaigns');
      }
      const data = await response.json();
      // Save to localStorage for future edits
      saveCampaigns(data.campaigns);
      return data.campaigns;
    } catch (error) {
      console.error('Error loading campaigns:', error);
      showNotification('Gagal memuat data kampanye', 'error');
      return [];
    }
  }

  // Get all campaigns (localStorage first, then JSON)
  async function getAllCampaigns() {
    let campaigns = loadCampaigns();
    if (!campaigns || campaigns.length === 0) {
      campaigns = await fetchCampaignsFromJSON();
    }
    return campaigns;
  }

  // Update statistics
  function updateStats(campaigns) {
    const total = campaigns.length;
    const active = campaigns.filter(c => c.status === 'active').length;
    const inactive = total - active;
    const frames = campaigns.reduce((sum, c) => sum + (c.frames ? c.frames.length : 0), 0);

    const statTotal = document.getElementById('stat-total');
    const statActive = document.getElementById('stat-active');
    const statInactive = document.getElementById('stat-inactive');
    const statFrames = document.getElementById('stat-frames');

    if (statTotal) statTotal.textContent = total;
    if (statActive) statActive.textContent = active;
    if (statInactive) statInactive.textContent = inactive;
    if (statFrames) statFrames.textContent = frames;
  }

  // Render campaign table
  function renderCampaignTable(campaigns) {
    const tbody = document.getElementById('campaign-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (campaigns.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Belum ada kampanye</td></tr>';
      return;
    }

    campaigns.forEach(function(campaign) {
      const tr = document.createElement('tr');

      const coverImg = campaign.cover ? `<img src="${campaign.cover}" alt="" class="campaign-cover" onerror="this.style.display='none'">` : '-';
      const statusBadge = campaign.status === 'active'
        ? '<span class="badge badge-active">Aktif</span>'
        : '<span class="badge badge-inactive">Tidak Aktif</span>';
      const frameCount = campaign.frames ? campaign.frames.length : 0;
      const dateRange = campaign.startDate && campaign.endDate
        ? `${formatDate(campaign.startDate)} - ${formatDate(campaign.endDate)}`
        : '-';

      tr.innerHTML = `
        <td>${coverImg}</td>
        <td><strong>${escapeHtml(campaign.title)}</strong></td>
        <td>${escapeHtml(campaign.category || '-')}</td>
        <td>${statusBadge}</td>
        <td>${dateRange}</td>
        <td>${frameCount}</td>
        <td class="actions">
          <button class="btn btn-icon btn-edit" onclick="editCampaign('${campaign.id}')" title="Edit">✏️</button>
          <button class="btn btn-icon btn-delete" onclick="deleteCampaign('${campaign.id}')" title="Hapus">🗑️</button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  // Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Show notification
  function showNotification(message, type) {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = 'notification show';
    if (type === 'error') {
      notification.classList.add('error');
    }

    setTimeout(function() {
      notification.classList.remove('show');
    }, 3000);
  }

  // Modal management
  let currentFrames = [];

  function openModal(isEdit) {
    const modal = document.getElementById('campaign-modal');
    const title = document.getElementById('modal-title');

    if (modal) {
      modal.classList.add('show');
    }

    if (title) {
      title.textContent = isEdit ? 'Edit Kampanye' : 'Tambah Kampanye';
    }

    // Reset form
    const form = document.getElementById('campaign-form');
    if (form) {
      form.reset();
    }

    document.getElementById('campaign-id').value = '';
    currentFrames = [];
    renderFrameList();
  }

  function closeModal() {
    const modal = document.getElementById('campaign-modal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  // Frame list management
  function renderFrameList() {
    const frameList = document.getElementById('frame-list');
    if (!frameList) return;

    frameList.innerHTML = '';

    currentFrames.forEach(function(frame, index) {
      const frameItem = document.createElement('div');
      frameItem.className = 'frame-item';
      frameItem.innerHTML = `
        <div style="flex: 1;">
          <input type="text" class="form-control frame-name" value="${escapeHtml(frame.name || '')}" placeholder="Nama bingkai" style="margin-bottom: 0.5rem;">
          <input type="text" class="form-control frame-image" value="${escapeHtml(frame.image || '')}" placeholder="URL gambar bingkai" style="font-size: 0.875rem;">
        </div>
        <button type="button" class="btn-remove-frame" onclick="removeFrame(${index})" title="Hapus bingkai">&times;</button>
      `;
      frameList.appendChild(frameItem);
    });
  }

  function addFrame() {
    currentFrames.push({ name: '', image: '' });
    renderFrameList();
  }

  function removeFrame(index) {
    currentFrames.splice(index, 1);
    renderFrameList();
  }

  // Make functions available globally
  window.addFrame = addFrame;
  window.removeFrame = removeFrame;

  // Edit campaign
  window.editCampaign = function(id) {
    const campaigns = loadCampaigns() || [];
    const campaign = campaigns.find(c => c.id === id);

    if (!campaign) {
      showNotification('Kampanye tidak ditemukan', 'error');
      return;
    }

    // Fill form
    document.getElementById('campaign-id').value = campaign.id || '';
    document.getElementById('campaign-title').value = campaign.title || '';
    document.getElementById('campaign-description').value = campaign.description || '';
    document.getElementById('campaign-category').value = campaign.category || '';
    document.getElementById('campaign-cover').value = campaign.cover || '';
    document.getElementById('campaign-status').value = campaign.status || 'active';
    document.getElementById('campaign-start-date').value = campaign.startDate || '';
    document.getElementById('campaign-end-date').value = campaign.endDate || '';

    // Load frames
    currentFrames = campaign.frames ? JSON.parse(JSON.stringify(campaign.frames)) : [];
    renderFrameList();

    // Open modal
    openModal(true);
  };

  // Delete campaign
  window.deleteCampaign = function(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus kampanye ini?')) {
      return;
    }

    let campaigns = loadCampaigns() || [];
    campaigns = campaigns.filter(c => c.id !== id);
    saveCampaigns(campaigns);

    refreshDashboard();
    showNotification('Kampanye berhasil dihapus');
  };

  // Save campaign
  function saveCampaign() {
    const id = document.getElementById('campaign-id').value;
    const title = document.getElementById('campaign-title').value.trim();
    const description = document.getElementById('campaign-description').value.trim();
    const category = document.getElementById('campaign-category').value;
    const cover = document.getElementById('campaign-cover').value.trim();
    const status = document.getElementById('campaign-status').value;
    const startDate = document.getElementById('campaign-start-date').value;
    const endDate = document.getElementById('campaign-end-date').value;

    // Validation
    if (!title || !description || !category) {
      showNotification('Mohon lengkapi judul, deskripsi, dan kategori', 'error');
      return;
    }

    // Collect frames
    const frameNames = document.querySelectorAll('.frame-name');
    const frameImages = document.querySelectorAll('.frame-image');
    const frames = [];

    frameNames.forEach(function(nameInput, index) {
      const name = nameInput.value.trim();
      const image = frameImages[index].value.trim();
      if (name && image) {
        frames.push({ name: name, image: image });
      }
    });

    let campaigns = loadCampaigns() || [];

    if (id) {
      // Edit existing campaign
      const index = campaigns.findIndex(c => c.id === id);
      if (index !== -1) {
        campaigns[index] = {
          id: id,
          title: title,
          description: description,
          category: category,
          cover: cover,
          status: status,
          startDate: startDate,
          endDate: endDate,
          frames: frames
        };
      }
      showNotification('Kampanye berhasil diperbarui');
    } else {
      // Add new campaign
      const newId = 'campaign-' + Date.now();
      campaigns.push({
        id: newId,
        title: title,
        description: description,
        category: category,
        cover: cover,
        status: status,
        startDate: startDate,
        endDate: endDate,
        frames: frames
      });
      showNotification('Kampanye berhasil ditambahkan');
    }

    saveCampaigns(campaigns);
    closeModal();
    refreshDashboard();
  }

  // Refresh dashboard
  async function refreshDashboard() {
    const campaigns = await getAllCampaigns();
    updateStats(campaigns);
    renderCampaignTable(campaigns);
  }

  // Initialize admin panel
  async function init() {
    if (!checkAuth()) return;

    displayAdminEmail();
    setupLogout();

    // Event listeners
    const btnAdd = document.getElementById('btn-add-campaign');
    const btnClose = document.getElementById('modal-close');
    const btnCancel = document.getElementById('btn-cancel-modal');
    const btnSave = document.getElementById('btn-save-campaign');
    const btnAddFrame = document.getElementById('btn-add-frame');

    if (btnAdd) {
      btnAdd.addEventListener('click', function() {
        openModal(false);
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', closeModal);
    }

    if (btnCancel) {
      btnCancel.addEventListener('click', closeModal);
    }

    if (btnSave) {
      btnSave.addEventListener('click', saveCampaign);
    }

    if (btnAddFrame) {
      btnAddFrame.addEventListener('click', addFrame);
    }

    // Close modal on overlay click
    const modal = document.getElementById('campaign-modal');
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeModal();
        }
      });
    }

    // Load initial data
    await refreshDashboard();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
