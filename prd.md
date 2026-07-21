# PRD — Sistem Input & Rekap Stock Barang (Internal)

**Versi:** 1.0
**Tanggal:** 21 Juli 2026
**Dibuat oleh:** Aliester
**Status:** Draft untuk pengembangan

---

## 1. Latar Belakang & Masalah

Saat ini pencatatan stock barang import dilakukan manual di Excel (`STOCK JUNI 2026`), dengan struktur: master item, saldo awal bulanan, input barang masuk/keluar harian, dan sisa barang. Proses ini punya beberapa masalah:

- Input manual di cell Excel rawan salah kolom/baris (800+ item).
- Saldo awal bulan berikutnya harus di-copy manual dari sisa barang bulan sebelumnya — rawan lupa/salah copy.
- Tidak ada jejak siapa mengubah data apa dan kapan.
- Tidak ada validasi (misal input negatif, salah format).
- Proses input jadi lambat karena harus scroll & cari cell secara manual.

## 2. Tujuan Produk

1. Mempercepat proses input data barang masuk/keluar harian.
2. Meminimalisir human error lewat validasi otomatis dan carry-over saldo otomatis.
3. Memungkinkan migrasi data lama (Excel) ke sistem baru tanpa input ulang manual.
4. Hasil export Excel harus **identik secara visual** dengan template asli (warna, merge cell, layout).

## 3. Target Pengguna

- Internal kantor, jumlah user sedikit (estimasi < 10 orang).
- Akses dibatasi di level jaringan (LAN kantor / Tailscale VPN), **tanpa sistem login**.
- Identitas user cukup lewat dropdown nama (non-password) untuk keperluan audit log saja.

## 4. Lingkup (Scope)

### 4.1 Termasuk dalam scope
- Import data Excel lama ke sistem (one-time / occasional, per kebutuhan).
- Input harian barang masuk & keluar per item.
- Kolom bebas teks: KET, HANDCARRY, KEBUTUHAN PO (per item per bulan).
- Carry-over saldo awal otomatis tiap bulan baru.
- Rekap harian (rekap total masuk/keluar per tanggal).
- Rekap bulanan (tampilan seperti Excel: saldo awal, jumlah masuk, jumlah keluar, sisa barang).
- Export ke Excel dengan format identik template asli.
- Audit log perubahan data (siapa, kapan, sebelum/sesudah).

### 4.2 Tidak termasuk (out of scope, fase awal)
- Sistem login & role-based permission kompleks.
- Real-time collaborative editing (Socket.IO) — belum dibutuhkan karena user sedikit.
- Notifikasi email/WhatsApp otomatis.
- Multi-gudang / multi-cabang (asumsi 1 lokasi stock).

## 5. Fitur & Requirement Detail

### 5.1 Import Data Excel Lama
**Tujuan:** Migrasi data historis tanpa input ulang manual.

- Admin upload file `.xlsx` sesuai format existing.
- Sistem otomatis parse:
  - Master item (NO, CODE, SPEC, UNIT).
  - Saldo awal bulan tersebut.
  - Data transaksi harian per tanggal (kolom M/K) jika ada.
  - Kolom KET, HANDCARRY, KEBUTUHAN PO.
- Sistem tampilkan preview hasil parse sebelum disimpan permanen (agar admin bisa cek kesalahan sebelum commit ke database).
- Item yang sudah ada (by CODE) di-update, item baru otomatis ditambahkan (upsert).

**Acceptance criteria:**
- File Excel dengan struktur seperti contoh berhasil ter-parse tanpa error.
- Data yang sudah masuk konsisten dengan isi Excel asli (spot-check minimal 10 baris).

### 5.2 Input Harian (Fitur Utama)
**Tujuan:** Mempercepat & mengurangi error saat input transaksi harian.

- Halaman menampilkan daftar item dengan **search by CODE atau SPEC** (bukan scroll manual).
- Pilih tanggal input (default: hari ini).
- Kolom input: Barang Masuk, Barang Keluar (per item, per tanggal terpilih).
- Validasi otomatis:
  - Hanya menerima angka, tidak boleh negatif.
  - Peringatan jika input menyebabkan sisa barang menjadi minus.
- Navigasi keyboard (Enter/Tab) agar input berturut-turut tanpa klik mouse.
- Live preview sisa barang saat input diketik.
- Highlight visual untuk item yang sudah diinput hari itu.
- Auto-save per baris (tidak perlu tombol submit besar di akhir, mengurangi risiko kehilangan data kalau lupa save).
- (Opsional, fase 2) Bulk paste dari clipboard format `CODE<tab>qty`.

**Acceptance criteria:**
- User bisa input transaksi untuk 20 item berturut-turut dalam < 2 menit tanpa mouse.
- Input invalid (huruf, negatif) ditolak sebelum tersimpan.

### 5.3 Kolom Catatan Bebas (KET, HANDCARRY, KEBUTUHAN PO)
- Melekat di level item per bulan (bukan per tanggal).
- Textarea/input teks bebas, auto-save saat kehilangan fokus (on blur).
- Tidak ada validasi format khusus (memang catatan bebas).

### 5.4 Carry-Over Saldo Awal Otomatis
**Tujuan:** Titik paling kritis untuk mencegah human error.

- Setiap tanggal 1 bulan baru, sistem otomatis:
  - Hitung sisa barang tiap item di bulan sebelumnya.
  - Buat record bulan baru dengan `saldo_awal` = sisa barang bulan lalu.
