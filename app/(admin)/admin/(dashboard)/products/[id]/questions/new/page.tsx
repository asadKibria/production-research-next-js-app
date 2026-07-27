import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { createProductQuestion } from "@/app/lib/actions/question";
import { QuestionForm } from "@/app/components/QuestionForm";

export default async function NewProductQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const boundAction = createProductQuestion.bind(null, product.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900">নতুন প্রশ্ন — {product.title}</h1>
      <QuestionForm action={boundAction} showImageUpload submitLabel="তৈরি করুন" />
    </div>
  );
}
