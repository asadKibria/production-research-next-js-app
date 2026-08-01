import "server-only";
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/app/lib/prisma";

/*
  A product's questions are always real rows, because customer answers point at
  them. "Following the defaults" therefore means keeping those rows in step with
  the QuestionTemplate list rather than reading the templates directly.

  ProductQuestion.isCustomized is the single decision per question: false means
  a default-question edit flows straight into it, true means the admin owns the
  wording and no sync may touch it. It is set by editing the question, or by the
  ডিফল্ট/কাস্টম switch on the question itself.

  Product.questionSource summarises the same thing for the product list, and is
  kept in step by refreshQuestionSourceFlag — `defaults` exactly when nothing on
  the product has been customized. Its two switch positions are bulk actions:
  freeze the whole list, or reset the whole list.

  Answers are never destroyed. A question left behind by a deleted default is
  only removed when it is untouched and nobody has answered it.
*/

/** Brings a single product back in line with the default questions. */
export async function syncProductQuestions(productId: string) {
  const [product, templates] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: { questions: { include: { _count: { select: { answers: true } } } } },
    }),
    prisma.questionTemplate.findMany({ orderBy: { displayOrder: "asc" } }),
  ]);
  if (!product) return;

  const handManaged = product.questionSource === "custom";
  const byTemplateId = new Map(
    product.questions.filter((q) => q.templateId).map((q) => [q.templateId as string, q]),
  );
  const ops: Prisma.PrismaPromise<unknown>[] = [];

  for (const template of templates) {
    const existing = byTemplateId.get(template.id);

    if (!existing) {
      // A hand-managed list only grows when the admin adds a question to it.
      if (handManaged) continue;
      ops.push(
        prisma.productQuestion.create({
          data: {
            productId,
            templateId: template.id,
            questionText: template.questionText,
            questionType: template.questionType,
            options: template.options,
            displayOrder: template.displayOrder,
          },
        }),
      );
      continue;
    }

    if (existing.isCustomized) continue;

    ops.push(
      prisma.productQuestion.update({
        where: { id: existing.id },
        data: {
          questionText: template.questionText,
          questionType: template.questionType,
          options: template.options,
          displayOrder: template.displayOrder,
        },
      }),
    );
  }

  // Questions whose default is gone. Anything customized or answered is the
  // admin's or the customers' — only an untouched, unanswered leftover goes.
  const templateIds = new Set(templates.map((t) => t.id));
  for (const question of product.questions) {
    if (question.templateId && templateIds.has(question.templateId)) continue;
    if (!question.templateId || question.isCustomized || question._count.answers > 0) continue;
    ops.push(prisma.productQuestion.delete({ where: { id: question.id } }));
  }

  if (ops.length > 0) await prisma.$transaction(ops);
}

/** Called after any default question changes, so every product keeps up. */
export async function syncAllProductsFromTemplates() {
  const products = await prisma.product.findMany({ select: { id: true } });
  for (const product of products) {
    await syncProductQuestions(product.id);
  }
}

/**
 * Keeps the product-level label honest: a product counts as following the
 * defaults exactly while none of its questions has been customized.
 */
export async function refreshQuestionSourceFlag(productId: string) {
  const customized = await prisma.productQuestion.count({
    where: { productId, isCustomized: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: { questionSource: customized > 0 ? "custom" : "defaults" },
  });
}
