# Arsitektur — TUTUR

**Versi:** 1.0  
**Status:** Target arsitektur MVP; kontrak Foundry sudah tersedia, frontend belum ada di repo.

## 1. Konteks sistem

TUTUR menggabungkan aplikasi web, wallet pengguna, Monad Testnet, dan penyimpanan metadata off-chain. Blockchain adalah sumber kebenaran untuk escrow, state task, vote, dan pembayaran. Metadata deskriptif serta teks kontribusi tetap off-chain.

```text
Sponsor / Kontributor / Validator
              |
              v
     Next.js web app (planned)
       |                 |
       | viem + wallet   | metadata store
       v                 v
 Monad Testnet       Browser localStorage
       |                 (P0)
       v
 TuturFactory ---- deploys ----> TuturTask (one per bounty)
```

Supabase persistence, bila ditambahkan setelah P0, menggantikan/menambah metadata store saja; ia tidak menjadi sumber kebenaran dana maupun status.

## 2. Status repo dan stack

**Sudah ada:** `contracts/src/TuturFactory.sol`, test Foundry di `contracts/test/TuturFactory.t.sol`, konfigurasi Solidity di `contracts/foundry.toml`, product brief, serta README template.

**Belum ada di repo:** aplikasi Next.js, dependency manifest frontend, `.env.example`, README final, ABI/config frontend, dan metadata store.

Stack target sesuai product brief:

- Kontrak: Solidity `0.8.28`, Foundry, tanpa dependency kontrak tambahan saat ini.
- Frontend: Next.js + TypeScript + Tailwind CSS.
- Interaksi chain/hash: viem; wallet connection dapat memakai wagmi bila membantu tanpa menambah kompleksitas berlebihan.
- Metadata P0: browser local storage.
- Metadata P1 opsional: Supabase dengan kebijakan akses yang aman.

Jangan menambahkan framework atau layanan baru jika tidak mendukung alur P0.

## 3. Komponen

### 3.1 `TuturFactory`

Implementasi berada di [`contracts/src/TuturFactory.sol`](./contracts/src/TuturFactory.sol).

- Menyimpan `treasury`, tiga validator, dan `feeBps` sebagai konfigurasi immutable.
- Memvalidasi alamat non-zero, keunikan validator, dan fee 1–1000 bps.
- `createTask(metadataHash, rewardAmount, deadline)` memvalidasi input dan pembayaran `reward + fee`.
- Men-deploy satu `TuturTask` baru per bounty, meneruskan nilai escrow, menyimpan alamat child, dan mengeluarkan `TaskCreated`.
- Menyediakan `getTaskCount()` dan `taskAt(index)` untuk discovery.

Discovery P0 dapat menggunakan factory read calls. Hindari menambah layanan indexer kompleks untuk kebutuhan daftar task demo; bila query penuh menjadi kendala, catat batasannya sebelum memilih mekanisme lain.

### 3.2 `TuturTask`

Setiap instance adalah escrow independen untuk satu task dan satu submission.

- Status: `Open`, `Submitted`, `Paid`, `Rejected`, `Refunded`.
- Mencatat sponsor, treasury, reward, fee, deadline, metadata hash, contributor, hash kontribusi, vote approvals/rejections, serta flag per-validator.
- Submission mensyaratkan status terbuka, belum melewati deadline, hash non-zero, bukan sponsor, dan consent true.
- Hanya tiga validator immutable yang dapat memberikan satu vote masing-masing.
- Dua approval memicu pembayaran reward ke contributor dan fee ke treasury.
- Dua rejection mengembalikan saldo escrow penuh ke sponsor.
- `refundAfterDeadline()` mengembalikan saldo penuh bila task belum final dan deadline sudah lewat.
- Status diubah sebelum external transfer; transfer gagal harus menggagalkan transaksi secara atomik.

### 3.3 Frontend (target)

Rute yang disarankan:

- `/` — ringkasan produk, status Monad Testnet dan CTA.
- `/tasks` — daftar task hasil pembacaan chain dan metadata yang tersedia lokal.
- `/tasks/new` — form pembuatan task dan estimasi biaya.
- `/tasks/[address]` — data escrow, form kontribusi, kontrol validator, refund, serta tautan transaksi.

Pisahkan logika sesuai area:

- **Chain config/contracts:** chain ID, RPC/explorer publik, factory address, ABI dan typed read/write helpers.
- **Wallet/transactions:** koneksi wallet, pemeriksaan/switch jaringan, pengiriman transaksi, receipt confirmation, error state.
- **Hashing:** satu fungsi normalisasi kontribusi dan satu fungsi hash yang dipakai konsisten saat submit dan verifikasi.
- **Metadata store:** interface kecil untuk local storage; semua operasi gagal tampil sebagai error atau status metadata unavailable, bukan nilai sukses palsu.
- **UI:** presentasi status chain dan form; tidak menyimpulkan status sukses hanya dari adanya transaction hash.

