import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { deleteProduct, toggleProductActive } from "@/app/lib/actions/product";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { questions: true, responses: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">প্রোডাক্ট ম্যানেজমেন্ট</h1>
          <p className="mt-1 text-sm text-ink-700">সব প্রোডাক্ট যোগ, এডিট বা মুছে ফেলুন</p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-plum-900 px-5 py-2.5 text-sm font-medium text-cream-050 hover:bg-plum-800"
        >
          + নতুন প্রোডাক্ট
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-4 rounded-2xl border border-cream-200 bg-cream-050 p-4"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-paper">
              {p.image ? (
                <Image src={p.image} alt={p.title} fill sizes="64px" className="object-cover" />
              ) : null}
            </div>

            <div className="flex-1">
              <p className="font-medium text-ink-900">{p.title}</p>
              <p className="text-xs text-ink-700">
                ক্রম: {p.displayOrder} · প্রশ্ন: {p._count.questions} · রেসপন্স: {p._count.responses}
              </p>
            </div>

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
              <button
                type="submit"
                className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                মুছুন
              </button>
            </form>
          </div>
        ))}

        {products.length === 0 ? <p className="text-sm text-ink-700">কোনো প্রোডাক্ট নেই।</p> : null}
      </div>
    </div>
  );
}
