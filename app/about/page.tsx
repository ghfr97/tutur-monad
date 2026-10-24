"use client";

import { useLanguage } from "@/lib/i18n-context";

export default function About() {
  const { t } = useLanguage();
  const h = "text-2xl font-semibold";
  const p = "mt-2 text-soft";
  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-4xl font-bold">{t.aboutPage.title}</h1>
      <section>
        <h2 className={h}>{t.aboutPage.problemTitle}</h2>
        <p className={p}>{t.aboutPage.problemDesc}</p>
      </section>
      <section>
        <h2 className={h}>{t.aboutPage.reviewTitle}</h2>
        <p className={p}>{t.aboutPage.reviewDesc}</p>
      </section>
      <section>
        <h2 className={h}>{t.aboutPage.feeTitle}</h2>
        <p className={p}>{t.aboutPage.feeDesc}</p>
      </section>
      <section>
        <h2 className={h}>{t.aboutPage.escrowTitle}</h2>
        <p className={p}>{t.aboutPage.escrowDesc}</p>
      </section>
      <section>
        <h2 className={h}>{t.aboutPage.dataTitle}</h2>
        <p className={p}>{t.aboutPage.dataDesc}</p>
      </section>
      <section>
        <h2 className={h}>{t.aboutPage.limitationsTitle}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-soft">
          {t.aboutPage.limitations.map((lim, idx) => (
            <li key={idx}>{lim}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

