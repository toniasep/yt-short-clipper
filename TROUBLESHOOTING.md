# Troubleshooting YouTube Download Errors

## Error: "Requested format is not available"

### Penyebab Umum:
1. **Cookies tidak valid atau sudah kadaluarsa**
2. **Deno JavaScript runtime issue** (n-challenge solver error)
3. **Video dengan proteksi khusus**

### Solusi:

#### 1. Upload Cookies Baru (RECOMMENDED ✅)

**Step-by-step:**

1. **Buka browser** (Chrome/Edge/Firefox)

2. **Logout dari YouTube** jika sudah login

3. **Login kembali** ke akun YouTube Anda

4. **Install Extension untuk Export Cookies**:
   - **Chrome/Edge**: [Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
   - **Firefox**: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

5. **Export Cookies**:
   - Pastikan masih di halaman YouTube
   - Klik icon extension
   - Export cookies.txt
   
6. **Upload ke Aplikasi**:
   - Buka tab "Download"
   - Section "Cookies (Required)"
   - Choose file → pilih cookies.txt yang baru
   - Klik "Upload"
   - Tunggu sampai muncul "✓ Cookies uploaded successfully"

7. **Coba download lagi**

---

#### 2. Update yt-dlp

```bash
pip install --upgrade yt-dlp
```

---

#### 3. Coba Video Lain

Beberapa video mungkin memiliki proteksi khusus. Coba video YouTube lain untuk memastikan sistem berfungsi.

---

## Error: "WARNING: n challenge solving failed"

### Penyebab:
Deno JavaScript runtime gagal memecahkan enkripsi signature YouTube (n-challenge).

### Solusi:

#### Opsi 1: Gunakan Cookies Fresh (RECOMMENDED)
Cookies yang valid akan membuat YouTube lebih "percaya" dan mengurangi challenge.

1. Logout dari YouTube
2. Login lagi
3. Export cookies baru
4. Upload ke aplikasi

#### Opsi 2: Update yt-dlp
```bash
pip install --upgrade yt-dlp
```

#### Opsi 3: Coba Ulang
Kadang error ini temporary. Coba download lagi setelah beberapa menit.

---

## Error: "Sign in to confirm you're not a bot"

### Penyebab:
YouTube mendeteksi aktivitas bot karena cookies tidak valid.

### Solusi:
1. **Wajib upload cookies baru**
2. Pastikan login ke YouTube saat export cookies
3. Export cookies dari session yang aktif (jangan private/incognito mode)

---

## Error: "cookies.txt not found"

### Solusi:
Upload cookies.txt file melalui menu Download → Cookies section.

Lihat [PANDUAN_COOKIES.md](PANDUAN_COOKIES.md) untuk cara mendapatkan cookies.

---

## Tips Mencegah Error

### ✅ DO:
- **Selalu gunakan cookies fresh** (export baru setiap kali)
- Login ke YouTube sebelum export cookies
- Export cookies dari browser yang aktif (bukan private/incognito)
- Update yt-dlp secara berkala
- Test dengan video YouTube umum (bukan premium/private)

### ❌ DON'T:
- Jangan gunakan cookies lama (>1 minggu)
- Jangan export cookies saat logout dari YouTube
- Jangan share cookies dengan orang lain
- Jangan download video private/premium tanpa akses

---

## Workflow Yang Benar

```
1. Buka YouTube di browser
   ↓
2. Login ke akun YouTube
   ↓
3. Install extension export cookies
   ↓
4. Export cookies.txt (pastikan masih di youtube.com)
   ↓
5. Buka aplikasi YT Short Clipper
   ↓
6. Tab "Download" → Upload cookies.txt
   ↓
7. Tunggu "✓ Cookies uploaded successfully"
   ↓
8. Paste URL YouTube
   ↓
9. Klik "Download"
   ↓
10. Tunggu hingga selesai
```

---

## Masih Error?

Jika sudah mencoba semua solusi di atas dan masih error:

1. **Restart aplikasi**
   ```bash
   # Stop aplikasi (Ctrl+C)
   # Jalankan ulang
   python webview_app.py
   ```

2. **Cek versi yt-dlp**
   ```bash
   yt-dlp --version
   # Atau
   python -m yt_dlp --version
   ```

3. **Test download manual** (debug):
   ```bash
   yt-dlp --cookies cookies.txt "URL_YOUTUBE"
   ```

4. **Bersihkan cache**:
   - Hapus folder `downloads/`
   - Hapus file `downloads.json`
   - Upload cookies baru
   - Coba lagi

---

## FAQ

### Q: Berapa lama cookies valid?
**A:** Biasanya 1-4 minggu. Export cookies baru jika download mulai error.

### Q: Apakah cookies aman?
**A:** Cookies disimpan lokal di komputer Anda. JANGAN share ke orang lain.

### Q: Bisa download tanpa cookies?
**A:** TIDAK. YouTube wajib memerlukan cookies untuk verifikasi.

### Q: Video premium bisa di-download?
**A:** Hanya jika akun Anda memiliki akses ke video tersebut.

---

**Catatan:** Jika mengalami error yang tidak dijelaskan di sini, cek file `error.log` di folder aplikasi.
