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

  // GitHub API Configuration
  const GITHUB_REPO = 'daarulazmi-ponpes/twibbon-studio';
  const GITHUB_BRANCH = 'main';
  const GITHUB_API_BASE = 'https://api.github.com';

  // Get GitHub token from localStorage
  function getGitHubToken() {
    return localStorage.getItem('github_token') || '';
  }

  // Save GitHub token to localStorage
  function saveGitHubToken(token) {
    localStorage.setItem('github_token', token);
  }

  // Test GitHub connection
  async function testGitHubConnection() {
    const token = getGitHubToken();
    if (!token) {
      showNotification('Silakan simpan token GitHub terlebih dahulu', 'error');
      return;
    }

    const statusEl = document.getElementById('token-status');
    if (statusEl) {
      statusEl.innerHTML = '<div style="color: #007bff;">🔄 Menguji koneksi...</div>';
    }

    try {
      const response = await fetch(`${GITHUB_API_BASE}/repos/${GITHUB_REPO}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const repo = await response.json();
        if (statusEl) {
          statusEl.innerHTML = '<div style="color: #28a745;">✅ Koneksi berhasil! Repository: ' + repo.name + '</div>';
        }
        showNotification('Koneksi GitHub berhasil!');
      } else {
        if (statusEl) {
          statusEl.innerHTML = '<div style="color: #dc3545;">❌ Gagal terhubung. Periksa token dan repository.</div>';
        }
        showNotification('Gagal terhubung ke GitHub', 'error');
      }
    } catch (error) {
      if (statusEl) {
        statusEl.innerHTML = '<div style="color: #dc3545;">❌ Error: ' + error.message + '</div>';
      }
      showNotification('Error koneksi: ' + error.message, 'error');
    }
  }

  // Get file content from GitHub
  async function getGitHubFile(path, sha = null) {
    const token = getGitHubToken();
    const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${path}`;
    
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    };

    const response = await fetch(url, { headers });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to get file: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.content,
      sha: data.sha
    };
  }

  // Create or update file on GitHub
  async function createOrUpdateFile(path, content, message, sha = null) {
    const token = getGitHubToken();
    const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${path}`;

    const body = {
      message: message,
      content: content,
      branch: GITHUB_BRANCH
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to create file: ${response.status}`);
    }

    return await response.json();
  }

  // Convert base64 to binary blob
  function base64ToBlob(base64, mimeType) {
    const byteString = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeType });
  }

  // Get image MIME type from base64
  function getImageMimeType(base64) {
    if (base64.startsWith('data:image/png')) return 'image/png';
    if (base64.startsWith('data:image/webp')) return 'image/webp';
    if (base64.startsWith('data:image/jpeg')) return 'image/jpeg';
    return 'image/png';
  }

  // Get file extension from MIME type
  function getExtensionFromMime(mimeType) {
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/webp') return 'webp';
    if (mimeType === 'image/jpeg') return 'jpg';
    return 'png';
  }

  // Update deploy progress
  function updateDeployProgress(percent, message) {
    const statusEl = document.getElementById('deploy-status');
    const progressBar = document.getElementById('deploy-progress-bar');
    const progressText = document.getElementById('deploy-progress-text');
    const messageEl = document.getElementById('deploy-message');

    if (statusEl) statusEl.style.display = 'block';
    if (progressBar) progressBar.style.width = percent + '%';
    if (progressText) progressText.textContent = percent + '%';
    if (messageEl) messageEl.textContent = message;
  }

  // Hide deploy progress
  function hideDeployProgress() {
    const statusEl = document.getElementById('deploy-status');
    if (statusEl) statusEl.style.display = 'none';
  }

  // Deploy campaigns to GitHub automatically
  async function deployToGitHub() {
    const token = getGitHubToken();
    if (!token) {
      showNotification('Silakan atur token GitHub di menu ⚙️ Pengaturan terlebih dahulu', 'error');
      return;
    }

    const campaigns = loadCampaigns();
    if (!campaigns || campaigns.length === 0) {
      showNotification('Tidak ada kampanye untuk di-deploy', 'error');
      return;
    }

    updateDeployProgress(0, 'Memulai deploy...');

    try {
      let progress = 0;
      const totalFiles = campaigns.length * 2; // cover + frames per campaign

      // Step 1: Upload images for each campaign
      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        const campaignFolder = 'assets/images/campaigns/' + campaign.id;

        // Upload cover image
        if (campaign.cover && campaign.cover.startsWith('data:')) {
          updateDeployProgress(progress, `Upload cover: ${campaign.title}...`);
          
          const mimeType = getImageMimeType(campaign.cover);
          const ext = getExtensionFromMime(mimeType);
          const coverPath = campaignFolder + '/cover.' + ext;

          try {
            const existing = await getGitHubFile(coverPath);
            const sha = existing ? existing.sha : null;
            await createOrUpdateFile(
              coverPath,
              campaign.cover.replace(/^data:image\/\w+;base64,/, ''),
              `Deploy cover: ${campaign.title}`,
              sha
            );
          } catch (error) {
            console.error('Failed to upload cover:', error);
          }

          progress = Math.round(((i + 1) / totalFiles) * 50);
          updateDeployProgress(progress, `Cover ${campaign.title} berhasil`);
        }

        // Upload frame images
        if (campaign.frames && campaign.frames.length > 0) {
          for (let j = 0; j < campaign.frames.length; j++) {
            const frame = campaign.frames[j];
            if (frame.image && frame.image.startsWith('data:')) {
              updateDeployProgress(progress, `Upload frame ${j + 1}: ${campaign.title}...`);
              
              const mimeType = getImageMimeType(frame.image);
              const ext = getExtensionFromMime(mimeType);
              const framePath = campaignFolder + '/frame-' + (j + 1) + '.' + ext;

              try {
                const existing = await getGitHubFile(framePath);
                const sha = existing ? existing.sha : null;
                await createOrUpdateFile(
                  framePath,
                  frame.image.replace(/^data:image\/\w+;base64,/, ''),
                  `Deploy frame: ${campaign.title} - ${frame.name}`,
                  sha
                );
              } catch (error) {
                console.error('Failed to upload frame:', error);
              }

              progress = Math.round(((i * campaign.frames.length + j + 1) / totalFiles) * 50);
            }
          }
        }
      }

      // Step 2: Update campaigns.json with correct paths
      updateDeployProgress(60, 'Mempersiapkan data JSON...');

      const campaignsData = campaigns.map(c => {
        const newCampaign = { ...c };
        
        // Update cover path
        if (newCampaign.cover && newCampaign.cover.startsWith('data:')) {
          const mimeType = getImageMimeType(newCampaign.cover);
          const ext = getExtensionFromMime(mimeType);
          newCampaign.cover = 'assets/images/campaigns/' + newCampaign.id + '/cover.' + ext;
        }

        // Update frame paths
        if (newCampaign.frames) {
          newCampaign.frames = newCampaign.frames.map((frame, index) => {
            const newFrame = { ...frame };
            if (newFrame.image && newFrame.image.startsWith('data:')) {
              const mimeType = getImageMimeType(newFrame.image);
              const ext = getExtensionFromMime(mimeType);
              newFrame.image = 'assets/images/campaigns/' + newCampaign.id + '/frame-' + (index + 1) + '.' + ext;
            }
            return newFrame;
          });
        }

        return newCampaign;
      });

      const jsonContent = JSON.stringify({ campaigns: campaignsData }, null, 2);

      // Step 3: Update campaigns.json on GitHub
      updateDeployProgress(75, 'Update campaigns.json...');
      
      try {
        const existingJson = await getGitHubFile('data/campaigns.json');
        const jsonSha = existingJson ? existingJson.sha : null;
        await createOrUpdateFile(
          'data/campaigns.json',
          jsonContent,
          'Deploy campaigns: ' + campaigns.length + ' campaigns',
          jsonSha
        );
      } catch (error) {
        console.error('Failed to update campaigns.json:', error);
        throw new Error('Gagal update campaigns.json: ' + error.message);
      }

      // Step 4: Complete
      updateDeployProgress(100, 'Deploy berhasil!');
      
      setTimeout(() => {
        hideDeployProgress();
        showNotification(`✅ Deploy berhasil! ${campaigns.length} kampanye sudah online.`);
      }, 1000);

    } catch (error) {
      updateDeployProgress(0, 'Error: ' + error.message);
      showNotification('Deploy gagal: ' + error.message, 'error');
      console.error('Deploy error:', error);
    }
  }

  // Publish campaigns - generates JSON file for Git commit (fallback method)
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
    const btnDeploy = document.getElementById('btn-deploy');
    const btnSaveToken = document.getElementById('btn-save-token');
    const btnTestToken = document.getElementById('btn-test-token');
    const coverFileInput = document.getElementById('campaign-cover-file');

    // Navigation between pages
    const navLinks = document.querySelectorAll('.admin-nav a[data-page]');
    const dashboardPage = document.querySelector('.admin-card');
    const settingsPage = document.getElementById('settings-page');

    navLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const page = this.getAttribute('data-page');
        
        // Update active state
        navLinks.forEach(function(l) { l.classList.remove('active'); });
        this.classList.add('active');

        // Show/hide pages
        if (page === 'settings') {
          if (dashboardPage) dashboardPage.style.display = 'none';
          if (settingsPage) settingsPage.style.display = 'block';
          
          // Load saved token
          const token = getGitHubToken();
          const tokenInput = document.getElementById('github-token');
          if (tokenInput && token) {
            tokenInput.value = token;
          }
        } else {
          if (dashboardPage) dashboardPage.style.display = 'block';
          if (settingsPage) settingsPage.style.display = 'none';
        }
      });
    });

    if (btnAdd) {
      btnAdd.addEventListener('click', function() {
        openModal(false);
      });
    }

    // Deploy button - automatic GitHub deploy
    if (btnDeploy) {
      btnDeploy.addEventListener('click', function() {
        const campaigns = loadCampaigns() || [];
        
        if (campaigns.length === 0) {
          showNotification('Tidak ada kampanye untuk di-deploy', 'error');
          return;
        }

        const confirmed = confirm(
          '🚀 DEPLOY KE LIVE SITE\n\n' +
          'Semua ' + campaigns.length + ' kampanye akan di-upload ke GitHub secara otomatis.\n' +
          'Gambar dan data JSON akan langsung tersedia di twibbon.daarulazmi.ponpes.id\n\n' +
          'Lanjutkan deploy?'
        );

        if (confirmed) {
          deployToGitHub();
        }
      });
    }

    // Save GitHub token
    if (btnSaveToken) {
      btnSaveToken.addEventListener('click', function() {
        const tokenInput = document.getElementById('github-token');
        const token = tokenInput.value.trim();
        
        if (!token) {
          showNotification('Masukkan token GitHub', 'error');
          return;
        }

        if (!token.startsWith('ghp_')) {
          showNotification('Token GitHub tidak valid. Harus dimulai dengan "ghp_"', 'error');
          return;
        }

        saveGitHubToken(token);
        showNotification('✅ Token GitHub berhasil disimpan!');
        
        const statusEl = document.getElementById('token-status');
        if (statusEl) {
          statusEl.innerHTML = '<div style="color: #28a745;">✅ Token disimpan. Klik "🔍 Test Koneksi" untuk verifikasi.</div>';
        }
      });
    }

    // Test GitHub connection
    if (btnTestToken) {
      btnTestToken.addEventListener('click', testGitHubConnection);
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

    // Cover file upload - store base64 directly
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

          // Validate file size (max 1MB)
          if (file.size > 1 * 1024 * 1024) {
            showNotification('Ukuran file terlalu besar. Maksimal 1MB', 'error');
            e.target.value = '';
            return;
          }

          try {
            const base64 = await fileToBase64(file);
            
            // Store base64 directly - will be uploaded to GitHub on deploy
            window.coverPath = base64;
            
            const coverPreview = document.getElementById('cover-preview');
            const coverPreviewImg = document.getElementById('cover-preview-img');
            coverPreviewImg.src = base64;
            coverPreview.style.display = 'block';
            
            showNotification('Cover dipilih. Akan di-upload saat deploy ke GitHub.');
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
