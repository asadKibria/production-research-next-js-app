"use client";

import Image from "next/image";
import { useState } from "react";
import { useLanguage } from "@/app/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { startOrResumeProduct } from "@/app/lib/actions/response";

type Product = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
};

export function ProductGalleryClient({
  products,
  statusByProductId,
}: {
  products: Product[];
  statusByProductId: Record<string, string>;
}) {
  const { t, locale } = useLanguage();
  const [preview, setPreview] = useState<Product | null>(null);

  const num = (value: number) => value.toLocaleString(locale === "bn" ? "bn-BD" : "en-US");
  const done = products.filter((p) => statusByProductId[p.id] === "completed").length;

  return (
    <main className="min-h-screen bg-paper pb-16">
      <header className="sticky top-0 z-30 border-b border-cream-200 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-ink-900 sm:text-lg">
              {t("gallery_title")}
            </h1>
            <p className="mt-0.5 truncate text-xs text-ink-700 sm:text-sm">{t("gallery_subtitle")}</p>
          </div>
          <LanguageToggle />
        </div>

        {/* overall progress across the whole collection */}
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 pb-3 sm:px-6">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-200">
            <div
              className="h-full rounded-full bg-plum-900 transition-all duration-500"
              style={{ width: `${products.length ? (done / products.length) * 100 : 0}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium text-taupe-600">
            {num(done)}/{num(products.length)}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pt-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, idx) => {
            const status = statusByProductId[p.id];
            const completed = status === "completed";
            const draft = status === "draft";

            const label = completed
              ? t("gallery_status_completed")
              : draft
                ? t("gallery_status_draft")
                : t("gallery_status_not_started");

            return (
              <article
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-cream-200 bg-cream-050 transition-shadow hover:shadow-lg"
              >
                <button
                  type="button"
                  onClick={() => p.image && setPreview(p)}
                  aria-label={`${p.title} — ${t("gallery_zoom_hint")}`}
                  className="relative block aspect-[3/4] w-full overflow-hidden bg-paper"
                >
                  {p.image ? (
                    <>
                      {/* Blurred fill so the letterboxed edges read as depth, not emptiness */}
                      <Image
                        src={p.image}
                        alt=""
                        fill
                        aria-hidden
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="scale-110 object-cover blur-2xl saturate-150 opacity-40"
                      />
                      {/* The garment itself — contained, so nothing is ever cropped away */}
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </>
                  ) : null}

                  <span className="absolute left-3 top-3 rounded-full bg-plum-950/70 px-2.5 py-1 text-[11px] font-medium text-cream-050 backdrop-blur-sm">
                    {num(idx + 1)}
                  </span>

                  {completed ? (
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-plum-900 px-2.5 py-1 text-[11px] font-medium text-cream-050">
                      ✓ {t("gallery_status_completed")}
                    </span>
                  ) : draft ? (
                    <span className="absolute right-3 top-3 rounded-full bg-taupe-400 px-2.5 py-1 text-[11px] font-medium text-plum-950">
                      {t("gallery_status_draft")}
                    </span>
                  ) : null}

                  {p.image ? (
                    <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-plum-950/70 px-3 py-1.5 text-[11px] font-medium text-cream-050 backdrop-blur-sm">
                      <ExpandIcon />
                      {t("gallery_zoom_hint")}
                    </span>
                  ) : null}
                </button>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <h2 className="text-base font-semibold leading-snug text-ink-900">{p.title}</h2>
                    {p.description ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-700">
                        {p.description}
                      </p>
                    ) : null}
                  </div>

                  <form action={startOrResumeProduct} className="mt-auto">
                    <input type="hidden" name="productId" value={p.id} />
                    <button
                      type="submit"
                      disabled={completed}
                      className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors ${
                        completed
                          ? "cursor-default bg-cream-200 text-ink-700"
                          : "bg-plum-900 text-cream-050 hover:bg-plum-800"
                      }`}
                    >
                      {label}
                      {!completed ? <span aria-hidden>→</span> : null}
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {preview?.image ? (
        <ProductPreview product={preview} onClose={() => setPreview(null)} />
      ) : null}
    </main>
  );
}

/** Full-screen look at one garment before committing to the questions. */
function ProductPreview({ product, onClose }: { product: Product; onClose: () => void }) {
  const { t } = useLanguage();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={product.title}
      className="fixed inset-0 z-50 flex flex-col bg-plum-950/95"
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <p className="truncate text-sm font-medium text-cream-050">{product.title}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("wizard_back")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-cream-050"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="relative flex-1 cursor-zoom-out"
        aria-label={t("wizard_back")}
      >
        <Image
          src={product.image as string}
          alt={product.title}
          fill
          sizes="100vw"
          className="object-contain p-4"
        />
      </button>

      <form action={startOrResumeProduct} className="px-5 pb-8 pt-2">
        <input type="hidden" name="productId" value={product.id} />
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-cream-050 px-6 py-3.5 text-sm font-semibold text-plum-950"
        >
          {t("gallery_status_not_started")}
          <span aria-hidden>→</span>
        </button>
      </form>
    </div>
  );
}

function ExpandIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path
        d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
