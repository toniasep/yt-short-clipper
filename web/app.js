const root = document.getElementById('app');
const shell = document.createElement('div');
shell.className = 'shell';
root.appendChild(shell);

const header = window.Components.Header();
shell.appendChild(header.element);

const main = document.createElement('main');
main.className = 'main';
shell.appendChild(main);

const aiView = window.Components.AiSettingsView();

const downloadView = window.Components.DownloadView();
const clippingView = window.Components.ClippingView();
main.appendChild(aiView.element);

main.appendChild(downloadView.element);
main.appendChild(clippingView.element);

const navButtons = header.buttons;
const views = [aiView.element, downloadView.element, clippingView.element];

function setActiveView(name) {
  views.forEach((view) => {
    view.classList.toggle('active', view.dataset.view === name);
  });
  navButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === name);
  });

  if (name === 'download') {
    requestAnimationFrame(() => {
      loadDownloadedVideos();
    });
  } else if (name === 'clipping') {
    requestAnimationFrame(() => {
      loadVideoListForClipping();
    });
  }
}

function setProviderType(type, applyBaseUrl) {
  providerType = type;
  aiView.fields.providerButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.provider === type);
  });
  const showCustom = type === 'custom';
  /* hfUrlField removed */
  aiView.fields.cmUrlField.classList.toggle('hidden', !showCustom);
  aiView.fields.hmUrlField.classList.toggle('hidden', !showCustom);
  if (applyBaseUrl && !showCustom) {
    const baseUrl = type === 'ytclip' ? 'https://ai-api.ytclip.org/v1' : 'https://api.openai.com/v1';
    /* hfUrl removed */
    aiView.fields.cmUrl.value = baseUrl;
    aiView.fields.hmUrl.value = baseUrl;
  }
}



navButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    setActiveView(btn.dataset.view);
  });
});

aiView.fields.saveBtn.addEventListener('click', async () => {
  const payload = {
    _provider_type: providerType,
    /* highlight_finder removed */
    caption_maker: {
      base_url: aiView.fields.cmUrl.value.trim(),
      api_key: aiView.fields.cmKey.value.trim(),
      model: aiView.fields.cmModel.value.trim()
    },
    hook_maker: {
      base_url: aiView.fields.hmUrl.value.trim(),
      api_key: aiView.fields.hmKey.value.trim(),
      model: aiView.fields.hmModel.value.trim()
    }
  };
  aiView.fields.status.textContent = 'Saving';
  try {
    const res = await window.pywebview.api.save_ai_settings(payload);
    aiView.fields.status.textContent = res && res.status === 'saved' ? 'Saved' : 'Error';
  } catch {
    aiView.fields.status.textContent = 'Error';
  }
});

async function init() {
  await waitForApi();
  setIconFallback();
  await setIconFromApi();
  if (!header.icon.src) {
    try {
      const paths = await window.pywebview.api.get_asset_paths();
      if (paths && paths.icon) {
        header.icon.src = toFileUrl(paths.icon);
      }
    } catch { }
  }
  try {
    const ai = await window.pywebview.api.get_ai_settings();
    /* hf settings removed */
    const cm = ai.caption_maker || {};
    const hm = ai.hook_maker || {};
    /* hf fields population removed */
    aiView.fields.cmUrl.value = cm.base_url || '';
    aiView.fields.cmKey.value = cm.api_key || '';
    setSelectOptions(aiView.fields.cmModel, [cm.model].filter(Boolean), cm.model || '');
    aiView.fields.hmUrl.value = hm.base_url || '';
    aiView.fields.hmKey.value = hm.api_key || '';
    setSelectOptions(aiView.fields.hmModel, [hm.model].filter(Boolean), hm.model || '');
  } catch { }
  try {
    const provider = await window.pywebview.api.get_provider_type();
    providerType = provider.provider_type || 'ytclip';
  } catch { }
  setProviderType(providerType, true);
  setActiveView('download'); // Default to download view

  // Videos will be loaded when Download tab is clicked
  // This ensures DOM is fully ready
}

aiView.fields.providerButtons.forEach((btn) => {
  btn.addEventListener('click', () => setProviderType(btn.dataset.provider, true));
});

