# Fix: Downloaded Videos Hilang Setelah Restart

## 🐛 Bug yang Diperbaiki

### Problem
Saat aplikasi di-close dan dibuka lagi:
- ❌ **Daftar video hilang** dari UI (tidak muncul)
- ✅ **File masih ada** di folder `downloads/`
- ❌ **Database tidak persist** atau tidak ter-load

### Root Cause

**Missing Database Methods!**

Kode memanggil method database yang **tidak exist**:
```python
# __init__ memanggil:
self._init_downloads_db()       # ❌ Method tidak ada!

# download_video memanggil:
db = self._read_downloads_db()  # ❌ Method tidak ada!
self._write_downloads_db(db)     # ❌ Method tidak ada!
```

**Result:**
- App crash atau error saat save
- Database tidak tersimpan
- Restart = data hilang!

---

## ✅ Solusi yang Diimplementasikan

### 1. **Add Database Methods**

#### `_init_downloads_db()`
```python
def _init_downloads_db(self):
    """Initialize downloads database file and sync with filesystem"""
    db_path = Path(self.downloads_dir) / "downloads.json"
    
    # Create database if doesn't exist
    if not db_path.exists():
        with open(db_path, 'w', encoding='utf-8') as f:
            json.dump({"videos": []}, f, indent=2)
    
    # Sync filesystem with database (restore missing entries)
    self._sync_downloads_from_filesystem()
```

**Benefit:** 
- ✅ Create `downloads.json` jika belum ada
- ✅ Auto-sync dengan filesystem

---

#### `_read_downloads_db()`
```python
def _read_downloads_db(self):
    """Read downloads database"""
    db_path = Path(self.downloads_dir) / "downloads.json"
    try:
        if db_path.exists():
            with open(db_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            return {"videos": []}
    except Exception as e:
        print(f"Error reading downloads database: {e}")
        return {"videos": []}
```

**Benefit:**
- ✅ Load database dari file
- ✅ Handle error gracefully
- ✅ Return empty jika tidak ada

---

#### `_write_downloads_db(data)`
```python
def _write_downloads_db(self, data):
    """Write downloads database"""
    db_path = Path(self.downloads_dir) / "downloads.json"
    try:
        with open(db_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error writing downloads database: {e}")
```

**Benefit:**
- ✅ Save database ke file
- ✅ Pretty print (indent=2)
- ✅ Support unicode (ensure_ascii=False)

---

### 2. **Auto-Restore dari Filesystem** 🎉

#### `_sync_downloads_from_filesystem()`
```python
def _sync_downloads_from_filesystem(self):
    """Sync filesystem videos with database"""
    # Scan downloads folder for .mp4 files
    for mp4_file in Path(self.downloads_dir).glob("*.mp4"):
        video_id = mp4_file.stem  # YouTube ID
        
        # Skip if already in database
        if video_id in existing_ids:
            continue
        
        # Try to get video info from YouTube
        try:
            url = f"https://www.youtube.com/watch?v={video_id}"
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
                title = info.get('title', f'Video {video_id}')
        except:
            title = f'Video {video_id}'  # Fallback
        
        # Check for subtitle
        srt_file = Path(f"{video_id}.srt")
        subtitle_path = str(srt_file) if srt_file.exists() else None
        
        # Add to database
        videos.append({
            "id": video_id,
            "url": url,
            "title": title,
            "path": str(mp4_file),
            "subtitle_path": subtitle_path,
        })
```

**Fitur Canggih:**
- 🔍 **Scan folder** untuk file `.mp4`
- 🆔 **Extract YouTube ID** dari filename
- 🌐 **Fetch video info** dari YouTube (jika bisa)
- 💾 **Restore ke database** otomatis
- 📝 **Fallback title** jika tidak bisa fetch info

**Benefit:**
- ✅ **Auto-recovery** jika database hilang/corrupt
- ✅ **Restore existing files** saat pertama kali startup
- ✅ **No manual work** - semua otomatis!

---

## 🎯 Expected Behavior

### Scenario 1: First Time Startup (Database Tidak Ada)
```
App Start:
1. Download folder: video1.mp4, video2.mp4
2. downloads.json: tidak ada
   ↓
Auto Sync:
3. Scan folder → found: video1.mp4, video2.mp4
4. Extract IDs: video1, video2
5. Fetch info dari YouTube
6. Create downloads.json with 2 entries
   ↓
Result:
✅ UI shows 2 videos
✅ Database created and saved
```

---

