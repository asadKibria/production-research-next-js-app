import Image from "next/image";
import Link from "next/link";
import { getScoreboard } from "@/app/lib/scoreboard";
import { QuestionExplorer } from "./QuestionExplorer";

/** Below this many responses a product's score is noise, and says so. */
const LOW_SAMPLE = 5;

function formatPrice(value: number | null) {
  if (value === null) return "—";
  return `৳${Math.round(value).toLocaleString("bn-BD")}`;
}

export default async function AdminInsightsPage() {
  const data = await getScoreboard();

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
          <QuestionExplorer
            questions={data.questions}
            products={data.products.map((p) => ({ productId: p.productId, title: p.title }))}
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
