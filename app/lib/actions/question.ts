"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth";
import { questionTypeSchema } from "@/app/lib/validation";
import { saveUploadedImage } from "@/app/lib/upload";
import { serializeOptions } from "@/app/lib/question-options";

export type QuestionFormState = { error: string | null; fieldErrors: Record<string, string> };

function buildOptions(questionType: string, formData: FormData): string | null {
  if (["multiple_choice", "checkbox", "purchase_intent"].includes(questionType)) {
    const raw = formData.get("optionsText")?.toString() ?? "";
    const list = raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0) return null;
    return serializeOptions(list);
  }
  if (questionType === "price_opinion") {
    const min = Number(formData.get("priceMin") ?? 0);
    const max = Number(formData.get("priceMax") ?? 5000);
    const step = Number(formData.get("priceStep") ?? 50);
    return serializeOptions({ min, max, step });
  }
  return null;
}

function parseCommon(formData: FormData) {
  const questionText = formData.get("questionText")?.toString().trim() ?? "";
  const questionTypeRaw = formData.get("questionType")?.toString() ?? "";
  const displayOrder = Number(formData.get("displayOrder") ?? 0);
  const typeParsed = questionTypeSchema.safeParse(questionTypeRaw);
  return {
    questionText,
    questionType: typeParsed.success ? typeParsed.data : null,
    displayOrder,
  };
}

// ---- Question Templates ----

export async function createQuestionTemplate(
  _prevState: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  await requireAdmin();
  const { questionText, questionType, displayOrder } = parseCommon(formData);
  if (!questionText || !questionType) {
    return { error: "প্রশ্ন ও ধরন আবশ্যক", fieldErrors: {} };
  }
  const options = buildOptions(questionType, formData);

  await prisma.questionTemplate.create({ data: { questionText, questionType, options, displayOrder } });

  revalidatePath("/admin/questions");
  redirect("/admin/questions");
}

export async function updateQuestionTemplate(
  id: string,
  _prevState: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  await requireAdmin();
  const { questionText, questionType, displayOrder } = parseCommon(formData);
  if (!questionText || !questionType) {
    return { error: "প্রশ্ন ও ধরন আবশ্যক", fieldErrors: {} };
  }
  const options = buildOptions(questionType, formData);

  await prisma.questionTemplate.update({
    where: { id },
    data: { questionText, questionType, options, displayOrder },
  });

  revalidatePath("/admin/questions");
  redirect("/admin/questions");
}

export async function deleteQuestionTemplate(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  if (!id) return;
  await prisma.questionTemplate.delete({ where: { id } });
  revalidatePath("/admin/questions");
}

// ---- Product Questions ----

export async function createProductQuestion(
  productId: string,
  _prevState: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  await requireAdmin();
  const { questionText, questionType, displayOrder } = parseCommon(formData);
  if (!questionText || !questionType) {
    return { error: "প্রশ্ন ও ধরন আবশ্যক", fieldErrors: {} };
  }
  const options = buildOptions(questionType, formData);

  let questionImage: string | null = null;
  const imageFile = formData.get("questionImage");
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      questionImage = await saveUploadedImage(imageFile);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "ছবি আপলোড ব্যর্থ হয়েছে", fieldErrors: {} };
    }
  }

  await prisma.productQuestion.create({
    data: { productId, questionText, questionType, options, questionImage, displayOrder },
  });

  revalidatePath(`/admin/products/${productId}/questions`);
  redirect(`/admin/products/${productId}/questions`);
}

export async function updateProductQuestion(
  id: string,
  productId: string,
  _prevState: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  await requireAdmin();
  const { questionText, questionType, displayOrder } = parseCommon(formData);
  if (!questionText || !questionType) {
    return { error: "প্রশ্ন ও ধরন আবশ্যক", fieldErrors: {} };
  }
  const options = buildOptions(questionType, formData);

  // undefined = leave as-is, null = clear it, string = replace it.
  let questionImage: string | null | undefined;
  const imageFile = formData.get("questionImage");
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      questionImage = await saveUploadedImage(imageFile);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "ছবি আপলোড ব্যর্থ হয়েছে", fieldErrors: {} };
    }
  } else if (formData.get("removeQuestionImage") === "on") {
    questionImage = null;
  }

  await prisma.productQuestion.update({
    where: { id },
    data: {
      questionText,
      questionType,
      options,
      displayOrder,
      ...(questionImage !== undefined ? { questionImage } : {}),
    },
  });

  revalidatePath(`/admin/products/${productId}/questions`);
  redirect(`/admin/products/${productId}/questions`);
}

export async function deleteProductQuestion(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  const productId = formData.get("productId")?.toString();
  if (!id) return;
  await prisma.productQuestion.delete({ where: { id } });
  if (productId) revalidatePath(`/admin/products/${productId}/questions`);
}
