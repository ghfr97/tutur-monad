# PRD — TUTUR

**Versi:** 1.0  
**Status:** Draft implementasi MVP  
**Konteks:** Monad Blitz Jogja, 24 Oktober 2026  
**Sumber utama:** [`TUTUR_DEVELOPER_PACK.md`](./TUTUR_DEVELOPER_PACK.md)

## 1. Ringkasan produk

TUTUR adalah prototipe micro-bounty untuk mengumpulkan kontribusi teks bahasa lokal. Sponsor mendanai sebuah tugas menggunakan MON di Monad Testnet. Kontributor mengirim teks dan menyetujui ketentuan penggunaan. Tiga validator yang telah dikonfigurasi memeriksa kontribusi; dua suara yang sama menyelesaikan tugas. Kontrak membayar kontributor dan treasury jika diterima, atau mengembalikan escrow kepada sponsor jika ditolak atau kedaluwarsa.

Tujuan MVP adalah membuktikan satu alur yang dapat didemokan dan diverifikasi di chain, bukan membuktikan permintaan pasar, kualitas bahasa secara otomatis, atau kepatuhan hukum.

## 2. Masalah dan hipotesis

Pengumpulan data bahasa membutuhkan permintaan yang jelas, persetujuan kontributor, proses pemeriksaan, dan pembayaran. Komponen tersebut sering kali terpisah sehingga status dan pembayaran sulit diverifikasi.

**Hipotesis produk:** escrow on-chain yang terikat pada tugas kecil, bukti hash kontribusi, dan keputusan validator dapat membuat proses pengumpulan serta pembayaran lebih transparan. Hipotesis ini belum tervalidasi secara komersial maupun hukum.

## 3. Pengguna dan kebutuhan

| Pengguna | Kebutuhan utama |
|---|---|
| Sponsor | Membuat tugas bahasa dengan prompt, target/register, reward, dan deadline yang jelas; mengetahui total biaya; melihat status serta hasil transaksi. |
| Kontributor | Memahami prompt dan ketentuan penggunaan sebelum mengirim kontribusi; menerima bukti bahwa pengajuan tercatat; memperoleh reward jika diterima. |
| Validator | Memeriksa kontribusi di luar chain, memilih approve/reject satu kali, dan melihat hasil pemungutan suara. |
| Pengunjung/demo reviewer | Memahami alur, melihat alamat kontrak dan status aktual, serta membuka transaksi nyata di explorer. |

## 4. Tujuan MVP

1. Menyelesaikan alur **buat tugas → submit kontribusi → vote → payout/refund** pada Monad Testnet.
2. Menampilkan keadaan chain dan transaksi hanya setelah pembacaan/receipt yang sesuai berhasil.
3. Menjaga isi teks tetap off-chain; chain hanya menyimpan hash, status, dan informasi escrow yang diperlukan.
4. Tetap berguna untuk demo satu browser tanpa layanan database eksternal.
5. Menyediakan instruksi yang bisa diikuti operator manusia untuk deployment dan hosting.

### Indikator penerimaan

- Tugas dapat dibuat dengan pembayaran tepat sebesar reward + fee.
- Kontribusi tunggal dapat dikirim setelah persetujuan terms eksplisit.
- Tiga alamat validator yang dikonfigurasi dapat memberikan masing-masing satu suara.
- Dua approval membayar reward dan fee; dua rejection atau expiry mengembalikan seluruh escrow kepada sponsor.
- UI menunjukkan keadaan task yang dibaca dari chain, alamat factory/task, serta tautan explorer hanya untuk hash transaksi nyata.
- Metadata lokal yang tidak tersedia tidak diganti dengan judul atau isi fiktif; UI menyatakan metadata tidak tersedia.
- Contract tests dan frontend checks yang tersedia dapat dijalankan, dan kegagalan yang tersisa didokumentasikan.

## 5. Ruang lingkup

### P0 — Wajib

