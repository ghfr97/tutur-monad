# Task Implementasi — TUTUR

Checklist ini memecah [`plan.md`](./plan.md) menjadi pekerjaan kecil yang bisa dikerjakan dan diverifikasi satu per satu. Jalankan sesuai urutan kecuali task ditandai dapat paralel. Centang hanya setelah kriteria selesai benar-benar diverifikasi.

**Status implementasi saat ini:** kontrak sudah build dan 27 test Foundry lulus; frontend P0 sudah dibuat dan lint/typecheck/production build serta route smoke test lokal lulus. Factory address telah diberikan operator, bytecode terdeteksi di Monad Testnet, dan getter tiga validator, fee, serta task count terkonfirmasi. Treasury getter dan alur transaksi penuh belum terverifikasi; explorer verification, hosting publik, dan demo transaksi masih menunggu operator manusia.

**Aturan kerja**

- Jangan meminta, membaca, atau menyimpan private key/seed phrase. Deployment dan signing dilakukan operator manusia.
- Jangan menganggap transaction hash sebagai keberhasilan; tunggu receipt sukses.
- Jangan menaruh raw contribution text di chain atau memakai data pribadi/sensitif.
- Jika task sudah terpenuhi oleh kode yang ada, verifikasi terlebih dahulu lalu tandai selesai tanpa membuat ulang implementasinya.
- Jika ada kegagalan, catat penyebab dan langkah perbaikan pada task terkait sebelum melanjutkan task yang bergantung padanya.

## 0. Baseline dan interface

### T0.1 — Inventaris repo dan perubahan lokal

- [x] Periksa struktur proyek, file konfigurasi, dependency, dan scripts yang tersedia.
- [x] Periksa status Git; jangan menimpa atau membuang perubahan yang sudah ada.
- [x] Pastikan folder `contracts` dan file frontend yang tersedia/ belum tersedia tercatat.

**Selesai bila:** tim tahu struktur kerja aktual dan tidak ada perubahan lokal yang tertimpa.

### T0.2 — Jalankan baseline kontrak

- [x] Dari `contracts`, jalankan `forge build`.
- [x] Dari `contracts`, jalankan `forge test -vv`.
- [x] Catat hasil: build berhasil, 27 test lulus; Foundry dijalankan via distribusi npm karena `forge` belum ada di PATH.

**Selesai bila:** build/test aktual telah dijalankan dan hasilnya diketahui (lulus atau kegagalannya tercatat).

### T0.3 — Kunci interface kontrak untuk integrasi

- [x] Konfirmasi constructor `TuturFactory`, parameter `createTask`, getter, enum status, fungsi task, serta event yang dipakai frontend.
- [x] Konfirmasi tiga validator dan treasury ditentukan saat deployment, fee demo `800` bps, dan satu task menerima satu submission.
- [x] Tentukan format metadata task dan prosedur normalisasi teks yang dipakai sebelum hashing.
- [x] Jika interface berubah, dokumentasikan perubahan dan selaraskan test serta ABI sebelum frontend memakai interface tersebut.

**Selesai bila:** parameter call, event, state, chain, dan format hash sudah menjadi acuan bersama.

## 1. Kontrak dan fondasi frontend

### T1.1 — Review kontrak terhadap kebutuhan MVP

**Dependensi:** T0.2, T0.3

- [x] Cocokkan validasi pembayaran, metadata hash, reward, fee, dan deadline dengan [`PRD.md`](./PRD.md).
- [x] Cocokkan aturan submit: status `Open`, sebelum deadline, hash tidak nol, bukan sponsor, dan consent diterima.
- [x] Cocokkan aturan vote: hanya validator konfigurasi, satu vote per validator, dan hanya sebelum deadline.
- [x] Cocokkan hasil: dua approval membayar reward + fee; dua rejection dan expiry mengembalikan seluruh saldo escrow.
- [x] Pastikan status terminal ditetapkan sebelum transfer dan transfer gagal me-revert seluruh perubahan.
- [x] Pastikan tidak ada fungsi admin yang dapat mengambil escrow.

**Selesai bila:** semua aturan yang sudah ada tervalidasi atau gap implementasi tercatat sebagai task perbaikan.

### T1.2 — Lengkapi gap kontrak dan test

**Dependensi:** T1.1

