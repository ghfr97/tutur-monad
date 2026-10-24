import Link from "next/link";
import { TaskList } from "@/components/task-list";
import {
  explorerAddressUrl,
  getFactoryAddress,
  getFactoryAddressError,
} from "@/lib/chain";

export default function Home() {
  const factoryAddress = getFactoryAddress();
  const factoryAddressError = getFactoryAddressError();

  return (
    <>
      <main>
        <section className="hero page-shell">
          <div className="hero-copy">
            <p className="eyebrow">BAHASA LOKAL · KONTRIBUSI TERVERIFIKASI</p>
            <h1>Setiap bahasa layak didengar.</h1>
            <p className="hero-lede">
              Sponsor mendanai tugas kecil, penutur berkontribusi, dan validator
              memeriksa hasil sebelum escrow dibayarkan.
            </p>
            <div className="button-row">
              <Link className="button button-dark" href="/tasks/new">
                Buat task
              </Link>
              <a className="button button-outline" href="#tasks">
                Lihat task terbuka
              </a>
            </div>
            <p className="fine-print">
              Prototipe hackathon di Monad Testnet. Testnet MON bukan uang nyata.
            </p>
          </div>
          <div className="hero-note">
            <span className="note-index">01 / ALUR</span>
            <ol>
              <li><span>01</span> Sponsor mendanai bounty</li>
              <li><span>02</span> Kontributor mengirim teks + consent</li>
              <li><span>03</span> Dua validator menentukan hasil</li>
              <li><span>04</span> Escrow membayar atau mengembalikan dana</li>
            </ol>
            <div className="fee-note">
              <span>Fee saat task diterima</span>
              <strong>8%</strong>
            </div>
          </div>
        </section>

        <section className="content-section page-shell" id="tasks">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ON-CHAIN ESCROW</p>
              <h2>Task yang tersedia</h2>
            </div>
            <Link className="text-link" href="/tasks/new">Buat task baru ↗</Link>
          </div>
          <TaskList />
        </section>

        <section className="about-section" id="about">
          <div className="page-shell about-grid">
            <div>
              <p className="eyebrow">CARA KERJA</p>
              <h2>Uang bergerak setelah keputusan, bukan janji.</h2>
            </div>
            <div>
              <p>
                Setiap bounty memiliki escrow sendiri. Dua dari tiga validator
                menyetujui hasil untuk membayar kontributor dan treasury.
                Penolakan atau deadline yang lewat mengembalikan escrow kepada
                sponsor.
              </p>
              <p className="fine-print">
                Teks kontribusi disimpan off-chain. Validasi bahasa dilakukan
                manusia; ini bukan sistem lisensi yang tervalidasi secara hukum.
              </p>
              {factoryAddress ? (
                <a
                  className="text-link"
                  href={explorerAddressUrl(factoryAddress)}
                  rel="noreferrer"
                  target="_blank"
                >
                  Factory {factoryAddress.slice(0, 8)}… di explorer ↗
                </a>
              ) : (
                <p className="fine-print">
                  {factoryAddressError ?? "Factory belum dikonfigurasi untuk deployment testnet."}
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer page-shell">
        <span>TUTUR · Prototipe Monad Testnet</span>
        <span>Jangan kirim teks pribadi atau sensitif.</span>
      </footer>
    </>
  );
}
