/* ============================================
   DAARUL AZMI TWIBBON STUDIO - Download Module
   (Integrated with EditorModule, this is a helper)
   ============================================ */

const DownloadModule = (function() {
  'use strict';

  // Download canvas as image
  function download(canvas, filename, format = 'png') {
    if (!canvas) {
      console.error('No canvas provided');
      return;
    }

    let dataURL;
    if (format === 'jpg' || format === 'jpeg') {
      // Create white background for JPG
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);
      dataURL = tempCanvas.toDataURL('image/jpeg', 0.95);
    } else {
      dataURL = canvas.toDataURL('image/png');
    }

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
  }

  return {
    download
  };
})();
