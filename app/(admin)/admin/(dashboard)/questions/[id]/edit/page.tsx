import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { updateQuestionTemplate } from "@/app/lib/actions/question";
import { QuestionForm } from "@/app/components/QuestionForm";

export default async function EditQuestionTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await prisma.questionTemplate.findUnique({ where: { id } });
  if (!template) notFound();

  const boundAction = updateQuestionTemplate.bind(null, template.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900">ডিফল্ট প্রশ্ন এডিট করুন</h1>
      <QuestionForm
        action={boundAction}
        initial={{
          questionText: template.questionText,
          questionType: template.questionType,
          displayOrder: template.displayOrder,
          optionsRaw: template.options,
        }}
        showImageUpload={false}
        submitLabel="সংরক্ষণ করুন"
      />
    </div>
  );
}
