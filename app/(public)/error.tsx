"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <h2 className="font-display text-2xl font-semibold text-plum-900">কিছু একটা ভুল হয়েছে</h2>
      <p className="max-w-md text-sm text-ink-700">
        দুঃখিত, পেজটি লোড করতে সমস্যা হয়েছে। আপনার দেওয়া উত্তরগুলো সংরক্ষিত আছে — আবার চেষ্টা করুন।
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-plum-900 px-6 py-2.5 text-sm font-medium text-cream-050 hover:bg-plum-800"
        >
          আবার চেষ্টা করুন
        </button>
        <Link
          href="/"
          className="rounded-full border border-cream-200 px-6 py-2.5 text-sm font-medium text-ink-700 hover:border-plum-700"
        >
          হোমে ফিরে যান
        </Link>
      </div>
    </div>
  );
}
