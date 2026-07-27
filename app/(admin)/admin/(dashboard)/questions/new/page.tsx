import { createQuestionTemplate } from "@/app/lib/actions/question";
import { QuestionForm } from "@/app/components/QuestionForm";

export default function NewQuestionTemplatePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900">নতুন ডিফল্ট প্রশ্ন</h1>
      <QuestionForm action={createQuestionTemplate} showImageUpload={false} submitLabel="তৈরি করুন" />
    </div>
  );
}
