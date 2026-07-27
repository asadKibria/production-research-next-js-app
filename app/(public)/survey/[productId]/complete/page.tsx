import { notFound, redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { getCurrentCustomer } from "@/app/lib/customer-session";
import { CompleteClient } from "./CompleteClient";

export default async function CompletePage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/survey");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) notFound();

  const response = await prisma.response.findUnique({
    where: { customerId_productId: { customerId: customer.id, productId } },
  });
  if (!response || response.status !== "completed") redirect(`/survey/${productId}`);

  const completedResponses = await prisma.response.findMany({
    where: { customerId: customer.id, status: "completed" },
    include: {
      product: { select: { title: true } },
      answers: { select: { rating: true } },
    },
  });

  const designsReviewedCount = completedResponses.length;

  let topPickTitle: string | null = null;
  let topPickAvg = -1;
  for (const r of completedResponses) {
    const ratings = r.answers.map((a) => a.rating).filter((v): v is number => typeof v === "number");
    const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    if (avg > topPickAvg) {
      topPickAvg = avg;
      topPickTitle = r.product.title;
    }
  }

  return (
    <CompleteClient
      customerName={customer.fullName}
      designsReviewedCount={designsReviewedCount}
      topPickTitle={topPickTitle}
    />
  );
}
