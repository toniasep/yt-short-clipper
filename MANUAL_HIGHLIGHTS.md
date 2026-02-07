# Manual Highlights Mode - Quick Guide

## 📖 Overview

**Manual Highlights Mode** memungkinkan Anda untuk melewati proses AI detection dan langsung memberikan timestamp highlight yang Anda inginkan.

---

## 🎯 Cara Kerja

Alur proses **TETAP SAMA** seperti mode AI, hanya **Step 2 (AI Detection) yang di-skip**:

```
┌─────────────────────────────────────────────────┐
│  STEP 1: Download Video dari YouTube           │
│  ✓ Download video + subtitle                   │
│  ✓ Extract metadata (title, channel, desc)     │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  STEP 2: Get Highlights                         │
│                                                 │
│  ┌─────────────┐        ┌──────────────────┐   │
│  │  AI Mode    │   OR   │  Manual Mode     │   │
│  │  (GPT-4)    │        │  (User Input)    │   │
│  └─────────────┘        └──────────────────┘   │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  STEP 3: Process Each Clip                      │
│  ✓ Cut video segment                            │
│  ✓ Convert to portrait (9:16)                   │
│  ✓ Add hook intro (optional)                    │
│  ✓ Add captions (optional)                      │
│  ✓ Add watermark                                │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  STEP 4: Cleanup & Save                         │
│  ✓ Save final clips                             │
│  ✓ Generate metadata JSON                       │
└─────────────────────────────────────────────────┘
```

---

## 📋 Format JSON Highlights

### **Minimum Required:**
```json
[
  {
    "start_time": "00:01:25,000",
    "end_time": "00:02:50,000",
    "title": "Judul Clip"
  }
]
```

### **Complete Format:**
```json
[
  {
    "start_time": "00:01:25,000",
    "end_time": "00:02:50,000",
    "title": "Realita Rumah Lantai Tanah",
    "hook_text": "Mpok Citra: Rumah saya lantainya masih tanah kalau banjir jadi lumpur",
    "reason": "Kontras ekstrem, viral potential"
  }
]
```

**Field Details:**
- `start_time` (**required**): Format `HH:MM:SS,mmm`
- `end_time` (**required**): Format `HH:MM:SS,mmm`
- `title` (**required**): Judul clip
- `hook_text` (optional): Defaults to `title` if not provided
- `reason` (optional): For reference only, not used in processing

---

## 🚀 Cara Menggunakan

### **Method 1: Python Script**

```bash
python test_manual_mode.py
```

Script akan minta:
1. YouTube URL
2. Add captions? (y/n)
3. Add hook intro? (y/n)

Highlights sudah hard-coded di script (edit sesuai kebutuhan).

---

### **Method 2: JavaScript (WebView UI)**

```javascript
// Prepare highlights
const highlights = [
  {
    start_time: "00:01:25,000",
    end_time: "00:02:50,000",
    title: "Clip Title",
    hook_text: "Hook text here"
  }
];

// Call API dengan manual_highlights parameter
pywebview.api.start_processing(
  "https://youtube.com/watch?v=xxxxx",  // url
  5,                                     // num_clips (ignored in manual mode)
  true,                                  // add_captions
  false,                                 // add_hook
  "id",                                  // subtitle_lang
  JSON.stringify(highlights)             // manual_highlights
).then(result => {
  console.log("Status:", result.status);
  console.log("Mode:", result.mode);           // "manual" or "ai"
  console.log("Highlights:", result.highlights_count);
  
  if (result.status === "started") {
    // Poll for progress
    pollProgress();
  }
});

function pollProgress() {
  setInterval(() => {
    pywebview.api.get_progress().then(data => {
      console.log(`${data.status} - ${data.progress * 100}%`);
    });
  }, 1000);
}
```

---

### **Method 3: Direct Python Code**

```python
from clipper_core import AutoClipperCore

highlights = [
    {
        "start_time": "00:01:25,000",
        "end_time": "00:02:50,000",
        "title": "Clip Title",
        "hook_text": "Hook text"
    }
]

core = AutoClipperCore(...)

# Just pass manual_highlights parameter
core.process(
    url="https://youtube.com/watch?v=xxxxx",
    manual_highlights=highlights,  # ← Add this parameter
    add_captions=True,
    add_hook=False
)
```

---

## 🔍 Validation Rules

System akan validasi setiap highlight yang Anda berikan:

### **1. Required Fields Check**
```
✓ start_time ada
✓ end_time ada
✓ title ada
```

### **2. Timestamp Format**
```
Format valid: HH:MM:SS,mmm

✓ "00:01:25,000"
✓ "01:30:45,500"
✗ "1:25"           (invalid: missing components)
✗ "00:01:25.000"   (invalid: use comma, not dot)
```

### **3. Duration Check**
```python
duration = end_time - start_time

if duration <= 0:
    # REJECTED: end_time harus lebih besar dari start_time
```

**Note:** Tidak ada batasan min/max duration seperti AI mode. User bebas tentukan durasi.

### **4. Auto-fill Defaults**
```python
# Jika hook_text kosong, pakai title
if not highlight["hook_text"]:
    highlight["hook_text"] = highlight["title"]

# Jika reason kosong, set default
if not highlight["reason"]:
    highlight["reason"] = "User-defined highlight"
```

---

## 📊 Log Output Example

```
=== Manual Highlights Mode ===
Validating 3 user-provided highlights...

  ✓ Highlight 1: Realita Rumah Lantai Tanah (85.0s)
  ✓ Highlight 2: Tragedi Berak Ditabrak Kelelawar (90.0s)
  ✓ Highlight 3: Kobra Bertelur di Bawah Kasur (90.0s)

✅ 3 valid highlights ready for processing

[2/4] Cutting clip 1/3...
  Duration: 00:01:25.00
  Output: z:\output\20260204-124501-01\cut.mp4
...
```

