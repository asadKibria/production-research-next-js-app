"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/app/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/app/components/LanguageToggle";

type Product = { id: string; title: string; image: string | null };

export function HomeClient({
  products,
  participantCount,
  announcementMessage,
}: {
  products: Product[];
  participantCount: number;
  announcementMessage: string | null;
}) {
  const { t } = useLanguage();

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-paper">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-cream-200 bg-cream-050">
        {/* watermark logo */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-[32rem] w-[32rem] opacity-[0.05] md:-right-10 md:top-1/2 md:-translate-y-1/2">
          <Image src="/brand/logo-dark.png" alt="" fill sizes="512px" className="object-contain" />
        </div>

        {/* decorative geometric shapes */}
        <div className="pointer-events-none absolute left-[-4rem] top-10 h-40 w-40 rounded-full bg-taupe-400/30 blur-2xl" />
        <div className="pointer-events-none absolute bottom-[-3rem] left-1/3 h-56 w-56 rotate-12 rounded-[3rem] bg-mauve-500/10 blur-xl" />
        <div className="pointer-events-none absolute right-10 top-1/3 h-24 w-24 rotate-45 rounded-2xl border border-taupe-400/40" />

        <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
          <LanguageToggle />
        </div>

        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 sm:py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col items-start gap-6">
            <Image
              src="/brand/logo-dark.png"
              alt={t("brand")}
              width={140}
              height={56}
              className="h-12 w-auto object-contain"
              priority
            />
            <span className="rounded-full bg-plum-900/10 px-4 py-1 text-sm font-medium text-plum-900">
              {t("hero_welcome")}
            </span>
            <h1 className="text-balance text-3xl font-semibold leading-tight text-ink-900 sm:text-4xl md:text-5xl">
              {t("hero_heading")}
            </h1>
            <p className="max-w-md text-balance text-base text-ink-700 sm:text-lg">
              {t("hero_subtitle")}
            </p>

            <Link
              href="/survey"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-plum-900 px-8 py-3.5 text-base font-medium text-cream-050 shadow-lg shadow-plum-900/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {t("hero_cta")}
              <span aria-hidden>→</span>
            </Link>

            {participantCount > 0 ? (
              <p className="text-sm text-ink-700">
                <span className="font-semibold text-plum-900">{participantCount}+</span>{" "}
                {t("hero_participants")}
              </p>
            ) : null}
          </div>

          <div className="relative mx-auto h-80 w-full max-w-sm md:h-[28rem] md:max-w-none">
            <div
              className="absolute inset-0 rounded-[2.5rem]"
              style={{
                maskImage: "linear-gradient(to left, black 70%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to left, black 70%, transparent 100%)",
              }}
            >
              <Image
                src="/brand/hero.jpg"
                alt="Hizjaab"
                fill
                priority
                sizes="(min-width: 768px) 40vw, 90vw"
                className="rounded-[2.5rem] object-cover object-top shadow-2xl md:rounded-none md:shadow-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
        <h2 className="text-center text-2xl font-semibold text-ink-900 sm:text-3xl">
          {t("how_it_works_title")}
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { title: t("how_it_works_1_title"), desc: t("how_it_works_1_desc"), n: 1 },
            { title: t("how_it_works_2_title"), desc: t("how_it_works_2_desc"), n: 2 },
            { title: t("how_it_works_3_title"), desc: t("how_it_works_3_desc"), n: 3 },
          ].map((step) => (
            <div
              key={step.n}
              className="rounded-2xl border border-cream-200 bg-cream-050 p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-plum-900 text-sm font-semibold text-cream-050">
                {step.n}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-700">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Product Gallery Preview */}
      {products.length > 0 ? (
        <section className="w-full bg-cream-050 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-ink-900 sm:text-3xl">
                {t("gallery_preview_title")}
              </h2>
              <p className="mt-2 text-ink-700">{t("gallery_preview_subtitle")}</p>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {products.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-cream-200 bg-paper"
                >
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="(min-width: 640px) 25vw, 50vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Gift Section */}
      {announcementMessage ? (
        <section className="mx-auto w-full max-w-4xl px-6 py-16 text-center sm:py-20">
          <div className="rounded-3xl border border-taupe-400/40 bg-gradient-to-br from-taupe-400/15 via-cream-050 to-mauve-500/10 p-10">
            <span className="text-3xl">🎁</span>
            <h2 className="mt-3 text-xl font-semibold text-ink-900 sm:text-2xl">
              {t("gift_title")}
            </h2>
            <p className="mt-2 text-ink-700">{announcementMessage}</p>
          </div>
        </section>
      ) : null}

      {/* Bottom CTA */}
      <section className="border-t border-cream-200 bg-plum-950 py-14 text-center">
        <Image
          src="/brand/logo-light.png"
          alt={t("brand")}
          width={120}
          height={48}
          className="mx-auto h-10 w-auto object-contain"
        />
        <Link
          href="/survey"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-cream-050 px-8 py-3.5 text-base font-medium text-plum-900 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {t("start_survey_cta")}
          <span aria-hidden>→</span>
        </Link>
      </section>
    </main>
  );
}
