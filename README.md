# Stock Master Neobrutalism

Aplikasi web manajemen stok barang (Input Harian, Rekap Bulanan, Dashboard) dengan antarmuka desain *Neobrutalism* yang modern, mencolok, dan interaktif.

Proyek ini menyediakan **2 opsi implementasi** yang bisa Anda gunakan sesuai kebutuhan:
1. **Versi Google Apps Script (Direkomendasikan)**: Berjalan 100% *online/serverless* terintegrasi langsung dengan akun Google Sheets Anda.
2. **Versi Lokal (Node.js + React)**: Berjalan secara *offline* di komputer Anda menggunakan database SQLite.

---

## Opsi 1: Menjalankan Versi Google Apps Script (GAS)

Versi ini sangat portabel, 100% gratis, bisa diakses dari perangkat mana pun (HP/Laptop), dan seluruh data transaksi tersimpan sangat aman di file **Google Sheets** Anda.

File yang Anda perlukan berada di dalam folder `appscript/`.

### Langkah-langkah Pemasangan (Deployment):
1. Buka browser dan buat file Google Sheets baru melalui [sheets.new](https://sheets.new) (Beri judul file, misal: "Database Stock Master").
2. Pada file Sheets tersebut, klik menu **Ekstensi** > **Apps Script**. Tab baru berisi editor kode akan terbuka.
3. Di editor Apps Script (pada file `Kode.gs` / `Code.gs`), hapus semua kode bawaan. Buka file `appscript/Code.gs` dari komputer Anda, salin (*copy*) seluruh isinya, dan tempel (*paste*) ke editor.
4. Klik tombol **+ (Tambahkan File)** di panel sebelah kiri, pilih **HTML**. Beri nama file tersebut: **`index`** (tanpa tambahan .html).
5. Hapus semua kode bawaan di `index.html` tersebut. Buka file `appscript/index.html` dari komputer Anda, salin seluruh isinya, dan tempel ke editor Apps Script.
6. Simpan (*Save*) proyek Anda (Ctrl + S).
7. Di bagian atas editor, pilih fungsi **`initializeSetup`** dari menu *dropdown*, lalu klik tombol ▶️ **Jalankan** (*Run*). 
   *(Google akan meminta izin akses. Klik "Review permissions" -> pilih akun Google -> klik "Advanced" -> klik "Go to project (unsafe)" -> klik "Allow").*
8. Setelah berhasil dijalankan, kembali ke file Google Sheets Anda. Otomatis akan terbentuk 3 tab Sheet (**Master**, **Transactions**, **Monthly**) yang siap digunakan.
9. Kembali ke Apps Script, klik tombol biru **Terapkan** (*Deploy*) di sudut kanan atas > **Deployment baru** (*New deployment*).
10. Klik icon roda gigi ⚙️, centang **Aplikasi Web** (*Web app*).
11. Pada bagian "Akses aplikasi" (*Who has access*), pilih **Siapa saja** (*Anyone*).
12. Klik **Terapkan**. Selesai! Buka URL Web App yang diberikan untuk menggunakan aplikasi.

*(**Tips**: Untuk memasukkan daftar barang secara massal, Anda cukup copy-paste data barang langsung ke bawah kolom tabel di sheet **Master**).*

---

## Opsi 2: Menjalankan Versi Lokal (Komputer)

Opsi ini cocok digunakan jika Anda seorang *developer* yang ingin memodifikasi tampilan atau logika aplikasi secara lokal. Aplikasi ini menggunakan **React (Vite)** di bagian *Frontend* dan **Express + Prisma + SQLite** di bagian *Backend*.

### Persyaratan Awal:
- Node.js versi 18 ke atas telah terinstal.

### Cara Menjalankan:
Buka dua terminal (*command prompt*) secara terpisah.

**Terminal 1 (Menjalankan Backend):**
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
*(Server backend akan berjalan di `http://localhost:3000`)*

**Terminal 2 (Menjalankan Frontend):**
```bash
cd frontend
npm install
npm run dev
```
*(Server frontend akan berjalan di `http://localhost:5173`. Buka URL ini di browser).*

---

## Cara *Compile* Ulang ke Google Apps Script
Jika Anda memodifikasi kode React (di folder `frontend/`) dan ingin memperbarui aplikasi Google Apps Script Anda:
1. Buka terminal, masuk ke folder `frontend`.
2. Jalankan perintah `npm run build`.
3. Perintah ini akan menghasilkan file `dist/index.html` tunggal yang baru.
4. Salin isi file tersebut dan tempel (timpa) file `index.html` yang ada di Google Apps Script editor Anda.
5. Lakukan "Deployment baru" lagi untuk mengaplikasikan pembaruan.
