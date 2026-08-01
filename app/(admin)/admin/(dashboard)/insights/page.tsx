import Image from "next/image";
import Link from "next/link";
import { getScoreboard, questionHealth, type QuestionBreakdown } from "@/app/lib/scoreboard";
import type { Sentiment } from "@/app/lib/insight-math";

const SENTIMENT_STYLES: Record<Sentiment, { bar: string; chip: string; label: string }> = {
  positive: { bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700", label: "পজিটিভ" },
  neutral: { bar: "bg-amber-400", chip: "bg-amber-50 text-amber-700", label: "নিউট্রাল" },
  negative: { bar: "bg-rose-500", chip: "bg-rose-50 text-rose-700", label: "নেগেটিভ" },
};

const NEUTRAL_BAR = "bg-plum-700";
/** Below this many responses a product's score is noise, and says so. */
const LOW_SAMPLE = 5;

function formatPrice(value: number | null) {
  if (value === null) return "—";
  return `৳${Math.round(value).toLocaleString("bn-BD")}`;
}

export default async function AdminInsightsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const productParam = Array.isArray(raw.productId) ? raw.productId[0] : raw.productId;
  const data = await getScoreboard();
  // Guard against a stale bookmark pointing at a product that no longer exists.
  const activeProductId =
    productParam && data.products.some((p) => p.productId === productParam) ? productParam : null;
  const activeProduct = data.products.find((p) => p.productId === activeProductId) ?? null;

  const hiddenGems = data.conflicts.filter((c) => c.kind === "hidden_gem");
  const politePraise = data.conflicts.filter((c) => c.kind === "polite_praise");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Winner Insights</h1>
        <p className="mt-1 text-sm text-ink-700">
          রেটিং, ক্রয়ের আগ্রহ আর দাম — তিনটা সিগন্যাল একসাথে দেখে কোন প্রোডাক্ট আসলে জিতছে
        </p>
      </div>

      {data.totalResponses === 0 ? (
        <div className="rounded-2xl border border-cream-200 bg-cream-050 p-8 text-center text-sm text-ink-700">
          এখনো কোনো সম্পন্ন রেসপন্স নেই। ডেটা আসা শুরু হলে এই পেজ নিজে থেকেই ভরে উঠবে।
        </div>
      ) : (
        <>
          <WinnerBoard data={data} />
          <ConflictSection hiddenGems={hiddenGems} politePraise={politePraise} />
          <QuestionSection
            questions={data.questions}
            products={data.products}
            activeProductId={activeProductId}
            activeProductTitle={activeProduct?.title ?? null}
          />
        </>
      )}
    </div>
  );
}

