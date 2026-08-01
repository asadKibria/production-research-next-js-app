import "server-only";
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/app/lib/prisma";

/*
  A product's questions are always real rows, because customer answers point at
  them. "Following the defaults" therefore means keeping those rows in step with
  the QuestionTemplate list rather than reading the templates directly.

  Two dials decide what a sync is allowed to touch:

  - Product.questionSource — `defaults` means the whole list mirrors the default
    questions; `custom` means the admin owns the list and only the questions
    still marked as defaults get refreshed.
  - ProductQuestion.isCustomized — set the moment the admin edits a question, so
    a later default-question edit cannot overwrite their wording.

  Answers are never destroyed. A question left behind by a deleted default is
  only removed when nobody has answered it; otherwise it stays and is marked
  customized so it stops claiming to be a default.
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

  const followsDefaults = product.questionSource === "defaults";
  const byTemplateId = new Map(
    product.questions.filter((q) => q.templateId).map((q) => [q.templateId as string, q]),
  );
  const ops: Prisma.PrismaPromise<unknown>[] = [];

  for (const template of templates) {
    const existing = byTemplateId.get(template.id);

    if (!existing) {
      // A custom list only grows when the admin adds a question themselves.
      if (!followsDefaults) continue;
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

    if (existing.isCustomized && !followsDefaults) continue;

    ops.push(
      prisma.productQuestion.update({
        where: { id: existing.id },
        data: {
          questionText: template.questionText,
          questionType: template.questionType,
          options: template.options,
          isCustomized: false,
          // A custom list keeps whatever order the admin gave it.
          ...(followsDefaults ? { displayOrder: template.displayOrder } : {}),
        },
      }),
    );
  }

  if (followsDefaults) {
    const templateIds = new Set(templates.map((t) => t.id));
    for (const question of product.questions) {
      if (question.templateId && templateIds.has(question.templateId)) continue;
      if (question._count.answers > 0) {
        if (!question.isCustomized) {
          ops.push(
            prisma.productQuestion.update({
              where: { id: question.id },
              data: { isCustomized: true },
            }),
          );
        }
      } else {
        ops.push(prisma.productQuestion.delete({ where: { id: question.id } }));
      }
    }
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
