"use client";

import Image from "next/image";
import Link from "next/link";
import { Reorder, useDragControls } from "framer-motion";
import { useState, useTransition } from "react";
import { ConfirmSubmitButton } from "@/app/components/ConfirmSubmitButton";
import { deleteProduct, reorderProducts, toggleProductActive } from "@/app/lib/actions/product";
import { QuestionSourceSwitch } from "./QuestionSourceSwitch";

export type AdminProduct = {
  id: string;
  title: string;
  image: string | null;
  isActive: boolean;
  displayOrder: number;
  questionSource: "defaults" | "custom";
  questionCount: number;
  responseCount: number;
};

export function ProductList({ products }: { products: AdminProduct[] }) {
  const [items, setItems] = useState(products);
  const [dirty, setDirty] = useState(false);
  const [saving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

  // Adopt fresh server data unless the admin has unsaved drag changes.
  // (React's "adjusting state when props change" pattern — done during render
  // rather than in an effect so there is no extra commit.)
  const [lastServerProducts, setLastServerProducts] = useState(products);
  if (products !== lastServerProducts) {
    setLastServerProducts(products);
    if (!dirty) setItems(products);
  }

  function save() {
    const ids = items.map((p) => p.id);
    startSaving(async () => {
      await reorderProducts(ids);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  function reset() {
    setItems(products);
    setDirty(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {dirty ? (
        <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-taupe-400/50 bg-taupe-400/15 px-4 py-3 backdrop-blur lg:top-2">
          <p className="text-sm font-medium text-ink-900">ক্রম বদলানো হয়েছে — সংরক্ষণ করুন</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={saving}
              className="rounded-full border border-cream-200 bg-paper px-4 py-1.5 text-xs font-medium text-ink-700 disabled:opacity-50"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-full bg-plum-900 px-5 py-1.5 text-xs font-medium text-cream-050 disabled:opacity-60"
            >
              {saving ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      ) : null}

      {saved ? (
        <p className="rounded-2xl bg-plum-900/10 px-4 py-2.5 text-sm font-medium text-plum-900">
          ✓ নতুন ক্রম সংরক্ষিত হয়েছে
        </p>
      ) : null}

      <Reorder.Group
        axis="y"
        values={items}
        onReorder={(next) => {
          setItems(next);
          setDirty(true);
        }}
        className="flex list-none flex-col gap-3"
      >
        {items.map((p, idx) => (
          <ProductRow key={p.id} product={p} position={idx + 1} />
        ))}
      </Reorder.Group>

      {items.length === 0 ? <p className="text-sm text-ink-700">কোনো প্রোডাক্ট নেই।</p> : null}
    </div>
  );
}

function ProductRow({ product: p, position }: { product: AdminProduct; position: number }) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={p}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.02, boxShadow: "0 18px 40px -12px rgba(34,26,29,0.35)", zIndex: 40 }}
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-cream-200 bg-cream-050 p-3 sm:flex-nowrap sm:gap-4 sm:p-4"
    >
      {/* Drag handle — dragging is deliberately opt-in so the row's buttons stay tappable */}
      <button
        type="button"
        aria-label={`${p.title} — ক্রম বদলাতে টেনে ধরুন`}
        onPointerDown={(e) => {
          e.preventDefault();
          controls.start(e);
        }}
        className="flex h-10 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-taupe-600 hover:bg-cream-200 active:cursor-grabbing"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.6" />
          <circle cx="15" cy="6" r="1.6" />
          <circle cx="9" cy="12" r="1.6" />
          <circle cx="15" cy="12" r="1.6" />
          <circle cx="9" cy="18" r="1.6" />
          <circle cx="15" cy="18" r="1.6" />
        </svg>
      </button>

      <span className="w-5 shrink-0 text-sm font-medium text-taupe-600">{position}</span>

      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-paper sm:h-16 sm:w-16">
        {p.image ? (
          <Image src={p.image} alt={p.title} fill sizes="64px" className="object-cover" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink-900">{p.title}</p>
        <p className="text-xs text-ink-700">
          প্রশ্ন: {p.questionCount} · রেসপন্স: {p.responseCount}
        </p>
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
        <QuestionSourceSwitch productId={p.id} source={p.questionSource} />

        <form action={toggleProductActive.bind(null, p.id, !p.isActive)}>
          <button
            type="submit"
            className={`rounded-full px-4 py-1.5 text-xs font-medium ${
              p.isActive ? "bg-plum-900 text-cream-050" : "bg-cream-200 text-ink-700"
            }`}
          >
            {p.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
          </button>
        </form>

        <Link
          href={`/admin/products/${p.id}/questions`}
          className="rounded-full border border-cream-200 px-4 py-1.5 text-xs font-medium text-ink-700 hover:border-plum-700"
        >
          প্রশ্ন
        </Link>
        <Link
          href={`/admin/products/${p.id}/edit`}
          className="rounded-full border border-cream-200 px-4 py-1.5 text-xs font-medium text-ink-700 hover:border-plum-700"
        >
          এডিট
        </Link>

        <form action={deleteProduct}>
          <input type="hidden" name="productId" value={p.id} />
          <ConfirmSubmitButton
            title="প্রোডাক্টটি মুছে ফেলবেন?"
            message={`"${p.title}" এর সাথে এর ${p.questionCount}টি প্রশ্ন ও ${p.responseCount}টি রেসপন্সও স্থায়ীভাবে মুছে যাবে। এটি ফিরিয়ে আনা যাবে না।`}
            className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            মুছুন
          </ConfirmSubmitButton>
        </form>
      </div>
    </Reorder.Item>
  );
}