- Wallet browser tersambung ke Monad Testnet (chain ID `10143`); UI menangani wallet terputus dan jaringan salah.
- Buat task berisi judul, prompt, bahasa/register target, reward, dan deadline.
- Hitung dan tampilkan fee sesuai konfigurasi kontrak serta jumlah total sebelum wallet dibuka. Untuk konfigurasi demo, fee adalah 800 bps (8%).
- Simpan metadata task di local storage; simpan metadata kontribusi di luar chain.
- Submit satu kontribusi teks, hash konten, dan persetujuan terms yang tidak dicentang secara default.
- Mewajibkan sponsor menjelaskan ketentuan penggunaan yang dibaca kontributor sebelum consent.
- Tampilkan halaman/detail task dengan status, sponsor, reward, fee, deadline, hash kontribusi, jumlah vote, alamat kontrak dan tautan transaksi nyata.
- Tampilkan kontrol validator hanya untuk wallet yang terdaftar; satu vote per validator per task.
- Tampilkan pemulihan escrow setelah deadline untuk task unresolved.
- Loading, pending, confirmed, rejected, failed, metadata-missing, dan error state yang dapat dipahami.
- Dokumentasikan setup lokal, deployment testnet oleh operator, hosting, variabel publik, serta keterbatasan demo.

### P1 — Hanya setelah seluruh P0 lulus

- Penyimpanan metadata bersama via Supabase dengan Row Level Security yang tepat.
- Panel aktivitas sederhana berbasis event kontrak.
- Eksperimen transaksi pada task independen dengan sampel dan metode yang dijelaskan secara jujur.
- Materi video/demo dan post submission.

### Tidak termasuk

- Audio, biometrik, atau pengumpulan data pribadi/sensitif.
- Token, DAO, staking, NFT, fiat, multi-chain, aplikasi mobile, model AI baru, adjudikasi AI, serta indexing kompleks.
- Klaim legal compliance, keabsahan lisensi, demand pelanggan, pendapatan, TPS, atau finality yang belum dibuktikan.
- Fitur admin yang dapat mengambil escrow.

## 6. Alur utama

### Sponsor

1. Mengisi informasi task dan meninjau terms/prompt.
2. Memasukkan reward dan deadline; melihat fee serta total pembayaran.
3. Menyetujui transaksi wallet.
4. Setelah receipt terkonfirmasi, melihat task dan escrow address serta tautan explorer.
5. Jika task masih belum selesai setelah deadline, memicu refund.

### Kontributor

1. Membuka task berstatus `Open` sebelum deadline.
2. Membaca prompt dan ketentuan penggunaan yang ditampilkan.
3. Mengisi teks contoh yang tidak sensitif.
4. Secara aktif mencentang pernyataan hak mengirim kontribusi dan persetujuan terms.
5. Frontend menormalisasi teks dengan satu fungsi terdokumentasi, membuat `keccak256`, dan menyimpan teks di off-chain metadata store.
6. Mengirim hanya hash dan persetujuan ke kontrak; menunggu receipt sebelum menyatakan transaksi sukses.

### Validator

1. Menghubungkan salah satu dari tiga wallet validator.
2. Meninjau kontribusi off-chain.
3. Mengirim approve atau reject, maksimal satu kali.
4. UI membaca ulang status setelah receipt; hasil final ditentukan kontrak setelah dua vote yang sama.

## 7. Aturan produk dan keadaan

Status kontrak:

| Status | Makna / aksi yang tersedia |
|---|---|
| `Open` | Menunggu satu kontribusi; submission hanya sebelum deadline. |
| `Submitted` | Kontribusi tercatat; validator dapat vote sebelum deadline. |
| `Paid` | Dua approval; reward dan fee telah dibayar. Terminal. |
| `Rejected` | Dua rejection; seluruh escrow dikembalikan. Terminal. |
| `Refunded` | Task unresolved melewati deadline; escrow dikembalikan. Terminal. |

Ketentuan tambahan:

- Satu task menerima maksimum satu kontribusi.
- Sponsor tidak dapat menjadi kontributor untuk task sendiri.
- Fee dihitung dengan basis 10.000; deployment demo menggunakan 800 bps.
- Task yang ditolak atau expired mengembalikan fee bersama reward.
- Hash tidak menyembunyikan data berentropi rendah dari analisis tebakan; jangan submit teks privat atau sensitif.
- Checkbox persetujuan adalah kontrol produk, bukan nasihat atau validasi legal.

