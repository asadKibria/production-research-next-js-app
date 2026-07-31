"use client";

import { useActionState, useState } from "react";
import { ImageUploadField } from "@/app/components/ImageUploadField";
import type { QuestionFormState } from "@/app/lib/actions/question";
import { getChoiceOptions, getPriceOpinionRange } from "@/app/lib/question-options";

type Action = (state: QuestionFormState, formData: FormData) => Promise<QuestionFormState>;

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "মাল্টিপল চয়েস",
  checkbox: "চেকবক্স",
  text: "টেক্সট",
  rating: "রেটিং",
  price_opinion: "মূল্য মতামত",
  purchase_intent: "ক্রয়ের আগ্রহ",
};

export function QuestionForm({
  action,
  initial,
  showImageUpload,
  submitLabel,
}: {
  action: Action;
  initial?: {
    questionText: string;
    questionType: string;
    displayOrder: number;
    optionsRaw: string | null;
    questionImage?: string | null;
  };
  showImageUpload: boolean;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null, fieldErrors: {} });
  const [type, setType] = useState(initial?.questionType ?? "multiple_choice");

  const initialOptionsText =
    initial && ["multiple_choice", "checkbox", "purchase_intent"].includes(initial.questionType)
      ? getChoiceOptions(initial.questionType, initial.optionsRaw).join("\n")
      : "";
  const initialPrice =
    initial && initial.questionType === "price_opinion"
      ? getPriceOpinionRange(initial.optionsRaw)
      : { min: 0, max: 5000, step: 50 };

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <Field label="প্রশ্ন">
        <input
          name="questionText"
          type="text"
          required
          defaultValue={initial?.questionText}
          className="input"
        />
      </Field>

      <Field label="ধরন">
        <select
          name="questionType"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input"
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      {["multiple_choice", "checkbox", "purchase_intent"].includes(type) ? (
        <Field label="অপশনসমূহ (একটি লাইনে একটি)">
          <textarea
            name="optionsText"
            rows={4}
            defaultValue={initialOptionsText}
            placeholder={type === "purchase_intent" ? "খালি রাখলে ডিফল্ট ৫-পয়েন্ট স্কেল ব্যবহার হবে" : ""}
            className="input"
          />
        </Field>
      ) : null}

      {type === "price_opinion" ? (
        <div className="grid grid-cols-3 gap-3">
          <Field label="সর্বনিম্ন">
            <input name="priceMin" type="number" defaultValue={initialPrice.min} className="input" />
          </Field>
          <Field label="সর্বোচ্চ">
            <input name="priceMax" type="number" defaultValue={initialPrice.max} className="input" />
          </Field>
          <Field label="ধাপ">
            <input name="priceStep" type="number" defaultValue={initialPrice.step} className="input" />
          </Field>
        </div>
      ) : null}

      <Field label="ক্রম (Display Order)">
        <input name="displayOrder" type="number" defaultValue={initial?.displayOrder ?? 0} className="input" />
      </Field>

      {showImageUpload ? (
        <Field label="প্রশ্নের ছবি (ঐচ্ছিক, না দিলে প্রোডাক্টের মূল ছবি দেখাবে)">
          <ImageUploadField
            name="questionImage"
            currentImage={initial?.questionImage}
            previewClassName="h-20 w-32"
          />
        </Field>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 self-start rounded-full bg-plum-900 px-6 py-2.5 text-sm font-medium text-cream-050 disabled:opacity-60"
      >
        {submitLabel}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--color-cream-200);
          background: var(--color-paper);
          padding: 0.6rem 0.9rem;
          font-size: 0.9rem;
          color: var(--color-ink-900);
          outline: none;
        }
        .input:focus {
          border-color: var(--color-plum-700);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      {children}
    </label>
  );
}
