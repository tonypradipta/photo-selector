# 📸 Perumda Photo Selector

> Platform pemilihan foto berbasis web yang membantu fotografer mengelola galeri proyek, membagikan foto kepada klien, menerima pilihan foto, hingga mengirimkan hasil foto terpilih secara terstruktur.

**Perumda Photo Selector** dirancang untuk menyederhanakan alur kerja fotografer dan klien dalam proses **photo proofing → photo selection → editing → delivery**. Aplikasi menggunakan arsitektur **Next.js sebagai frontend** dan **Laravel sebagai REST API backend**, dengan integrasi Google Drive untuk pengelolaan foto.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Laravel](https://img.shields.io/badge/Laravel-10-FF2D20?logo=laravel&logoColor=white)](https://laravel.com/)
[![PHP](https://img.shields.io/badge/PHP-8.1%2B-777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ✨ Tentang Project

Dalam workflow fotografi, proses memilih foto dari ratusan hingga ribuan file dapat memakan banyak waktu jika dilakukan melalui chat atau folder biasa.

Project ini menyediakan satu workspace terpusat untuk:

- 👤 **Fotografer** membuat dan mengelola proyek.
- 🖼️ **Klien** membuka galeri melalui tautan khusus.
- ❤️ **Klien** memilih foto yang diinginkan.
- 🔐 Galeri dapat dilindungi dengan password/PIN dan dikunci setelah proses seleksi selesai.
- ☁️ **Google Drive** digunakan sebagai sumber dan penyimpanan file foto.
- ✨ Foto terpilih dapat masuk ke workflow editing.
- 📦 Foto final dapat dikirim melalui halaman delivery.
- 🌐 Klien dapat mengunduh foto individual atau paket ZIP.
- 🌍 Antarmuka mendukung pergantian bahasa.

---

## 🚀 Fitur Utama

### 📊 Dashboard Fotografer

Dashboard menyediakan workspace untuk mengelola seluruh aktivitas proyek:

- Daftar proyek dan statusnya
- Statistik foto terpilih dan foto terkirim
- Pencarian proyek
- Manajemen klien
- Profil dan pengaturan
- Copy link galeri klien
- Sinkronisasi foto
- Lock/unlock proyek

### 🖼️ Client Photo Selection

Klien dapat membuka galeri menggunakan token unik tanpa perlu membuat akun.

Fitur yang tersedia:

- Gallery berbasis token
- Password protection
- Preview foto
- Pemilihan dan pembatalan pilihan foto
- Batas maksimal jumlah foto yang dapat dipilih
- Review pilihan sebelum submit
- Konfirmasi final selection
- Status galeri setelah dikunci

### ✂️ Selected Photos Workflow

Foto yang telah dipilih klien dapat dikelola melalui workflow terpisah:

1. Foto dipilih oleh klien.
2. Foto masuk ke daftar **Foto Terpilih**.
3. Fotografer dapat memulai proses editing.
4. Hasil dapat dilanjutkan ke proses delivery.

### 📦 Photo Delivery

Setelah foto selesai diedit, fotografer dapat membuat proses delivery:

- Menentukan folder hasil foto.
- Sinkronisasi folder.
- Monitoring status sinkronisasi.
- Mengirim delivery link kepada klien.
- Revoke delivery jika diperlukan.
- Menandai delivery sebagai selesai.
- Download foto satu per satu.
- Download seluruh foto dalam format ZIP.

### ☁️ Google Drive Integration

Backend menyediakan service khusus untuk integrasi Google Drive, termasuk:

- Membaca foto dari folder.
- Sinkronisasi foto ke project.
- Mengelola folder hasil editing.
- Mengakses file berdasarkan metadata/folder.

---

## 🏗️ Arsitektur

Project menggunakan pendekatan **separated frontend + backend**:

```
┌───────────────────────────────┐
│           CLIENT              │
│       Browser / Mobile        │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│       Next.js Frontend        │
│   React + TypeScript +        │
│       Tailwind CSS            │
└───────────────┬───────────────┘
                │ REST API
                ▼
┌───────────────────────────────┐
│        Laravel Backend        │
│    REST API + Sanctum Auth    │
└───────┬───────────┬───────────┘
        │           │
        ▼           ▼
   ┌─────────┐  ┌──────────────┐
   │ MySQL   │  │ Google Drive │
   └─────────┘  └──────────────┘
```

### Struktur repository

```
photo-selector/
├── backend/                 # Laravel REST API
│   ├── app/
│   │   ├── Http/
│   │   │   └── Controllers/
│   │   ├── Models/
│   │   └── Services/
│   ├── config/
│   ├── database/
│   ├── routes/
│   ├── storage/
│   ├── .env.example
│   └── composer.json
│
├── frontend/                # Next.js application
│   ├── app/
│   │   ├── api/
│   │   ├── delivery/
│   │   ├── projects/
│   │   └── select/
│   ├── components/
│   │   ├── dashboard/
│   │   ├── delivery/
│   │   ├── gallery/
│   │   └── project-detail/
│   ├── lib/
│   ├── public/
│   └── package.json
│
└── README.md
```

---

## 🛠️ Tech Stack

### Frontend

| Teknologi | Kegunaan |
|---|---|
| **Next.js 16** | React framework dan application routing |
| **React 19** | UI component development |
| **TypeScript** | Static typing |
| **Tailwind CSS 4** | Styling dan responsive UI |
| **shadcn/ui** | UI primitives |
| **Lucide React** | Icon system |
| **Zod** | Validation |
| **Sharp** | Image processing |
| **JSZip** | ZIP generation/download |
| **Google APIs** | Integrasi Google services |

### Backend

| Teknologi | Kegunaan |
|---|---|
| **Laravel 10** | REST API framework |
| **PHP 8.1+** | Backend runtime |
| **Laravel Sanctum** | Authentication |
| **MySQL** | Relational database |
| **Guzzle** | HTTP client |
| **Google APIs** | Integrasi Google Drive |

---

## 🔄 Workflow Aplikasi

### 1. Buat Project

Fotografer membuat project baru dan mengatur informasi klien serta batas jumlah foto yang dapat dipilih.

### 2. Sinkronisasi Foto

Foto dari Google Drive disinkronisasikan ke project.

### 3. Bagikan Gallery

Sistem menghasilkan tautan unik untuk klien.

Contoh:

```
https://your-domain.com/select/{token}
```

### 4. Client Memilih Foto

Klien membuka gallery, melihat preview, kemudian memilih foto yang diinginkan.

### 5. Submit Selection

Klien melakukan review dan mengirim pilihan final.

### 6. Editing

Fotografer melihat daftar foto terpilih dan memproses foto tersebut.

### 7. Delivery

Foto yang sudah selesai diedit dimasukkan ke workflow delivery.

### 8. Client Download

Klien membuka delivery link dan dapat mengunduh foto secara individual maupun sebagai ZIP.

---

## 🔐 Authentication & Security

Backend menggunakan **Laravel Sanctum** untuk protected API routes.

Secara umum endpoint dibagi menjadi:

### Public

Digunakan oleh client-facing pages:

- Authentication
- Gallery
- Gallery unlock
- Photo selection
- Gallery submission
- Delivery portal
- Photo download
- ZIP download

### Protected

Digunakan oleh fotografer yang telah login:

- Profile
- Project management
- Selected photos
- Delivery management
- Project synchronization

> **Catatan:** Jangan pernah commit file `.env`, credential Google Service Account, API key, database password, atau secret lainnya ke repository.

---

## ⚙️ Instalasi

### Prerequisites

Pastikan environment sudah memiliki:

- **PHP 8.1 atau lebih baru**
- **Composer**
- **Node.js**
- **npm**
- **MySQL**
- **Google Cloud Project** jika menggunakan Google Drive integration

---

### 1. Clone Repository

```bash
git clone https://github.com/tonypradipta/photo-selector.git
cd photo-selector
```

---

### 2. Setup Backend

Masuk ke folder backend:

```bash
cd backend
```

Install dependency:

```bash
composer install
```

Buat file environment:

```bash
cp .env.example .env
```

Generate application key:

```bash
php artisan key:generate
```

Atur database pada `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=photo_selector
DB_USERNAME=root
DB_PASSWORD=
```

Jalankan migration:

```bash
php artisan migrate
```

Jalankan backend:

```bash
php artisan serve
```

Backend secara default tersedia di:

```
http://localhost:8000
```

---

### 3. Setup Google Drive

Buat Google Cloud Project dan aktifkan Google Drive API.

Kemudian masukkan credential pada `backend/.env`:

```env
GOOGLE_PROJECT_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_API_KEY=
```

Folder Google Drive yang digunakan aplikasi perlu diberikan akses kepada service account sesuai kebutuhan aplikasi.

---

### 4. Setup Frontend

Buka terminal baru:

```bash
cd frontend
```

Install dependency:

```bash
npm install
```

Buat file:

```
.env.local
```

Kemudian konfigurasi URL backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Jalankan development server:

```bash
npm run dev
```

Frontend tersedia di:

```
http://localhost:3000
```

---

## 📡 API Overview

API utama berada di:

```
backend/routes/api.php
```

### Authentication

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/logout
GET  /api/auth/user
```

### Gallery

```
GET  /api/gallery/{token}
POST /api/gallery/{token}/unlock
POST /api/gallery/{token}/selection
POST /api/gallery/{token}/submit
```

### Projects

```
GET    /api/projects
POST   /api/projects
GET    /api/projects/{id}
PUT    /api/projects/{id}
DELETE /api/projects/{id}
POST   /api/projects/{id}/lock
POST   /api/projects/{id}/sync
GET    /api/projects/{id}/photos
```

### Selected Photos

```
GET  /api/selected-photos
GET  /api/selected-photos/{id}
POST /api/selected-photos/{id}/start-editing
GET  /api/selected-photos/{id}/export
```

### Delivery

```
GET  /api/deliveries
GET  /api/deliveries/{id}
PUT  /api/deliveries/{id}/folder
POST /api/deliveries/{id}/sync
GET  /api/deliveries/{id}/sync-status
POST /api/deliveries/{id}/send
POST /api/deliveries/{id}/revoke/{deliveryId}
POST /api/deliveries/{id}/complete
```

### Public Delivery

```
GET /api/delivery/{token}
POST /api/delivery/{token}/pin
GET /api/delivery/{token}/photos/{photoId}/download
GET /api/delivery/{token}/zip
```

---

## 🧪 Development

### Frontend

```bash
cd frontend

npm run dev
```

Production build:

```bash
npm run build
npm run start
```

### Backend

```bash
cd backend

php artisan serve
```

Useful Laravel commands:

```bash
php artisan migrate
php artisan route:list
php artisan config:clear
php artisan cache:clear
```

---

## 🌐 Deployment

Untuk deployment production, pisahkan deployment frontend dan backend.

### Frontend

Next.js dapat dideploy ke platform yang mendukung Node.js/Next.js.

Set environment variable:

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

### Backend

Laravel membutuhkan:

- PHP 8.1+
- Composer
- MySQL
- Web server / PHP process manager
- Environment variables
- Storage permission
- Google API credentials

Pastikan backend menggunakan HTTPS pada production dan domain frontend telah dikonfigurasi pada Sanctum.

---

## 📌 Status Project

Project ini sedang dikembangkan dan dapat mengalami perubahan pada:

- UI/UX
- API contract
- Database schema
- Google Drive synchronization
- Photo delivery workflow
- Authentication flow

Gunakan branch terpisah untuk pengembangan fitur baru.

---

## 🤝 Contributing

Kontribusi sangat terbuka.

1. Fork repository.
2. Buat branch baru:

```bash
git checkout -b feature/nama-fitur
```

3. Commit perubahan:

```bash
git commit -m "feat: add nama fitur"
```

4. Push branch:

```bash
git push origin feature/nama-fitur
```

5. Buat Pull Request.

---

## 🐛 Bug & Feature Request

Jika menemukan bug atau memiliki ide fitur, silakan gunakan **GitHub Issues** pada repository ini.

Saat melaporkan bug, sertakan:

- Deskripsi masalah
- Langkah untuk reproduksi
- Expected behavior
- Actual behavior
- Screenshot jika diperlukan
- Environment yang digunakan

---

## 📄 License

Project ini menggunakan lisensi **MIT**.

---

## 👨‍💻 Author

**Tony Pradipta**

GitHub: [@tonypradipta](https://github.com/tonypradipta)

Repository: [photo-selector](https://github.com/tonypradipta/photo-selector)

---

<p align="center">
  Built with ❤️ for a better photography workflow.
</p>
