"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n-context";

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className="inline-flex items-center rounded-md border border-rule bg-paper2 p-0.5 text-xs font-semibold shadow-xs"
      role="group"
      aria-label="Language selection / Pemilihan bahasa"
    >
      <button
        type="button"
        id="lang-btn-id"
        onClick={() => setLocale("id")}
        className={`cursor-pointer rounded px-2.5 py-1 transition-all duration-150 ${
          locale === "id"
            ? "bg-accent text-accentink font-bold shadow-sm"
            : "text-soft hover:text-ink hover:bg-paper/60"
        }`}
        aria-pressed={locale === "id"}
        title="Bahasa Indonesia"
      >
        ID
      </button>
      <button
        type="button"
        id="lang-btn-en"
        onClick={() => setLocale("en")}
        className={`cursor-pointer rounded px-2.5 py-1 transition-all duration-150 ${
          locale === "en"
            ? "bg-accent text-accentink font-bold shadow-sm"
            : "text-soft hover:text-ink hover:bg-paper/60"
        }`}
        aria-pressed={locale === "en"}
        title="English"
      >
        EN
      </button>
    </div>
  );
}

export default LanguageToggle;
