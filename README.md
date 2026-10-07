# 📸 Perumda Photo Selector

> Platform photo proofing dan client selection untuk fotografer — dibangun dengan Next.js dan terhubung ke Laravel REST API yang dideploy secara terpisah.

Perumda Photo Selector membantu fotografer mengelola project, membagikan galeri kepada klien, menerima pilihan foto, memantau proses editing, hingga mengirimkan hasil foto final.

## ✨ Fitur

- 📊 Dashboard project fotografer
- 🖼️ Client photo selection berbasis token
- 🔐 Password/PIN protection untuk galeri dan delivery
- ❤️ Pemilihan foto dengan batas maksimal
- ☁️ Integrasi Google Drive melalui backend
- ✂️ Workflow selected photos → editing
- 📦 Photo delivery dan download ZIP
- 🌍 Dukungan bahasa Indonesia/Inggris
- 🔄 Auto-refresh untuk data project
- 📱 Responsive UI

## 🏗️ Arsitektur

Repository ini **khusus untuk aplikasi Next.js**. Laravel backend tidak lagi disimpan di repository ini karena dideploy pada domain/subdomain API terpisah.

```
Browser
   │
   ▼
┌──────────────────────────────┐
│ Next.js App                  │
│ photo-selector               │
│ Hostinger / Node.js Hosting  │
│                              │
│ SSR + Server Actions         │
│ Next.js API proxy routes     │
└──────────────┬───────────────┘
               │ HTTPS REST API
               ▼
┌──────────────────────────────┐
│ Laravel REST API             │
│ https://api.example.com      │
│                              │
│ Sanctum/Auth + MySQL         │
│ Google Drive integration     │
└──────────────────────────────┘
```

### Struktur repository

```
photo-selector/
├── app/
│   ├── (auth)/
│   ├── api/
│   ├── delivery/
│   ├── projects/
│   └── select/
├── components/
│   ├── dashboard/
│   ├── delivery/
│   ├── gallery/
│   └── project-detail/
├── lib/
│   ├── api-client.ts
│   ├── config.ts
│   ├── laravel-proxy.ts
│   └── ...
├── public/
├── .env.example
├── next.config.js
├── package.json
├── package-lock.json
└── README.md
```

## 🛠️ Tech Stack

- **Next.js 16**
- **React 19**
- **TypeScript 5.7**
- **Tailwind CSS 4**
- **shadcn/ui**
- **Lucide React**
- **Zod**
- **Sharp**
- **JSZip**

Backend API:

- **Laravel**
- **PHP**
- **Laravel Sanctum**
- **MySQL**
- **Google Drive API**

> Backend API dikelola dan dideploy secara terpisah dari repository ini.

## 🚀 Menjalankan Secara Lokal

### Prerequisites

- Node.js 20, 22, atau 24
- npm
- Laravel API yang sedang berjalan

### 1. Clone

```bash
git clone https://github.com/tonypradipta/photo-selector.git
cd photo-selector
```

### 2. Install dependency

```bash
npm install
```

### 3. Environment

Salin `.env.example` menjadi `.env.local`:

```bash
cp .env.example .env.local
```

Isi:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Untuk production:

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

### 4. Development

```bash
npm run dev
```

Buka:

```
http://localhost:3000
```

### 5. Production test

```bash
npm run build
npm run start
```

## 🌐 Deployment ke Hostinger

Aplikasi ini **bukan static frontend**. Project menggunakan SSR, Server Actions, middleware/proxy, dynamic rendering, dan Next.js API routes. Karena itu deploy sebagai **Next.js/Node.js Web App**, bukan sebagai file HTML statis.

