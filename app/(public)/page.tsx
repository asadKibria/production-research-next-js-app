import { prisma } from "@/app/lib/prisma";
import { HomeClient } from "./HomeClient";

// Served from the CDN for speed, but regenerated at most once a minute so the
// live participant count and product list never go stale. Product/announcement
// edits also call revalidatePath("/") for an immediate refresh.
export const revalidate = 60;

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
