window.Components = window.Components || {};

window.Components.DownloadView = function () {
  const section = document.createElement('section');
  section.className = 'card glass entrance view';
  section.dataset.view = 'download';

  const title = document.createElement('div');
  title.className = 'section-title';
  title.textContent = 'Download Video YouTube';

  // Cookies upload section
  const cookiesSection = document.createElement('div');
  cookiesSection.className = 'cookies-section';
  cookiesSection.style.marginBottom = '16px';

  const cookiesLabel = document.createElement('div');
  cookiesLabel.className = 'label';
  cookiesLabel.textContent = 'Cookies (Required)';

  const cookiesHelp = document.createElement('div');
  cookiesHelp.className = 'help-text';
  cookiesHelp.innerHTML = 'Upload cookies.txt file untuk download YouTube. <a href="COOKIES.md" target="_blank">Panduan mendapatkan cookies</a>';

  const cookiesInputRow = document.createElement('div');
  cookiesInputRow.className = 'input-row';

  const cookiesFileInput = document.createElement('input');
  cookiesFileInput.type = 'file';
  cookiesFileInput.accept = '.txt';
  cookiesFileInput.id = 'cookies-file';
  cookiesFileInput.className = 'file-input';
  cookiesFileInput.style.display = 'none';

  const cookiesFileLabel = document.createElement('div');
  cookiesFileLabel.className = 'input file-label';
  cookiesFileLabel.textContent = 'Choose cookies.txt file...';
  cookiesFileLabel.style.cursor = 'pointer';
  cookiesFileLabel.onclick = () => cookiesFileInput.click();

  const cookiesUploadBtn = document.createElement('button');
  cookiesUploadBtn.id = 'upload-cookies-btn';
  cookiesUploadBtn.className = 'btn primary';
  cookiesUploadBtn.textContent = 'Upload';

  cookiesInputRow.appendChild(cookiesFileLabel);
  cookiesInputRow.appendChild(cookiesUploadBtn);

  const cookiesStatus = document.createElement('div');
  cookiesStatus.id = 'cookies-status';
  cookiesStatus.className = 'status';

  cookiesSection.appendChild(cookiesLabel);
  cookiesSection.appendChild(cookiesHelp);
  cookiesSection.appendChild(cookiesFileInput);
  cookiesSection.appendChild(cookiesInputRow);
  cookiesSection.appendChild(cookiesStatus);

  // URL input section
  const urlTitle = document.createElement('div');
  urlTitle.className = 'section-title';
  urlTitle.textContent = 'YouTube URLs (Satu per baris untuk batch download)';
  urlTitle.style.marginTop = '24px';

  const urlHelp = document.createElement('div');
  urlHelp.className = 'help-text';
  urlHelp.textContent = 'Paste satu atau beberapa URL YouTube. Satu URL per baris untuk download beberapa video sekaligus.';

  const urlTextarea = document.createElement('textarea');
  urlTextarea.className = 'textarea';
  urlTextarea.placeholder = 'https://www.youtube.com/watch?v=xxxxx\nhttps://www.youtube.com/watch?v=yyyyy\n...';
  urlTextarea.id = 'download-urls';
  urlTextarea.rows = 5;

  const buttonRow = document.createElement('div');
  buttonRow.className = 'input-row';
  buttonRow.style.marginTop = '12px';

  const downloadBtn = document.createElement('button');
  downloadBtn.id = 'download-btn';
  downloadBtn.className = 'btn primary';
  downloadBtn.textContent = 'Download All';

  const clearBtn = document.createElement('button');
  clearBtn.id = 'clear-urls-btn';
  clearBtn.className = 'btn ghost';
  clearBtn.textContent = 'Clear';
  clearBtn.onclick = () => { urlTextarea.value = ''; };

  buttonRow.appendChild(downloadBtn);
  buttonRow.appendChild(clearBtn);

  // Queue status
  const queueSection = document.createElement('div');
  queueSection.className = 'queue-section';
  queueSection.style.marginTop = '16px';
  queueSection.style.display = 'none';

  const queueTitle = document.createElement('div');
  queueTitle.className = 'label';
  queueTitle.textContent = 'Download Queue';

  const queueList = document.createElement('div');
  queueList.id = 'download-queue';
  queueList.className = 'queue-list';

  queueSection.appendChild(queueTitle);
  queueSection.appendChild(queueList);

  const progress = document.createElement('div');
  progress.className = 'progress';
  const bar = document.createElement('div');
  bar.id = 'download-bar';
  bar.className = 'bar';
  progress.appendChild(bar);

  const status = document.createElement('div');
  status.id = 'download-status';
  status.className = 'status';

  // Downloaded videos list
  const listTitle = document.createElement('div');
  listTitle.className = 'section-title';
  listTitle.style.marginTop = '24px';
  listTitle.textContent = 'Video yang Sudah Di-Download';

  // TEST BUTTON
  const testBtn = document.createElement('button');
  testBtn.className = 'btn primary';
  testBtn.textContent = '🔄 TEST LOAD VIDEOS (Click Me!)';
  testBtn.style.marginTop = '12px';
  testBtn.onclick = async function () {
    this.textContent = 'Loading...';
    this.disabled = true;
    try {
      const videos = await window.pywebview.api.get_downloaded_videos();
      alert('Got ' + videos.length + ' videos from API!\n\nTitles:\n' + videos.map(v => v.title).join('\n'));

      const listEl = document.getElementById('video-list');
      if (!listEl) {
        alert('ERROR: video-list element NOT FOUND!');
        return;
      }

      let html = '';
      videos.forEach(v => {
        html += '<div style="padding:12px;margin:8px 0;background:#222;border:1px solid #444;border-radius:8px;">';
        html += '<div style="color:#fff;font-size:14px;font-weight:bold;">' + v.title + '</div>';
        html += '<div style="color:#999;font-size:12px;">' + v.id + '.mp4</div>';
        html += '</div>';
      });

      listEl.innerHTML = html;
      alert('SUCCESS! HTML set. Check if videos appear below.');
    } catch (e) {
      alert('ERROR: ' + e.message);
    } finally {
      this.textContent = '🔄 TEST LOAD VIDEOS (Click Me!)';
      this.disabled = false;
    }
  };

  const videoList = document.createElement('div');
  videoList.id = 'video-list';
  videoList.className = 'video-list';
  videoList.innerHTML = '<div class="empty-state">Belum ada video yang di-download</div>';

  section.appendChild(title);
  section.appendChild(cookiesSection);
  section.appendChild(urlTitle);
  section.appendChild(urlHelp);
  section.appendChild(urlTextarea);
  section.appendChild(buttonRow);
  section.appendChild(queueSection);
  section.appendChild(progress);
  section.appendChild(status);
  section.appendChild(listTitle);
  section.appendChild(testBtn);  // ADD TEST BUTTON
  section.appendChild(videoList);

  // Handle file selection
  cookiesFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      cookiesFileLabel.textContent = e.target.files[0].name;
    }
  });

  return {
    element: section,
    fields: {
      urlTextarea,
      downloadBtn,
      bar,
      status,
      videoList,
      cookiesFileInput,
      cookiesUploadBtn,
      cookiesStatus,
      queueSection,
      queueList
    }
  };
};
