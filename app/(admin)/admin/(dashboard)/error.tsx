"use client";

import { useEffect } from "react";

export default function AdminDashboardError({
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
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-cream-200 bg-cream-050 p-8">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">ডেটা লোড করা যায়নি</h2>
        <p className="mt-1 text-sm text-ink-700">
          ডেটাবেস থেকে তথ্য আনতে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-taupe-600">রেফারেন্স: {error.digest}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-plum-900 px-5 py-2 text-sm font-medium text-cream-050 hover:bg-plum-800"
      >
        আবার চেষ্টা করুন
      </button>
    </div>
  );
}
