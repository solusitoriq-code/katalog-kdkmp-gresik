# SOP Onboarding KDKMP Baru (Katalog Online Gresik)

Dokumen Standar Operasional Prosedur (SOP) pendaftaran wilayah, aktivasi koperasi, penugasan manager, pengisian produk, dan distribusi katalog untuk **Koperasi Desa/Kelurahan Merah Putih (KDKMP)** di Kabupaten Gresik.

---

## 1. Alur Singkat

1. **Undang Pengguna** via Supabase Dashboard (Auth Users).
2. **Buat / Aktifkan Koperasi** di Super Admin Wilayah (`/admin/wilayah`).
3. **Tetapkan (Assign) Manager** Koperasi ke KDKMP tujuan.
4. **Isi Kategori & Produk** oleh Manager KDKMP.
5. **Bagikan QR Code & Tautan Katalog** ke warga/pembeli.

---

## 2. Prosedur Rinci

### Langkah 1: Undang Pengguna Baru via Supabase Dashboard

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan pilih proyek **Katalog Online KDKMP Gresik**.
2. Masuk ke menu **Authentication** > **Users**.
3. Klik tombol **Invite user**.
4. Masukkan alamat email calon manager KDKMP (misal: `manager.golokan@kdkmp-gresik.id`).
5. Calon manager akan menerima surel undangan untuk menyetel kata sandi akun mereka.

> [!IMPORTANT]
> Akun pengguna wajib dibuat di Supabase Auth sebelum dapat dihubungkan ke koperasi. Super admin tidak menyimpan kata sandi pengguna secara langsung.

---

### Langkah 2: Buat atau Aktifkan Koperasi di Portal Super Admin

1. Masuk ke portal admin dengan akun `super_admin` di `/admin/login`.
2. Buka menu **Wilayah** (`/admin/wilayah`) pada navigasi utama.
3. **Periksa Status Kecamatan (Tab Kecamatan)**:
   - Cari kecamatan tempat KDKMP berada.
   - Pastikan saklar status kecamatan berada pada posisi **Aktif** (hijau). Jika kecamatan baru dibuka (ekspansi dari pilot), klik saklar untuk mengaktifkannya.
   - Jika kecamatan belum terdaftar, klik tombol **Tambah Kecamatan**, isi Nama, Kode Kemendagri, Slug (otomatis dibuat), urutan, dan simpan.
4. **Buka Tab Koperasi**:
   - Jika desa/kelurahan sudah ada dalam daftar master Kemendagri (`35.25`), klik tombol **Ubah** pada baris koperasi terkait.
   - Jika membuat entitas baru, klik tombol **Tambah Koperasi**.
   - Isi formulir:
     - **Kecamatan**: Pilih kecamatan terkait.
     - **Tipe Wilayah**: Pilih `Desa` atau `Kelurahan`.
     - **Nama Wilayah**: Masukkan nama desa/kelurahan (misal: `Golokan`).
     - **Nama Koperasi**: Otomatis terisi `KDKMP Desa Golokan` (dapat disesuaikan).
     - **Slug Rute**: Huruf kecil dan tanda hubung (misal: `golokan`). Wajib unik dalam 1 kecamatan dan tidak boleh menggunakan kata terlarang (`admin`, `login`, `api`, `assets`, `dev`).
     - **Kode Kemendagri**: Kode resmi wilayah Kemendagri (misal: `35.25.09.2008`).
     - **Nomor WhatsApp**: Nomor WhatsApp admin penerima pesanan (format `08...` atau `628...`).
     - **Status Aktif**: Aktifkan saklar agar katalog tampil di direktori publik (nomor WhatsApp wajib valid jika aktif).
   - Klik **Simpan Koperasi**.

---

### Langkah 3: Tetapkan (Assign) Manager ke KDKMP

