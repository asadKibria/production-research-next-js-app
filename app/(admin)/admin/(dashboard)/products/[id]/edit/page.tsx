import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { updateProduct } from "@/app/lib/actions/product";
import { ProductForm } from "../../ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const boundAction = updateProduct.bind(null, product.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900">প্রোডাক্ট এডিট করুন</h1>
      <ProductForm
        action={boundAction}
        initial={{
          title: product.title,
          description: product.description,
          isActive: product.isActive,
          displayOrder: product.displayOrder,
          image: product.image,
        }}
        submitLabel="সংরক্ষণ করুন"
      />
    </div>
  );
}
