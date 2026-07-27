"use client";

import Image from "next/image";
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
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink-900 sm:text-2xl">
              {t("gallery_title")}
            </h1>
            <p className="mt-1 text-sm text-ink-700">{t("gallery_subtitle")}</p>
          </div>
          <LanguageToggle />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const status = statusByProductId[p.id];
            const completed = status === "completed";
            const draft = status === "draft";

            const label = completed
              ? t("gallery_status_completed")
              : draft
                ? t("gallery_status_draft")
                : t("gallery_status_not_started");

            return (
              <div
                key={p.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-cream-200 bg-cream-050"
              >
                <div className="relative aspect-[4/3] w-full bg-paper">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : null}
                  {completed ? (
                    <span className="absolute right-3 top-3 rounded-full bg-plum-900 px-3 py-1 text-xs font-medium text-cream-050">
                      ✓
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h2 className="text-base font-semibold text-ink-900">{p.title}</h2>
                  <form action={startOrResumeProduct} className="mt-auto">
                    <input type="hidden" name="productId" value={p.id} />
                    <button
                      type="submit"
                      disabled={completed}
                      className={`w-full rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                        completed
                          ? "cursor-default bg-cream-200 text-ink-700"
                          : "bg-plum-900 text-cream-050 hover:bg-plum-800"
                      }`}
                    >
                      {label}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
