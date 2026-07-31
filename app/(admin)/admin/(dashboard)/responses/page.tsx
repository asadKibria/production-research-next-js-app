import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { responseFilterSchema } from "@/app/lib/validation";
import { queryResponses } from "@/app/lib/response-query";
import { deleteResponseAdmin } from "@/app/lib/actions/response";
import { ResponseFilterForm } from "./ResponseFilterForm";

const GENDER_LABELS: Record<string, string> = { male: "পুরুষ", female: "মহিলা", other: "অন্যান্য" };
const RESIDENCE_LABELS: Record<string, string> = { City: "শহর", Village: "গ্রাম" };

function buildQueryString(params: Record<string, string | undefined>, overrides: Record<string, string>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...overrides })) {
    if (value) search.set(key, value);
  }
  return search.toString();
}

export default async function AdminResponsesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }

  const parsed = responseFilterSchema.safeParse(flat);
  const filters = parsed.success ? parsed.data : { page: 1 };

  const [products, result] = await Promise.all([
    prisma.product.findMany({ orderBy: { displayOrder: "asc" }, select: { id: true, title: true } }),
    queryResponses(filters),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const exportQuery = buildQueryString(flat, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">রেসপন্স তালিকা</h1>
          <p className="mt-1 text-sm text-ink-700">মোট {result.total}টি রেসপন্স পাওয়া গেছে</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/admin/responses/export?${exportQuery}&format=csv`}
            className="rounded-full border border-cream-200 px-4 py-2 text-sm font-medium text-ink-700 hover:border-plum-700"
          >
            CSV এক্সপোর্ট
          </a>
          <a
            href={`/api/admin/responses/export?${exportQuery}&format=xlsx`}
            className="rounded-full border border-cream-200 px-4 py-2 text-sm font-medium text-ink-700 hover:border-plum-700"
          >
            Excel এক্সপোর্ট
          </a>
        </div>
      </div>

      <ResponseFilterForm products={products} initial={flat} />

      <div className="overflow-x-auto rounded-2xl border border-cream-200">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-cream-050 text-ink-700">
            <tr>
              <th className="px-4 py-3">নাম</th>
              <th className="px-4 py-3">প্রোডাক্ট</th>
              <th className="px-4 py-3">জেলা</th>
              <th className="px-4 py-3">শহর/গ্রাম</th>
              <th className="px-4 py-3">বয়স</th>
              <th className="px-4 py-3">লিঙ্গ</th>
              <th className="px-4 py-3">পেশা</th>
              <th className="px-4 py-3">গড় রেটিং</th>
              <th className="px-4 py-3">অবস্থা</th>
              <th className="px-4 py-3">সম্পন্ন</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {result.items.map(({ response, avgRating }) => (
              <tr key={response.id} className="border-t border-cream-200">
                <td className="px-4 py-3 text-ink-900">{response.customer.fullName}</td>
                <td className="px-4 py-3 text-ink-700">{response.product.title}</td>
                <td className="px-4 py-3 text-ink-700">{response.customer.district}</td>
                <td className="px-4 py-3 text-ink-700">
                  {RESIDENCE_LABELS[response.customer.residenceType] ?? response.customer.residenceType}
                </td>
                <td className="px-4 py-3 text-ink-700">{response.customer.age}</td>
                <td className="px-4 py-3 text-ink-700">
                  {GENDER_LABELS[response.customer.gender] ?? response.customer.gender}
                </td>
                <td className="px-4 py-3 text-ink-700">{response.customer.profession}</td>
                <td className="px-4 py-3 text-ink-700">{avgRating ? avgRating.toFixed(2) : "—"}</td>
                <td className="px-4 py-3">
                  {response.status === "completed" ? (
                    <span className="whitespace-nowrap rounded-full bg-plum-900/10 px-2.5 py-1 text-xs font-medium text-plum-900">
                      সম্পন্ন
                    </span>
                  ) : (
                    <span className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                      অসম্পূর্ণ
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-700">
                  {response.completedAt ? new Date(response.completedAt).toLocaleDateString("bn-BD") : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/responses/${response.id}`}
                      className="rounded-full border border-cream-200 px-3 py-1 text-xs font-medium text-ink-700 hover:border-plum-700"
                    >
                      দেখুন
                    </Link>
                    <form action={deleteResponseAdmin}>
                      <input type="hidden" name="responseId" value={response.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        মুছুন
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {result.items.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-sm text-ink-700">
                  কোনো রেসপন্স পাওয়া যায়নি
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/responses?${buildQueryString(flat, { page: String(p) })}`}
              className={`rounded-full px-3 py-1.5 text-sm ${
                p === result.page ? "bg-plum-900 text-cream-050" : "border border-cream-200 text-ink-700"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
