"use client";

import Link from "next/link";
import { useState } from "react";
import type { Sentiment } from "@/app/lib/insight-math";
import type { QuestionBreakdown } from "@/app/lib/scoreboard";

const SENTIMENT_STYLES: Record<Sentiment, { bar: string; chip: string; label: string }> = {
  positive: { bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700", label: "পজিটিভ" },
  neutral: { bar: "bg-amber-400", chip: "bg-amber-50 text-amber-700", label: "নিউট্রাল" },
  negative: { bar: "bg-rose-500", chip: "bg-rose-50 text-rose-700", label: "নেগেটিভ" },
};

const NEUTRAL_BAR = "bg-plum-700";

export type ExplorerProduct = { productId: string; title: string };

/**
 * The product filter is client state rather than a query parameter on purpose.
 * Every product's counts already ship with the page, so a round trip would buy
 * nothing — and navigating re-runs the dashboard's page transition and snaps
 * the scroll position back to the top, which reads as a jolt when the chips sit
 * halfway down a long page. Switching products now only re-renders these cards.
 */
export function QuestionExplorer({
  questions,
  products,
}: {
  questions: QuestionBreakdown[];
  products: ExplorerProduct[];
}) {
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const activeProductTitle =
    products.find((p) => p.productId === activeProductId)?.title ?? null;

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-ink-900">প্রশ্ন ধরে ধরে ফিডব্যাক</h2>
        <p className="mt-0.5 text-xs text-ink-700">
          যেকোনো অপশনে ক্লিক করলে ঠিক সেই উত্তর দেওয়া রেসপন্সগুলোর তালিকা খুলবে
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <ProductChip
          label="সব প্রোডাক্ট"
          active={activeProductId === null}
          onSelect={() => setActiveProductId(null)}
        />
        {products.map((p) => (
          <ProductChip
            key={p.productId}
            label={p.title}
            active={activeProductId === p.productId}
            onSelect={() => setActiveProductId(p.productId)}
          />
        ))}
      </div>

      {questions.map((q) => (
        <QuestionCard
          key={q.questionText}
          question={q}
          activeProductId={activeProductId}
          activeProductTitle={activeProductTitle}
        />
      ))}
    </section>
  );
}

function ProductChip({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-plum-900 text-cream-050"
          : "border border-cream-200 bg-cream-050 text-ink-700 hover:border-plum-700"
      }`}
    >
      {label}
    </button>
  );
}

function QuestionCard({
  question,
  activeProductId,
  activeProductTitle,
}: {
  question: QuestionBreakdown;
  activeProductId: string | null;
  activeProductTitle: string | null;
}) {
  const countFor = (option: QuestionBreakdown["options"][number]) =>
    activeProductId === null ? option.count : (option.byProduct[activeProductId] ?? 0);

  const picks = question.options.reduce((sum, o) => sum + countFor(o), 0);
  // Percentages are always "% of the people who answered", never "% of picks" —
  // on a checkbox question one person can tick four boxes.
  const respondents =
    activeProductId === null
      ? question.respondentCount
      : (question.respondentsByProduct[activeProductId] ?? 0);

  return (
    <div className="rounded-2xl border border-cream-200 bg-cream-050 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-ink-900">{question.questionText}</h3>
          <p className="mt-0.5 text-xs text-ink-700">
            {respondents} জন উত্তর দিয়েছেন
            {activeProductTitle ? ` • ${activeProductTitle}` : ""}
            {question.questionType === "checkbox"
              ? ` • একাধিক বেছে নেওয়া যায় (মোট ${picks}টি পছন্দ)`
              : ""}
          </p>
        </div>
        {/* The score covers every product, so it would be a lie next to a
            single-product filter. */}
        {question.health !== null && activeProductId === null ? (
          <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-medium text-plum-900">
            পজিটিভিটি {Math.round(question.health)}/100
          </span>
        ) : null}
      </div>

      {respondents === 0 ? (
        <p className="mt-4 text-sm text-ink-700">এই ফিল্টারে কোনো উত্তর নেই।</p>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {question.options.map((option) => {
            const count = countFor(option);
            const pct = respondents > 0 ? (count / respondents) * 100 : 0;
            const style = option.sentiment ? SENTIMENT_STYLES[option.sentiment] : null;
            const drillDown = new URLSearchParams({
              answerQuestion: question.questionText,
              answerOption: option.label,
            });
            if (activeProductId) drillDown.set("productId", activeProductId);

            return (
              <Link
                key={option.label}
                href={`/admin/responses?${drillDown.toString()}`}
                className="group block rounded-xl px-2 py-1.5 transition-colors hover:bg-paper"
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-ink-900 group-hover:underline">
                      {option.label}
                    </span>
                    {style ? (
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${style.chip}`}
                      >
                        {style.label}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 tabular-nums text-ink-700">
                    {count} <span className="text-xs">({Math.round(pct)}%)</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream-200">
                  <div
                    className={`h-full rounded-full transition-[width] duration-200 ${
                      style ? style.bar : NEUTRAL_BAR
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {question.isScale ? (
        <p className="mt-3 text-[11px] text-ink-700">
          পজিটিভ/নেগেটিভ ঠিক হয় অপশন লিস্টের ক্রম অনুযায়ী — সবচেয়ে ভালো অপশনটা আগে থাকতে হবে।
        </p>
      ) : null}
    </div>
  );
}