Ini adalah batas modul logis, bukan kewajiban membuat banyak package atau abstraksi generik.

Normalisasi teks kontribusi yang diimplementasikan: ubah line ending CRLF/CR menjadi LF, normalisasi Unicode ke NFC, lalu trim spasi di awal/akhir. Hash dibuat dari teks normalisasi UTF-8 dengan keccak256; fungsi yang sama dipakai untuk mencocokkan metadata lokal dengan hash on-chain.

## 4. Model data

### On-chain

Factory:

| Data | Arti |
|---|---|
| `treasury`, `validator1..3`, `feeBps` | Konfigurasi immutable saat deployment. |
| daftar alamat task | Discovery escrow. |
| `TaskCreated` | Bukti pembuatan: task address, sponsor, metadata hash, reward, fee, deadline. |

Task:

| Data | Arti |
|---|---|
| `sponsor`, `treasury`, `validator1..3` | Aktor dan penerima escrow/vote. |
| `rewardAmount`, `feeAmount`, `deadline`, `metadataHash` | Parameter task tetap. |
| `contributor`, `contributionHash`, `status` | Submission dan hasil. |
| `approvals`, `rejections`, `hasVoted` | Hasil pemungutan suara. |
| event submission/vote/finalization/refund | Riwayat perubahan yang dapat diperiksa melalui explorer. |

### Off-chain P0

Task metadata disimpan dengan task address sebagai key dan sekurangnya memuat title, prompt, usage terms, source/target language, register/dialect, versi terms, dan `createdAt`. Hash komitmen metadata memakai normalisasi JSON yang sama saat dibuat dan diperiksa UI.

Metadata kontribusi berisi teks, wallet kontributor, waktu/versi consent, dan content hash. Raw text tidak dikirim ke kontrak. Local storage tidak disinkronkan antar-browser; bila metadata tidak ada, gunakan label “Metadata tidak tersedia di perangkat ini” dan render nilai on-chain yang tetap tersedia.

### Konfigurasi publik

Variabel publik yang disarankan dalam `.env.example`:

