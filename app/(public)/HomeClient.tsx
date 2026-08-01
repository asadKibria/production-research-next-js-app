"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const { t, locale } = useLanguage();
  const heroRef = useRef<HTMLElement>(null);
  const [pastHero, setPastHero] = useState(false);

  /** Bengali copy reads badly with Latin digits, so localise the numerals. */
  const num = (value: number) => value.toLocaleString(locale === "bn" ? "bn-BD" : "en-US");

  /**
   * Playfair (`font-display`) has no Bengali glyphs, so it would silently fall
   * back mid-heading. Use it only for English; Bengali gets the body face at a
   * heavier weight and tighter tracking, which carries the same editorial feel.
   */
  const display = locale === "en" ? "font-display" : "font-semibold tracking-tight";

  // Reveal the sticky mobile CTA only once the hero's own CTA is out of view.
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { rootMargin: "-72px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const withImages = products.filter((p) => p.image);
  // Two passes of the same list make the ticker loop without a visible seam.
  const ticker = withImages.length > 0 ? [...withImages, ...withImages] : [];

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-paper">
      {/* ── Masthead ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-cream-200/80 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-6">
          <Image
            src="/brand/logo-dark.png"
            alt={t("brand")}
            width={120}
            height={48}
            priority
            className="h-7 w-auto object-contain sm:h-8"
          />
          <div className="flex items-center gap-3">
            <span className="hidden text-[11px] uppercase tracking-[0.22em] text-taupe-600 sm:inline">
              {t("home_season")}
            </span>
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative isolate overflow-hidden bg-plum-950">
        <div className="absolute inset-0">
          <Image
            src="/brand/hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_22%] opacity-55"
          />
          {/* Duotone wash keeps the photograph on-brand and the type readable */}
          <div className="absolute inset-0 bg-gradient-to-b from-plum-950/85 via-plum-950/55 to-plum-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-plum-950/80 to-transparent" />
        </div>
        <div className="grain absolute inset-0" />

        <div className="relative mx-auto flex min-h-[86svh] max-w-6xl flex-col justify-end px-5 pb-12 pt-24 sm:px-6 sm:pb-16 md:min-h-[78svh] md:justify-center md:pb-24 md:pt-32">
          {/* editorial rule */}
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-cream-100/70">
            <span className="h-px w-8 bg-cream-100/40" />
            {t("home_edition")}
          </div>

          <h1
            className={`mt-5 max-w-3xl text-balance ${display} text-[2.6rem] leading-[1.06] text-cream-050 sm:text-6xl md:text-7xl`}
          >
            {t("hero_heading")}
          </h1>

          <p className="mt-5 max-w-md text-balance text-base leading-relaxed text-cream-100/85 sm:text-lg">
            {t("hero_subtitle")}
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/survey"
              className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-cream-050 px-8 py-4 text-base font-medium text-plum-950 shadow-xl shadow-plum-950/40 transition-transform active:scale-[0.98] sm:hover:scale-[1.02]"
            >
              {t("hero_cta")}
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>

            {participantCount > 0 ? (
              <p className="text-sm text-cream-100/80">
                <span className={`${display} text-xl text-cream-050`}>{num(participantCount)}</span>{" "}
                {t("hero_participants")}
              </p>
            ) : null}
          </div>

          <p className="mt-10 text-[11px] uppercase tracking-[0.24em] text-cream-100/45">
            ↓ {t("home_scroll_hint")}
          </p>
        </div>
      </section>

      {/* ── Lookbook ticker ──────────────────────────────────────── */}
      {ticker.length > 0 ? (
        <section className="border-y border-cream-200 bg-cream-050 py-7 sm:py-9">
          <div className="mx-auto mb-5 flex max-w-6xl items-center gap-3 px-5 text-[11px] uppercase tracking-[0.24em] text-taupe-600 sm:px-6">
            <span className="h-px w-8 bg-taupe-400" />
            {t("home_marquee_label")}
          </div>

          <div className="marquee-mask overflow-hidden">
            <ul className="marquee-track flex w-max gap-3 sm:gap-4">
              {ticker.map((p, i) => (
                <li
                  key={`${p.id}-${i}`}
                  className="relative h-40 w-28 shrink-0 overflow-hidden rounded-xl bg-paper sm:h-56 sm:w-40"
                >
                  <Image
                    src={p.image as string}
                    alt={p.title}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-16">
        <dl className="grid grid-cols-3 gap-3 sm:gap-6">
          {[
            { value: num(products.length), label: t("home_stat_designs") },
            { value: locale === "bn" ? "৩–৫" : "3–5", label: t("home_stat_minutes") },
            { value: num(participantCount), label: t("home_stat_voices") },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-cream-200 bg-cream-050 px-3 py-5 text-center sm:px-5 sm:py-7"
            >
              <dt className={`${display} text-3xl text-plum-900 sm:text-5xl`}>{stat.value}</dt>
              <dd className="mt-1.5 text-[11px] leading-snug text-ink-700 sm:text-sm">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-4 sm:px-6">
        <h2 className={`${display} text-3xl text-ink-900 sm:text-4xl`}>{t("how_it_works_title")}</h2>

        <ol className="relative mt-8 grid grid-cols-1 gap-7 sm:grid-cols-3 sm:gap-6">
          {/* connecting rule (desktop only) */}
          <span
            aria-hidden
            className="absolute left-0 right-0 top-5 hidden h-px bg-cream-200 sm:block"
          />
          {[
            { n: num(1).padStart(2, num(0)), title: t("how_it_works_1_title"), desc: t("how_it_works_1_desc") },
            { n: num(2).padStart(2, num(0)), title: t("how_it_works_2_title"), desc: t("how_it_works_2_desc") },
            { n: num(3).padStart(2, num(0)), title: t("how_it_works_3_title"), desc: t("how_it_works_3_desc") },
          ].map((step) => (
            <li key={step.n} className="relative flex gap-4 sm:flex-col sm:gap-0">
              <span
                className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cream-200 bg-paper ${display} text-sm text-plum-900`}
              >
                {step.n}
              </span>
              <div className="sm:mt-5">
                <h3 className="text-lg font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Why it matters ───────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-plum-900 px-6 py-10 sm:px-12 sm:py-14">
          <div className="grain absolute inset-0" />
          <div className="relative max-w-2xl">
            <h2 className={`${display} text-2xl leading-snug text-cream-050 sm:text-4xl`}>
              {t("home_why_title")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-cream-100/80">{t("home_why_body")}</p>
          </div>
        </div>
      </section>

      {/* ── Gallery ──────────────────────────────────────────────── */}
      {withImages.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-5 pb-14 sm:px-6 sm:pb-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className={`${display} text-3xl text-ink-900 sm:text-4xl`}>
                {t("gallery_preview_title")}
              </h2>
              <p className="mt-1.5 text-sm text-ink-700">{t("gallery_preview_subtitle")}</p>
            </div>
            <Link
              href="/survey"
              className="text-sm font-medium text-plum-900 underline underline-offset-4"
            >
              {t("home_gallery_cta")} →
            </Link>
          </div>

          {/* Asymmetric editorial grid — the first tile spans two columns */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {withImages.slice(0, 7).map((p, idx) => (
              <figure
                key={p.id}
                className={`group relative overflow-hidden rounded-2xl bg-cream-050 ${
                  idx === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-[4/5]" : "aspect-[3/4]"
                }`}
              >
                <Image
                  src={p.image as string}
                  alt={p.title}
                  fill
                  sizes={idx === 0 ? "(min-width: 640px) 50vw, 100vw" : "(min-width: 640px) 25vw, 50vw"}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum-950/85 to-transparent px-3 pb-2.5 pt-8 text-xs font-medium text-cream-050 sm:text-sm">
                  {p.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Gift ─────────────────────────────────────────────────── */}
      {announcementMessage ? (
        <section className="mx-auto w-full max-w-3xl px-5 pb-14 sm:px-6 sm:pb-20">
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-taupe-600/50 bg-gradient-to-br from-taupe-400/20 via-cream-050 to-mauve-500/10 px-6 py-8 text-center sm:px-10">
            <span className="text-3xl">🎁</span>
            <h2 className={`mt-3 ${display} text-xl text-ink-900 sm:text-2xl`}>{t("gift_title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-700 sm:text-base">
              {announcementMessage}
            </p>
          </div>
        </section>
      ) : null}

      {/* ── Closing CTA ──────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden border-t border-cream-200 bg-plum-950 px-5 py-16 text-center sm:py-20">
        <div className="grain absolute inset-0" />
        <div className="relative">
          <Image
            src="/brand/logo-light.png"
            alt={t("brand")}
            width={120}
            height={48}
            className="mx-auto h-9 w-auto object-contain"
          />
          <p
            className={`mx-auto mt-6 max-w-md text-balance ${display} text-2xl leading-snug text-cream-050 sm:text-3xl`}
          >
            {t("home_hero_kicker")}
          </p>
          <Link
            href="/survey"
            className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-cream-050 px-8 py-4 text-base font-medium text-plum-950 transition-transform active:scale-[0.98] sm:hover:scale-[1.02]"
          >
            {t("start_survey_cta")}
            <span aria-hidden>→</span>
          </Link>
          <p className="mx-auto mt-8 max-w-xs text-xs leading-relaxed text-cream-100/50">
            {t("home_privacy_note")}
          </p>
        </div>
      </section>

      {/* ── Sticky mobile CTA ────────────────────────────────────── */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-paper/95 px-4 py-3 backdrop-blur-md transition-transform duration-300 sm:hidden ${
          pastHero ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <Link
          href="/survey"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-plum-900 py-3.5 text-base font-medium text-cream-050"
        >
          {t("home_sticky_cta")}
          <span aria-hidden>→</span>
        </Link>
      </div>
      {/* keeps the closing section clear of the sticky bar */}
      <div aria-hidden className="h-20 sm:hidden" />
    </main>
  );
}
