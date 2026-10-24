# Rencana Implementasi — TUTUR

**Tujuan:** menyelesaikan MVP TUTUR sesuai [`PRD.md`](./PRD.md) dan menjaga desain sesuai [`architecture.md`](./architecture.md).  
**Urutan dan cut-line:** mengacu pada jendela kerja enam jam dalam [`TUTUR_DEVELOPER_PACK.md`](./TUTUR_DEVELOPER_PACK.md).

## 1. Kondisi awal

Repo saat ini berisi kontrak Factory/Task dan test Foundry, file konfigurasi Foundry, spesifikasi produk, serta README template. Frontend, `.env.example`, README final, dan koneksi kontrak ke UI belum tersedia.

Sebelum menambah implementasi, pastikan test kontrak saat ini dapat dijalankan dan catat hasil baseline. Pertahankan file yang sudah ada; jangan mengganti stack tanpa alasan teknis.

## 2. Prinsip pelaksanaan

- Kunci interface kontrak dan event lebih dahulu; frontend dibangun terhadap ABI tersebut.
- Kerjakan P0 end-to-end sebelum fitur P1.
- Jaga aplikasi tetap dapat dijalankan setelah tiap tahap besar.
- Jangan menandai transaksi sukses sebelum receipt dikonfirmasi.
- Operator manusia menangani burner wallet, penandatanganan deployment, dan hosting.
- Tidak menggunakan data sensitif atau membuat analytics/transaksi/hasil demo palsu.
- Bila waktu kurang, potong Supabase dan eksperimen concurrency sebelum payout/refund, test penting, deployment, atau README.

## 3. Tahap dan deliverable

### Tahap 0 — Baseline dan kontrak produk (00:00–00:30)

**Pekerjaan**

- Inventaris file, scripts, dependency, status git, dan spesifikasi.
- Jalankan `forge build` serta `forge test -vv` dari folder `contracts`; pahami dan catat kegagalan yang relevan.
- Pastikan constructor, parameter, event, status enum, dan payment flow kontrak menjadi interface integrasi.
- Sepakati metadata fields, chain constants, dan prosedur normalisasi hash.

**Selesai bila**

- Tim memiliki daftar kerja P0 yang jelas dan baseline hasil tes.
- Tidak ada perubahan yang menghapus pekerjaan pengguna atau konfigurasi yang ada.

### Tahap 1 — Kontrak dan shell frontend paralel (00:30–02:00)

**Track kontrak**

- Review implementasi factory dan escrow terhadap PRD.
- Pastikan validasi pembayaran, validator, satu submission, satu vote per validator, status terminal, payout/refund, dan deadline.
- Jalankan deterministic tests; tambahkan test hanya untuk gap acceptance yang ditemukan.
- Simpan ABI yang diperlukan frontend dengan cara yang sesuai build Foundry/repo.

**Track frontend**

- Scaffold Next.js + TypeScript + Tailwind di lokasi yang tidak bertabrakan dengan `contracts`.
- Implementasikan layout editorial ringkas, network indicator, disconnected/wrong-network state, loading/error primitives.
- Tulis chain config dan typed factory/task interaction skeleton dari interface yang disepakati.

**Selesai bila**

- Contract interface tidak berubah tanpa koordinasi.
- Frontend dapat dijalankan lokal (walaupun UI masih memakai metadata contoh yang jelas bukan transaksi nyata).

### Tahap 2 — Alur frontend dan metadata lokal (02:00–03:30)

- Buat halaman list/detail dan form create task.
- Hitung fee dan total berdasarkan nilai konfigurasi; tampilkan sebelum wallet signature.
- Implementasikan local metadata store untuk task dan kontribusi, serta empty/unavailable state.
- Implementasikan normalisasi/hash kontribusi dengan fungsi tunggal yang terdokumentasi.
- Implementasikan create task, submit contribution, validator voting, reads status, dan refund.
- Untuk setiap write: tampilkan pending, tunggu receipt, refresh reads, tampilkan error jika wallet menolak atau transaksi revert.
- Tambahkan explorer links hanya berdasarkan transaction hash nyata pada network yang benar.

**Selesai bila**

- Seluruh aksi P0 terhubung ke interface kontrak dan alur dapat diuji lokal.
- Metadata tidak pernah diperlukan untuk menyimpulkan status on-chain.

### Tahap 3 — Integrasi, pengujian, dan deploy testnet (03:30–04:30)

- Jalankan contract build/test.
- Jalankan frontend lint, typecheck, dan build sesuai scripts yang dibuat.
- Uji manual kondisi disconnected/wrong chain, payment mismatch/error, consent wajib, validator tidak berhak/already voted, status terminal, metadata tidak tersedia.
- Operator manusia membuat burner wallet, memperoleh testnet MON, dan men-deploy factory pada Monad Testnet.
- Atur alamat factory/validator/treasury sebagai konfigurasi publik, tanpa memasukkan secret ke repo.
- Uji satu alur testnet penuh: create → submit → dua votes → payout; uji rejection/refund atau expiry jika waktu memungkinkan.

**Selesai bila**

- Deployment address serta transaction hash diperoleh dari aktivitas nyata dan dapat dibuka di explorer.
- UI menampilkan keadaan kontrak yang sesuai receipt dan chain.

### Tahap 4 — README, verifikasi, hosting, dan demo (04:30–05:30)

