"use client";

import { useActionState } from "react";
import { saveAnnouncement, type AnnouncementFormState } from "@/app/lib/actions/announcement";

const initialAnnouncementFormState: AnnouncementFormState = { error: null };

export function AnnouncementForm({
  initial,
}: {
  initial: { message: string; isActive: boolean };
}) {
  const [state, formAction, pending] = useActionState(
    saveAnnouncement,
    initialAnnouncementFormState,
  );

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">সংরক্ষণ হয়েছে</p>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-700">মেসেজ</span>
        <textarea
          name="message"
          rows={3}
          required
          defaultValue={initial.message}
          className="w-full rounded-xl border border-cream-200 bg-paper p-3 text-sm text-ink-900 outline-none focus:border-plum-700"
        />
      </label>

      <label className="flex items-center gap-2.5">
        <input type="checkbox" name="isActive" defaultChecked={initial.isActive} />
        <span className="text-sm text-ink-700">হোম পেজে দেখাবে (সক্রিয়)</span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 self-start rounded-full bg-plum-900 px-6 py-2.5 text-sm font-medium text-cream-050 disabled:opacity-60"
      >
        সংরক্ষণ করুন
      </button>
    </form>
  );
}