function WinnerBoard({ data }: { data: Awaited<ReturnType<typeof getScoreboard>> }) {
  return (
    <section className="rounded-2xl border border-cream-200 bg-cream-050 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink-900">উইনার বোর্ড</h2>
        <p className="text-xs text-ink-700">
          স্কোর = অর্ধেক রেটিং + অর্ধেক ক্রয়ের আগ্রহ, কম রেসপন্স হলে গড়ের দিকে টানা
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="text-xs text-ink-700">
              <th className="pb-2 font-medium">#</th>
              <th className="pb-2 font-medium">প্রোডাক্ট</th>
              <th className="pb-2 font-medium">স্কোর</th>
              <th className="pb-2 font-medium">রেসপন্স</th>
              <th className="pb-2 font-medium">রেটিং</th>
              <th className="pb-2 font-medium">অবশ্যই/সম্ভবত কিনব</th>
              <th className="pb-2 font-medium">দাম (মিডিয়ান)</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((p, idx) => (
              <tr key={p.productId} className="border-t border-cream-200 align-middle">
                <td className="py-3 text-ink-700">{idx + 1}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-paper">
                      {p.image ? (
                        <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />
                      ) : null}
                    </div>
                    <span className="font-medium text-ink-900">{p.title}</span>
                  </div>
                </td>
                <td className="py-3">
                  <span className="rounded-full bg-plum-900 px-2.5 py-1 font-display text-xs font-semibold text-cream-050">
                    {p.winnerScore === null ? "—" : Math.round(p.winnerScore)}
                  </span>
                </td>
                <td className="py-3 text-ink-700">
                  {p.responseCount}
                  {p.responseCount < LOW_SAMPLE ? (
                    <span
                      className="ml-1.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
                      title={`${LOW_SAMPLE}টির কম রেসপন্স — স্কোর এখনো ভরসাযোগ্য নয়`}
                    >
                      কম ডেটা
                    </span>
                  ) : null}
                </td>
                <td className="py-3 text-ink-700">
                  {p.avgRating === null ? (
                    "—"
                  ) : (
                    <>
                      <span className="text-plum-900">★ {p.avgRating.toFixed(2)}</span>
                      <span className="ml-1 text-xs text-ink-700">({p.ratingCount})</span>
                    </>
                  )}
                </td>
                <td className="py-3 text-ink-700">
                  {p.intentTop2Pct === null ? "—" : `${Math.round(p.intentTop2Pct)}%`}
                </td>
                <td className="py-3 text-ink-700">
                  {formatPrice(p.medianPrice)}
                  {p.priceP25 !== null && p.priceP75 !== null && p.priceCount > 2 ? (
                    <span className="ml-1 text-xs text-ink-700">
                      ({formatPrice(p.priceP25)}–{formatPrice(p.priceP75)})
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 rounded-xl bg-paper p-3 text-xs leading-relaxed text-ink-700">
        <strong className="text-ink-900">কেন শুধু রেটিং দিয়ে র‍্যাঙ্ক করা হয় না:</strong> মানুষ
        ভদ্রতা করে ৪–৫ স্টার দেয়, তাই সব প্রোডাক্টের রেটিং কাছাকাছি চলে আসে। &ldquo;কিনব কিনা&rdquo;
        প্রশ্নটা টাকার সবচেয়ে কাছের সিগন্যাল, আর দামের মিডিয়ান বলে দেয় মার্জিন কতটা থাকবে।
        মাত্র ২–৩টা রেসপন্স পাওয়া প্রোডাক্ট যেন ৫ স্টার নিয়ে উপরে উঠে না যায়, সেজন্য স্কোর
        সামগ্রিক গড়ের দিকে টেনে ধরা হয়।
      </p>
    </section>
  );
}

function ConflictSection({
  hiddenGems,
  politePraise,
}: {
  hiddenGems: Awaited<ReturnType<typeof getScoreboard>>["conflicts"];
  politePraise: Awaited<ReturnType<typeof getScoreboard>>["conflicts"];
}) {
  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <ConflictCard
        title="রেটিং কম, তবু কিনবে"
        subtitle="স্টার কম কিন্তু ক্রয়ের আগ্রহ পজিটিভ — এখানেই স্কোরটা কম বলছে"
        tone="gem"
        items={hiddenGems}
        emptyText="এমন কোনো রেসপন্স এখনো নেই।"
      />
      <ConflictCard
        title="রেটিং বেশি, তবু কিনবে না"
        subtitle="স্টার বেশি কিন্তু ক্রয়ের আগ্রহ নেগেটিভ — প্রশংসা আছে, চাহিদা নেই"
        tone="polite"
        items={politePraise}
        emptyText="এমন কোনো রেসপন্স এখনো নেই।"
      />
    </section>
  );
}

function ConflictCard({
  title,
  subtitle,
  tone,
  items,
  emptyText,
}: {
  title: string;
  subtitle: string;
  tone: "gem" | "polite";
  items: Awaited<ReturnType<typeof getScoreboard>>["conflicts"];
  emptyText: string;
}) {
  const accent = tone === "gem" ? "text-emerald-700" : "text-rose-600";
  return (
    <div className="rounded-2xl border border-cream-200 bg-cream-050 p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className={`text-sm font-semibold ${accent}`}>{title}</h2>
        <span className="rounded-full bg-paper px-2 py-0.5 text-xs text-ink-700">{items.length}</span>
      </div>
      <p className="mt-0.5 text-xs text-ink-700">{subtitle}</p>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-ink-700">{emptyText}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {items.slice(0, 6).map((c) => (
            <Link
              key={c.responseId}
              href={`/admin/responses/${c.responseId}`}
              className="block rounded-xl bg-paper p-3.5 transition-colors hover:bg-cream-200/60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink-900">{c.customerName}</span>
                <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[10px] text-ink-700">
                  {c.productTitle}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-ink-700">
                <span className="text-taupe-600">{"★".repeat(c.rating ?? 0)}</span>
                {c.intentLabel ? <span className="ml-2">→ {c.intentLabel}</span> : null}
                {c.price !== null ? <span className="ml-2">• {formatPrice(c.price)}</span> : null}
              </p>
              {c.comment ? (
                <p className="mt-1 line-clamp-2 text-sm text-ink-700">&ldquo;{c.comment}&rdquo;</p>
              ) : null}
            </Link>
          ))}
          {items.length > 6 ? (
            <p className="text-xs text-ink-700">আরও {items.length - 6}টি — রেসপন্স তালিকায় দেখুন</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function QuestionSection({
  questions,
  products,
  activeProductId,
  activeProductTitle,
}: {
  questions: QuestionBreakdown[];
  products: Awaited<ReturnType<typeof getScoreboard>>["products"];
  activeProductId: string | null;
  activeProductTitle: string | null;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-ink-900">প্রশ্ন ধরে ধরে ফিডব্যাক</h2>
          <p className="mt-0.5 text-xs text-ink-700">
            যেকোনো অপশনে ক্লিক করলে ঠিক সেই উত্তর দেওয়া রেসপন্সগুলোর তালিকা খুলবে
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <ProductChip href="/admin/insights" label="সব প্রোডাক্ট" active={activeProductId === null} />
        {products.map((p) => (
          <ProductChip
            key={p.productId}
            href={`/admin/insights?productId=${encodeURIComponent(p.productId)}`}
            label={p.title}
            active={activeProductId === p.productId}
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

function ProductChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-plum-900 text-cream-050"
          : "border border-cream-200 bg-cream-050 text-ink-700 hover:border-plum-700"
      }`}
    >
      {label}
    </Link>
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
  const health = activeProductId === null ? questionHealth(question) : null;

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
        {health !== null ? (
          <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-medium text-plum-900">
            পজিটিভিটি {Math.round(health)}/100
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
                    className={`h-full rounded-full ${style ? style.bar : NEUTRAL_BAR}`}
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