- [x] Perbaiki hanya gap yang ditemukan pada T1.1; review tidak menemukan gap yang memerlukan perubahan kontrak.
- [x] Pastikan test mencakup pembayaran kurang/lebih, reward/hash/deadline/fee/validator tidak valid.
- [x] Pastikan test mencakup unauthorized vote, double vote, duplicate submission, sponsor submission, dan consent wajib.
- [x] Pastikan test mencakup approval payout, rejection refund, expiry refund, refund terlalu awal, dan status terminal.
- [x] Pastikan test mencakup aksi setelah deadline dan kegagalan transfer secara atomik.
- [x] Jalankan ulang `forge build` dan `forge test -vv`; 27 test lulus.

**Selesai bila:** seluruh test penerimaan yang relevan lulus; tidak ada perubahan kontrak tanpa test terkait.

### T1.3 — Siapkan artefak ABI

**Dependensi:** T1.2

- [x] Bangun kontrak menggunakan konfigurasi Foundry yang ada.
- [x] Gunakan ABI typed minimal untuk Factory dan Task tanpa menyalin artifact build ke source frontend.
- [x] Buat typed contract config/helper frontend berdasarkan ABI dan parameter yang sudah dikunci.

**Selesai bila:** frontend dapat memanggil interface yang sama dengan kontrak yang berhasil dibangun.

### T1.4 — Scaffold frontend

- [x] Buat aplikasi Next.js + TypeScript + Tailwind di root atau direktori yang tidak bertabrakan dengan `contracts`.
- [x] Tambahkan hanya dependency yang diperlukan untuk MVP.
- [x] Buat scripts dev, lint, typecheck, dan build yang sesuai dengan stack.
- [x] Jalankan app lokal dan pastikan halaman awal dapat dirender.

**Selesai bila:** proyek frontend bisa dijalankan dan dibuild tanpa bergantung pada alamat kontrak live.

### T1.5 — Buat kerangka UI dan status wallet

**Dependensi:** T1.4

- [x] Buat layout/editorial style yang ringkas dan konsisten untuk produk bahasa/data.
- [x] Tampilkan indikator Monad Testnet yang jelas.
- [x] Implementasikan tampilan wallet disconnected, connected, dan wrong network beserta aksi yang sesuai.
- [x] Buat komponen state transaksi loading, pending, success, dan error.
- [x] Pastikan contoh/sample metadata tidak disajikan sebagai task atau transaksi on-chain nyata.

**Selesai bila:** UI dasar menampilkan status wallet/network dan state transaksi tanpa klaim keberhasilan palsu.

## 2. Chain, metadata, dan alur pengguna

### T2.1 — Konfigurasi chain dan factory

**Dependensi:** T1.3, T1.5

- [x] Konfigurasikan chain ID `10143`, RPC Monad Testnet, dan explorer berdasarkan spesifikasi saat ini.
- [x] Baca alamat factory dari environment publik; jangan hardcode alamat deployment yang belum diverifikasi.
- [x] Validasi konfigurasi yang wajib dan tampilkan error setup yang jelas bila alamat factory belum tersedia.
- [x] Buat pembacaan typed untuk factory/task state yang dibutuhkan.

**Selesai bila:** UI dapat membaca konfigurasi secara aman dan tidak membuat link explorer dari alamat/chain yang salah.

### T2.2 — Implementasikan metadata store lokal

**Dependensi:** T0.3, T1.4

- [x] Tetapkan tipe metadata task: title, prompt, bahasa, register/dialect, usage terms version, dan waktu pembuatan.
- [x] Simpan ketentuan penggunaan yang eksplisit pada metadata task dan tampilkan sebelum kontributor menyetujui terms.
- [x] Simpan metadata menggunakan task address sebagai kunci setelah address task tersedia.
- [x] Simpan teks kontribusi dan catatan consent hanya off-chain sesuai desain privasi MVP.
- [x] Tangani metadata tidak ada/rusak dengan status yang eksplisit.
- [x] Jika metadata task tidak tersedia, tetap tampilkan informasi on-chain dan label “Metadata tidak tersedia di perangkat ini”.

**Selesai bila:** demo satu browser berjalan tanpa database dan kehilangan metadata tidak membuat UI mengarang informasi.

### T2.3 — Buat fungsi normalisasi dan hash kontribusi

**Dependensi:** T0.3

- [x] Implementasikan satu fungsi normalisasi teks yang terdokumentasi.
- [x] Gunakan fungsi hash keccak256 melalui library yang sesuai.
- [x] Pastikan hashing dan verifikasi memakai implementasi yang sama.
- [x] Pastikan hanya hash yang dikirim ke transaksi; raw text tidak menjadi calldata atau event.