- Proses ini berjalan otomatis via scheduled job (cron), **tanpa tombol manual** untuk menghindari human action di titik sensitif.
- `saldo_awal` bersifat read-only di UI (tidak bisa diedit manual oleh user).
- (Cadangan) Tersedia halaman terpisah "Generate Bulan Baru" manual untuk admin, khusus jika cron gagal jalan — dengan konfirmasi eksplisit sebelum eksekusi.

**Acceptance criteria:**
- Saldo awal bulan berjalan selalu sama dengan sisa barang bulan sebelumnya, tanpa campur tangan manual.

### 5.5 Rekap Harian
- Tampilan ringkasan: total barang masuk & keluar per tanggal (semua item digabung, atau bisa difilter per item).
- Berguna untuk cek cepat aktivitas harian tanpa buka rekap bulanan penuh.

### 5.6 Rekap Bulanan
- Tampilan tabel sesuai struktur Excel asli: NO, CODE, SPEC, UNIT, KET, HANDCARRY, SALDO AWAL, JUMLAH MASUK, JUMLAH KELUAR, SISA BARANG, KEBUTUHAN PO, dan breakdown per tanggal (M/K).
- Bisa filter per bulan/tahun.
- Semua angka (kecuali saldo awal & catatan teks) dihitung otomatis dari data transaksi harian — tidak disimpan manual, supaya tidak ada data yang "tidak sinkron".

### 5.7 Export ke Excel — Identik dengan Template Asli
**Tujuan:** Hasil export harus sama persis (visual & struktur) dengan file Excel yang dipakai sekarang.

- Sistem menggunakan **file Excel asli sebagai template dasar** (bukan generate ulang style dari kode).
- Saat export, sistem membuka salinan template tersebut dan **hanya mengisi value ke cell yang sudah punya format tetap** (warna, border, merge, font, lebar kolom tidak disentuh/ditulis ulang).
- Kolom tanggal (jumlah hari per bulan) di-generate mengikuti pola kolom tanggal yang sudah ada di template.
- Output file `.xlsx` bisa langsung didownload user dari halaman rekap bulanan.

**Acceptance criteria:**
- File hasil export dibuka di Excel/Google Sheets, dibandingkan side-by-side dengan file asli: warna header, merge cell, urutan kolom, dan border sama persis.
- Tidak ada perbedaan visual yang terlihat oleh user saat pertama kali membuka file.

### 5.8 Audit Log
- Setiap perubahan data transaksi (input/edit) tercatat: nama user (dari dropdown), timestamp, nilai lama → nilai baru.
- Bisa dilihat di halaman terpisah (misal per item atau per tanggal) untuk investigasi jika ada selisih stock.

## 6. Struktur Data (High-Level)

| Tabel | Isi |
|---|---|
| `items` | Master data: code, spec, unit |
| `item_monthly` | Saldo awal, ket, handcarry, kebutuhan_po per item per bulan |
| `daily_transactions` | Barang masuk/keluar per item per tanggal |
| `audit_logs` | Riwayat perubahan data |

Angka `jumlah_masuk`, `jumlah_keluar`, `sisa_barang` **tidak disimpan langsung** — selalu dihitung dari `daily_transactions` agar data selalu konsisten.

## 7. Non-Functional Requirements

| Aspek | Ketentuan |
|---|---|
| Akses | Dibatasi jaringan (LAN/Tailscale), tanpa login |
| Performa | Input harian responsif untuk ±800 item, tanpa lag saat search |
| Reliabilitas | Cron carry-over saldo harus punya fallback manual |
| Kompatibilitas export | File `.xlsx` bisa dibuka normal di Excel & Google Sheets |
| Deployment | VPS/Raspberry Pi + Nginx + PM2 |

## 8. Stack Teknis yang Direkomendasikan

| Bagian | Pilihan |
|---|---|
| Frontend | React + Vite + Tailwind |
| Backend | Express + TypeScript + Prisma |
| Database | SQLite (cukup untuk skala internal ini) |
| Import/Export Excel | ExcelJS |
| Scheduler | node-cron (untuk carry-over saldo otomatis) |
| Deployment | VPS/Raspberry Pi + Nginx reverse proxy + PM2 |

## 9. Rencana Tahapan Pengembangan

| Fase | Deliverable |
|---|---|
| 1 | Schema database (Prisma) + struktur project |
| 2 | Script import Excel lama → database |
| 3 | Halaman input harian (search, validasi, keyboard flow) |
| 4 | Logic carry-over saldo awal otomatis (cron) |
| 5 | Halaman rekap harian & bulanan |
| 6 | Export Excel berbasis template asli |
| 7 | Audit log & dropdown identitas user |
| 8 | Testing menyeluruh + deployment internal |

## 10. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Cron carry-over gagal jalan | Sediakan tombol manual cadangan dengan konfirmasi eksplisit |
| Format Excel lama tidak konsisten antar file | Validasi & preview sebelum commit saat import |
| User input ganda untuk tanggal yang sama | Constraint unique per item+tanggal, edit menimpa data lama (bukan menambah baris baru) |
| Template Excel berubah di kemudian hari | Simpan template sebagai file terpisah yang mudah diganti tanpa ubah kode |

## 11. Kriteria Keberhasilan (Definition of Done)

- Data lama berhasil dimigrasi tanpa kehilangan informasi.
- User bisa input transaksi harian lebih cepat dibanding proses Excel manual sebelumnya.
- Saldo awal bulan baru selalu benar tanpa campur tangan manual.
- File export tidak bisa dibedakan secara visual dari file Excel asli oleh pengguna.
- Ada jejak audit untuk setiap perubahan data transaksi.