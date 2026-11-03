# Daarul Azmi Twibbon Studio

Platform resmi pembuatan foto Twibbon untuk kegiatan Pondok Pesantren Daarul Azmi.

**Tagline:** "Satu Bingkai, Satu Semangat, Bersama Daarul Azmi."

## Fitur

- 🎨 **Editor Twibbon** — Upload foto, atur posisi, zoom, rotasi, dan download hasil
- 📱 **Mobile First** — Desain responsif, mendukung gesture pinch-to-zoom di HP
- 🏷️ **Kampanye** — Kelola berbagai kampanye Twibbon untuk kegiatan berbeda
- 📥 **Download PNG/JPG** — Hasil berkualitas tinggi sesuai resolusi bingkai
- 🔒 **Privasi** — Foto diproses secara lokal di browser, tidak diunggah ke server
- 📲 **PWA** — Bisa diinstal sebagai aplikasi di HP

## Teknologi

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas API
- File API
- JSON untuk data kampanye

## Struktur Folder

```
twibbon-studio/
├── index.html              # Halaman beranda
├── kampanye.html           # Daftar kampanye
├── editor.html             # Editor Twibbon
├── panduan.html            # Panduan penggunaan
├── manifest.json           # PWA manifest
├── service-worker.js       # PWA service worker
├── assets/
│   └── logo/
│       └── logo.png        # Logo Daarul Azmi
├── campaigns/              # Folder untuk gambar kampanye
│   ├── harlah/
│   │   ├── cover.png       # Cover kampanye
│   │   ├── frame-1.png     # Bingkai 1 (PNG transparan)
│   │   └── frame-2.png     # Bingkai 2
│   ├── maulid/
│   ├── wisuda/
│   ├── islam/
│   ├── ramadan/
│   └── ppdb/
├── css/
│   ├── global.css          # Variabel dan utility
│   ├── layout.css          # Layout halaman
│   ├── mobile.css          # Responsif mobile
│   └── editor.css          # Layout editor
├── js/
│   ├── app.js              # Inisialisasi aplikasi
│   ├── campaigns.js        # Modul kampanye
│   ├── canvas-engine.js    # Engine canvas
│   ├── editor.js           # Logika editor
│   └── download.js         # Helper download
└── data/
    └── campaigns.json      # Data kampanye
```

## Cara Menjalankan

### Lokal (Development)

1. Buka terminal di folder `twibbon-studio`
2. Jalankan server lokal:
   ```bash
   python3 -m http.server 8000
   ```
   atau
   ```bash
   npx serve .
   ```
3. Buka browser di `http://localhost:8000`

### GitHub Pages

1. Push ke repositori GitHub
2. Aktifkan GitHub Pages di Settings → Pages
3. Pilih branch `main` dan folder `/ (root)`
4. Website akan tersedia di `https://username.github.io/repo-name/`

### Subdomain Custom

Tambahkan file `CNAME` dengan isi domain Anda, contoh:
```
twibbon.daarulazmi.ponpes.id
```

## Cara Menambahkan Logo

Ganti file `assets/logo/logo.png` dengan logo Daarul Azmi Anda.

## Cara Menambahkan Bingkai (Frame)

### 1. Buat Gambar Bingkai

- Format: **PNG dengan transparansi**
- Resolusi: Minimal **1080x1080 pixel**
- Area tengah harus transparan agar foto terlihat
- Gunakan tools seperti Photoshop, GIMP, atau Canva

### 2. Upload ke Folder Kampanye

Letakkan file bingkai di folder kampanye yang sesuai:
```
campaigns/nama-kampanye/frame-1.png
```

### 3. Edit `data/campaigns.json`

Tambahkan atau edit data kampanye:

```json
{
  "id": "nama-kampanye",
  "title": "Judul Kampanye",
  "description": "Deskripsi kampanye...",
  "category": "kategori",
  "cover": "campaigns/nama-kampanye/cover.png",
  "status": "active",
  "frames": [
    {
      "name": "Nama Bingkai 1",
      "image": "campaigns/nama-kampanye/frame-1.png"
    },
    {
      "name": "Nama Bingkai 2",
      "image": "campaigns/nama-kampanye/frame-2.png"
    }
  ]
}
```

### 4. Status Kampanye

- `"active"` — Kampanye aktif, ditampilkan di halaman utama
- `"inactive"` — Kampanye tidak aktif, masih bisa diakses

## Cara Menguji di HP

1. Buka website di browser HP (Chrome/Safari)
2. Upload foto dari galeri
3. Geser foto dengan satu jari
4. Zoom dengan dua jari (pinch)
5. Rotasi dengan dua jari
6. Download hasilnya

## Privasi

- Semua foto diproses **lokal di browser** pengguna
- Tidak ada foto yang diunggah ke server
- Tidak ada data pribadi yang disimpan

## Dashboard Admin

Dashboard admin untuk mengelola kampanye akan tersedia di tahap berikutnya. Saat ini, kampanye dikelola langsung melalui file `data/campaigns.json`.

## Lisensi

© 2026 Pondok Pesantren Daarul Azmi. Hak cipta dilindungi undang-undang.
