import { ConfirmSubmitButton } from "@/app/components/ConfirmSubmitButton";
import { setProductQuestionSource } from "@/app/lib/actions/question";

/**
 * Picks where a product's questions come from: the shared default questions, or
 * its own custom list.
 *
 * Switching to custom is free — the current questions simply stop following the
 * defaults. Switching back to defaults rewrites the list, so it is confirmed
 * first.
 */
export function QuestionSourceSwitch({
  productId,
  source,
  className = "",
}: {
  productId: string;
  source: "defaults" | "custom";
  className?: string;
}) {
  const base = "rounded-full px-3 py-1 text-[11px] font-medium transition-colors";
  const on = "bg-plum-900 text-cream-050";
  const off = "text-ink-700 hover:text-plum-900";

  return (
    <div
      className={`flex items-center gap-0.5 rounded-full border border-cream-200 bg-paper p-0.5 ${className}`}
    >
      <form action={setProductQuestionSource.bind(null, productId, "defaults")}>
        {source === "defaults" ? (
          <span className={`${base} ${on} block`}>ডিফল্ট প্রশ্ন</span>
        ) : (
          <ConfirmSubmitButton
            title="ডিফল্ট প্রশ্নে ফিরে যাবেন?"
            message="এই প্রোডাক্টের প্রশ্নগুলো ডিফল্ট প্রশ্ন দিয়ে বদলে যাবে — কাস্টম করা লেখা ও অপশন থাকবে না। যেসব প্রশ্নে ইতিমধ্যে উত্তর এসেছে, সেগুলো মুছবে না।"
            confirmLabel="হ্যাঁ, ডিফল্ট করুন"
            className={`${base} ${off}`}
          >
            ডিফল্ট প্রশ্ন
          </ConfirmSubmitButton>
        )}
      </form>

      <form action={setProductQuestionSource.bind(null, productId, "custom")}>
        <button type="submit" className={`${base} ${source === "custom" ? on : off}`}>
          কাস্টম
        </button>
      </form>
    </div>
  );
}
