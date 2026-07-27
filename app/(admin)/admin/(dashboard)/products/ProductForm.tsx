"use client";

import { useActionState } from "react";
import Image from "next/image";
import type { ProductFormState } from "@/app/lib/actions/product";

type Action = (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;

export function ProductForm({
  action,
  initial,
  submitLabel,
}: {
  action: Action;
  initial?: {
    title: string;
    description: string | null;
    isActive: boolean;
    displayOrder: number;
    image: string | null;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null, fieldErrors: {} });

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <Field label="শিরোনাম" error={state.fieldErrors.title}>
        <input
          name="title"
          type="text"
          required
          defaultValue={initial?.title}
          className="input"
        />
      </Field>

      <Field label="বিবরণ" error={state.fieldErrors.description}>
        <textarea name="description" rows={3} defaultValue={initial?.description ?? ""} className="input" />
      </Field>

      <Field label="ক্রম (Display Order)" error={state.fieldErrors.displayOrder}>
        <input
          name="displayOrder"
          type="number"
          defaultValue={initial?.displayOrder ?? 0}
          className="input"
        />
      </Field>

      <label className="flex items-center gap-2.5">
        <input type="checkbox" name="isActive" defaultChecked={initial?.isActive ?? true} />
        <span className="text-sm text-ink-700">সক্রিয় (হোম পেজে দেখাবে)</span>
      </label>

      <Field label="ছবি" error={undefined}>
        {initial?.image ? (
          <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-xl">
            <Image src={initial.image} alt="" fill sizes="96px" className="object-cover" />
          </div>
        ) : null}
        <input name="image" type="file" accept="image/*" className="text-sm text-ink-700" />
      </Field>

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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