**Selesai bila:** hash dapat dihasilkan secara konsisten dan raw contribution text tidak dikirim ke chain.

### T2.4 — Implementasikan halaman daftar dan detail task

**Dependensi:** T2.1, T2.2

- [x] Buat halaman daftar task berdasarkan data on-chain yang bisa dibaca dari factory.
- [x] Gabungkan metadata lokal pada detail task tanpa menjadikannya sumber status.
- [x] Buat halaman detail yang menampilkan sponsor, reward, fee, deadline, status, kontribusi/hash, dan vote count yang tersedia.
- [x] Tampilkan task address, factory address, dan tautan explorer yang relevan.
- [x] Tampilkan state kosong, loading, error RPC, dan metadata tidak tersedia.

**Selesai bila:** implementasi membaca data chain dan menangani metadata yang hilang. **Catatan:** pembacaan terhadap deployment nyata diverifikasi pada T3.5.

### T2.5 — Implementasikan create task

**Dependensi:** T2.1, T2.2

- [x] Buat form title, prompt, ketentuan penggunaan, bahasa/register target, reward, dan deadline.
- [x] Validasi field wajib, format, reward, serta deadline sebelum membuka wallet.
- [x] Hitung fee menggunakan `reward * feeBps / 10_000` dan tampilkan fee serta total.
- [x] Hash metadata, kirim `createTask` dengan nilai total yang tepat, dan tampilkan pending state.
- [x] Tunggu receipt sukses sebelum menampilkan task sebagai dibuat.
- [x] Ambil task address dari event/hasil transaksi yang tervalidasi dan simpan metadata dengan address tersebut.
- [x] Tampilkan hash transaksi dan explorer link hanya bila hash transaksi nyata tersedia.
- [x] Tangani wallet rejection, revert, dan kegagalan menyimpan metadata secara eksplisit.

**Selesai bila:** implementasi create dan receipt confirmation selesai. **Catatan:** transaksi live belum dites; lanjutkan pada T3.5.

### T2.6 — Implementasikan submit kontribusi

**Dependensi:** T2.2, T2.3, T2.4

- [x] Aktifkan form hanya untuk task `Open` yang belum melewati deadline.
- [x] Tampilkan prompt dan usage terms sebelum submit.
- [x] Tambahkan checkbox consent yang tidak tercentang secara default.
- [x] Tolak submit dari sponsor dan validasi teks kosong/hash nol.
- [x] Simpan teks di off-chain store dan kirim `submitContribution(hash, true)` ke kontrak.
- [x] Tunggu receipt sukses lalu baca ulang state task.
- [x] Tangani metadata store error, wallet rejection, revert, dan deadline lewat.

**Selesai bila:** implementasi submit dan receipt confirmation selesai. **Catatan:** transaksi live belum dites; lanjutkan pada T3.5.

### T2.7 — Implementasikan validasi dan vote

**Dependensi:** T2.1, T2.4

- [x] Baca alamat validator dari kontrak task.
- [x] Tampilkan vote controls hanya pada validator yang sah dan task `Submitted` sebelum deadline.
- [x] Nonaktifkan vote bila teks kontribusi tidak tersedia atau hash lokal tidak cocok dengan hash on-chain.
- [x] Sembunyikan/nonaktifkan aksi untuk wallet yang sudah vote.
- [x] Kirim approve/reject, tunggu receipt, lalu refresh status dan jumlah vote.
- [x] Tampilkan hasil `Paid`/`Rejected` sesuai state kontrak, bukan hasil asumsi lokal.
- [x] Tangani user bukan validator, already voted, deadline lewat, wallet rejection, dan revert.

**Selesai bila:** implementasi voting dan pembacaan status selesai. **Catatan:** dua validator perlu diuji pada T3.5.

### T2.8 — Implementasikan refund setelah deadline

**Dependensi:** T2.1, T2.4

- [x] Tampilkan aksi refund hanya untuk task belum final yang melewati deadline.
- [x] Kirim `refundAfterDeadline()` dari wallet yang terhubung.
- [x] Tunggu receipt sukses, refresh status, dan tampilkan status `Refunded`.
- [x] Tangani refund terlalu awal, status terminal, wallet rejection, dan revert.

**Selesai bila:** implementasi refund selesai. **Catatan:** jalur refund live belum dites.

