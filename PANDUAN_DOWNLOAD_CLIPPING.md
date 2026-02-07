# Panduan Fitur Download & Clipping Terpisah

Project ini telah diperbarui untuk memisahkan proses download video YouTube dan proses clipping. Sekarang Anda memiliki lebih banyak kontrol atas workflow Anda.

## Fitur Baru

### 1. Menu Download Video
Menu ini memungkinkan Anda untuk men-download video YouTube terlebih dahulu tanpa langsung melakukan proses clipping.

**Cara Menggunakan:**
1. Klik tab **"Download"** di navigation bar
2. Paste URL YouTube video yang ingin di-download
3. Klik tombol **"Download"**
4. Video akan di-download dan disimpan di folder `downloads/`
5. Video yang sudah di-download akan muncul di daftar di bawahnya

**Keuntungan:**
- Download sekali, clip berkali-kali
- Tidak perlu menunggu download ulang jika ingin membuat clip berbeda
- Bisa manage video yang sudah di-download
- Bisa delete video yang tidak diperlukan lagi

### 2. Menu Kelola Clipping
Menu ini memungkinkan Anda untuk membuat clips dari video yang sudah di-download dengan menentukan timestamp secara manual.

**Cara Menggunakan:**
1. Klik tab **"Clipping"** di navigation bar
2. Pilih video dari dropdown (video yang sudah di-download sebelumnya)
3. Masukkan timestamps dalam format JSON:
   ```json
   [
     {
       "start": 10,
       "end": 25,
       "title": "Intro menarik",
       "reason": "Pembukaan yang engaging"
     },
     {
       "start": 45,
       "end": 60,
       "title": "Highlight utama",
       "reason": "Momen paling viral"
     }
   ]
   ```
4. Pilih pengaturan (Subtitle, Auto captions, Hook scene)
5. Klik **"Mulai Clipping"**
6. Hasil clip akan tersimpan di folder `output/`

**Format Timestamp:**
- `start`: Waktu mulai dalam detik (required)
- `end`: Waktu selesai dalam detik (required)
- `title`: Judul clip (optional)
- `reason`: Alasan/deskripsi clip (optional)

### 3. Menu Home (Tetap Ada)
Menu Home masih tersedia untuk workflow lama (download + clip langsung dengan AI).

## Struktur Folder

```
yt-short-clipper/
├── downloads/          # Video yang sudah di-download
│   └── downloads.json  # Database tracking video
├── output/             # Hasil clipping
└── ...
```

## Tips Penggunaan

1. **Download sekali, clip berkali-kali**: Download video populer sekali, lalu eksperimen dengan berbagai timestamp untuk menemukan clip terbaik.

2. **Manfaatkan JSON**: Simpan timestamp JSON Anda sebagai referensi untuk video tertentu.

3. **Hapus video yang tidak diperlukan**: Gunakan tombol "Delete" pada daftar video yang sudah di-download untuk menghemat ruang penyimpanan.

4. **Kombinasikan dengan AI**: Gunakan menu Home untuk AI-generated highlights, lalu gunakan menu Clipping untuk manual fine-tuning.

## Contoh Workflow

### Workflow 1: Manual Clipping
1. Download video dari YouTube menggunakan menu **Download**
2. Tonton video dan catat timestamp menarik
3. Buka menu **Clipping**
4. Pilih video dan masukkan timestamps
5. Mulai clipping

### Workflow 2: AI + Manual Refinement
1. Gunakan menu **Home** untuk generate clips dengan AI
2. Review hasil AI
3. Download video yang sama di menu **Download**
4. Buat clips manual dengan timestamp yang lebih presisi di menu **Clipping**

## Troubleshooting

**Q: Video tidak muncul di dropdown Clipping?**
A: Pastikan video sudah berhasil di-download di menu Download. Cek status download hingga "complete".

**Q: Error saat clipping?**
A: Pastikan format JSON timestamp benar. Gunakan validator JSON online jika perlu.

**Q: Video di-download kemana?**
A: Video disimpan di folder `downloads/` di direktori aplikasi.

## Catatan Teknis

- Video di-download dalam format terbaik yang tersedia dari YouTube
- Subtitle otomatis akan di-download jika tersedia
- Database video menggunakan file JSON sederhana (`downloads.json`)
- Setiap video diberi ID unik (UUID) untuk tracking
