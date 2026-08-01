import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { ProductList } from "./ProductList";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { questions: true, responses: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">প্রোডাক্ট ম্যানেজমেন্ট</h1>
          <p className="mt-1 text-sm text-ink-700">
            কার্ডের বাঁ পাশের হ্যান্ডেল <span aria-hidden>⠿</span> ধরে টেনে ক্রম বদলান
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-plum-900 px-5 py-2.5 text-sm font-medium text-cream-050 hover:bg-plum-800"
        >
          + নতুন প্রোডাক্ট
        </Link>
      </div>

      <ProductList
        products={products.map((p) => ({
          id: p.id,
          title: p.title,
          image: p.image,
          isActive: p.isActive,
          displayOrder: p.displayOrder,
          questionSource: p.questionSource,
          questionCount: p._count.questions,
          responseCount: p._count.responses,
        }))}
      />
    </div>
  );
}