aiView.fields.hfEye.addEventListener('click', () => toggleEye(aiView.fields.hfKey, aiView.fields.hfEye));
aiView.fields.cmEye.addEventListener('click', () => toggleEye(aiView.fields.cmKey, aiView.fields.cmEye));
aiView.fields.hmEye.addEventListener('click', () => toggleEye(aiView.fields.hmKey, aiView.fields.hmEye));

async function validateAndLoad(kind) {
  const baseUrl = kind.url.value.trim();
  const apiKey = kind.key.value.trim();
  kind.status.textContent = 'Validating';
  const res = await window.pywebview.api.validate_api_key(baseUrl, apiKey);
  if (!res || res.status !== 'ok') {
    kind.status.textContent = res && res.message ? res.message : 'Invalid';
    return;
  }
  kind.status.textContent = 'Loading models';
  const modelsRes = await window.pywebview.api.get_models(baseUrl, apiKey);
  const models = (modelsRes && modelsRes.models) || [];
  setSelectOptions(kind.model, models, kind.model.value);
  kind.status.textContent = models.length ? 'Valid' : 'Valid, no models';
}

aiView.fields.hfValidateBtn.addEventListener('click', () => validateAndLoad({
  url: aiView.fields.hfUrl,
  key: aiView.fields.hfKey,
  model: aiView.fields.hfModel,
  status: aiView.fields.hfValidateStatus
}));

aiView.fields.cmValidateBtn.addEventListener('click', () => validateAndLoad({
  url: aiView.fields.cmUrl,
  key: aiView.fields.cmKey,
  model: aiView.fields.cmModel,
  status: aiView.fields.cmValidateStatus
}));

aiView.fields.hmValidateBtn.addEventListener('click', () => validateAndLoad({
  url: aiView.fields.hmUrl,
  key: aiView.fields.hmKey,
  model: aiView.fields.hmModel,
  status: aiView.fields.hmValidateStatus
}));

// Cookies upload functionality
async function uploadCookies() {
  const fileInput = downloadView.fields.cookiesFileInput;
  if (!fileInput.files || fileInput.files.length === 0) {
    downloadView.fields.cookiesStatus.textContent = 'Please select a file';
    return;
  }

  const file = fileInput.files[0];
  downloadView.fields.cookiesStatus.textContent = 'Uploading...';
  downloadView.fields.cookiesUploadBtn.disabled = true;

  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      try {
        const res = await window.pywebview.api.upload_cookies(content);
        if (res && res.status === 'success') {
          downloadView.fields.cookiesStatus.textContent = '✓ Cookies uploaded successfully';
        } else {
          downloadView.fields.cookiesStatus.textContent = res?.message || 'Upload failed';
        }
      } catch (err) {
        downloadView.fields.cookiesStatus.textContent = 'Error: ' + err.message;
      } finally {
        downloadView.fields.cookiesUploadBtn.disabled = false;
      }
    };
    reader.onerror = () => {
      downloadView.fields.cookiesStatus.textContent = 'Error reading file';
      downloadView.fields.cookiesUploadBtn.disabled = false;
    };
    reader.readAsText(file);
  } catch (e) {
    downloadView.fields.cookiesStatus.textContent = 'Error: ' + e.message;
    downloadView.fields.cookiesUploadBtn.disabled = false;
  }
}

