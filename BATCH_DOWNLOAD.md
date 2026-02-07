# Update: Batch Download System

## ✨ Fitur Baru

### 1. **Batch Download** - Download Banyak Video Sekaligus
Sekarang bisa download beberapa video YouTube dalam satu kali proses!

### 2. **YouTube ID sebagai Nama File**
File video disimpan dengan nama YouTube ID (bukan "source.mp4"):
- `7weobfchlYg.mp4`
- `XYZ123abc45.mp4`

### 3. **Auto-Delete File**
Saat delete video dari UI, file fisik (.mp4 dan .srt) otomatis terhapus.

### 4. **Queue System**
Lihat progress semua download dalam queue dengan status real-time.

---

## 🎯 Cara Menggunakan

### Batch Download Multiple Videos

1. **Upload Cookies** (jika belum):
   ```
   Tab Download → Cookies → Choose cookies.txt → Upload
   ```

2. **Paste Multiple URLs**:
   ```
   Paste beberapa URL YouTube, satu URL per baris:
   
   https://www.youtube.com/watch?v=xxxxx
   https://www.youtube.com/watch?v=yyyyy
   https://www.youtube.com/watch?v=zzzzz
   ```

3. **Click "Download All"**
   - Semua URL akan masuk ke queue
   - Download berjalan satu per satu
   - Queue menampilkan status:
     - ⏳ **Menunggu...** (pending)
     - 📥 **Downloading X%** (active)
     - ✓ **Selesai** (complete)
     - ✗ **Error** (failed)

4. **Monitor Progress**
   - Progress bar: Download saat ini
   - Queue list: Semua video dalam batch
   - Status text: Info detail

---

## 📁 File Management

### Nama File dengan YouTube ID
Setiap video disimpan dengan YouTube ID-nya:

**Contoh:**
```
downloads/
├── 7weobfchlYg.mp4         ← Video
├── 7weobfchlYg.srt         ← Subtitle
├── XYZ123abc45.mp4
├── XYZ123abc45.srt
└── ...
```

### Delete Video
Saat click **🗑️ Delete** di UI:
1. ✅ Video dihapus dari database
2. ✅ File `.mp4` dihapus dari disk
3. ✅ File `.srt` dihapus dari disk

---

## 🔄 Workflow Baru

### Single Video Download
```
1. Paste 1 URL
   ↓
2. Click "Download All"
   ↓
3. Video di-download
   ↓
4. File disimpan: <youtube_id>.mp4
   ↓
5. Muncul di list "Video yang Sudah Di-Download"
```

### Batch Multiple Videos
```
1. Paste beberapa URL (satu per baris)
   ↓
2. Click "Download All"
   ↓
3. Semua URL masuk queue
   ↓
4. Download satu per satu secara otomatis
   ↓
5. Queue update real-time:
      - Video 1: ✓ Selesai
      - Video 2: Downloading 45%
      - Video 3: Menunggu...
   ↓
6. Setelah semua selesai → "Batch download selesai! X/Y berhasil"
```

---

## 🎨 UI Improvements

### Queue Display
```
┌─────────────────────────────────────────────┐
│  Download Queue                             │
├─────────────────────────────────────────────┤
│  📹 Video Title 1                           │
│  youtube.com/watch?v=xxx      ✓ Selesai    │
├─────────────────────────────────────────────┤
│  📹 Video Title 2                           │
│  youtube.com/watch?v=yyy   Downloading 67% │
├─────────────────────────────────────────────┤
│  📹 Loading...                              │
│  youtube.com/watch?v=zzz      Menunggu...  │
└─────────────────────────────────────────────┘
```

### Textarea Input
- Multi-line input untuk batch URLs
- Button "Clear" untuk clear semua URLs

---

## ⚙️ Technical Details

### Backend Changes

**File: `webview_app.py`**
- Extract YouTube ID dari URL dengan regex
- Rename downloaded files: `<youtube_id>.mp4`
- Update database dengan YouTube ID sebagai key
- Prevent duplicate: Re-download URL yang sama akan update existing entry
- Delete method: Hapus file fisik + database entry

**File: `web/app.js`**
- Queue management system
- Sequential download (satu per satu)
- Auto-continue ke video berikutnya
- Handle error per-item (lanjut ke next jika gagal)

**File: `web/components/download.js`**
- Textarea untuk multiple URLs
- Queue section display
- Clear button

---

## 📊 Queue States

| State | Description | Color |
|-------|-------------|-------|
| `pending` | Menunggu giliran | Gray |
| `downloading` | Sedang download | Blue (Brand) |
| `complete` | Berhasil | Green |
| `error` | Gagal | Red |

---

## 🚀 Example Use Case

### Download Playlist Videos
```
1. Copy semua URL dari playlist:
   https://www.youtube.com/watch?v=video1
   https://www.youtube.com/watch?v=video2
   https://www.youtube.com/watch?v=video3
   https://www.youtube.com/watch?v=video4
   https://www.youtube.com/watch?v=video5

2. Paste semua ke textarea

3. Click "Download All"

4. Tunggu semua selesai (bisa tinggal)

5. Semua video ready untuk clipping!
```

---

## ✅ Benefits

1. **Efisiensi**: Download banyak video tanpa manual intervention
2. **Organized**: File dengan nama YouTube ID mudah dikenali
3. **Clean**: Delete dari UI = file fisik juga terhapus
4. **Transparent**: Queue menampilkan progress semua video
5. **Resilient**: Error di satu video tidak stop yang lain

---

## 🔧 Troubleshooting

### "Invalid YouTube URL"
➜ URL tidak valid atau bukan YouTube URL. Format yang valid:
- `youtube.com/watch?v=VIDEO_ID`
- `youtu.be/VIDEO_ID`

### Batch download stuck
➜ Refresh page dan coba lagi. Queue akan reset.

### File tidak terhapus saat delete
➜ Cek permission folder `downloads/`. Pastikan aplikasi punya write access.

---

**Selamat menggunakan fitur batch download! 🎬✨**
