import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { updateProductQuestion } from "@/app/lib/actions/question";
import { QuestionForm } from "@/app/components/QuestionForm";

export default async function EditProductQuestionPage({
  params,
}: {
  params: Promise<{ id: string; qid: string }>;
}) {
  const { id, qid } = await params;
  const [product, question] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.productQuestion.findUnique({ where: { id: qid } }),
  ]);
  if (!product || !question || question.productId !== product.id) notFound();

  const boundAction = updateProductQuestion.bind(null, question.id, product.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900">প্রশ্ন এডিট করুন — {product.title}</h1>
      <QuestionForm
        action={boundAction}
        initial={{
          questionText: question.questionText,
          questionType: question.questionType,
          displayOrder: question.displayOrder,
          optionsRaw: question.options,
          questionImage: question.questionImage,
        }}
        showImageUpload
        submitLabel="সংরক্ষণ করুন"
      />
    </div>
  );
}