## 8. Kebutuhan non-fungsional

- **Keamanan dana:** state terminal ditetapkan sebelum transfer; kegagalan transfer harus revert; frontend tidak mengelola private key.
- **Kejujuran transaksi:** hash transaksi belum berarti sukses; sukses hanya setelah receipt confirmed.
- **Privasi:** tidak mengirim raw text, private data, atau secrets ke chain, log publik, maupun konfigurasi frontend.
- **Ketahanan:** kontrak tetap sumber kebenaran status/payment; metadata hilang tidak menghalangi tampilan data on-chain.
- **Usability:** total pembayaran, network indicator, istilah consent, status, dan error ditampilkan jelas.
- **Keterbatasan:** ini prototipe testnet, belum diaudit, validator dipercaya, dan storage local hanya tersedia di browser yang menyimpannya.

## 9. Asumsi dan dependensi

- Monad Testnet memakai chain ID `10143`, RPC `https://testnet-rpc.monad.xyz`, dan explorer `https://testnet.monadexplorer.com`; konfirmasi pembaruan dari penyelenggara.
- Operator manusia membuat burner wallet, mendapatkan testnet MON, menandatangani deployment/transaksi, serta mengatur hosting.
- Factory deployment menyediakan treasury dan tiga alamat validator yang berbeda.
- Supabase bersifat opsional; P0 berjalan dengan local storage.
- Dokumen ini menggunakan kontrak/source yang ada sebagai interface awal; perubahan interface harus disinkronkan ke ABI frontend dan dokumentasi.

## 10. Risiko dan mitigasi

| Risiko | Mitigasi MVP |
|---|---|
| Kesalahan alamat/chain atau transaksi gagal | Indikator jaringan, validasi alamat, receipt confirmation, pesan error yang eksplisit. |
| Metadata tidak tersedia pada browser lain | Nyatakan dengan jelas; tetap tampilkan fakta on-chain. |
| Validator kolusi atau kunci demo hilang | Nyatakan validator sebagai trusted demo wallets; tidak mengklaim Sybil resistance. |
| Hash konten tidak merahasiakan teks | Jangan mengunggah data sensitif; jelaskan bahwa teks disimpan off-chain. |
| Fee salah atau dana tidak tepat | Hitung dari feeBps konfigurasi; tes pembayaran kurang/lebih dan fee calculation. |
| Waktu hackathon habis | Potong Supabase dan eksperimen concurrency terlebih dahulu; jangan potong payout/refund atau deployment/documentasi. |

## 11. Kriteria rilis/demo

- [ ] Contract build dan test lulus.
- [ ] Test mencakup happy path, unauthorized vote, double vote, duplicate submission, wrong payment, rejection/refund, expiry, fee, dan kegagalan transfer bila implementasi mendukung.
- [ ] Frontend lint/typecheck/build lulus jika script tersedia.
- [ ] Buat task, submit, dua vote, dan payout telah dites; transaksi demo benar-benar terkonfirmasi di testnet.
- [ ] Explorer link membuka transaksi yang sesuai dan menggunakan hash nyata.
- [ ] README berisi setup, alamat publik, deployment/hosting manual, serta checklist demo.
- [ ] Tidak ada secret di repo dan semua batasan prototipe disampaikan.

## 12. Referensi

- [`TUTUR_DEVELOPER_PACK.md`](./TUTUR_DEVELOPER_PACK.md) — spesifikasi sumber dan acceptance checklist.
- [`README_TEMPLATE.md`](./README_TEMPLATE.md) — template README/submission.
- [`contracts/src/TuturFactory.sol`](./contracts/src/TuturFactory.sol) — interface dan implementasi kontrak saat ini.
- [`contracts/test/TuturFactory.t.sol`](./contracts/test/TuturFactory.t.sol) — pengujian Foundry saat ini.
