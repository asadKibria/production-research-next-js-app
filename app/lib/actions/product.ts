"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth";
import { productSchema } from "@/app/lib/validation";
import { saveUploadedImage } from "@/app/lib/upload";

export type ProductFormState = { error: string | null; fieldErrors: Record<string, string> };

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    title: formData.get("title")?.toString() ?? "",
    description: formData.get("description")?.toString() ?? "",
    isActive: formData.get("isActive") === "on",
    displayOrder: formData.get("displayOrder")?.toString() ?? "0",
  });
}

/** The admin list plus every public surface that renders the product catalog. */
function revalidateProductSurfaces() {
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/survey/products");
}

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: "ফর্মে কিছু তথ্য সঠিক নয়", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const imageFile = formData.get("image");
  let imagePath: string | null = null;
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      imagePath = await saveUploadedImage(imageFile);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "ছবি আপলোড ব্যর্থ হয়েছে", fieldErrors: {} };
    }
  }

  const templates = await prisma.questionTemplate.findMany({ orderBy: { displayOrder: "asc" } });

  await prisma.product.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      image: imagePath,
      isActive: parsed.data.isActive,
      displayOrder: parsed.data.displayOrder,
      questions: {
        create: templates.map((t) => ({
          questionText: t.questionText,
          questionType: t.questionType,
          options: t.options,
          displayOrder: t.displayOrder,
        })),
      },
    },
  });

  revalidateProductSurfaces();
  redirect("/admin/products");
}

export async function updateProduct(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: "ফর্মে কিছু তথ্য সঠিক নয়", fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const imageFile = formData.get("image");
  let imagePath: string | undefined;
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      imagePath = await saveUploadedImage(imageFile);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "ছবি আপলোড ব্যর্থ হয়েছে", fieldErrors: {} };
    }
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      isActive: parsed.data.isActive,
      displayOrder: parsed.data.displayOrder,
      ...(imagePath ? { image: imagePath } : {}),
    },
  });

  revalidateProductSurfaces();
  redirect("/admin/products");
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.product.update({ where: { id: productId }, data: { isActive } });
  revalidateProductSurfaces();
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const productId = formData.get("productId")?.toString();
  if (!productId) return;
  await prisma.product.delete({ where: { id: productId } });
  revalidateProductSurfaces();
}
