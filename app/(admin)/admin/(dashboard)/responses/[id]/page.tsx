import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";

const GENDER_LABELS: Record<string, string> = { male: "পুরুষ", female: "মহিলা", other: "অন্যান্য" };
const RESIDENCE_LABELS: Record<string, string> = { City: "শহর", Village: "গ্রাম" };

function displayAnswer(questionType: string, answerValue: string | null): string {
  if (!answerValue) return "—";
  if (questionType === "checkbox") {
    try {
      const arr = JSON.parse(answerValue);
      return Array.isArray(arr) ? arr.join("، ") : answerValue;
    } catch {
      return answerValue;
    }
  }
  if (questionType === "price_opinion") return `৳ ${answerValue}`;
  return answerValue;
}

export default async function ResponseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const response = await prisma.response.findUnique({
    where: { id },
    include: {
      customer: true,
      product: true,
      answers: { include: { productQuestion: true } },
    },
  });
  if (!response) notFound();

  const sortedAnswers = [...response.answers].sort(
    (a, b) => a.productQuestion.displayOrder - b.productQuestion.displayOrder,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-900">রেসপন্স বিস্তারিত</h1>
        <Link
          href="/admin/responses"
          className="rounded-full border border-cream-200 px-4 py-2 text-sm font-medium text-ink-700 hover:border-plum-700"
        >
          ← তালিকায় ফিরুন
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-cream-200 bg-cream-050 p-5 sm:grid-cols-2">
        <Info label="নাম" value={response.customer.fullName} />
        <Info label="প্রোডাক্ট" value={response.product.title} />
        <Info label="জেলা" value={response.customer.district} />
        <Info
          label="শহর/গ্রাম"
          value={RESIDENCE_LABELS[response.customer.residenceType] ?? response.customer.residenceType}
        />
        <Info label="বয়স" value={String(response.customer.age)} />
        <Info label="লিঙ্গ" value={GENDER_LABELS[response.customer.gender] ?? response.customer.gender} />
        <Info label="পেশা" value={response.customer.profession} />
        <Info label="মোবাইল" value={response.customer.mobileNumber ?? "—"} />
        <Info
          label="সম্পন্ন হয়েছে"
          value={response.completedAt ? new Date(response.completedAt).toLocaleString("bn-BD") : "—"}
        />
      </div>

      {response.customOpinion ? (
        <div className="rounded-2xl border border-taupe-400/50 bg-taupe-400/10 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-taupe-600">
            কাস্টমারের নিজস্ব মতামত
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-900">
            {response.customOpinion}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {sortedAnswers.map((a) => {
          const image = a.productQuestion.questionImage ?? response.product.image;
          return (
            <div key={a.id} className="rounded-2xl border border-cream-200 bg-cream-050 p-4">
              <div className="flex items-start gap-4">
                {image ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <Image src={image} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                ) : null}
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">{a.productQuestion.questionText}</p>
                  <p className="mt-1 text-sm text-ink-700">
                    {displayAnswer(a.productQuestion.questionType, a.answerValue)}
                  </p>
                  {a.rating ? (
                    <p className="mt-1 text-xs text-taupe-600">{"★".repeat(a.rating)}</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-700">{label}</p>
      <p className="text-sm font-medium text-ink-900">{value}</p>
    </div>
  );
}
