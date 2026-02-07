window.Components = window.Components || {};

window.Components.ClippingView = function () {
    const section = document.createElement('section');
    section.className = 'card glass entrance view';
    section.dataset.view = 'clipping';

    const title = document.createElement('div');
    title.className = 'section-title';
    title.textContent = 'Kelola Clipping';

    // Video selection
    const videoSelectField = document.createElement('div');
    videoSelectField.className = 'field';
    const videoLabel = document.createElement('div');
    videoLabel.className = 'label';
    videoLabel.textContent = 'Pilih Video';
    const videoSelect = document.createElement('select');
    videoSelect.className = 'select';
    videoSelect.id = 'video-select';
    videoSelect.innerHTML = '<option value="">-- Pilih video yang sudah di-download --</option>';
    videoSelectField.appendChild(videoLabel);
    videoSelectField.appendChild(videoSelect);

    // Timestamps JSON input
    const timestampsField = document.createElement('div');
    timestampsField.className = 'field';
    timestampsField.style.marginTop = '16px';
    const timestampsLabel = document.createElement('div');
    timestampsLabel.className = 'label';
    timestampsLabel.textContent = 'Timestamps (JSON)';
    const timestampsHelp = document.createElement('div');
    timestampsHelp.className = 'help-text';
    timestampsHelp.innerHTML = `Format: <code>[{"start": 10, "end": 25, "title": "Clip 1"}, ...]</code>`;
    const timestampsInput = document.createElement('textarea');
    timestampsInput.className = 'textarea';
    timestampsInput.id = 'timestamps-input';
    timestampsInput.placeholder = '[\n  {\n    "start": 10,\n    "end": 25,\n    "title": "Clip menarik 1"\n  },\n  {\n    "start": 45,\n    "end": 60,\n    "title": "Clip menarik 2"\n  }\n]';
    timestampsInput.rows = 10;
    timestampsField.appendChild(timestampsLabel);
    timestampsField.appendChild(timestampsHelp);
    timestampsField.appendChild(timestampsInput);

    // Video Settings Grid
    const settingsGrid = document.createElement('div');
    settingsGrid.className = 'grid';

    // Subtitle & Flags
    const subtitle = document.createElement('select');
    subtitle.className = 'select';
    subtitle.id = 'clip-subtitle';
    subtitle.innerHTML = '<option value="id" selected>Indonesian</option><option value="en">English</option>';

    // Resolution
    const resolution = document.createElement('select');
    resolution.className = 'select';
    resolution.id = 'clip-resolution';
    resolution.innerHTML = '<option value="9:16" selected>9:16 (Shorts)</option><option value="1:1">1:1 (Square)</option><option value="16:9">16:9</option>';

    // Switches
    const capSwitch = makeSwitch('Auto captions', 'clip-captions', true);
    const hookSwitch = makeSwitch('Hook', 'clip-hook', false);
    const cropSwitch = makeSwitch('Smart Crop', 'clip-crop', true);

    // Watermark (Browse button)
    const watermarkBtn = document.createElement('button');
    watermarkBtn.className = 'btn ghost';
    watermarkBtn.textContent = 'Browse Watermark...';

    const watermarkPath = document.createElement('div');
    watermarkPath.className = 'help-text';
    watermarkPath.style.marginTop = '4px';
    watermarkPath.textContent = 'No file selected';

    const watermarkField = makeField('Watermark', watermarkBtn);
    watermarkField.appendChild(watermarkPath);

    settingsGrid.appendChild(makeField('Subtitle', subtitle));
    settingsGrid.appendChild(makeField('Resolution', resolution));
    settingsGrid.appendChild(watermarkField);
    settingsGrid.appendChild(capSwitch);
    settingsGrid.appendChild(hookSwitch);
    settingsGrid.appendChild(cropSwitch);

    const startBtn = document.createElement('button');
    startBtn.id = 'clip-start';
    startBtn.className = 'btn primary';
    startBtn.style.marginTop = '24px';
    startBtn.textContent = 'Mulai Clipping';

    const progress = document.createElement('div');
    progress.className = 'progress';
    progress.style.marginTop = '16px';
    const bar = document.createElement('div');
    bar.id = 'clip-bar';
    bar.className = 'bar';
    progress.appendChild(bar);

    const status = document.createElement('div');
    status.id = 'clip-status';
    status.className = 'status';

    section.appendChild(title);
    section.appendChild(videoSelectField);
    section.appendChild(timestampsField);
    section.appendChild(settingsGrid);
    section.appendChild(startBtn);
    section.appendChild(progress);
    section.appendChild(status);

    return {
        element: section,
        fields: {
            videoSelect,
            timestampsInput,
            subtitle,
            resolution,
            watermarkBtn,
            watermarkPath,
            captions: capSwitch.querySelector('input'),
            hook: hookSwitch.querySelector('input'),
            crop: cropSwitch.querySelector('input'),
            startBtn,
            bar,
            status
        }
    };
};

function makeField(labelText, inputEl) {
    const field = document.createElement('div');
    field.className = 'field';
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = labelText;
    field.appendChild(label);
    field.appendChild(inputEl);
    return field;
}

function makeSwitch(text, id, checked) {
    const field = document.createElement('div');
    field.className = 'field';
    const label = document.createElement('label');
    label.className = 'switch';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.checked = checked;
    const slider = document.createElement('span');
    slider.className = 'slider';
    const span = document.createElement('span');
    span.className = 'switch-label';
    span.textContent = text;
    label.appendChild(input);
    label.appendChild(slider);
    label.appendChild(span);
    field.appendChild(label);
    return field;
}