```dotenv
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_EXPLORER_URL=https://testnet.monadexplorer.com
NEXT_PUBLIC_TUTUR_FACTORY_ADDRESS=0xREPLACE_AFTER_DEPLOYMENT
NEXT_PUBLIC_TREASURY_ADDRESS=0xREPLACE_WITH_TREASURY
NEXT_PUBLIC_VALIDATOR_1=0xREPLACE_WITH_VALIDATOR_1
NEXT_PUBLIC_VALIDATOR_2=0xREPLACE_WITH_VALIDATOR_2
NEXT_PUBLIC_VALIDATOR_3=0xREPLACE_WITH_VALIDATOR_3
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Alamat adalah konfigurasi publik, namun nilainya harus berasal dari deployment sebenarnya. Private key, seed phrase, dan service-role credential tidak boleh berada di frontend atau Git.

## 5. Interaksi dan alur data

### Buat task

1. Frontend memvalidasi form dan membaca feeBps dari konfigurasi/factory.
2. Frontend menghitung `fee = floor(reward × feeBps / 10_000)` dan `total = reward + fee`; pastikan hasil tidak nol sesuai validasi kontrak.
3. Metadata dibuat dan hash-nya dihitung; metadata lokal disiapkan agar dapat dikaitkan dengan alamat task setelah event/hasil transaksi tersedia.
4. Wallet mengirim `createTask` dengan `msg.value = total`.
5. UI menampilkan pending; menunggu receipt sukses.
6. Setelah sukses, frontend mengambil task address dari event `TaskCreated` atau hasil transaksi yang tervalidasi, menyimpan metadata menggunakan alamat tersebut, lalu membaca task dari chain.
7. Explorer link dibuat hanya dari transaction hash nyata dan base URL network yang benar.

### Submit kontribusi

1. Baca status dan deadline aktual dari `TuturTask`.
2. Wajibkan persetujuan terms aktif sebelum enable submit.
3. Normalisasi teks dengan fungsi yang sama untuk hash dan verifikasi lokal; jangan simpan raw text di local storage bila consent belum diberikan.
4. Simpan metadata off-chain; kirim `submitContribution(contentHash, true)` ke wallet.
5. Tunggu receipt sukses lalu refresh reads. Jika transaksi gagal, jangan tampilkan status Submitted.

### Vote dan finalisasi

1. Baca validator address, `hasVoted`, status, deadline, approvals/rejections.
2. Pastikan teks kontribusi lokal tersedia dan hash-nya cocok dengan hash on-chain sebelum menampilkan aksi vote.
3. Tampilkan vote control hanya pada validator yang sah dan task yang masih dapat divote.
4. Kirim `vote(approve)`; tunggu receipt lalu refresh state.
5. Setelah vote kedua yang sama, tampilkan status final sesuai kontrak dan buat tautan transaction explorer yang berasal dari receipt/hash tersebut.

### Refund

1. Baca status dan timestamp/deadline.
2. Aktifkan aksi refund setelah deadline hanya untuk state unresolved.
3. Kirim `refundAfterDeadline()`; tunggu receipt dan refresh.
4. Jangan mengasumsikan sponsor memicu sendiri; kontrak membolehkan siapa pun memanggil fungsi refund.

## 6. Batas kepercayaan dan keamanan

- **Wallet pengguna** memegang dan menandatangani transaksi; aplikasi tidak mengumpulkan atau mengirim private key.
- **Factory/child contract** mengatur state dan distribusi escrow. Frontend tidak dapat mengubah hasil transaksi.
- **Validator** adalah pihak tepercaya pada MVP; desain ini tidak memberi Sybil resistance, dispute resolution, atau jaminan independensi sosial.
- **Metadata store** tidak dipercaya sebagai sumber status pembayaran. Metadata dapat hilang/tidak cocok; cocokkan dengan task address/hash on-chain dan tunjukkan ketidaktersediaan secara eksplisit.
- **Hash kontribusi** memberi komitmen/integrity check, bukan kerahasiaan. Data sensitif dilarang.
- **Explorer** hanya link navigasi dari chain/hash yang terkonfigurasi; bukan bukti tambahan yang dibuat aplikasi.
- Transaksi berstatus confirmed hanya setelah receipt sukses pada chain target; tangani wrong network, wallet rejection, revert, timeout/RPC error, dan metadata persistence failure secara eksplisit.
- Transaksi wallet dikirim melalui RPC yang dikonfigurasi di wallet; `NEXT_PUBLIC_MONAD_RPC_URL` aplikasi hanya mengatur pembacaan dan estimasi gas. Jika RPC mengembalikan rate limit, UI menjelaskan bahwa itu bukan otomatis revert, memberi cooldown 30 detik tanpa resend otomatis, dan mengarahkan operator memakai endpoint Monad Testnet alternatif yang sah.

## 7. Monad Testnet dan transaksi

Konfigurasi event saat ini: chain ID `10143`, native currency MON, RPC `https://testnet-rpc.monad.xyz`, explorer `https://testnet.monadexplorer.com`, faucet `https://faucet.monad.xyz`. Operator harus memeriksa pembaruan penyelenggara sebelum deployment.

Kontrak dibuat sebagai escrow terpisah per task. Ini mengurangi kebutuhan berbagi state aplikasi di antara task independen dan merupakan eksperimen arsitektur untuk chain dengan eksekusi paralel; bukan jaminan bahwa semua transaksi akan berjalan paralel atau klaim performa.

## 8. Operasi dan deployment

1. Jalankan build/test Foundry di `contracts`.
2. Buat burner wallet dan dapatkan testnet MON secara manual.
3. Operator men-deploy factory dengan treasury, tiga validator berbeda, dan fee demo 800 bps memakai signing workflow milik operator.
4. Catat alamat deployment publik, verifikasi source bila tersedia, lalu konfigurasi `NEXT_PUBLIC_TUTUR_FACTORY_ADDRESS`.
5. Jalankan dan build frontend; deploy dengan hosting yang dipilih tim.
6. Jalankan alur end-to-end nyata dan simpan hash transaksi yang terkonfirmasi untuk README/demo.

Jangan membuat script deployment yang menyimpan private key, meminta secret kepada coding agent, atau menyatakan deployment berhasil tanpa alamat/receipt nyata.

## 9. Keterbatasan yang diketahui

- Tidak ada frontend atau metadata persistence saat ini.
- Discovery task melalui pembacaan factory sederhana dapat menjadi kurang efisien saat jumlah task tumbuh; MVP tidak memerlukan indexer kompleks.
- local storage hanya tersedia pada browser/perangkat tempat data disimpan.
- Satu task mendukung satu submission dan tiga validator tetap.
- Kontrak adalah prototipe hackathon dan belum diaudit.
- Supabase, event activity panel, dan eksperimen concurrency bukan dependensi P0.
