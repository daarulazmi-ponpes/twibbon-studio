/* ============================================
   DAARUL AZMI TWIBBON STUDIO - Canvas Engine
   ============================================ */

const CanvasEngine = (function() {
  'use strict';

  let canvas = null;
  let ctx = null;
  let frameImage = null;
  let userPhoto = null;
  
  // Photo state
  let photoState = {
    x: 0,
    y: 0,
    zoom: 1,
    rotation: 0
  };
  
  // Drag state
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let photoStart = { x: 0, y: 0 };
  
  // Touch state for pinch zoom
  let lastTouchDistance = 0;
  let lastTouchRotation = 0;

  // Initialize canvas
  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error('Canvas element not found');
      return false;
    }
    ctx = canvas.getContext('2d');
    
    // Setup event listeners
    setupMouseEvents();
    setupTouchEvents();
    
    return true;
  }

  // Load frame image
  function loadFrame(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        frameImage = img;
        // Set canvas size to match frame
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        resetPhotoState();
        render();
        resolve(img);
      };
      img.onerror = () => {
        reject(new Error('Failed to load frame: ' + src));
      };
      img.src = src;
    });
  }

  // Load user photo
  function loadPhoto(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        reject(new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          userPhoto = img;
          resetPhotoState();
          render();
          resolve({
            image: img,
            name: file.name,
            size: file.size,
            width: img.naturalWidth,
            height: img.naturalHeight
          });
        };
        img.onerror = () => reject(new Error('Gagal memuat foto'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  }

  // Reset photo state
  function resetPhotoState() {
    photoState = {
      x: 0,
      y: 0,
      zoom: 1,
      rotation: 0
    };
    
    // Update sliders
    const posXSlider = document.getElementById('pos-x');
    const posYSlider = document.getElementById('pos-y');
    const zoomSlider = document.getElementById('zoom');
    const rotateSlider = document.getElementById('rotate');
    
    if (posXSlider) posXSlider.value = 0;
    if (posYSlider) posYSlider.value = 0;
    if (zoomSlider) zoomSlider.value = 100;
    if (rotateSlider) rotateSlider.value = 0;
    
    updateSliderValues();
  }

  // Render canvas
  function render() {
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw user photo if exists
    if (userPhoto) {
      ctx.save();
      
      // Move to center of canvas
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.translate(centerX + photoState.x, centerY + photoState.y);
      ctx.rotate(photoState.rotation * Math.PI / 180);
      ctx.scale(photoState.zoom, photoState.zoom);
      
      // Calculate photo size to cover canvas
      const photoWidth = userPhoto.naturalWidth;
      const photoHeight = userPhoto.naturalHeight;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      const scale = Math.max(canvasWidth / photoWidth, canvasHeight / photoHeight);
      const drawWidth = photoWidth * scale;
      const drawHeight = photoHeight * scale;
      
      ctx.drawImage(userPhoto, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      
      ctx.restore();
    }
    
    // Draw frame on top
    if (frameImage) {
      ctx.drawImage(frameImage, 0, 0);
    }
  }

  // Setup mouse events for dragging
  function setupMouseEvents() {
    if (!canvas) return;
    
    canvas.addEventListener('mousedown', (e) => {
      if (!userPhoto) return;
      isDragging = true;
      dragStart = { x: e.clientX, y: e.clientY };
      photoStart = { x: photoState.x, y: photoState.y };
      canvas.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      // Scale movement by canvas display ratio
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      photoState.x = photoStart.x + dx * scaleX;
      photoState.y = photoStart.y + dy * scaleY;
      
      updateSlidersFromState();
      render();
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
      if (canvas) canvas.style.cursor = 'move';
    });
    
    // Mouse wheel for zoom
    canvas.addEventListener('wheel', (e) => {
      if (!userPhoto) return;
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      photoState.zoom = Math.max(0.1, Math.min(3, photoState.zoom + delta));
      
      const zoomSlider = document.getElementById('zoom');
      if (zoomSlider) zoomSlider.value = Math.round(photoState.zoom * 100);
      updateSliderValues();
      
      render();
    }, { passive: false });
  }

  // Setup touch events for mobile
  function setupTouchEvents() {
    if (!canvas) return;
    
    // Single touch for drag
    canvas.addEventListener('touchstart', (e) => {
      if (!userPhoto) return;
      
      if (e.touches.length === 1) {
        isDragging = true;
        dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        photoStart = { x: photoState.x, y: photoState.y };
      } else if (e.touches.length === 2) {
        isDragging = false;
        lastTouchDistance = getTouchDistance(e.touches);
        lastTouchRotation = getTouchAngle(e.touches);
      }
      
      e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
      if (!userPhoto) return;
      
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - dragStart.x;
        const dy = e.touches[0].clientY - dragStart.y;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        photoState.x = photoStart.x + dx * scaleX;
        photoState.y = photoStart.y + dy * scaleY;
        
        updateSlidersFromState();
        render();
      } else if (e.touches.length === 2) {
        // Pinch zoom
        const distance = getTouchDistance(e.touches);
        const scale = distance / lastTouchDistance;
        photoState.zoom = Math.max(0.1, Math.min(3, photoState.zoom * scale));
        lastTouchDistance = distance;
        
        // Two-finger rotation
        const angle = getTouchAngle(e.touches);
        const rotationDelta = angle - lastTouchRotation;
        photoState.rotation += rotationDelta * 0.5;
        lastTouchRotation = angle;
        
        const zoomSlider = document.getElementById('zoom');
        if (zoomSlider) zoomSlider.value = Math.round(photoState.zoom * 100);
        const rotateSlider = document.getElementById('rotate');
        if (rotateSlider) rotateSlider.value = Math.round(photoState.rotation);
        updateSliderValues();
        
        render();
      }
      
      e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchend', () => {
      isDragging = false;
    });
  }

  // Helper: Get distance between two touches
  function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Helper: Get angle between two touches
  function getTouchAngle(touches) {
    return Math.atan2(
      touches[1].clientY - touches[0].clientY,
      touches[1].clientX - touches[0].clientX
    ) * 180 / Math.PI;
  }

  // Update sliders from photo state
  function updateSlidersFromState() {
    const posXSlider = document.getElementById('pos-x');
    const posYSlider = document.getElementById('pos-y');
    
    if (posXSlider) posXSlider.value = Math.round(photoState.x);
    if (posYSlider) posYSlider.value = Math.round(photoState.y);
    updateSliderValues();
  }

  // Update slider value displays
  function updateSliderValues() {
    const posXSlider = document.getElementById('pos-x');
    const posYSlider = document.getElementById('pos-y');
    const zoomSlider = document.getElementById('zoom');
    const rotateSlider = document.getElementById('rotate');
    
    const posXValue = document.getElementById('pos-x-value');
    const posYValue = document.getElementById('pos-y-value');
    const zoomValue = document.getElementById('zoom-value');
    const rotateValue = document.getElementById('rotate-value');
    
    if (posXSlider && posXValue) posXValue.textContent = posXSlider.value;
    if (posYSlider && posYValue) posYValue.textContent = posYSlider.value;
    if (zoomSlider && zoomValue) zoomValue.textContent = zoomSlider.value + '%';
    if (rotateSlider && rotateValue) rotateValue.textContent = rotateSlider.value + '°';
  }

  // Setup slider controls
  function setupSliders() {
    const posXSlider = document.getElementById('pos-x');
    const posYSlider = document.getElementById('pos-y');
    const zoomSlider = document.getElementById('zoom');
    const rotateSlider = document.getElementById('rotate');
    
    if (posXSlider) {
      posXSlider.addEventListener('input', () => {
        photoState.x = parseInt(posXSlider.value);
        updateSliderValues();
        render();
      });
    }
    
    if (posYSlider) {
      posYSlider.addEventListener('input', () => {
        photoState.y = parseInt(posYSlider.value);
        updateSliderValues();
        render();
      });
    }
    
    if (zoomSlider) {
      zoomSlider.addEventListener('input', () => {
        photoState.zoom = parseInt(zoomSlider.value) / 100;
        updateSliderValues();
        render();
      });
    }
    
    if (rotateSlider) {
      rotateSlider.addEventListener('input', () => {
        photoState.rotation = parseInt(rotateSlider.value);
        updateSliderValues();
        render();
      });
    }
  }

  // Get canvas data URL
  function getDataURL(format = 'png') {
    if (!canvas) return null;
    
    if (format === 'jpg') {
      // For JPG, draw white background first
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);
      return tempCanvas.toDataURL('image/jpeg', 0.95);
    }
    
    return canvas.toDataURL('image/png');
  }

  // Public API
  return {
    init,
    loadFrame,
    loadPhoto,
    resetPhotoState,
    render,
    setupSliders,
    updateSliderValues,
    getDataURL,
    getPhotoState: () => photoState,
    setPhotoState: (state) => {
      photoState = { ...photoState, ...state };
      render();
    }
  };
})();
