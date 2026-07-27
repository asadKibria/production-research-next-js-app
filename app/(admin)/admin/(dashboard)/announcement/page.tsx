import { prisma } from "@/app/lib/prisma";
import { AnnouncementForm } from "./AnnouncementForm";

export default async function AnnouncementPage() {
  const announcement = await prisma.announcement.findFirst();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">গিফট/অফার ঘোষণা</h1>
        <p className="mt-1 text-sm text-ink-700">
          হোম পেজের গিফট সেকশন এখান থেকে চালু/বন্ধ ও এডিট করা যাবে
        </p>
      </div>
      <AnnouncementForm
        initial={{
          message: announcement?.message ?? "",
          isActive: announcement?.isActive ?? false,
        }}
      />
    </div>
  );
}
