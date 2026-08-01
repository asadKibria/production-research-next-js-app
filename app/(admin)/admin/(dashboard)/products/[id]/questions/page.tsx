import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { deleteProductQuestion } from "@/app/lib/actions/question";
import { ConfirmSubmitButton } from "@/app/components/ConfirmSubmitButton";

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "মাল্টিপল চয়েস",
  checkbox: "চেকবক্স",
  text: "টেক্সট",
  rating: "রেটিং",
  price_opinion: "মূল্য মতামত",
  purchase_intent: "ক্রয়ের আগ্রহ",
};

export default async function ProductQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { questions: { orderBy: { displayOrder: "asc" } } },
  });
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">প্রশ্ন ম্যানেজ করুন</h1>
          <p className="mt-1 text-sm text-ink-700">{product.title}</p>
        </div>
        <Link
          href={`/admin/products/${product.id}/questions/new`}
          className="rounded-full bg-plum-900 px-5 py-2.5 text-sm font-medium text-cream-050 hover:bg-plum-800"
        >
          + নতুন প্রশ্ন
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {product.questions.map((q, idx) => (
          <div
            key={q.id}
            className="flex items-center gap-4 rounded-2xl border border-cream-200 bg-cream-050 p-4"
          >
            <span className="text-sm text-ink-700">{idx + 1}.</span>

            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-paper">
              {q.questionImage ?? product.image ? (
                <Image
                  src={(q.questionImage ?? product.image) as string}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : null}
              {!q.questionImage ? (
                <span className="absolute inset-x-0 bottom-0 bg-ink-900/60 py-0.5 text-center text-[9px] leading-none text-cream-050">
                  ডিফল্ট
                </span>
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink-900">{q.questionText}</p>
              <p className="text-xs text-ink-700">
                {TYPE_LABELS[q.questionType] ?? q.questionType}
                {q.questionImage ? " · নিজস্ব ছবি" : ""}
              </p>
            </div>
            <Link
              href={`/admin/products/${product.id}/questions/${q.id}/edit`}
              className="rounded-full border border-cream-200 px-4 py-1.5 text-xs font-medium text-ink-700 hover:border-plum-700"
            >
              এডিট
            </Link>
            <form action={deleteProductQuestion}>
              <input type="hidden" name="id" value={q.id} />
              <input type="hidden" name="productId" value={product.id} />
              <ConfirmSubmitButton
                title="প্রশ্নটি মুছে ফেলবেন?"
                message={`"${q.questionText}" প্রশ্নটি এবং এর সব উত্তর স্থায়ীভাবে মুছে যাবে। এটি ফিরিয়ে আনা যাবে না।`}
                className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                মুছুন
              </ConfirmSubmitButton>
            </form>
          </div>
        ))}
        {product.questions.length === 0 ? (
          <p className="text-sm text-ink-700">কোনো প্রশ্ন নেই।</p>
        ) : null}
      </div>
    </div>
  );
}
