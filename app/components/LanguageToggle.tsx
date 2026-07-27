"use client";

import { useLanguage } from "@/app/lib/i18n/LanguageProvider";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "bn" ? "en" : "bn")}
      className={
        className ??
        "rounded-full border border-cream-200 bg-paper/80 px-4 py-1.5 text-sm font-medium text-plum-900 backdrop-blur transition-colors hover:border-plum-700"
      }
    >
      {t("nav_lang_toggle")}
    </button>
  );
}