### T2.9 — Buat explorer link dan transaksi status yang konsisten

**Dependensi:** T2.5, T2.6, T2.7, T2.8

- [x] Gunakan transaction hash hasil write yang nyata.
- [x] Tampilkan transaksi pending selama menunggu receipt.
- [x] Tampilkan confirmed hanya setelah receipt sukses.
- [x] Tampilkan gagal/reverted atau belum terkonfirmasi bila receipt bermasalah; jangan tampilkan success state.
- [x] Pastikan explorer base URL sesuai network yang terhubung.

**Selesai bila:** implementasi state transaksi konsisten. **Catatan:** status harus dikonfirmasi lagi pada transaksi T3.5.

### T2.10 — Tangani RPC rate limit saat mengirim transaksi

- [x] Kenali pesan HTTP/RPC 429 dan rate-limit sebagai gangguan RPC, bukan otomatis sebagai revert kontrak.
- [x] Berikan pesan tindakan yang jelas dan jeda 30 detik sebelum aksi dapat dicoba lagi.
- [x] Jangan melakukan resend otomatis; dokumentasikan bahwa RPC wallet (mis. MetaMask) untuk broadcast berbeda dari RPC aplikasi untuk read/estimasi gas.
- [x] Dokumentasikan cara memakai endpoint Monad Testnet provider alternatif serta memeriksa status transaksi sebelum resubmit.

**Selesai bila:** rate limit tidak memicu forced send atau resend otomatis, dan pengguna menerima langkah pemulihan yang aman.

## 3. QA, deployment, dan demo

### T3.1 — Jalankan pemeriksaan frontend

**Dependensi:** T2.9

- [x] Jalankan lint.
- [x] Jalankan typecheck (tambahkan script bila belum tersedia).
- [x] Jalankan production build.
- [x] Perbaiki error yang berasal dari perubahan MVP; seluruh checks frontend lulus.

**Selesai bila:** seluruh checks yang disediakan lulus atau kegagalan yang tersisa dinyatakan jelas.

### T3.2 — QA manual kondisi batas

**Dependensi:** T3.1

- [ ] Periksa wallet disconnected dan wrong network.
- [ ] Periksa user membatalkan signature dan transaksi revert.
- [ ] Periksa loading/pending receipt serta confirmed state.
- [ ] Periksa consent kosong, submission duplikat, dan sponsor sebagai contributor.
- [ ] Periksa wallet bukan validator, validator vote ulang, serta task terminal.
- [ ] Periksa deadline dan refund.
- [ ] Periksa metadata hilang dan link explorer pada network yang benar.

**Selesai bila:** semua state tampil sesuai hasil aktual dan tidak ada kontrol yang mendorong aksi tidak valid.

### T3.3 — Siapkan konfigurasi publik dan keamanan repo

**Dependensi:** T2.1

- [x] Buat `.env.example` di root dengan placeholder alamat publik dan konfigurasi chain.
- [x] Pastikan `.env.local` dan konfigurasi rahasia tidak masuk Git.
- [x] Pastikan tidak ada private key, seed phrase, atau Supabase service-role key di source/client bundle.
- [x] Jelaskan bahwa alamat factory dan validator harus diisi dari deployment nyata.

**Selesai bila:** konfigurasi bisa direplikasi tanpa membagikan secret.

### T3.4 — Deploy factory ke Monad Testnet (operator manusia)

**Dependensi:** T1.2, T3.3

- [ ] Operator membuat burner wallet sendiri dan mendapatkan testnet MON dari sumber resmi.
- [ ] Operator memeriksa ulang chain ID/RPC/explorer yang diumumkan penyelenggara.
- [ ] Operator men-deploy factory dengan treasury dan tiga validator non-zero serta berbeda; fee demo 800 bps.
- [ ] Catat alamat factory dan bukti deployment yang nyata.
- [ ] Verifikasi source di explorer jika layanan tersedia.
- [ ] Jangan mengirim private key/seed phrase ke agent atau menyimpannya di repo.

**Status:** alamat diberikan operator; bytecode ditemukan dan getter validator/fee terbaca. Treasury getter belum terverifikasi karena error RPC, sehingga konfigurasi deployment perlu dicocokkan lewat explorer/Remix.

**Selesai bila:** factory address dan seluruh konfigurasi deployment diverifikasi di Monad Testnet.

### T3.5 — Jalankan smoke test on-chain

