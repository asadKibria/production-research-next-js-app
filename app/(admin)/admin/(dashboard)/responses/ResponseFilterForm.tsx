"use client";

import { ageGroups } from "@/app/lib/age-groups";
import { residenceTypes } from "@/app/lib/residence-type";
import { districts } from "@/app/lib/districts";

type Product = { id: string; title: string };

export function ResponseFilterForm({
  products,
  initial,
}: {
  products: Product[];
  initial: Record<string, string | undefined>;
}) {
  return (
    <form method="get" className="grid grid-cols-2 gap-3 rounded-2xl border border-cream-200 bg-cream-050 p-4 sm:grid-cols-4">
      <select name="productId" defaultValue={initial.productId ?? ""} className="input">
        <option value="">সব প্রোডাক্ট</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>

      <select name="gender" defaultValue={initial.gender ?? ""} className="input">
        <option value="">সব লিঙ্গ</option>
        <option value="male">পুরুষ</option>
        <option value="female">মহিলা</option>
        <option value="other">অন্যান্য</option>
      </select>

      <select name="age" defaultValue={initial.age ?? ""} className="input">
        <option value="">সব বয়স</option>
        {ageGroups.map((g) => (
          <option key={g.value} value={g.value}>
            {g.bn}
          </option>
        ))}
      </select>

      <select name="residenceType" defaultValue={initial.residenceType ?? ""} className="input">
        <option value="">শহর/গ্রাম (সব)</option>
        {residenceTypes.map((r) => (
          <option key={r.value} value={r.value}>
            {r.bn}
          </option>
        ))}
      </select>

      <input name="profession" type="text" placeholder="পেশা" defaultValue={initial.profession ?? ""} className="input" />

      <select name="district" defaultValue={initial.district ?? ""} className="input">
        <option value="">সব জেলা</option>
        {districts.map((d) => (
          <option key={d.value} value={d.value}>
            {d.bn}
          </option>
        ))}
      </select>

      <input
        name="minAvgRating"
        type="number"
        step="0.1"
        min={1}
        max={5}
        placeholder="ন্যূনতম গড় রেটিং"
        defaultValue={initial.minAvgRating ?? ""}
        className="input"
      />

      <input
        name="purchaseIntent"
        type="text"
        placeholder="ক্রয়ের আগ্রহ"
        defaultValue={initial.purchaseIntent ?? ""}
        className="input"
      />
      <input name="dateFrom" type="date" defaultValue={initial.dateFrom ?? ""} className="input" />
      <input name="dateTo" type="date" defaultValue={initial.dateTo ?? ""} className="input" />

      <button
        type="submit"
        className="rounded-full bg-plum-900 px-5 py-2 text-sm font-medium text-cream-050 hover:bg-plum-800"
      >
        ফিল্টার করুন
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--color-cream-200);
          background: var(--color-paper);
          padding: 0.5rem 0.8rem;
          font-size: 0.85rem;
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