Hostinger saat ini mendukung deployment Next.js melalui Node.js hosting, termasuk SSR dan API routes. [Dokumentasi deployment Next.js Hostinger](https://www.hostinger.com/id/web-apps-hosting/nextjs-hosting)

### Build settings

Gunakan:

```
Framework: Next.js
Node.js: 22.x
Build command: npm run build
Start command: npm run start
```

Repository sekarang memiliki `package.json` langsung di root agar Hostinger dapat mendeteksi aplikasi tanpa harus masuk ke folder `frontend/`.

### Environment variable

Tambahkan pada Hostinger:

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

Jangan memasukkan credential database, Google Service Account, private key, atau secret backend ke repository.

Hostinger menyediakan pengaturan environment variable pada proses deployment/redeploy. [Pengaturan environment variable Hostinger](https://www.hostinger.com/support/how-to-add-environment-variables-during-node-js-application-deployment/)

### Alur production

```
https://your-domain.com
        │
        │ Next.js
        ▼
   Hostinger
        │
        │ HTTPS
        ▼
https://api.your-domain.com
        │
        │ Laravel REST API
        ▼
   MySQL / Google Drive
```

## 🔐 Catatan CORS & Sanctum

Karena frontend dan backend berada pada origin yang berbeda, backend Laravel harus mengizinkan domain frontend production.

Contoh:

```
Frontend:
https://photo.your-domain.com

API:
https://api.your-domain.com
```

Konfigurasi Laravel harus disesuaikan agar request dari frontend diperbolehkan dan credential/cookie Sanctum bekerja sesuai arsitektur authentication backend.

Jika menggunakan bearer token, pastikan endpoint API menerima:

```
Authorization: Bearer <token>
```

## 🔌 API Proxy

Beberapa operasi client-facing menggunakan Next.js API routes sebagai proxy:

```
/api/gallery/[token]/selection
/api/gallery/[token]/submit
/api/gallery/[token]/unlock
/api/projects/[id]/photos
/api/projects/[id]/sync
```

Route tersebut meneruskan request ke Laravel API menggunakan `NEXT_PUBLIC_API_URL`.

Dengan demikian, Next.js tetap berfungsi sebagai application server/BFF untuk bagian tertentu, sementara seluruh business logic dan data utama tetap berada di Laravel.

## 🔄 Workflow

1. Fotografer login.
2. Fotografer membuat project.
3. Foto project disinkronkan dari Google Drive.
4. Sistem membuat link galeri client.
5. Klien membuka galeri dan memilih foto.
6. Pilihan dikirim ke Laravel API.
7. Fotografer memproses foto terpilih.
8. Foto hasil editing disinkronkan.
9. Delivery dibuat.
10. Klien mengunduh foto final.

## 📡 Endpoint Utama

Authentication:

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/logout
GET  /api/auth/user
```

Gallery:

```
GET  /api/gallery/{token}
POST /api/gallery/{token}/unlock
POST /api/gallery/{token}/selection
POST /api/gallery/{token}/submit
```

Projects:

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

## 🔒 Security

- Jangan commit `.env.local`.
- Jangan commit API key atau credential Google.
- Gunakan HTTPS pada production.
- Gunakan domain API khusus untuk Laravel.
- Batasi CORS Laravel hanya ke origin frontend yang diperlukan.
- Jangan menaruh secret backend pada `NEXT_PUBLIC_*` karena variabel tersebut dapat tersedia di browser.
- Review token/cookie authentication sebelum production.

## 🧪 Troubleshooting Hostinger

Jika deployment gagal:

1. Pastikan `package.json` berada di root repository.
2. Pastikan Node.js version sesuai dengan `engines`.
3. Pastikan `NEXT_PUBLIC_API_URL` sudah diisi.
4. Periksa build logs.
5. Periksa runtime logs jika build berhasil tetapi aplikasi tidak dapat dibuka.

Hostinger menyarankan pengecekan build command, Node.js version, environment variables, dan lokasi `package.json` ketika deployment gagal. [Panduan troubleshooting Node.js Hostinger](https://www.hostinger.com/support/fix-failed-build-application-error-hostinger-node-js/)

## 📌 Status

Project sedang aktif dikembangkan. Perubahan dapat terjadi pada UI, API contract, authentication flow, Google Drive synchronization, dan delivery workflow.

## 👨‍💻 Author

**Tony Pradipta**

- GitHub: [@tonypradipta](https://github.com/tonypradipta)
- Repository: [photo-selector](https://github.com/tonypradipta/photo-selector)

---

<p align="center">
  Built with ❤️ for a better photography workflow.
</p>
