"use client";

import Link from "next/link";
import { useLanguage } from "@/app/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/app/components/LanguageToggle";

export function CompleteClient({
  customerName,
  designsReviewedCount,
  topPickTitle,
}: {
  customerName: string;
  designsReviewedCount: number;
  topPickTitle: string | null;
}) {
  const { t } = useLanguage();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-cream-050 px-6 py-16">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-taupe-400/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-mauve-500/15 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 h-24 w-24 rotate-45 rounded-2xl border border-taupe-400/40" />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <LanguageToggle />
      </div>

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-plum-900/10 text-plum-900">
          <CheckIcon />
        </span>

        <h1 className="mt-6 text-3xl font-semibold text-ink-900 sm:text-4xl">
          {t("wizard_thank_you_greeting")}, {customerName}!
        </h1>
        <p className="mt-3 max-w-sm text-balance text-ink-700">
          {t("wizard_thank_you_personal_desc")}
        </p>

        <div className="mt-8 grid w-full grid-cols-2 gap-4">
          <div className="rounded-2xl border border-cream-200 bg-paper p-5 text-left">
            <p className="text-xs font-medium text-ink-700">{t("wizard_designs_reviewed")}</p>
            <p className="font-display mt-1 text-3xl font-semibold text-plum-900">
              {designsReviewedCount}
            </p>
          </div>
          <div className="rounded-2xl border border-cream-200 bg-paper p-5 text-left">
            <p className="flex items-center gap-1.5 text-xs font-medium text-ink-700">
              <HeartIcon />
              {t("wizard_top_pick")}
            </p>
            <p className="mt-1 line-clamp-2 text-base font-semibold text-ink-900">
              {topPickTitle ?? "—"}
            </p>
          </div>
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/survey/products"
            className="inline-flex items-center gap-2 rounded-full bg-plum-900 px-8 py-3.5 text-base font-medium text-cream-050 shadow-lg shadow-plum-900/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {t("wizard_back_to_gallery")}
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-cream-200 bg-paper px-8 py-3.5 text-base font-medium text-ink-900 transition-colors hover:border-plum-700"
          >
            {t("wizard_back_home")}
          </Link>
        </div>

        <p className="mt-8 flex items-center gap-1.5 text-xs text-ink-700/80">
          <LockIcon />
          {t("wizard_privacy_note")}
        </p>
      </div>
    </main>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-6.7-4.35-9.3-8.2C1 10.1 1.6 6.6 4.6 5.1 6.9 4 9.2 4.9 12 8c2.8-3.1 5.1-4 7.4-2.9 3 1.5 3.6 5 1.9 7.7C18.7 16.65 12 21 12 21Z" />
    </svg>
  );
}