### Scenario 2: Normal Restart (Database Ada)
```
App Start:
1. Download folder: video1.mp4, video2.mp4
2. downloads.json: exists with 2 entries
   ↓
Load Database:
3. Read downloads.json
4. Load 2 video entries
   ↓
Result:
✅ UI shows 2 videos (from database)
✅ No need to re-fetch info
```

---

### Scenario 3: Database Lost/Deleted (Recovery)
```
App Start:
1. Download folder: video1.mp4, video2.mp4, video3.mp4
2. downloads.json: deleted/corrupt
   ↓
Auto Recovery:
3. Scan folder → found 3 videos
4. Try fetch info dari YouTube
5. Recreate downloads.json with 3 entries
   ↓
Result:
✅ UI shows 3 videos
✅ Database recovered from files!
✅ User tidak kehilangan data
```

---

### Scenario 4: New File Added Manually
```
User manually copies video4.mp4 to downloads/
   ↓
App Restart:
1. Scan folder → found: video1, video2, video3, video4
2. Database has: video1, video2, video3
3. video4 missing in database!
   ↓
Auto Sync:
4. Detect video4 is new
5. Fetch info from YouTube
6. Add video4 to database
   ↓
Result:
✅ UI shows 4 videos
✅ Manually added file auto-detected!
```

---

## 📁 Database Structure

**File:** `downloads/downloads.json`

**Format:**
```json
{
  "videos": [
    {
      "id": "7weobfchlYg",
      "url": "https://www.youtube.com/watch?v=7weobfchlYg",
      "title": "Amazing Video Title",
      "path": "Z:\\yt clip\\yt-short-clipper\\downloads\\7weobfchlYg.mp4",
      "subtitle_path": "Z:\\yt clip\\yt-short-clipper\\downloads\\7weobfchlYg.srt"
    },
    {
      "id": "XYZ123abc45",
      "url": "https://www.youtube.com/watch?v=XYZ123abc45",
      "title": "Another Great Video",
      "path": "Z:\\yt clip\\yt-short-clipper\\downloads\\XYZ123abc45.mp4",
      "subtitle_path": null
    }
  ]
}
```

**Fields:**
- `id`: YouTube video ID
- `url`: Original YouTube URL
- `title`: Video title (fetched dari YouTube)
- `path`: Full path ke file .mp4
- `subtitle_path`: Full path ke file .srt (atau `null`)

---

## 🔧 Technical Details

### When Database Methods Called

1. **`_init_downloads_db()`**  
   Called: App startup (`__init__`)  
   Purpose: Initialize & sync database

2. **`_sync_downloads_from_filesystem()`**  
   Called: During `_init_downloads_db()`  
   Purpose: Restore missing entries from files

3. **`_read_downloads_db()`**  
   Called: 
   - Get downloaded videos list
   - Before download (check duplicate)
   - Before delete  
   Purpose: Load database

4. **`_write_downloads_db(data)`**  
   Called:
   - After successful download
   - After delete
   - After sync  
   Purpose: Save database

---

## ✨ Benefits

✅ **Persist data** - Video list tidak hilang setelah restart  
✅ **Auto-recovery** - Database hilang? Auto-restore dari files!  
✅ **Smart sync** - Detect file baru di folder otomatis  
✅ **No data loss** - User tidak kehilangan downloaded videos  
✅ **Fetch info** - Auto-fetch title dari YouTube  
✅ **Fallback** - Jika fetch gagal, pakai ID sebagai title  

---

## 🚀 Testing

### Test 1: First Time Use
```
1. Delete downloads.json (if exists)
2. Put some .mp4 files in downloads/
3. Start app
4. Check UI → videos should appear!
5. Check downloads.json → should be created
```

### Test 2: Normal Restart
```
1. Download 2 videos
2. Close app
3. Restart app
4. Videos should still appear in list ✓
```

### Test 3: Manual File Add
```
1. App running with 2 videos
2. Manually copy video3.mp4 to downloads/
3. Restart app
4. video3 should appear in list ✓
```

### Test 4: Database Deleted
```
1. Download 3 videos
2. Close app
3. Delete downloads.json
4. Restart app
5. All 3 videos should re-appear! ✓
```

---

## 📝 Console Output

Saat app start dengan sync:
```
[DB Sync] Restored: 7weobfchlYg - Amazing Video Title
[DB Sync] Restored: XYZ123abc45 - Another Great Video
[DB Sync] Restored 2 videos from filesystem
```

---

**Database persistence fixed! Videos tidak akan hilang lagi.** 🎉
