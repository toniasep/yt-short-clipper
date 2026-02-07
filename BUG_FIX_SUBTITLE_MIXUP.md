# Fix: Subtitle Mix-Up Bug

## 🐛 Bug yang Diperbaiki

### Problem
Saat batch download beberapa video:
1. Video pertama gagal download (error HTTP 503)
2. Video kedua berhasil download
3. **BUG**: File video kedua OK, tapi subtitle-nya malah subtitle dari video pertama!
   - Video: `video2_id.mp4` ✅ (benar)
   - Subtitle: `video2_id.srt` ❌ (ID benar tapi isi subtitle video pertama)

### Root Cause
1. Download menggunakan temp folder dengan nama fixed: `source.mp4`, `source.srt`
2. Video pertama gagal, tapi subtitle-nya sudah terdownload ke `_temp/source.srt`
3. File `source.srt` tidak di-cleanup setelah error
4. Video kedua download, subtitle baru (atau tidak ada subtitle)
5. Saat rename/move, file `_temp/source.srt` lama (dari video pertama) ter-move ke `video2_id.srt`
6. **Result**: Video kedua punya subtitle video pertama!

---

## ✅ Solusi yang Diimplementasikan

### 1. **Clean Temp Folder Before Download**
```python
# IMPORTANT: Clean temp folder before download to prevent subtitle mix-up
temp_dir = Path(self.downloads_dir) / "_temp"
if temp_dir.exists():
    # Remove all files in temp folder
    for item in temp_dir.glob('*'):
        try:
            if item.is_file():
                item.unlink()
        except Exception as e:
            pass  # Ignore errors, continue
```

**Benefit**: Setiap download mulai dengan temp folder yang bersih.

---

### 2. **Validate Subtitle Before Move**
```python
# Handle subtitle carefully - only move if exists and valid
final_subtitle_path = None
if subtitle_path:
    subtitle_src = Path(subtitle_path)
    if subtitle_src.exists() and subtitle_src.stat().st_size > 0:
        # Subtitle exists and not empty
        shutil.move(str(subtitle_src), str(new_subtitle_path))
        final_subtitle_path = str(new_subtitle_path)
    else:
        # Subtitle doesn't exist or empty
        self.download_status = "Warning: No subtitle available"
else:
    self.download_status = "Warning: No subtitle downloaded"
```

**Checks:**
- ✅ File subtitle benar-benar exists
- ✅ File subtitle tidak empty (size > 0)
- ✅ Hanya move file yang valid

**Benefit**: Tidak akan move file subtitle lama/salah.

---

### 3. **Use `final_subtitle_path` in Database**
```python
# Save to database with final_subtitle_path
videos.append({
    "id": video_id,
    "url": url,
    "title": video_title,
    "path": str(video_path),
    "subtitle_path": final_subtitle_path,  # Use validated path
})
```

**Benefit**: Database hanya simpan subtitle yang benar-benar valid.

---

## 🔍 Test Scenario

### Before Fix ❌
```
Download Queue:
1. Video A → FAIL (HTTP 503)
   - source.mp4: tidak selesai
   - source.srt: sudah download ✓ (subtitle A)

2. Video B → SUCCESS
   - source.mp4: download ✓ (video B)
   - source.srt: tidak download (no subtitle)
   
Rename:
- source.mp4 → videoB_id.mp4 ✓
- source.srt → videoB_id.srt ❌ (subtitle A, bukan B!)

Result: videoB_id.srt berisi subtitle video A!
```

### After Fix ✅
```
Download Queue:
1. Video A → FAIL (HTTP 503)
   - source.mp4: tidak selesai
   - source.srt: sudah download (subtitle A)
   
Before Video B:
   - Clean temp folder!
   - source.srt: deleted ✓

2. Video B → SUCCESS
   - source.mp4: download ✓ (video B)
   - source.srt: tidak download (no subtitle)
   
Rename:
- source.mp4 → videoB_id.mp4 ✓
- source.srt check: NOT EXISTS, skip ✓

Save to DB:
- subtitle_path: None ✓

Result: Video B tidak punya subtitle (correct!)
```

---

## 📝 Changes Made

**File: `webview_app.py`**

1. **Added temp cleanup before download**:
   - Line ~350: Clean `_temp/` folder
   - Remove all files: `.mp4`, `.srt`, dll

2. **Added subtitle validation**:
   - Line ~405: Check subtitle exists
   - Line ~407: Check subtitle size > 0
   - Only move valid subtitle files

3. **Use `final_subtitle_path`**:
   - Line ~430: Database uses validated subtitle path
   - `None` if no valid subtitle

---

## 🎯 Expected Behavior Now

### Scenario 1: Both videos have subtitles
```
Video A: ✓ Download → videoA_id.mp4, videoA_id.srt
Video B: ✓ Download → videoB_id.mp4, videoB_id.srt
```

### Scenario 2: First fails, second succeeds
```
Video A: ✗ FAIL (HTTP 503)
         - Temp cleaned before next
Video B: ✓ Download → videoB_id.mp4, videoB_id.srt (or None)
```

### Scenario 3: Video without subtitle
```
Video A: ✓ Download → videoA_id.mp4, subtitle_path: None
Video B: ✓ Download → videoB_id.mp4, subtitle_path: None
```

---

## ✨ Benefits

✅ **No more subtitle mix-up** between videos  
✅ **Clean temp folder** before each download  
✅ **Validate subtitle** before move  
✅ **Correct database** entries  
✅ **Handle failures** gracefully  

---

## 🚀 Testing

Untuk test fix ini:

1. **Get 2 YouTube URLs**:
   - URL 1: Video yang mungkin fail (private/restricted)
   - URL 2: Video public normal

2. **Batch download**:
   ```
   URL1 (fail expected)
   URL2 (success expected)
   ```

3. **Verify**:
   - Check folder `downloads/`
   - Only video 2 file should exist
   - If video 2 has subtitle, subtitle should match video 2 content
   - No leftover from video 1

---

**Bug fixed! Ready to test.** 🎉
