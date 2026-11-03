/* ============================================
   DAARUL AZMI TWIBBON STUDIO - Editor Module
   ============================================ */

const EditorModule = (function() {
  'use strict';

  let currentCampaign = null;
  let currentFrameIndex = 0;
  let currentFile = null;

  // Get base path for subdomain support
  function getBasePath() {
    const hostname = window.location.hostname;
    if (hostname.includes('twibbon.daarulazmi')) {
      return '';
    }
    return '/twibbon';
  }

  // Get full image URL with cache busting
  function getImageUrl(path) {
    if (!path) return '';
    // External URLs (ImgBB) - use directly
    if (path.startsWith('http://') || path.startsWith('https://')) {
      // Add CORS parameter for ImgBB
      if (path.includes('i.ibb.co')) {
        return path + (path.includes('?') ? '&' : '?') + 'cors=true';
      }
      return path;
    }
    // Base64 images - return as-is
    if (path.startsWith('data:')) {
      return path;
    }
    // Relative paths - add base path and cache busting
    const basePath = getBasePath();
    const cleanPath = basePath ? basePath + '/' + path : path;
    return cleanPath + '?v=' + Date.now();
  }

  // Initialize editor page
  async function init() {
    // Check if this is the editor page
    if (!document.getElementById('editor-canvas')) return;
    
    // Initialize canvas
    CanvasEngine.init('editor-canvas');
    CanvasEngine.setupSliders();
    
    // Get campaign ID and frame index from URL
    const urlParams = new URLSearchParams(window.location.search);
    const campaignId = urlParams.get('campaign');
    const frameIndex = urlParams.get('frame');
    
    if (!campaignId) {
      showNotification('Pilih kampanye terlebih dahulu', 'error');
      setTimeout(() => {
        window.location.href = 'kampanye.html';
      }, 2000);
      return;
    }
    
    // Load campaign data
    try {
      currentCampaign = await CampaignsModule.getCampaignById(campaignId);
      
      if (!currentCampaign) {
        showNotification('Kampanye tidak ditemukan', 'error');
        return;
      }
      
      // Update page title
      document.getElementById('campaign-title').textContent = currentCampaign.title;
      document.title = currentCampaign.title + ' - Editor Twibbon';
      
      // Update OG meta tags with campaign cover (convert relative path to absolute URL)
      if (currentCampaign.cover) {
        const ogImage = document.getElementById('og-image');
        const ogImageSecure = document.getElementById('og-image-secure');
        const ogImageAlt = document.getElementById('og-image-alt');
        const ogDescription = document.querySelector('meta[name="description"]');
        
        // Convert relative path to absolute URL for OG
        let coverUrl = currentCampaign.cover;
        if (coverUrl && !coverUrl.startsWith('http')) {
          coverUrl = 'https://twibbon.daarulazmi.ponpes.id/' + coverUrl;
        }
        
        if (ogImage) ogImage.setAttribute('content', coverUrl);
        if (ogImageSecure) ogImageSecure.setAttribute('content', coverUrl);
        if (ogImageAlt) ogImageAlt.setAttribute('content', currentCampaign.title);
        if (ogDescription) ogDescription.setAttribute('content', currentCampaign.description);
      }
      
      // Set frame index from URL parameter if provided
      if (frameIndex !== null) {
        currentFrameIndex = parseInt(frameIndex, 10) || 0;
      }
      
      // Load frames
      await loadFrames(currentCampaign.frames);
      
      // Setup event listeners
      setupEventListeners();
      
    } catch (error) {
      console.error('Error initializing editor:', error);
      showNotification('Gagal memuat kampanye', 'error');
    }
  }

  // Load frame options
  async function loadFrames(frames) {
    if (!frames || frames.length === 0) {
      console.warn('No frames available for this campaign');
      return;
    }
    
    const frameOptionsContainer = document.getElementById('frame-options');
    const frameSelection = document.getElementById('frame-selection');
    
    if (!frameOptionsContainer || !frameSelection) return;
    
    frameOptionsContainer.innerHTML = '';
    frameSelection.style.display = 'block';
    
    frames.forEach((frame, index) => {
      const option = document.createElement('div');
      option.className = 'frame-option-editor' + (index === currentFrameIndex ? ' selected' : '');
      
      const frameUrl = getImageUrl(frame.image);
      const imgHtml = frameUrl
        ? `<img src="${frameUrl}" alt="${frame.name}" onerror="this.style.display='none'">`
        : '<div style="width:100%;height:80px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#999;font-size:0.8rem;">DEMO</div>';
      
      option.innerHTML = `
        ${imgHtml}
        <div class="frame-name">${frame.name}</div>
      `;
      
      option.addEventListener('click', () => {
        // Update selected state
        frameOptionsContainer.querySelectorAll('.frame-option-editor').forEach(el => {
          el.classList.remove('selected');
        });
        option.classList.add('selected');
        
        currentFrameIndex = index;
        loadCurrentFrame();
      });
      
      frameOptionsContainer.appendChild(option);
    });
    
    // Load first frame
    await loadCurrentFrame();
  }

  // Load current selected frame
  async function loadCurrentFrame() {
    if (!currentCampaign || !currentCampaign.frames || !currentCampaign.frames[currentFrameIndex]) {
      return;
    }
    
    const frame = currentCampaign.frames[currentFrameIndex];
    
    if (frame.image) {
      try {
        const frameUrl = getImageUrl(frame.image);
        console.log('Loading frame image:', frameUrl);
        await CanvasEngine.loadFrame(frameUrl);
        console.log('Frame image loaded successfully');
      } catch (error) {
        console.error('Error loading frame:', error);
        showNotification('Gagal memuat bingkai, menggunakan mode DEMO', 'error');
        // Create a demo frame
        createDemoFrame();
      }
    } else {
      createDemoFrame();
    }
  }

  // Create a demo frame when no frame image is available
  function createDemoFrame() {
    const canvas = document.getElementById('editor-canvas');
    if (!canvas) return;
    
    // Set canvas to 1080x1080
    canvas.width = 1080;
    canvas.height = 1080;
    
    const ctx = canvas.getContext('2d');
    
    // Draw a simple border frame
    ctx.strokeStyle = '#1a5d1a';
    ctx.lineWidth = 40;
    ctx.strokeRect(20, 20, 1040, 1040);
    
    // Add inner border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 10;
    ctx.strokeRect(60, 60, 960, 960);
    
    // Add text at bottom
    ctx.fillStyle = '#1a5d1a';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DAARUL AZMI', 540, 1000);
    
    ctx.fillStyle = '#d4af37';
    ctx.font = '36px Arial';
    ctx.fillText(currentCampaign ? currentCampaign.title : 'Twibbon Studio', 540, 1050);
    
    // Re-render if photo exists
    CanvasEngine.render();
  }

  // Setup event listeners
  function setupEventListeners() {
    // Upload button
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => {
        fileInput.click();
      });
      
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          handlePhotoUpload(file);
        }
      });
    }
    
    // Change photo button
    const changePhotoBtn = document.getElementById('change-photo-btn');
    if (changePhotoBtn && fileInput) {
      changePhotoBtn.addEventListener('click', () => {
        fileInput.click();
      });
    }
    
    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        CanvasEngine.resetPhotoState();
        showNotification('Posisi foto direset');
      });
    }
    
    // Download buttons
    const downloadPng = document.getElementById('download-png');
    const downloadJpg = document.getElementById('download-jpg');
    
    if (downloadPng) {
      downloadPng.addEventListener('click', () => {
        downloadImage('png');
      });
    }
    
    if (downloadJpg) {
      downloadJpg.addEventListener('click', () => {
        downloadImage('jpg');
      });
    }
  }

  // Handle photo upload
  async function handlePhotoUpload(file) {
    try {
      currentFile = file;
      const info = await CanvasEngine.loadPhoto(file);
      
      // Show controls
      document.getElementById('position-controls').style.display = 'block';
      document.getElementById('download-section').style.display = 'block';
      document.getElementById('canvas-placeholder').style.display = 'none';
      
      // Show photo info
      const photoInfo = document.getElementById('photo-info');
      const photoName = document.getElementById('photo-name');
      const photoSize = document.getElementById('photo-size');
      
      if (photoInfo && photoName && photoSize) {
        photoInfo.style.display = 'block';
        photoName.textContent = file.name;
        photoSize.textContent = `${info.width}x${info.height}px • ${(file.size / 1024 / 1024).toFixed(2)}MB`;
      }
      
      showNotification('Foto berhasil diupload');
    } catch (error) {
      console.error('Error uploading photo:', error);
      showNotification(error.message || 'Gagal mengupload foto', 'error');
    }
  }

  // Download image
  function downloadImage(format) {
    const dataURL = CanvasEngine.getDataURL(format);
    if (!dataURL) {
      showNotification('Gagal membuat gambar', 'error');
      return;
    }
    
    const link = document.createElement('a');
    const fileName = currentCampaign 
      ? `twibbon-${currentCampaign.id}.${format}`
      : `twibbon-daarul-azmi.${format}`;
    
    link.download = fileName;
    link.href = dataURL;
    link.click();
    
    showNotification(`Twibbon berhasil didownload (${format.toUpperCase()})`);
  }

  // Show notification
  function showNotification(message, type = 'success') {
    if (AppModule && AppModule.showNotification) {
      AppModule.showNotification(message, type);
    } else {
      // Fallback
      const notification = document.getElementById('notification');
      if (notification) {
        notification.textContent = message;
        notification.className = 'notification show';
        if (type === 'error') {
          notification.classList.add('error');
        }
        setTimeout(() => {
          notification.classList.remove('show');
        }, 3000);
      }
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init
  };
})();
