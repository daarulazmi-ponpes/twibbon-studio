// ============================================
// DAARUL AZMI TWIBBON STUDIO - Admin Panel
// ============================================

(function() {
  'use strict';

  // Global variable for cover path
  window.coverPath = '';

  // Convert file to Base64 (for preview only)
  function fileToBase64(file) {
    return new Promise(function(resolve, reject) {
      const reader = new FileReader();
      reader.onload = function(e) {
        resolve(e.target.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Resize image to OG optimal size (1200x630 max)
  function resizeImageForOG(base64, maxWidth, maxHeight, quality) {
    return new Promise(function(resolve, reject) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with quality
        const resizedBase64 = canvas.toDataURL('image/jpeg', quality || 0.8);
        resolve(resizedBase64);
      };
      img.onerror = reject;
      img.src = base64;
    });
  }

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

  // Load campaigns from localStorage (admin draft)
  function loadCampaigns() {
    const stored = localStorage.getItem('twibbon_campaigns');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  }

  // Save campaigns to localStorage (admin draft)
  function saveCampaigns(campaigns) {
    localStorage.setItem('twibbon_campaigns', JSON.stringify(campaigns));
  }

  // Publish campaigns - generates JSON file for Git commit
  function publishCampaigns() {
    const campaigns = loadCampaigns() || [];
    
    if (campaigns.length === 0) {
      showNotification('Tidak ada kampanye untuk dipublish', 'error');
      return;
    }

    // Generate JSON content
    const jsonContent = JSON.stringify({ campaigns: campaigns }, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaigns.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('File campaigns.json berhasil didownload. Upload file ini ke repositori Git.');
  }

  // Make publish function available globally
  window.publishCampaigns = publishCampaigns;

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

    // Reset cover
    window.coverPath = '';
    const coverPreview = document.getElementById('cover-preview');
    if (coverPreview) {
      coverPreview.style.display = 'none';
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
      
      const previewContent = frame.image 
        ? `<img src="${frame.image}" alt="Preview">`
        : '<div class="placeholder">Belum ada gambar</div>';

      frameItem.innerHTML = `
        <div class="frame-item-header">
          <strong>Bingkai #${index + 1}</strong>
          <button type="button" class="btn-remove-frame" onclick="removeFrame(${index})" title="Hapus bingkai">&times;</button>
        </div>
        <div style="display: flex; gap: 1rem; align-items: flex-start;">
          <div class="frame-item-preview">
            ${previewContent}
          </div>
          <div style="flex: 1;">
            <input type="text" class="form-control frame-name" data-index="${index}" value="${escapeHtml(frame.name || '')}" placeholder="Nama bingkai" style="margin-bottom: 0.5rem;">
            <div class="frame-upload-area">
              <input type="file" class="frame-file-input" data-index="${index}" accept="image/png,image/jpeg,image/webp">
            </div>
            <small style="color: var(--dark-gray);">Pilih gambar PNG transparan dari galeri</small>
          </div>
        </div>
      `;
      frameList.appendChild(frameItem);

      // Add event listener for file upload
      const fileInput = frameItem.querySelector('.frame-file-input');
      fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
          // Validate file type
          if (!file.type.match('image/(png|jpeg|webp)')) {
            showNotification('Format file tidak didukung. Gunakan PNG, JPG, atau WebP', 'error');
            e.target.value = '';
            return;
          }

          // Validate file size (max 2MB)
          if (file.size > 2 * 1024 * 1024) {
            showNotification('Ukuran file terlalu besar. Maksimal 2MB', 'error');
            e.target.value = '';
            return;
          }

          try {
            const base64 = await fileToBase64(file);
            currentFrames[index].image = base64;
            const preview = frameItem.querySelector('.frame-item-preview');
            preview.innerHTML = `<img src="${base64}" alt="Preview">`;
            showNotification('Gambar bingkai berhasil diupload');
          } catch (error) {
            showNotification('Gagal membaca gambar', 'error');
            e.target.value = '';
          }
        }
      });
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
    document.getElementById('campaign-status').value = campaign.status || 'active';
    document.getElementById('campaign-start-date').value = campaign.startDate || '';
    document.getElementById('campaign-end-date').value = campaign.endDate || '';

    // Set cover path and preview
    window.coverPath = campaign.cover || '';
    const coverPreview = document.getElementById('cover-preview');
    const coverPreviewImg = document.getElementById('cover-preview-img');
    if (window.coverPath) {
      coverPreviewImg.src = window.coverPath;
      coverPreview.style.display = 'block';
    } else {
      coverPreview.style.display = 'none';
    }

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
  async function saveCampaign() {
    const id = document.getElementById('campaign-id').value;
    const title = document.getElementById('campaign-title').value.trim();
    const description = document.getElementById('campaign-description').value.trim();
    const category = document.getElementById('campaign-category').value;
    const cover = window.coverPath || '';
    const status = document.getElementById('campaign-status').value;
    const startDate = document.getElementById('campaign-start-date').value;
    const endDate = document.getElementById('campaign-end-date').value;

    // Validation
    if (!title || !description || !category) {
      showNotification('Mohon lengkapi judul, deskripsi, dan kategori', 'error');
      return;
    }

    // Collect frames from currentFrames array (already contains Base64)
    const frameNames = document.querySelectorAll('.frame-name');
    const frames = [];

    frameNames.forEach(function(nameInput, index) {
      const name = nameInput.value.trim();
      const image = currentFrames[index] ? currentFrames[index].image : '';
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
    const btnPublish = document.getElementById('btn-publish');
    const coverFileInput = document.getElementById('campaign-cover-file');

    if (btnAdd) {
      btnAdd.addEventListener('click', function() {
        openModal(false);
      });
    }

    if (btnPublish) {
      btnPublish.addEventListener('click', function() {
        const campaigns = loadCampaigns() || [];
        
        if (campaigns.length === 0) {
          showNotification('Tidak ada kampanye untuk dipublish', 'error');
          return;
        }

        // Show publish instructions modal
        const confirmed = confirm(
          '📤 PUBLISH KAMPANYE\n\n' +
          '1. File campaigns.json akan didownload ke komputer Anda\n' +
          '2. Buka https://github.com/daarulazmi-ponpes/twibbon-studio/tree/main/data\n' +
          '3. Klik "Upload files" dan pilih file campaigns.json yang didownload\n' +
          '4. Klik "Commit changes" di bawah\n' +
          '5. Tunggu 1-2 menit agar GitHub Pages rebuild\n\n' +
          'Lanjutkan download file?'
        );

        if (confirmed) {
          publishCampaigns();
        }
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

    // Cover file upload - generates path suggestion
    if (coverFileInput) {
      coverFileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
          // Validate file type
          if (!file.type.match('image/(png|jpeg|webp)')) {
            showNotification('Format file tidak didukung. Gunakan PNG, JPG, atau WebP', 'error');
            e.target.value = '';
            return;
          }

          // Validate file size (max 5MB for cover)
          if (file.size > 5 * 1024 * 1024) {
            showNotification('Ukuran file terlalu besar. Maksimal 5MB', 'error');
            e.target.value = '';
            return;
          }

          try {
            const base64 = await fileToBase64(file);
            
            // Resize for OG if image is too large
            let previewBase64 = base64;
            if (file.size > 200 * 1024) {
              previewBase64 = await resizeImageForOG(base64, 1200, 630, 0.8);
            }

            // Store the file name as path reference
            const campaignId = document.getElementById('campaign-id').value || 'campaign-' + Date.now();
            window.coverPath = 'campaigns/' + campaignId + '/cover.png';
            
            const coverPreview = document.getElementById('cover-preview');
            const coverPreviewImg = document.getElementById('cover-preview-img');
            coverPreviewImg.src = previewBase64;
            coverPreview.style.display = 'block';
            
            // Update path hint
            const pathHint = document.getElementById('cover-path-hint');
            if (pathHint) {
              pathHint.textContent = window.coverPath;
            }
            
            showNotification('Cover dipilih. Upload file ke: ' + window.coverPath);
          } catch (error) {
            showNotification('Gagal membaca gambar', 'error');
            e.target.value = '';
          }
        }
      });
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