// Load downloaded videos for Download view
async function loadDownloadedVideos() {
  console.log('[JS] loadDownloadedVideos() called');

  try {
    const videos = await window.pywebview.api.get_downloaded_videos();
    console.log('[JS] Got videos:', videos);

    const listElement = document.getElementById('video-list');

    if (!listElement) {
      alert('ERROR: video-list element not found in DOM!');
      console.error('[JS] Cannot find #video-list element');
      return;
    }

    if (!videos || videos.length === 0) {
      listElement.innerHTML = '<div class="empty-state">Belum ada video yang di-download</div>';
      return;
    }

    // Build HTML manually
    let html = '';
    videos.forEach(function (v) {
      html += '<div class="video-item" style="padding:16px;margin:8px 0;background:#1a1a1a;border:1px solid #333;border-radius:8px;">';
      html += '<div class="video-info">';
      html += '<div class="video-title" style="font-size:15px;font-weight:600;color:#fff;margin-bottom:6px;">' + (v.title || 'Unknown') + '</div>';
      html += '<div class="video-path" style="font-size:12px;color:#999;">' + v.id + '.mp4</div>';
      html += '</div>';
      html += '<div class="video-actions" style="margin-top:8px;display:flex;gap:8px;">';
      html += '<button class="btn ghost copy-link-btn" data-url="' + (v.url || ('https://www.youtube.com/watch?v=' + v.id)) + '" style="padding:8px 16px;">📋 Copy Link</button>';
      html += '<button class="btn ghost delete-video-btn" data-video-id="' + v.id + '" style="padding:8px 16px;">🗑️ Delete</button>';
      html += '</div>';
      html += '</div>';
    });

    listElement.innerHTML = html;

    // Add delete handlers
    const deleteButtons = document.querySelectorAll('.delete-video-btn');
    deleteButtons.forEach(function (btn) {
      btn.onclick = async function () {
        const videoId = this.getAttribute('data-video-id');
        if (confirm('Delete video ' + videoId + '?')) {
          try {
            await window.pywebview.api.delete_downloaded_video(videoId);
            loadDownloadedVideos();
          } catch (err) {
            alert('Error: ' + err.message);
          }
        }
      };
    });

    // Add copy handlers
    const copyButtons = document.querySelectorAll('.copy-link-btn');
    copyButtons.forEach(function (btn) {
      btn.onclick = function () {
        const url = this.getAttribute('data-url');
        if (url) {
          navigator.clipboard.writeText(url).then(() => {
            const originalText = this.textContent;
            this.textContent = 'Copied!';
            setTimeout(() => this.textContent = originalText, 2000);
          }).catch(() => {
            alert('Copy failed. URL: ' + url);
          });
        }
      };
    });

  } catch (e) {
    console.error('[JS] Error:', e);
    alert('ERROR in loadDownloadedVideos: ' + e.message);
  }
}

// Global function for manual testing
window.testLoadVideos = function () {
  console.log('[TEST] Manual trigger');
  loadDownloadedVideos();
};

// Also expose for debugging
window.downloadView = downloadView;

// Load video list for Clipping view
async function loadVideoListForClipping() {
  try {
    const videos = await window.pywebview.api.get_downloaded_videos();

    const videoSelect = clippingView.fields.videoSelect;
    videoSelect.innerHTML = '<option value="">-- Pilih video yang sudah di-download --</option>';

    if (videos && videos.length > 0) {
      videos.forEach(v => {
        const option = document.createElement('option');
        option.value = v.id;
        option.textContent = v.title || v.id;
        videoSelect.appendChild(option);
      });
    }
  } catch (e) {
    console.error('Error loading video list for clipping:', e);
  }
}

// Check cookies status on init
async function checkCookiesStatus() {
  try {
    const res = await window.pywebview.api.check_cookies();
    if (res && res.exists) {
      downloadView.fields.cookiesStatus.textContent = '✓ Cookies file found';
    } else {
      downloadView.fields.cookiesStatus.textContent = 'No cookies file. Please upload cookies.txt';
    }
  } catch (e) {
    downloadView.fields.cookiesStatus.textContent = 'Could not check cookies status';
  }
}

// Download functionality with queue system
let downloadPolling = null;
let downloadQueue = [];
let currentDownload = null;
let isDownloading = false;

async function startDownload() {
  const urls = downloadView.fields.urlTextarea.value
    .split('\n')
    .map(u => u.trim())
    .filter(u => u && (u.includes('youtube.com') || u.includes('youtu.be')));

  if (urls.length === 0) {
    alert('Masukkan minimal satu URL YouTube');
    return;
  }

  // Add to queue
  downloadQueue = urls.map((url, index) => ({
    id: Date.now() + index,
    url,
    status: 'pending',
    title: 'Loading...',
    progress: 0
  }));

  // Show queue
  updateQueueDisplay();
  downloadView.fields.queueSection.style.display = 'block';
  downloadView.fields.downloadBtn.disabled = true;
  downloadView.fields.urlTextarea.disabled = true;

  // Start processing queue
  processDownloadQueue();
}

