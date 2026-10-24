"use client";

import React, { createContext, useContext, useState, useMemo } from "react";

export type Locale = "en" | "id";

export interface Translations {
  nav: {
    tasks: string;
    createTask: string;
    about: string;
    monadNotice: string;
    connect: string;
    connected: string;
  };
  footer: {
    notice: string;
  };
  walletGate: {
    noProvider: string;
    connectPrompt: string;
    connectBtn: string;
    wrongNetwork: string;
    switchBtn: string;
  };
  factory: {
    notConfigured: string;
    notConfiguredTitle: string;
  };
  home: {
    eyebrow: string;
    title: string;
    description: string;
    browseBtn: string;
    fundBtn: string;
    runsOn: string;
    factoryNotSet: string;
    problemTitle: string;
    problemDesc: string;
    escrowTitle: string;
    escrowDesc: string;
    howItWorksTitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    revenueTitle: string;
    revenueDesc: string;
    latestTasksTitle: string;
    loadingChain: string;
    noTasksCreated: string;
  };
  tasksPage: {
    title: string;
    subtitle: string;
    refresh: string;
    createBtn: string;
    loading: string;
    error: string;
    empty: string;
  };
  aboutPage: {
    title: string;
    problemTitle: string;
    problemDesc: string;
    reviewTitle: string;
    reviewDesc: string;
    feeTitle: string;
    feeDesc: string;
    escrowTitle: string;
    escrowDesc: string;
    dataTitle: string;
    dataDesc: string;
    limitationsTitle: string;
    limitations: string[];
  };
}

