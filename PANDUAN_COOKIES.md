# Panduan Upload Cookies untuk Download YouTube

## Mengapa Perlu Cookies?

YouTube memerlukan cookies untuk memverifikasi bahwa Anda adalah pengguna yang sah. Tanpa cookies, download mungkin gagal dengan error seperti:
- "Requested format is not available"
- "Video unavailable"
- "Sign in to confirm you're not a bot"

## Cara Mendapatkan Cookies

### Menggunakan Browser Extension (Recommended)

#### 1. Chrome/Edge - Get cookies.txt LOCALLY Extension

1. **Install Extension:**
   - Buka: https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc
   - Klik "Add to Chrome/Edge"

2. **Export Cookies:**
   - Buka website YouTube (youtube.com)
   - Login ke akun YouTube Anda
   - Klik icon extension (puzzle piece)
   - Klik "Get cookies.txt LOCALLY"
   - Klik "Export" atau "Download"
   - File `cookies.txt` akan terdownload

#### 2. Firefox - cookies.txt Extension

1. **Install Extension:**
   - Buka: https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/
   - Klik "Add to Firefox"

2. **Export Cookies:**
   - Buka website YouTube (youtube.com)
   - Login ke akun YouTube Anda
   - Klik icon extension cookies.txt
   - Klik "Current Site"
   - File `cookies.txt` akan terdownload

## Cara Upload Cookies di Aplikasi

1. **Klik tab "Download"** di aplikasi
2. Di bagian **"Cookies (Required)"**:
   - Klik **"Choose cookies.txt file..."**
   - Pilih file `cookies.txt` yang sudah di-download
   - Klik **"Upload"**
3. Tunggu hingga muncul pesan **"✓ Cookies uploaded successfully"**
4. Sekarang Anda bisa download video YouTube

## Troubleshooting

### "No cookies file. Please upload cookies.txt"
➜ Anda belum upload cookies. Ikuti langkah di atas untuk upload.

### "Download failed! cookies.txt not found"
➜ Cookies belum di-upload dengan benar. Coba upload ulang.

### "ERROR: Sign in to confirm you're not a bot"
➜ Cookies sudah kadaluarsa. Login ulang ke YouTube dan export cookies baru.

### Download masih gagal setelah upload cookies
➜ Coba:
1. Logout dari YouTube
2. Login ulang
3. Export cookies baru
4. Upload cookies baru ke aplikasi

## Keamanan

- ⚠️ **Jangan share cookies Anda ke orang lain!** Cookies berisi informasi login Anda.
- ✅ File cookies disimpan lokal di komputer Anda
- ✅ Cookies tidak dikirim ke server manapun
- ✅ Ganti cookies secara berkala untuk keamanan

## Lokasi File Cookies

File cookies akan disimpan di:
```
<app_directory>/cookies.txt
```

## Cookies Kadaluarsa?

Cookies biasanya berlaku beberapa minggu hingga beberapa bulan. Jika download mulai gagal lagi:
1. Export cookies baru dari browser
2. Upload ulang ke aplikasi
3. Coba download lagi

---

**Catatan:** Cookies diperlukan untuk semua download YouTube, termasuk di menu Download maupun menu Home.
