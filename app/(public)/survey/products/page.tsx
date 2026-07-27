import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { getCurrentCustomer } from "@/app/lib/customer-session";
import { ProductGalleryClient } from "./ProductGalleryClient";

export default async function ProductGalleryPage() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect("/survey");
  }

  const [products, responses] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: { id: true, title: true, description: true, image: true },
    }),
    prisma.response.findMany({
      where: { customerId: customer.id },
      select: { productId: true, status: true },
    }),
  ]);

  const statusByProductId = Object.fromEntries(responses.map((r) => [r.productId, r.status]));

  return <ProductGalleryClient products={products} statusByProductId={statusByProductId} />;
}
