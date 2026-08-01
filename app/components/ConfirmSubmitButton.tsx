"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Submit button that makes the user confirm first.
 *
 * Wraps the surrounding `<form>`'s submission: clicking opens a dialog, and the
 * form is only submitted after an explicit confirmation. Used for every
 * destructive admin action, since deletes cascade and cannot be undone.
 */
export function ConfirmSubmitButton({
  children,
  className,
  title,
  message,
  confirmLabel = "হ্যাঁ, মুছে ফেলুন",
  cancelLabel = "বাতিল",
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function confirm() {
    setOpen(false);
    // Submit the real form the button lives in.
    buttonRef.current?.form?.requestSubmit();
  }

  return (
    <>
      {/*
        Deliberately type="button", not a submit that preventDefaults: before
        hydration (or if the JS fails to load) a submit button would post the
        form and delete without ever showing the warning.
      */}
      <button
        ref={buttonRef}
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        className={className}
      >
        {pending ? "…" : children}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
        >
          <button
            type="button"
            aria-label={cancelLabel}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-[2px]"
          />

          <div className="relative w-full max-w-sm rounded-3xl border border-cream-200 bg-paper p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
                <path
                  d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-ink-900">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{message}</p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-cream-200 px-5 py-2.5 text-sm font-medium text-ink-700 hover:border-plum-700"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={confirm}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