export const translations: Record<Locale, Translations> = {
  en: {
    nav: {
      tasks: "Tasks",
      createTask: "Create task",
      about: "About",
      monadNotice: "Monad Testnet · test MON only",
      connect: "Connect",
      connected: "Connected",
    },
    footer: {
      notice: "Hackathon prototype for Monad Blitz Jogja. Unaudited. Testnet MON has no monetary value.",
    },
    walletGate: {
      noProvider: "No browser wallet detected. Install MetaMask (or a compatible wallet) to interact.",
      connectPrompt: "Connect a burner wallet to continue.",
      connectBtn: "Connect wallet",
      wrongNetwork: "Wrong network. TUTUR runs on {name} (chain {id}).",
      switchBtn: "Switch network",
    },
    factory: {
      notConfiguredTitle: "Factory address not configured.",
      notConfigured: "Deploy TuturFactory to Monad Testnet and set NEXT_PUBLIC_TUTUR_FACTORY_ADDRESS in .env.local (see README). No tasks can be shown until then; nothing here is simulated.",
    },
    home: {
      eyebrow: "Monad Blitz Jogja · hackathon prototype",
      title: "Every contribution counts. Every verified voice gets rewarded.",
      description:
        "TUTUR turns local-language data collection into verifiable micro-bounties. Sponsors fund a small task, contributors submit text, three validators review it, and a smart contract pays for accepted work.",
      browseBtn: "Browse tasks",
      fundBtn: "Fund a task",
      runsOn: "Runs on Monad Testnet with test MON only.",
      factoryNotSet: "Factory contract not configured yet.",
      problemTitle: "The problem",
      problemDesc:
        "AI builders and researchers need reliable language data for translation, speech and evaluation. Collecting it well means clear tasks, contributor consent, quality review and transparent pay. Regional languages and registers are easy to overlook.",
      escrowTitle: "Why independent escrows",
      escrowDesc:
        "Each task is its own contract with its own balance and votes. Unrelated tasks never touch a shared payout queue, an architectural fit for Monad’s optimistic parallel execution. It is a design choice, not a guarantee of parallelism.",
      howItWorksTitle: "How it works",
      step1Title: "1 · Fund",
      step1Desc: "A sponsor locks reward + 8% fee in MON inside a dedicated task escrow.",
      step2Title: "2 · Contribute & review",
      step2Desc:
        "A contributor submits text (only its hash goes on-chain) and accepts the usage terms. Three validators vote; two matching votes decide.",
      step3Title: "3 · Settle",
      step3Desc: "Accepted: reward to contributor, fee to treasury. Rejected or expired: full refund to the sponsor.",
      revenueTitle: "Revenue model (hypothesis)",
      revenueDesc:
        "An 8% service fee on accepted work, enforced in the contract. Example: a 1 MON reward needs 1.08 MON funded; on acceptance 1 MON goes to the contributor and 0.08 MON to the treasury. This is an illustrative testnet example, not validated pricing or revenue.",
      latestTasksTitle: "Latest on-chain tasks",
      loadingChain: "Loading from chain…",
      noTasksCreated: "No tasks have been created yet.",
    },
    tasksPage: {
      title: "Task marketplace",
      subtitle: "Every row is read from the factory contract on Monad Testnet.",
      refresh: "Refresh",
      createBtn: "Create task",
      loading: "Loading tasks from chain…",
      error: "Could not read tasks from Monad Testnet RPC. Try again.",
      empty: "No tasks exist on this factory yet. Create the first one.",
    },
    aboutPage: {
      title: "About TUTUR",
      problemTitle: "The problem",
      problemDesc:
        "Language models, translation and speech systems need dependable data in local languages and registers. Gathering it requires clear task definitions, contributor consent, human quality review and visible compensation. TUTUR explores making the smallest unit of that work a verifiable on-chain task.",
      reviewTitle: "How review works",
      reviewDesc:
        "Three validator wallets are fixed in the factory at deployment. After a contribution is submitted, each validator can vote once. Two matching votes finalize the task: approvals pay out, rejections refund the sponsor. Quality judgement is human; AI is not an authority here.",
      feeTitle: "The service fee",
      feeDesc:
        "The factory stores a fee in basis points (800 = 8%). The sponsor funds reward + fee. On acceptance the contract pays the reward to the contributor and the fee to the treasury. The treasury is fixed at deployment and there is no admin withdrawal function. The 8% rate is a business hypothesis, not validated pricing.",
      escrowTitle: "Independent escrows",
      escrowDesc:
        "Every task is its own contract with its own balance, contribution and votes, so a transaction on one task does not need to write to another task’s state. This suits Monad’s optimistic parallel execution as an architectural fit. It does not guarantee parallel execution, and it is not a claim that only Monad can run this design.",
      dataTitle: "Data handling",
      dataDesc:
        "Raw contribution text is never stored on-chain; only a keccak256 hash of the normalized text is. In this prototype, text and task metadata live in browser local storage, so another browser sees on-chain state but “metadata unavailable on this device”. Do not submit personal or sensitive data. The consent checkbox is a product-level acknowledgement, not a reviewed legal licence.",
      limitationsTitle: "Prototype limitations",
      limitations: [
        "Unaudited hackathon code on testnet; test MON has no monetary value.",
        "Three trusted validators; collusion and Sybil resistance are not solved.",
        "One contribution per task; no dispute process.",
        "Off-chain storage is local to a browser unless a shared database is added.",
        "Demand and the 8% price point still need customer validation.",
      ],
    },
  },
  id: {
    nav: {
      tasks: "Daftar Tugas",
      createTask: "Buat Tugas",
      about: "Tentang",
      monadNotice: "Monad Testnet · hanya test MON",
      connect: "Hubungkan",
      connected: "Terhubung",
    },
    footer: {
      notice: "Prototipe hackathon untuk Monad Blitz Jogja. Belum diaudit. Testnet MON tidak memiliki nilai moneter riil.",
    },
    walletGate: {
      noProvider: "Dompet browser tidak terdeteksi. Pasang MetaMask (atau dompet yang kompatibel) untuk berinteraksi.",
      connectPrompt: "Hubungkan dompet burner untuk melanjutkan.",
      connectBtn: "Hubungkan dompet",
      wrongNetwork: "Jaringan salah. TUTUR berjalan di {name} (chain {id}).",
      switchBtn: "Ganti jaringan",
    },
    factory: {
      notConfiguredTitle: "Alamat factory belum dikonfigurasi.",
      notConfigured: "Deploy TuturFactory ke Monad Testnet dan atur NEXT_PUBLIC_TUTUR_FACTORY_ADDRESS di .env.local (lihat README). Daftar tugas tidak dapat ditampilkan sebelum itu; data di sini tidak disimulasikan.",
    },
    home: {
      eyebrow: "Monad Blitz Jogja · prototipe hackathon",
      title: "Setiap kontribusi bermakna. Setiap suara terverifikasi mendapat imbalan.",
      description:
        "TUTUR mengubah pengumpulan data bahasa daerah menjadi micro-bounty yang dapat diverifikasi on-chain. Sponsor mendanai tugas kecil, kontributor mengirimkan teks, tiga validator meninjau, dan smart contract membayar hasil kerja yang diterima.",
      browseBtn: "Jelajahi tugas",
      fundBtn: "Danai tugas baru",
      runsOn: "Berjalan di Monad Testnet hanya dengan test MON.",
      factoryNotSet: "Kontrak factory belum dikonfigurasi.",
      problemTitle: "Tantangan",
      problemDesc:
        "Pengembang AI dan peneliti memerlukan data bahasa yang andal untuk penerjemahan, wicara, dan evaluasi model. Pengumpulan yang baik memerlukan kejelasan tugas, izin kontributor, penilaian mutu manusia, dan imbalan transparan. Bahasa daerah dan tingkatan tutur (seperti ngoko/krama) sering kali luput dari perhatian.",
      escrowTitle: "Mengapa escrow independen",
      escrowDesc:
        "Setiap tugas memiliki kontrak mandiri dengan saldo dan voting terpisah. Tugas yang berbeda tidak pernah berbagi antrean pembayaran, selaras dengan keunggulan eksekusi paralel optimistik di Monad. Ini adalah rancangan arsitektur, bukan klaim performa tanpa bukti.",
      howItWorksTitle: "Cara kerja",
      step1Title: "1 · Danai",
      step1Desc: "Sponsor mengunci imbalan + biaya layanan 8% dalam token MON pada escrow kontrak tugas tersendiri.",
      step2Title: "2 · Kontribusi & peninjauan",
      step2Desc:
        "Kontributor mengirimkan teks (hanya hash yang dicatat on-chain) dan menyetujui ketentuan lisensi. Tiga validator memberikan suara; dua suara sepakat menentukan hasil.",
      step3Title: "3 · Penyelesaian",
      step3Desc: "Diterima: imbalan langsung dikirim ke kontributor, biaya layanan ke kas. Ditolak atau kedaluwarsa: pengembalian dana 100% ke sponsor.",
      revenueTitle: "Model pendapatan (hipotesis)",
      revenueDesc:
        "Biaya layanan 8% dari tugas yang disetujui, ditegakkan otomatis oleh kontrak. Contoh: imbalan 1 MON membutuhkan pendanaan 1,08 MON; saat disetujui, 1 MON dibayarkan ke kontributor dan 0,08 MON ke kas platform. Ini adalah contoh ilustrasi testnet, bukan penetapan harga komersial.",
      latestTasksTitle: "Tugas on-chain terbaru",
      loadingChain: "Memuat dari blockchain…",
      noTasksCreated: "Belum ada tugas yang dibuat di kontrak ini.",
    },
    tasksPage: {
      title: "Pasar Tugas Micro-bounty",
      subtitle: "Setiap baris dibaca langsung dari kontrak factory di Monad Testnet.",
      refresh: "Segarkan",
      createBtn: "Buat tugas",
      loading: "Memuat daftar tugas dari chain…",
      error: "Gagal membaca tugas dari RPC Monad Testnet. Silakan coba lagi.",
      empty: "Belum ada tugas di factory ini. Buat tugas pertama Anda sekarang.",
    },
    aboutPage: {
      title: "Tentang TUTUR",
      problemTitle: "Tantangan",
      problemDesc:
        "Model AI bahasa, penerjemah, dan sistem pengenalan suara membutuhkan data yang dapat diandalkan dalam bahasa daerah dan ragam tingkatannya. Pengumpulan yang bertanggung jawab membutuhkan kejelasan definisi tugas, persetujuan kontributor, tinjauan kualitas manusia, dan kompensasi yang adil. TUTUR mewujudkan unit terkecil pekerjaan tersebut menjadi tugas on-chain yang dapat diverifikasi.",
      reviewTitle: "Cara peninjauan validator",
      reviewDesc:
        "Tiga alamat dompet validator ditentukan saat deploy factory. Setelah kontribusi dikirimkan, tiap validator dapat memilih sekali. Dua suara yang sama menentukan hasil akhir: persetujuan mencairkan pembayaran, penolakan mengembalikan dana ke sponsor. Penilaian kualitas dilakukan secara murni oleh manusia.",
      feeTitle: "Biaya layanan",
      feeDesc:
        "Factory menyimpan parameter biaya (800 = 8%). Sponsor mendanai imbalan + biaya layanan. Saat diterima, kontrak membayarkan imbalan ke kontributor dan biaya ke perbendaharaan kas. Alamat kas ditentukan saat deploy dan tidak ada fungsi penarikan sepihak oleh admin.",
      escrowTitle: "Escrow mandiri",
      escrowDesc:
        "Setiap tugas memiliki smart contract tersendiri dengan saldo, kontribusi, dan status voting terisolasi. Transaksi pada satu tugas tidak memengaruhi status tugas lain, sangat cocok dengan eksekusi paralel Monad.",
      dataTitle: "Penanganan data & privasi",
      dataDesc:
        "Teks kontribusi mentah tidak pernah disimpan di blockchain; hanya nilai keccak256 hash teks ternormalisasi yang dicatat. Pada prototipe ini, teks dan metadata tersimpan di penyimpanan lokal browser. Jangan mengirimkan data pribadi atau rahasia.",
      limitationsTitle: "Batasan prototipe",
      limitations: [
        "Kode hackathon di testnet belum diaudit; test MON tidak bernilai uang riil.",
        "Menggunakan 3 validator tepercaya; mekanisme anti-Sybil penuh belum diterapkan.",
        "Satu pengajuan per tugas; belum ada sistem sengketa lanjutan.",
        "Penyimpanan metadata bersifat lokal di browser sebelum integrasi database publik.",
        "Tingkat permintaan dan angka tarif 8% masih memerlukan validasi pasar lanjutan.",
      ],
    },
  },
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: () => {},
  t: translations.en,
});

const STORAGE_KEY = "tutur_locale_pref";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "en" || saved === "id") return saved;
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("id")) return "id";
    } catch {
      // ignore storage access issues
    }
    return "en";
  });

  const setLocale = (loc: Locale) => {
    setLocaleState(loc);
    try {
      localStorage.setItem(STORAGE_KEY, loc);
    } catch {
      // ignore
    }
  };

  const t = useMemo(() => translations[locale], [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
