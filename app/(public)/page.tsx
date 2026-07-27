import { prisma } from "@/app/lib/prisma";
import { HomeClient } from "./HomeClient";

export default async function HomePage() {
  const [products, participantCount, announcement] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: { id: true, title: true, image: true },
    }),
    prisma.response.count({ where: { status: "completed" } }),
    prisma.announcement.findFirst({ where: { isActive: true } }),
  ]);

  return (
    <HomeClient
      products={products}
      participantCount={participantCount}
      announcementMessage={announcement?.message ?? null}
    />
  );
}