**Dependensi:** T3.4, T2.9

- [ ] Konfigurasikan alamat factory dan jalankan app dengan wallet burner testnet.
- [ ] Jalankan create task, submit kontribusi, dua approval, dan cek payout reward + fee.
- [ ] Jalankan rejection atau expiry refund jika waktu memungkinkan.
- [ ] Catat chain, contract/task address, transaction hashes, status receipt, dan hasil UI.
- [ ] Buka tautan explorer untuk memastikan link merujuk transaksi yang benar.

**Selesai bila:** satu jalur sukses dapat diverifikasi di chain dan tidak ada bukti demo yang direkayasa.

### T3.6 — Lengkapi README dan instruksi operasional

**Dependensi:** T3.5

- [x] Lengkapi README dari template yang ada dengan deskripsi produk dan batasan MVP.
- [x] Dokumentasikan setup/test kontrak dan setup/build frontend.
- [x] Dokumentasikan `.env.example` dan konfigurasi publik yang diperlukan.
- [x] Tulis langkah deployment/verification kontrak yang ditandatangani operator manusia.
- [x] Tulis instruksi hosting frontend.
- [x] Isi factory address dengan alamat yang diberikan operator dan bytecode-nya terdeteksi di Monad Testnet.
- [ ] Isi URL app dan transaksi demo hanya dengan nilai yang benar-benar ada.
- [x] Tambahkan checklist demo dan instruksi metadata local storage.

**Selesai bila:** developer lain dapat menjalankan proyek dan operator memahami langkah deployment tanpa membutuhkan secret di dokumentasi.

### T3.7 — Host dan verifikasi demo publik

**Dependensi:** T3.6

- [ ] Deploy frontend ke hosting pilihan tim.
- [ ] Buka URL publik di browser dan pastikan app dapat dimuat.
- [ ] Pastikan network indicator, factory address, dan explorer links benar.
- [ ] Jalankan setidaknya smoke test UI utama pada URL hosted.
- [ ] Rekam demo minimal 30 detik dan siapkan alur demo tiga menit berdasarkan transaksi aktual.

**Selesai bila:** URL live berfungsi dan demonstrasi merepresentasikan alur yang benar-benar tersedia.

### T3.8 — Freeze, regression, dan submission

**Dependensi:** T3.7

- [ ] Hentikan penambahan fitur baru.
- [ ] Jalankan ulang `forge build`, `forge test -vv`, lint, typecheck, dan build frontend.
- [ ] Lakukan smoke test terakhir pada hosted app.
- [ ] Pastikan placeholder submission sudah diganti atau diberi label belum tersedia.
- [ ] Pastikan tidak ada secret, data sensitif, klaim analytics palsu, atau success palsu.
- [ ] Kirim repo, URL live, factory address, transaksi nyata, dan video bila tersedia.
- [ ] Catat item yang belum selesai secara jujur.

**Selesai bila:** submission dapat diverifikasi atau pekerjaan tersisa dinyatakan secara eksplisit tanpa klaim berlebihan.

## 4. Pekerjaan setelah P0 (jangan mulai sebelum T3.5)

- [ ] **P1:** Tambahkan Supabase hanya dengan schema dan Row Level Security yang ditinjau; service-role key tidak boleh masuk client.
- [ ] **P1:** Tambahkan recent activity sederhana hanya jika dibutuhkan; evaluasi kebutuhan indexer sebelum mengimplementasikan.
- [ ] **P1:** Jalankan concurrency experiment hanya dengan sampel nyata, metode jelas, dan tanpa klaim TPS dari sampel kecil.
- [ ] **Pasca-MVP:** Rencanakan audit kontrak, governance validator/dispute, privasi dan consent lintas browser, serta review legal dengan pihak yang sesuai.

## 5. Cut line jika waktu terbatas

Urutan yang boleh ditunda:

1. Supabase.
2. Panel aktivitas.
3. Eksperimen concurrency.
4. Polish yang tidak memengaruhi alur P0.

Jangan memotong payout/refund, receipt confirmation, test kontrak penting, penanganan secret, deployment testnet yang diperlukan untuk demo, atau dokumentasi dasar.

## Referensi

- [`PRD.md`](./PRD.md)
- [`architecture.md`](./architecture.md)
- [`plan.md`](./plan.md)
- [`TUTUR_DEVELOPER_PACK.md`](./TUTUR_DEVELOPER_PACK.md)
