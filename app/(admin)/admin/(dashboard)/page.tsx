import Image from "next/image";
import { getInsightsData } from "@/app/lib/admin-stats";
import { DashboardCharts } from "./DashboardCharts";

export default async function AdminDashboardPage() {
  const data = await getInsightsData();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">রিসার্চ ড্যাশবোর্ড</h1>
          <p className="mt-1 text-sm text-ink-700">
            কাস্টমার প্রোডাক্ট রিসার্চ থেকে পাওয়া সামগ্রিক ইনসাইট
          </p>
        </div>
        <a
          href="/api/admin/responses/export?format=csv"
          className="flex items-center gap-2 rounded-full border border-cream-200 bg-cream-050 px-4 py-2 text-sm font-medium text-ink-700 hover:border-plum-700"
        >
          <DownloadIcon />
          CSV এক্সপোর্ট
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={<UsersIcon />}
          label="মোট রেসপন্স"
          value={String(data.totalResponsesCount)}
          hint={
            data.inProgressResponsesCount > 0
              ? `+${data.inProgressResponsesCount}টি অসম্পূর্ণ • ${data.registeredCustomersCount} জন কাস্টমার`
              : `${data.registeredCustomersCount} জন কাস্টমার`
          }
        />
        <KpiCard
          icon={<StarIcon />}
          label="গড় স্কোর"
          value={data.averageRating > 0 ? `${data.averageRating.toFixed(2)} / 5` : "—"}
          hint="সব মানদণ্ড মিলিয়ে"
        />
        <KpiCard
          icon={<ThumbIcon />}
          label="ক্রয়ের আগ্রহ"
          value={data.purchaseIntentTop ? `${Math.round(data.purchaseIntentTop.percentage)}%` : "—"}
          hint={data.purchaseIntentTop ? data.purchaseIntentTop.label : "এখনো কোনো ডেটা নেই"}
        />
        <KpiCard
          icon={<TrophyIcon />}
          label="সেরা পারফর্মার"
          value={data.topPerformer ? data.topPerformer.title : "—"}
          hint={data.topPerformer ? `গড় ★ ${data.topPerformer.avgRating.toFixed(2)}` : ""}
          valueClassName="text-base leading-tight"
        />
      </div>

      <DashboardCharts data={data} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-cream-200 bg-cream-050 p-5">
          <h3 className="text-sm font-semibold text-ink-900">প্রোডাক্ট র‍্যাঙ্কিং</h3>
          <p className="text-xs text-ink-700">গড় রেটিং অনুযায়ী সাজানো</p>

          {data.productRanking.length === 0 ? (
            <p className="mt-6 text-sm text-ink-700">এখনো কোনো ডেটা নেই</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="text-xs text-ink-700">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">প্রোডাক্ট</th>
                    <th className="pb-2 font-medium">রেসপন্স</th>
                    <th className="pb-2 font-medium">গড় রেটিং</th>
                    <th className="pb-2 font-medium">ক্রয়ের আগ্রহ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.productRanking.map((p, idx) => (
                    <tr key={p.productId} className="border-t border-cream-200">
                      <td className="py-2.5 text-ink-700">{idx + 1}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-paper">
                            {p.image ? (
                              <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />
                            ) : null}
                          </div>
                          <span className="font-medium text-ink-900">{p.title}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-ink-700">{p.responseCount}</td>
                      <td className="py-2.5 text-plum-900">★ {p.avgRating.toFixed(2)}</td>
                      <td className="py-2.5 text-ink-700">
                        {p.topPurchaseIntent ? `${Math.round(p.topPurchaseIntent.percentage)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-cream-200 bg-cream-050 p-5">
          <h3 className="text-sm font-semibold text-ink-900">সাম্প্রতিক মতামত</h3>
          <p className="text-xs text-ink-700">সাম্প্রতিক লিখিত ফিডব্যাক</p>

          {data.recentComments.length === 0 ? (
            <p className="mt-6 text-sm text-ink-700">এখনো কোনো মন্তব্য নেই</p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {data.recentComments.map((c) => (
                <div key={c.id} className="rounded-xl bg-paper p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-ink-900">{c.customerName}</span>
                    <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[10px] text-ink-700">
                      {c.productTitle}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-ink-700">&ldquo;{c.text}&rdquo;</p>
                  {c.rating ? (
                    <p className="mt-1 text-xs text-taupe-600">{"★".repeat(c.rating)}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-cream-200 bg-cream-050 p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-ink-700">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-plum-900/10 text-plum-900">
          {icon}
        </span>
      </div>
      <p className={`mt-2 font-display font-semibold text-plum-900 ${valueClassName ?? "text-2xl"}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 truncate text-xs text-ink-700">{hint}</p> : null}
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}

function ThumbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 10v12" strokeLinecap="round" />
      <path
        d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M17 5h2.5a2.5 2.5 0 0 1 0 5H17M7 5H4.5a2.5 2.5 0 0 0 0 5H7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