function updateQueueDisplay() {
  const queueHtml = downloadQueue.map(item => {
    let statusText = '';
    let statusClass = '';

    if (item.status === 'pending') {
      statusText = 'Menunggu...';
      statusClass = 'queue-pending';
    } else if (item.status === 'downloading') {
      statusText = `Downloading ${item.progress.toFixed(0)}%`;
      statusClass = 'queue-active';
    } else if (item.status === 'complete') {
      statusText = '✓ Selesai';
      statusClass = 'queue-complete';
    } else if (item.status === 'error') {
      statusText = `✗ Error: ${item.error || 'Unknown'}`;
      statusClass = 'queue-error';
    }

    return `
      <div class="queue-item ${statusClass}">
        <div class="queue-info">
          <div class="queue-title">${item.title}</div>
          <div class="queue-url">${item.url}</div>
        </div>
        <div class="queue-status">${statusText}</div>
      </div>
    `;
  }).join('');

  downloadView.fields.queueList.innerHTML = queueHtml;
}

async function processDownloadQueue() {
  if (isDownloading || downloadQueue.length === 0) {
    // All done
    downloadView.fields.downloadBtn.disabled = false;
    downloadView.fields.urlTextarea.disabled = false;
    downloadView.fields.status.textContent = `Selesai! ${downloadQueue.filter(d => d.status === 'complete').length} dari ${downloadQueue.length} video berhasil di-download.`;
    return;
  }

  // Get next pending item
  const nextItem = downloadQueue.find(d => d.status === 'pending');
  if (!nextItem) {
    // All processed
    downloadView.fields.downloadBtn.disabled = false;
    downloadView.fields.urlTextarea.disabled = false;
    const successCount = downloadQueue.filter(d => d.status === 'complete').length;
    downloadView.fields.status.textContent = `Batch download selesai! ${successCount}/${downloadQueue.length} video berhasil.`;
    return;
  }

  isDownloading = true;
  currentDownload = nextItem;
  nextItem.status = 'downloading';
  updateQueueDisplay();

  downloadView.fields.status.textContent = `Downloading: ${nextItem.url}`;
  downloadView.fields.bar.style.width = '0%';

  try {
    const res = await window.pywebview.api.download_video(nextItem.url);
    if (res && res.status === 'started') {
      pollDownload();
      downloadPolling = setInterval(pollDownload, 500);
    } else {
      nextItem.status = 'error';
      nextItem.error = res?.message || 'Failed to start';
      updateQueueDisplay();
      isDownloading = false;
      processDownloadQueue(); // Continue to next
    }
  } catch (e) {
    nextItem.status = 'error';
    nextItem.error = e.message;
    updateQueueDisplay();
    isDownloading = false;
    processDownloadQueue(); // Continue to next
  }
}

async function pollDownload() {
  try {
    const p = await window.pywebview.api.get_download_progress();
    const pr = Math.max(0, Math.min(1, p.progress || 0));
    downloadView.fields.bar.style.width = (pr * 100).toFixed(1) + '%';
    downloadView.fields.status.textContent = p.status || '';

    // Update current download progress in queue
    if (currentDownload) {
      currentDownload.progress = pr * 100;
      // Update title if available in status
      if (p.status && p.status.includes('Title:')) {
        const match = p.status.match(/Title: (.+)/);
        if (match) {
          currentDownload.title = match[1].substring(0, 50) + '...';
        }
      }
      updateQueueDisplay();
    }

    if (p.status && (p.status.startsWith('error') || p.status === 'complete')) {
      clearInterval(downloadPolling);
      downloadPolling = null;

      if (currentDownload) {
        if (p.status === 'complete') {
          currentDownload.status = 'complete';
          currentDownload.progress = 100;
        } else {
          currentDownload.status = 'error';
          currentDownload.error = p.status.replace('error: ', '');
        }
        updateQueueDisplay();
      }

      if (p.status === 'complete') {
        loadDownloadedVideos();
        loadVideoListForClipping();
      }

      isDownloading = false;
      currentDownload = null;

      // Process next in queue
      setTimeout(() => processDownloadQueue(), 500);
    }
  } catch {
    clearInterval(downloadPolling);
    downloadPolling = null;
    if (currentDownload) {
      currentDownload.status = 'error';
      currentDownload.error = 'Connection error';
      updateQueueDisplay();
    }
    isDownloading = false;
    currentDownload = null;
    processDownloadQueue(); // Continue to next
  }
}



// Clipping functionality
let clippingPolling = null;

