"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth";
import { questionTypeSchema } from "@/app/lib/validation";
import { saveUploadedImage } from "@/app/lib/upload";
import { serializeOptions } from "@/app/lib/question-options";
import {
  refreshQuestionSourceFlag,
  syncAllProductsFromTemplates,
  syncProductQuestions,
} from "@/app/lib/question-sync";

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
  await syncAllProductsFromTemplates();

  revalidatePath("/admin/questions");
  revalidatePath("/admin/products");
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
  // This is the whole point of a default question: the edit reaches every
  // product that still follows it.
  await syncAllProductsFromTemplates();

  revalidatePath("/admin/questions");
  revalidatePath("/admin/products");
  redirect("/admin/questions");
}

export async function deleteQuestionTemplate(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  if (!id) return;
  await prisma.questionTemplate.delete({ where: { id } });
  await syncAllProductsFromTemplates();
  revalidatePath("/admin/questions");
  revalidatePath("/admin/products");
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

  // A hand-written question has no default behind it, so it is custom by
  // definition and no sync will ever rewrite it.
  await prisma.productQuestion.create({
    data: {
      productId,
      questionText,
      questionType,
      options,
      questionImage,
      displayOrder,
      isCustomized: true,
    },
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
      // Editing is what makes a question custom — from here on, default-question
      // edits leave it alone.
      isCustomized: true,
      ...(questionImage !== undefined ? { questionImage } : {}),
    },
  });
  await refreshQuestionSourceFlag(productId);

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/questions`);
  redirect(`/admin/products/${productId}/questions`);
}

export async function deleteProductQuestion(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  const productId = formData.get("productId")?.toString();
  if (!id) return;
  await prisma.productQuestion.delete({ where: { id } });
  if (productId) {
    await refreshQuestionSourceFlag(productId);
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}/questions`);
  }
}

/**
 * The product-level switch, which acts on the whole list at once: freeze every
 * question so default-question edits stop reaching them, or reset every
 * question back to its default. The caller confirms the reset first, since that
 * is where custom wording gets replaced.
 */
export async function setProductQuestionSource(productId: string, source: "defaults" | "custom") {
  await requireAdmin();

  if (source === "custom") {
    await prisma.productQuestion.updateMany({
      where: { productId },
      data: { isCustomized: true },
    });
  } else {
    await prisma.productQuestion.updateMany({
      where: { productId },
      data: { isCustomized: false },
    });
  }

  await prisma.product.update({ where: { id: productId }, data: { questionSource: source } });
  if (source === "defaults") await syncProductQuestions(productId);

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/questions`);
}

/** Puts one question back to its default wording, options and type. */
export async function resetProductQuestionToDefault(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  const productId = formData.get("productId")?.toString();
  if (!id) return;

  const question = await prisma.productQuestion.findUnique({ where: { id } });
  if (!question?.templateId) return;
  const template = await prisma.questionTemplate.findUnique({ where: { id: question.templateId } });
  if (!template) return;

  await prisma.productQuestion.update({
    where: { id },
    data: {
      questionText: template.questionText,
      questionType: template.questionType,
      options: template.options,
      isCustomized: false,
    },
  });
  await refreshQuestionSourceFlag(question.productId);

  revalidatePath("/admin/products");
  if (productId) revalidatePath(`/admin/products/${productId}/questions`);
}

/**
 * Detaches one question from its default, so the admin can word it their way
 * without a later default-question edit undoing it.
 */
export async function markProductQuestionCustom(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString();
  const productId = formData.get("productId")?.toString();
  if (!id) return;

  const question = await prisma.productQuestion.update({
    where: { id },
    data: { isCustomized: true },
  });
  await refreshQuestionSourceFlag(question.productId);

  revalidatePath("/admin/products");
  if (productId) revalidatePath(`/admin/products/${productId}/questions`);
}
