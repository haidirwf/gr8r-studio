# Panduan Setup Integrasi Supabase - Gr8r Studio

Panduan langkah demi langkah untuk menghubungkan **Gr8r Studio** dengan database cloud Supabase, menjalankan skema migrasi data (proyek lomba, SKL, tugas, dan catatan), serta mengonfigurasi variabel lingkungan.

---

## 1. Ikhtisar Arsitektur

Gr8r Studio dirancang dengan pendekatan *hybrid-resilient*:
- **Mode Cloud**: Saat variabel lingkungan Supabase terisi, data tersinkronisasi langsung dengan Supabase PostgreSQL melalui client `@supabase/supabase-js`.
- **Mode Lokal (Fallback)**: Jika variabel lingkungan belum diisi, aplikasi tetap dapat digunakan secara mulus melalui penyimpanan browser lokal (`localStorage`) tanpa error runtime.
- **Keamanan Penuh (RLS)**: Seluruh tabel dilindungi *Row Level Security* (RLS). Pengguna hanya diizinkan membaca, menambah, mengubah, dan menghapus data miliknya sendiri (`auth.uid() = user_id`).

---

## 2. Langkah 1: Membuat Project Supabase Baru

Ikuti langkah-langkah berikut untuk membuat proyek:

1. Buka situs [supabase.com](https://supabase.com) dan login atau buat akun baru.
2. Di halaman Dashboard, klik tombol **"New Project"**.
3. Pilih organisasi Anda, lalu isi formulir pembuatan project:
   - **Name**: `Gr8r Studio` (atau nama pilihan Anda).
   - **Database Password**: Buat password yang kuat dan simpan dengan aman.
   - **Region**: Pilih wilayah terdekat (misalnya: *Southeast Asia - Singapore* untuk performa tercepat di Indonesia).
   - **Pricing Plan**: Pilih **Free Plan**.
4. Klik tombol **"Create new project"** dan tunggu 1-2 menit hingga database selesai disiapkan.

---

## 3. Langkah 2: Menjalankan Migrasi Skema SQL

Skema database lengkap telah disediakan pada berkas [docs/supabase-schema.sql](file:///home/idal/sekolajh/gr8r-studio/docs/supabase-schema.sql).

**Langkah Eksekusi di Supabase:**

1. Masuk ke dashboard proyek Supabase Anda.
2. Pada bilah navigasi kiri, pilih menu **SQL Editor** (ikon terminal/kode).
3. Klik tombol **"New Query"** (atau ikon **+**).
4. Buka file `docs/supabase-schema.sql` pada proyek ini, salin seluruh kodenya, dan tempelkan ke dalam editor query Supabase.
5. Klik tombol hijau **"Run"** (atau tekan shortcut `Ctrl + Enter` / `Cmd + Enter`).
6. Pastikan muncul notifikasi **"Success. No rows returned"** di bagian hasil.

**Tabel-tabel yang dibuat:**
- **`public.profiles`**: Menyimpan identitas siswa/pengguna (`id`, `name`, `email`, `avatar_url`) yang otomatis dibuat via database trigger saat registrasi akun.
- **`public.projects`**: Mengelola proyek belajar dengan kategori khusus pelajar (`category`: `'lomba'`, `'skl'`, atau `'umum'`), batas waktu (`deadline`), `color`, `status`, dan `progress` (0-100%).
- **`public.tasks`**: Rincian tugas yang berelasi dengan proyek atau mandiri, dilengkapi tanggal jatuh tempo (`due_date`), status (`'todo'`, `'progress'`, `'done'`), serta sub-tugas dinamis dalam kolom `jsonb`.
- **`public.notes`**: Catatan cepat materi/ide dengan penanda sematan (`pinned`) dan variasi warna.
- **Row Level Security (RLS)**: Otomatis diaktifkan pada keempat tabel di atas sehingga setiap user hanya bisa mengakses datanya masing-masing.

---

## 4. Langkah 3: Konfigurasi File Environment (.env)

Frontend Vite membutuhkan URL project dan Anon Public Key untuk dapat berkomunikasi dengan API Supabase.

**Cara Mendapatkan Kredensial API:**

1. Pada dashboard Supabase, klik ikon **Settings** (roda gigi) di bilah navigasi kiri bawah.
2. Pilih submenu **Data API** (atau **API** di bawah kategori Project Settings).
3. Temukan bagian **Project URL** dan **Project API Keys**:
   - Salin **Project URL** (format: `https://[project-id].supabase.co`).
   - Salin **anon public key** (token panjang berawalan `eyJ...`).

**Membuat File .env Lokal:**

1. Di terminal proyek Anda, buat salinan dari berkas `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Buka berkas `.env` dan masukkan kredensial yang telah Anda salin:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Simpan berkas `.env`.

> [!NOTE]
> File `.env` sudah masuk ke dalam `.gitignore` sehingga kunci otentikasi Anda tidak akan terunggah ke repositori git publik.

---

## 5. Langkah 4: Menjalankan Aplikasi & Verifikasi Koneksi

Setelah konfigurasi `.env` selesai:

1. Jalankan development server lokal:
   ```bash
   npm run dev
   ```
2. Buka aplikasi di browser (biasanya di `http://localhost:5173`).
3. Buka **Developer Tools** browser (`F12` atau `Ctrl+Shift+I`) dan periksa tab **Console**:
   - Jika konfigurasi berhasil, peringatan oranye/kuning fallback Supabase tidak akan muncul lagi.
   - Instance helper Supabase di `src/core/supabase.js` siap digunakan oleh modul-modul aplikasi.
4. Lakukan pengecekan build produksi:
   ```bash
   npm run build
   ```

---

## 6. Helper Client di Kode Sumber

Koneksi Supabase dikelola secara terpusat pada file [src/core/supabase.js](file:///home/idal/sekolajh/gr8r-studio/src/core/supabase.js).

**Contoh Penggunaan:**

```javascript
import { supabase, isSupabaseConfigured, getCurrentUser } from './core/supabase.js';

// Cek apakah Supabase aktif
if (isSupabaseConfigured) {
  // Ambil user yang sedang login
  const user = await getCurrentUser();
  console.log('User aktif:', user?.email);

  // Ambil daftar proyek lomba
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('category', 'lomba');
}
```

---

## 7. Pemecahan Masalah (Troubleshooting)

**1. Muncul error "new row violates row-level security policy":**
- Pastikan user sudah login terlebih dahulu sebelum melakukan `INSERT` ke tabel `projects`, `tasks`, atau `notes`.
- Pastikan nilai `user_id` pada payload data cocok dengan `(await supabase.auth.getUser()).data.user.id`.

**2. Nilai env tidak terbaca di browser:**
- Di Vite, semua variabel lingkungan yang dapat diakses oleh browser wajib diawali dengan awalan `VITE_` (contoh: `VITE_SUPABASE_URL`).
- Jika Anda baru saja mengedit `.env`, restart development server (`Ctrl + C` lalu `npm run dev`) agar Vite memuat variabel baru.

**3. Error trigger pada user registration:**
- Trigger `handle_new_user` dijalankan secara `SECURITY DEFINER` dengan privilege admin Supabase untuk memasukkan profil baru ke tabel `public.profiles`. Pastikan migrasi di `docs/supabase-schema.sql` telah dijalankan sampai selesai tanpa baris yang terlewati.
