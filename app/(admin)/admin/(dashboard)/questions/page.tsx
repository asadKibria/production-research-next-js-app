import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { deleteQuestionTemplate } from "@/app/lib/actions/question";
import { ConfirmSubmitButton } from "@/app/components/ConfirmSubmitButton";

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "মাল্টিপল চয়েস",
  checkbox: "চেকবক্স",
  text: "টেক্সট",
  rating: "রেটিং",
  price_opinion: "মূল্য মতামত",
  purchase_intent: "ক্রয়ের আগ্রহ",
};

export default async function QuestionTemplatesPage() {
  const templates = await prisma.questionTemplate.findMany({ orderBy: { displayOrder: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">ডিফল্ট প্রশ্ন সেট</h1>
          <p className="mt-1 text-sm text-ink-700">
            নতুন প্রোডাক্ট তৈরি হলে এই প্রশ্নগুলো স্বয়ংক্রিয়ভাবে কপি হয়ে যাবে
          </p>
        </div>
        <Link
          href="/admin/questions/new"
          className="rounded-full bg-plum-900 px-5 py-2.5 text-sm font-medium text-cream-050 hover:bg-plum-800"
        >
          + নতুন প্রশ্ন
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {templates.map((q, idx) => (
          <div
            key={q.id}
            className="flex items-center gap-4 rounded-2xl border border-cream-200 bg-cream-050 p-4"
          >
            <span className="text-sm text-ink-700">{idx + 1}.</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-ink-900">{q.questionText}</p>
              <p className="text-xs text-ink-700">{TYPE_LABELS[q.questionType] ?? q.questionType}</p>
            </div>
            <Link
              href={`/admin/questions/${q.id}/edit`}
              className="rounded-full border border-cream-200 px-4 py-1.5 text-xs font-medium text-ink-700 hover:border-plum-700"
            >
              এডিট
            </Link>
            <form action={deleteQuestionTemplate}>
              <input type="hidden" name="id" value={q.id} />
              <ConfirmSubmitButton
                title="ডিফল্ট প্রশ্নটি মুছে ফেলবেন?"
                message={`"${q.questionText}" টেমপ্লেটটি মুছে যাবে। আগে তৈরি হওয়া প্রোডাক্টের প্রশ্নগুলো অক্ষত থাকবে, তবে নতুন প্রোডাক্টে এটি আর যোগ হবে না।`}
                className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                মুছুন
              </ConfirmSubmitButton>
            </form>
          </div>
        ))}
        {templates.length === 0 ? <p className="text-sm text-ink-700">কোনো ডিফল্ট প্রশ্ন নেই।</p> : null}
      </div>
    </div>
  );
}
