import { ConfirmSubmitButton } from "@/app/components/ConfirmSubmitButton";
import {
  markProductQuestionCustom,
  resetProductQuestionToDefault,
} from "@/app/lib/actions/question";

const BASE = "rounded-full px-3 py-1 text-[11px] font-medium transition-colors";
const ON = "bg-plum-900 text-cream-050";
const OFF = "text-ink-700 hover:text-plum-900";

/**
 * Per-question version of the product switch: this one question either follows
 * the shared default or is the admin's own. Going back to the default replaces
 * the wording, so it asks first.
 */
export function QuestionDefaultSwitch({
  questionId,
  productId,
  questionText,
  isCustomized,
  hasTemplate,
}: {
  questionId: string;
  productId: string;
  questionText: string;
  isCustomized: boolean;
  hasTemplate: boolean;
}) {
  // A hand-added question has no default behind it — nothing to switch between.
  if (!hasTemplate) {
    return (
      <span className="rounded-full bg-plum-900/10 px-3 py-1 text-[11px] font-medium text-plum-900">
        নিজের প্রশ্ন
      </span>
    );
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-cream-200 bg-paper p-0.5">
      <form action={resetProductQuestionToDefault}>
        <input type="hidden" name="id" value={questionId} />
        <input type="hidden" name="productId" value={productId} />
        {isCustomized ? (
          <ConfirmSubmitButton
            title="প্রশ্নটি ডিফল্টে ফেরাবেন?"
            message={`"${questionText}" এর লেখা ও অপশন ডিফল্ট প্রশ্ন অনুযায়ী বদলে যাবে। এর উত্তরগুলো মুছবে না।`}
            confirmLabel="হ্যাঁ, ডিফল্ট করুন"
            className={`${BASE} ${OFF}`}
          >
            ডিফল্ট
          </ConfirmSubmitButton>
        ) : (
          <span className={`${BASE} ${ON} block`}>ডিফল্ট</span>
        )}
      </form>

      <form action={markProductQuestionCustom}>
        <input type="hidden" name="id" value={questionId} />
        <input type="hidden" name="productId" value={productId} />
        <button type="submit" className={`${BASE} ${isCustomized ? ON : OFF}`}>
          কাস্টম
        </button>
      </form>
    </div>
  );
}