---

## 💡 Tips

### **1. Cara Dapat Timestamp Akurat**

**A. Dari YouTube Player:**
- Pause di momen yang diinginkan
- Lihat timestamp di player (e.g., 1:25)
- Convert ke format `00:01:25,000`

**B. Dari Video Editor:**
- Import video ke editor (Premiere, DaVinci)
- Mark In/Out points
- Export timecode

**C. Dari Subtitle File:**
- Buka `.srt` file
- Copy timestamp langsung

### **2. Duration Sweet Spot**

Platform limits:
- **YouTube Shorts**: Max 60s (optimal: 45-59s)
- **TikTok**: Max 10 min (optimal: 30-90s)
- **Instagram Reels**: Max 90s (optimal: 30-60s)

### **3. Buffer Time**

Tambahkan 0.5-1 detik buffer di awal/akhir untuk smooth transitions:

```json
// Jika scene start di 1:25, mulai dari 1:24.5
{
  "start_time": "00:01:24,500",  // 0.5s sebelum
  "end_time": "00:02:50,500"      // 0.5s sesudah
}
```

---

## ⚠️ Common Errors

### **1. Missing Required Fields**
```
⚠ Highlight 2: Missing required fields ['title'], skipped
```
**Fix:** Pastikan semua highlight punya `start_time`, `end_time`, dan `title`

### **2. Invalid Timestamp Format**
```
⚠ Highlight 1 'Clip Title': Error parsing timestamps - invalid literal for int()
```
**Fix:** Cek format timestamp, harus `HH:MM:SS,mmm` (pakai comma, bukan dot)

### **3. Negative Duration**
```
⚠ Highlight 3 'Clip Title': Invalid duration (-5.0s), end_time must be after start_time
```
**Fix:** `end_time` harus lebih besar dari `start_time`

### **4. Empty Array**
```
Error: Manual highlights array is empty
```
**Fix:** Berikan minimal 1 highlight

---

## 🆚 Comparison: Manual vs AI Mode

| Aspect | **AI Mode** | **Manual Mode** |
|--------|-------------|-----------------|
| **Input Required** | YouTube URL | YouTube URL + highlights JSON |
| **Step 1 (Download)** | ✅ Same | ✅ Same |
| **Step 2 (Highlights)** | AI analyzes transcript | User provides timestamps |
| **Step 3 (Processing)** | ✅ Same | ✅ Same |
| **Step 4 (Cleanup)** | ✅ Same | ✅ Same |
| **Cost** | $0.10-0.40/video | $0.00 (FREE) |
| **Speed** | Slower (AI processing) | Faster (no AI call) |
| **Control** | AI decides | User decides |
| **Duration Limits** | 58-120s enforced | No limits |
| **Accuracy** | AI might miss moments | User knows best |

---

## 🎬 Complete Example

```python
# test_example.py
from clipper_core import AutoClipperCore
from utils.helpers import get_ffmpeg_path, get_ytdlp_path

# Your highlights (dari nonton video, catat timestamp menarik)
highlights = [
    {
        "start_time": "00:01:25,000",
        "end_time": "00:02:50,000",
        "title": "Cerita Lucu Rumah Lantai Tanah",
        "hook_text": "Mpok Citra: Rumah saya lantainya masih tanah"
    },
    {
        "start_time": "00:03:00,000",
        "end_time": "00:04:30,000",
        "title": "Ditabrak Kelelawar",
        "hook_text": "Lagi berak malah ketabrak kelelawar"
    }
]

# Initialize
core = AutoClipperCore(
    client=None,
    ffmpeg_path=get_ffmpeg_path(),
    ytdlp_path=get_ytdlp_path(),
    output_dir="./output",
    log_callback=print
)

# Process (sama seperti AI mode, cuma tambah manual_highlights parameter)
core.process(
    url="https://youtube.com/watch?v=xxxxx",
    manual_highlights=highlights,  # ← Magic happens here
    add_captions=True,
    add_hook=False
)

print("✅ Done! Check ./output folder")
```

---

## 📝 Example Highlights JSON File

Simpan sebagai `my_highlights.json`:

```json
[
  {
    "start_time": "00:01:25,000",
    "end_time": "00:02:50,000",
    "title": "Realita Rumah Lantai Tanah",
    "hook_text": "Mpok Citra: Rumah saya lantainya masih tanah kalau banjir jadi lumpur",
    "reason": "Kontras ekstrem antara kehidupan Raditya Dika dengan kondisi rumah Mpok Citra"
  },
  {
    "start_time": "00:03:00,000",
    "end_time": "00:04:30,000",
    "title": "Tragedi Berak Ditabrak Kelelawar",
    "hook_text": "Mpok Citra: Lagi berak saya malah ketabrak kelelawar dari pohon mangga",
    "reason": "Cerita absurd dan kocak tentang toilet terbuka"
  },
  {
    "start_time": "00:05:30,000",
    "end_time": "00:07:00,000",
    "title": "Kobra Bertelur di Bawah Kasur",
    "hook_text": "Mpok Citra: Ular kobra sampai bertelur di bawah tempat tidur saya",
    "reason": "Horor sekaligus lucu, relatable untuk orang kampung"
  }
]
```

Load dan gunakan:

```python
import json

# Load from file
with open("my_highlights.json") as f:
    highlights = json.load(f)

# Use in processing
core.process(url="...", manual_highlights=highlights)
```

---

**Happy Clipping! ✂️🎬**

---

## 📞 Support

Jika ada pertanyaan atau error:
1. Check format JSON di [JSONLint](https://jsonlint.com)
2. Validate timestamp format
3. Check `error.log` file
4. Join Discord untuk bantuan
