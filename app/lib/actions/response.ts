"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { getCurrentCustomer } from "@/app/lib/customer-session";
import { requireAdmin } from "@/app/lib/auth";

export async function startOrResumeProduct(formData: FormData) {
  const productId = formData.get("productId")?.toString();
  if (!productId) return;

  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect("/survey");
  }

  const existing = await prisma.response.findUnique({
    where: { customerId_productId: { customerId: customer.id, productId } },
  });

  if (!existing) {
    await prisma.response.create({
      data: { customerId: customer.id, productId, status: "draft", currentStep: 1 },
    });
  }

  redirect(`/survey/${productId}`);
}

export async function deleteResponseAdmin(formData: FormData) {
  await requireAdmin();
  const responseId = formData.get("responseId")?.toString();
  if (!responseId) return;
  await prisma.response.delete({ where: { id: responseId } });
  revalidatePath("/admin/responses");
}