- Lengkapi README dengan penjelasan produk, setup kontrak/frontend, variabel env, deployment manual, hosting, alamat factory, dan tautan transaksi nyata.
- Verifikasi source kontrak pada explorer bila fitur tersedia.
- Host frontend ke layanan yang dipilih tim; lakukan smoke test URL publik.
- Lengkapi metadata dan pastikan UI menampilkan penjelasan jika data tidak tersedia pada browser lain.
- Rekam demo sekurangnya 30 detik dan siapkan narasi tiga menit berdasarkan alur yang benar-benar berjalan.

**Selesai bila**

- Aplikasi publik dapat dimuat, informasi chain/address jelas, dan transaksi demo dapat diverifikasi.

### Tahap 5 — Freeze dan submission (05:30–06:00)

- Freeze fitur baru.
- Jalankan regression check kontrak/frontend dan smoke test hosted app.
- Pastikan README tidak memiliki placeholder submission yang seharusnya sudah diganti.
- Periksa kembali tidak ada private key, seed phrase, service-role key, data sensitif, atau klaim yang tidak terukur.
- Kirim submission dengan repo, URL live, factory address, transaksi demo, dan video bila tersedia.

**Selesai bila**

- Checklist P0/submission terpenuhi atau sisa pekerjaan ditulis dengan jelas dan tidak dipresentasikan sebagai selesai.

## 4. Paket kerja dan dependensi

| ID | Paket kerja | Dependensi | Kriteria selesai |
|---|---|---|---|
| W1 | Baseline dan kontrak interface | — | Perintah build/test dan interface tercatat. |
| W2 | Lengkapi/verifikasi kontrak dan tests | W1 | Build dan test penting lulus. |
| W3 | Frontend shell, wallet, chain config | W1 | App berjalan dan mengidentifikasi network dengan benar. |
| W4 | Metadata model, store, hashing | W1 | Hash konsisten; fallback metadata eksplisit. |
| W5 | Wiring transaksi P0 | W2, W3, W4 | Create, submit, vote, payout/refund membaca status nyata. |
| W6 | QA integrasi dan testnet | W5 | Jalur nyata dan receipt diverifikasi; error state diperiksa. |
| W7 | README, verifikasi, hosting, demo | W6 | URL/address/hash nyata dan checklist demo siap. |

Jika tim beranggotakan tiga orang, W2 dapat berjalan paralel dengan W3; W4 dapat dimulai paralel dengan UI shell, tetapi W5 bergantung pada kontrak/interface dan metadata/hash yang disepakati.

## 5. Rencana pengujian

### Kontrak

Jalankan dari `contracts`:

```bash
forge build
forge test -vv
```

Pastikan coverage perilaku yang diperlukan:

- Create task dan alamat escrow tersimpan.
- Pembayaran kurang atau berlebih ditolak; reward/hash/deadline/validator/fee tidak valid ditolak.
- Caller non-validator ditolak dan validator tidak dapat vote dua kali.
- Submission kedua, submission dari sponsor, hash kosong, consent false, dan aksi setelah deadline ditolak.
- Dua approval membayar reward serta fee dengan tepat.
- Dua rejection dan expiry mengembalikan escrow penuh kepada sponsor.
- Refund terlalu awal dan aksi pada status terminal ditolak.
- Transfer gagal me-revert state dan saldo secara atomik.

Test yang sudah ada perlu menjadi baseline; jangan menganggapnya lulus sebelum benar-benar menjalankannya.

### Frontend

Jalankan scripts yang tersedia setelah scaffolding:

```bash
npm run lint
npm run typecheck
npm run build
```

Jika script `typecheck` belum didefinisikan, gunakan pemeriksaan TypeScript yang sesuai package dan tulis perintahnya di README.

Uji manual wallet disconnected, wrong network, cancel signature, pending receipt, revert, metadata missing, task expiry, invalid validator, repeated vote, dan tampilan hash/explorer.

### Smoke test on-chain

Catat network, factory/task address, transaction hash, status receipt, dan hasil yang terlihat di UI. Jangan mencatat private key. Untuk demo concurrency, catat jumlah transaksi dan metode; jangan menyebut sampel kecil sebagai benchmark TPS.

## 6. Release checklist

- [ ] Kontrak ter-build dan seluruh test relevan lulus.
- [ ] Frontend lint/typecheck/build lulus atau kegagalan yang diketahui dijelaskan.
- [ ] Factory dideploy oleh operator manusia di Monad Testnet dengan tiga validator berbeda.
- [ ] Public env hanya memuat konfigurasi publik dan alamat yang benar.
- [ ] Create, submit, vote, payout diuji dengan receipt nyata; rejection/expiry diverifikasi.
- [ ] UI tidak menampilkan success sebelum receipt confirmed.
- [ ] Metadata unavailable dan chain status dibedakan dengan benar.
- [ ] README berisi run/deploy/hosting instructions dan tidak memiliki klaim/fakta fiktif.
- [ ] URL hosting dan link transaksi diverifikasi.
- [ ] Demo singkat siap, fitur dibekukan.

## 7. Cut line dan hal yang ditunda

Jika waktu terbatas, urutan penghapusan scope:

1. Supabase.
2. Panel aktivitas/event.
3. Eksperimen concurrency/analytics.
4. Polish non-esensial.

Jangan menghapus atau menunda alur escrow/payout/refund, validasi transaksi receipt, keamanan secret, deployment testnet yang dibutuhkan demo, atau README dasar.

Setelah MVP, pekerjaan produksi yang membutuhkan keputusan terpisah antara lain audit kontrak, model validator/dispute, ketahanan metadata lintas-browser dan consent, serta review hukum/privasi. Pekerjaan tersebut tidak termasuk dalam estimasi enam jam.