1. Pada halaman `/admin/wilayah`, buka tab **Admin Koperasi**.
2. Pada kartu **Tetapkan Manager KDKMP**:
   - Masukkan alamat email pengguna yang telah diundang pada Langkah 1.
   - Pilih Koperasi Tujuan dari daftar dropdown.
   - Klik tombol **Tetapkan Manager**.
3. **Ketentuan Sistem (1 Manager = 1 KDKMP)**:
   - Jika email belum terdaftar di Supabase Auth, sistem akan menampilkan pesan:
     `Email belum terdaftar. Undang via Supabase Dashboard.`
   - Jika KDKMP tujuan sudah memiliki manager aktif, sistem akan menolak karena 1 KDKMP hanya dikelola oleh 1 manager.
   - Jika akun email sudah menjadi manager di KDKMP lain, sistem akan menolak karena 1 manager tidak boleh merangkap beberapa KDKMP.
4. Setelah berhasil, manager akan tercantum di tabel **Daftar Manager KDKMP Aktif**.
   - *Catatan Pencabutan*: Jika terjadi pergantian pengurus, klik tombol **Cabut** pada baris manager terkait, lalu konfirmasi untuk membebaskan penugasan.

---

### Langkah 4: Pengisian Data Kategori & Produk (Oleh Manager KDKMP)

1. Manager KDKMP masuk ke portal admin melalui `/admin/login` menggunakan email dan kata sandi yang telah didaftarkan.
2. Manager KDKMP otomatis terkunci pada koperasinya dan tidak dapat mengakses data koperasi lain (dijamin via Row Level Security Supabase).
3. **Pengaturan Profil Koperasi (`/admin/pengaturan`)**:
   - Lengkapi jam buka dan tutup operasional (zona waktu WIB / `Asia/Jakarta`).
   - Tentukan batas minimal belanja untuk gratis ongkir dan catatan pengantaran lokal.
   - Unggah logo KDKMP (otomatis dipotong persegi 256×256 px dalam format WebP).
4. **Kelola Kategori (`/admin/kategori`)**:
   - Tambahkan kategori produk sembako (misal: *Beras & Pangan Pokok*, *Minyak & Gula*, *Bumbu Dapur*, *Minuman & Harian*).
5. **Kelola Produk (`/admin/produk`)**:
   - Klik **Tambah Produk** untuk menginput dagangan sembako.
   - Isi Nama, Kategori, Harga (Rupiah, kelipatan satuan), Satuan (kg, liter, pcs, karung, pack, dll.), dan Status Stok (*Tersedia*, *Pre-Order*, atau *Habis*).
   - Unggah foto produk langsung dari kamera HP atau galeri. Sistem otomatis mengompresi foto menjadi format WebP dengan sisi terpanjang ≤ 800 px dan ukuran berkas ≤ 100 KB untuk menghemat kuota penyimpanan dan bandwidth.

---

### Langkah 5: Bagikan QR Code & Tautan Katalog ke Pembeli

1. Masuk ke menu **Pengaturan** (`/admin/pengaturan`) pada portal admin manager KDKMP.
2. Temukan kartu **Bagikan Katalog**:
   - Tautan publik berformat: `https://katalog.gresik.id/:kecamatan/:desa` (contoh: `/sidayu/golokan`).
3. **Salin Tautan**: Bagikan tautan langsung ke grup WhatsApp warga desa, RT/RW, atau media sosial desa.
4. **Unduh QR Code**:
   - Klik tombol **Unduh QR Code (PNG)**.
   - Berkas gambar QR resolusi tinggi (512×512 px) dapat langsung dicetak pada banner, brosur kasir, atau papan pengumuman balai desa.
5. **Uji Transaksi**:
   - Pindai QR code menggunakan kamera HP untuk memastikan katalog terbuka langsung ke halaman KDKMP.
   - Lakukan simulasi penambahan item ke keranjang dan checkout via WhatsApp untuk memastikan nomor WhatsApp manager menerima format pesanan dengan rapi.