async function startClipping() {
  console.log('[JS] startClipping triggered');
  const videoId = clippingView.fields.videoSelect.value;
  const timestampsJson = clippingView.fields.timestampsInput.value.trim();

  console.log('[JS] Inputs - VideoID:', videoId);
  console.log('[JS] Inputs - JSON Length:', timestampsJson.length);

  if (!videoId) {
    console.warn('[JS] Validation failed: No video selected');
    clippingView.fields.status.textContent = '❌ Error: Pilih video terlebih dahulu (di dropdown atas)';
    clippingView.fields.status.style.color = '#ff6b6b';
    return;
  }

  if (!timestampsJson) {
    console.warn('[JS] Validation failed: No JSON');
    clippingView.fields.status.textContent = '❌ Error: Masukkan timestamps format JSON';
    clippingView.fields.status.style.color = '#ff6b6b';
    return;
  }

  // Validate JSON
  let timestamps;
  try {
    timestamps = JSON.parse(timestampsJson);
    if (!Array.isArray(timestamps)) {
      console.warn('[JS] Validation failed: JSON is not array');
      clippingView.fields.status.textContent = '❌ Error: Timestamps harus berupa array JSON [...]';
      clippingView.fields.status.style.color = '#ff6b6b';
      return;
    }
  } catch (e) {
    console.error('[JS] JSON Parse error:', e);
    clippingView.fields.status.textContent = '❌ JSON Error: ' + e.message;
    clippingView.fields.status.style.color = '#ff6b6b';
    return;
  }

  // Reset status style
  clippingView.fields.status.style.color = '';

  // Settings
  const watermarkPath = clippingView.fields.watermarkPath.dataset.path || null;
  const smartCrop = clippingView.fields.crop.checked;
  const resolution = clippingView.fields.resolution.value;

  console.log('[JS] Settings:', { watermarkPath, smartCrop, resolution, caption: clippingView.fields.captions.checked });

  clippingView.fields.startBtn.disabled = true;
  clippingView.fields.videoSelect.disabled = true;
  clippingView.fields.timestampsInput.disabled = true;
  clippingView.fields.status.textContent = 'Starting clipping...';
  clippingView.fields.bar.style.width = '0%';

  try {
    console.log('[JS] Calling pywebview.api.start_clipping...');
    const res = await window.pywebview.api.start_clipping(
      videoId,
      timestamps,
      clippingView.fields.captions.checked,
      clippingView.fields.hook.checked,
      clippingView.fields.subtitle.value,
      watermarkPath,
      smartCrop,
      resolution
    );
    console.log('[JS] API Response:', res);

    if (res && res.status === 'started') {
      pollClipping();
      clippingPolling = setInterval(pollClipping, 500);
    } else {
      console.warn('[JS] API status not started:', res);
      clippingView.fields.status.textContent = res?.message || 'Failed to start clipping';
      unlockClippingControls();
    }
  } catch (e) {
    console.error('[JS] API Exception:', e);
    clippingView.fields.status.textContent = 'Error: ' + e.message;
    unlockClippingControls();
  }
}

async function pollClipping() {
  try {
    const p = await window.pywebview.api.get_clipping_progress();
    const pr = Math.max(0, Math.min(1, p.progress || 0));
    clippingView.fields.bar.style.width = (pr * 100).toFixed(1) + '%';
    clippingView.fields.status.textContent = p.status || '';
    if (p.status && (p.status.startsWith('error') || p.status === 'complete')) {
      clearInterval(clippingPolling);
      clippingPolling = null;
      unlockClippingControls();
    }
  } catch {
    clearInterval(clippingPolling);
    clippingPolling = null;
    unlockClippingControls();
  }
}

function unlockClippingControls() {
  clippingView.fields.startBtn.disabled = false;
  clippingView.fields.videoSelect.disabled = false;
  clippingView.fields.timestampsInput.disabled = false;
}

downloadView.fields.cookiesUploadBtn.addEventListener('click', uploadCookies);
downloadView.fields.downloadBtn.addEventListener('click', startDownload);
clippingView.fields.startBtn.addEventListener('click', startClipping);

clippingView.fields.watermarkBtn.addEventListener('click', async () => {
  try {
    const path = await window.pywebview.api.browse_file('Image Files (*.png;*.jpg;*.jpeg)');
    if (path) {
      clippingView.fields.watermarkPath.textContent = path;
      clippingView.fields.watermarkPath.dataset.path = path;
      clippingView.fields.watermarkBtn.textContent = 'Change Watermark';
    }
  } catch (e) { console.error('Browse error:', e); }
});

window.addEventListener('pywebviewready', init);
setTimeout(() => {
  init();
  checkCookiesStatus();
}, 800);

