"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { getCurrentCustomer } from "@/app/lib/customer-session";

async function assertOwnership(responseId: string) {
  const customer = await getCurrentCustomer();
  if (!customer) throw new Error("UNAUTHORIZED");
  const response = await prisma.response.findUnique({ where: { id: responseId } });
  if (!response || response.customerId !== customer.id) throw new Error("FORBIDDEN");
  return response;
}

export async function saveAnswer(input: {
  responseId: string;
  productQuestionId: string;
  answerValue: string | null;
  rating: number | null;
  nextStep: number;
}) {
  const response = await assertOwnership(input.responseId);
  if (response.status === "completed") return { ok: true as const };

  await prisma.responseAnswer.upsert({
    where: {
      responseId_productQuestionId: {
        responseId: input.responseId,
        productQuestionId: input.productQuestionId,
      },
    },
    update: { answerValue: input.answerValue, rating: input.rating },
    create: {
      responseId: input.responseId,
      productQuestionId: input.productQuestionId,
      answerValue: input.answerValue,
      rating: input.rating,
    },
  });

  await prisma.response.update({
    where: { id: input.responseId },
    data: { currentStep: input.nextStep },
  });

  return { ok: true as const };
}

export async function updateCurrentStep(responseId: string, step: number) {
  const response = await assertOwnership(responseId);
  if (response.status === "completed") return;
  await prisma.response.update({ where: { id: responseId }, data: { currentStep: step } });
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; error: string; missingQuestionId: string | null };

export async function submitResponse(
  responseId: string,
  /** Free-form closing remark. Blank is fine — it never blocks submission. */
  customOpinion?: string | null,
): Promise<SubmitResult> {
  const response = await assertOwnership(responseId);
  if (response.status === "completed") return { ok: true };

  const questions = await prisma.productQuestion.findMany({
    where: { productId: response.productId },
    orderBy: { displayOrder: "asc" },
  });
  const answers = await prisma.responseAnswer.findMany({ where: { responseId } });
  const answerByQuestionId = new Map(answers.map((a) => [a.productQuestionId, a]));

  // Only choice-style questions require a separate star rating. Free text,
  // price opinion, purchase intent, and rating-type (dual-purpose) questions
  // are already a complete answer on their own.
  const requiresRating = (questionType: string) =>
    questionType === "multiple_choice" || questionType === "checkbox";

  for (const q of questions) {
    // Free text is optional — mirrors `questionIsOptional` in wizard-types.ts.
    if (q.questionType === "text") continue;

    const a = answerByQuestionId.get(q.id);
    const hasAnswer =
      q.questionType === "rating" ? true : Boolean(a?.answerValue && a.answerValue.trim().length > 0);

    if (!requiresRating(q.questionType)) {
      if (!hasAnswer) {
        return { ok: false, error: "সব প্রশ্নের উত্তর দিতে হবে", missingQuestionId: q.id };
      }
      continue;
    }

    const hasRating = typeof a?.rating === "number" && a.rating >= 1 && a.rating <= 5;
    if (!hasRating || !hasAnswer) {
      return {
        ok: false,
        error: "সব প্রশ্নের উত্তর ও রেটিং দিতে হবে",
        missingQuestionId: q.id,
      };
    }
  }

  const trimmedOpinion = customOpinion?.trim();

  await prisma.response.update({
    where: { id: responseId },
    data: {
      status: "completed",
      completedAt: new Date(),
      customOpinion: trimmedOpinion ? trimmedOpinion.slice(0, 2000) : null,
    },
  });

  // The home page caches the live participant count.
  revalidatePath("/");

  return { ok: true };
}
