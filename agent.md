# 1.  Agent System Instructions (Interactive Videotron Cloud)

DO NOT IGNORE THIS FILE. As an AI Agent working on this project, you must read, understand, and strictly adhere to the guidelines and context provided below before modifying any code.


# 2. Summary
Membangun platform interaktif berbasis web yang menghubungkan
smartphone, QR Code, CMS, dan Videotron dalam satu ekosistem real-time
untuk meningkatkan engagement pengunjung pada event, mall, exhibition,
kampus, promosi, dan aktivitas pemasaran.

# 3. Tujuan Produk
- Meningkatkan engagement pengunjung.
- Mengumpulkan database pelanggan.
- Meningkatkan conversion campaign.
- Menyediakan dashboard analitik real-time.
- Mendukung banyak event (multi-event).

# 4. Komponen Sistem

- Dashboard dan CMS
- Mobile Web (QR Experience)
- CMS
- Videotron Player, web based
- Analytics

# 5. User Role

### Visitor
-   Scan QR
-   Mengikuti permainan
-   Voting
-   Polling
-   Quiz
-   Klaim hadiah

### Operator
-   Menjalankan event
-   Memulai permainan
-   Moderasi konten

### Admin
-   Mengelola seluruh sistem
-   User & Role
-   Mengelola Campaign
-   Analytics

# CMS usage 
1. Admin create campaign: campaign name, campaign schedule, campaign logo, campaign banner, pilih game yang akan dipasang, copy URL join atau download QR url join
2. operator menjalankan campaign yang ada. dan memonitor hasil campaign, copy URL join atau download QR url join
3. admin juga memonitor hasil campaign live ( jumlah visitor, jumlah game berjalan, jumlah engagement, result engangement)

# default path utk videotron web view /{namagame}/{campaignid}
# default path utk mobile view visitor yang join /{namagame}/join/{campaignid}
catatan penting:
1. live update halaman videotron view jika visitor berinteraksi atau config di cms di ubah
2. bisa menggunakan PC yang berbeda utk videotron web view dan admin


# 6. List of Games

# Game 1 --- SPIN THE WHEEL

## Tujuan

Mengumpulkan data pelanggan sambil memberikan hadiah.

## Flow

1.  Pengunjung scan QR.
2.  Landing page terbuka.
3.  Isi data (nama, email, nomor HP sesuai kebutuhan event).
4.  Sistem memverifikasi hak bermain.
5.  Videotron menampilkan animasi roda.
6.  User menekan tombol SPIN dari HP.
7.  Hasil muncul di videotron dan HP.
8.  Hadiah disimpan ke akun peserta.
9.  CMS mencatat transaksi.

## Hadiah

-   Voucher
-   Diskon
-   Merchandise
-   Kupon Belanja
-   Lucky Point
-   No Prize

## CMS

-   Atur hadiah
-   Probabilitas hadiah
-   Kuota hadiah
-   Masa berlaku
-   Riwayat pemenang

## Acceptance Criteria

-   Maksimal 1 kali bermain sesuai aturan campaign.
-   Hasil sinkron antara HP dan videotron.
-   Semua transaksi terekam.

------------------------------------------------------------------------

# Game 2 --- LIVE VOTING

## Tujuan

Meningkatkan interaksi pengunjung.

## Contoh

Makanan favorit? - Pizza - Burger - Bakso

## Flow

1.  QR Scan
2.  Pilih jawaban
3.  Vote dikirim
4.  Grafik berubah real-time
5.  CMS menyimpan hasil

## CMS

-   Buat voting
-   Atur opsi
-   Aktif/nonaktif
-   Export hasil

------------------------------------------------------------------------

# Game 3 --- LIVE POLLING

## Tujuan

Polling real-time untuk event.

## Flow

-   Scan QR
-   Jawab polling
-   Persentase berubah di videotron
-   Hasil tersimpan

## Perbedaan dengan Voting

Polling mendukung beberapa pertanyaan dalam satu sesi.

------------------------------------------------------------------------

# Game 4 --- QUIZ BERHADIAH

## Flow

-   Videotron menampilkan soal
-   HP menjadi media jawaban
-   Timer berjalan
-   Jawaban dinilai
-   Leaderboard diperbarui real-time

## Leaderboard

-   Top 10 Hari Ini
-   Top Minggu Ini
-   Top Bulan Ini

## CMS

-   Bank soal
-   Point
-   Timer
-   Tingkat kesulitan

------------------------------------------------------------------------

# Game 5 --- TIC TAC TOE

## Flow

-   Dua pemain scan QR
-   Pairing otomatis
-   HP menjadi controller
-   Videotron menjadi papan
-   Sistem menentukan menang/seri

## CMS

-   Match history
-   Statistik

------------------------------------------------------------------------

# Game 6 --- RACING GAME

## Flow

-   Scan QR
-   Join race
-   HP menjadi steering wheel
-   Countdown
-   Balapan real-time
-   Ranking ditampilkan

## CMS

-   Track
-   Durasi
-   Jumlah pemain

------------------------------------------------------------------------

# Game 7 --- LIVE INSTAGRAM WALL

## Flow

-   Sistem membaca hashtag
-   Moderasi
-   Approve / Reject
-   Foto tampil di videotron

## CMS

-   Keyword
-   Blacklist
-   Moderasi manual
-   Auto refresh


# 7. Versioning & Git Protocol (CRITICAL)
Whenever you are asked to fix a bug or add a feature, you must execute the following workflow:

Increment Version: You MUST update the version in package.json.

Patch (1.0.x) for bug fixes.
Minor (1.x.0) for new features.


Update README Changelog: You MUST append the new version, date, and a bulleted list of changes to the Changelog section in README.md.
Commit and Push: You MUST commit your changes with a clear, conventional commit message (e.g., feat: ..., fix: ...) and instantly git push to the working branch (e.g., dev.0.0.0-game). Do not leave changes uncommitted.

By reading this, you are bound to these rules. Proceed with your task!
