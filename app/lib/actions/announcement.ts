"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth";
import { announcementSchema } from "@/app/lib/validation";

export type AnnouncementFormState = { error: string | null; success?: boolean };

export async function saveAnnouncement(
  _prevState: AnnouncementFormState,
  formData: FormData,
): Promise<AnnouncementFormState> {
  await requireAdmin();

  const parsed = announcementSchema.safeParse({
    message: formData.get("message")?.toString() ?? "",
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { error: "মেসেজ আবশ্যক" };
  }

  const existing = await prisma.announcement.findFirst();
  if (existing) {
    await prisma.announcement.update({ where: { id: existing.id }, data: parsed.data });
  } else {
    await prisma.announcement.create({ data: parsed.data });
  }

  revalidatePath("/admin/announcement");
  revalidatePath("/");
  return { error: null, success: true };
}
