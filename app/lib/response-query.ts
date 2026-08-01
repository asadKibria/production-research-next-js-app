import "server-only";
import { prisma } from "@/app/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

export type ResponseFilters = {
  productId?: string;
  age?: string;
  gender?: string;
  profession?: string;
  district?: string;
  residenceType?: string;
  minAvgRating?: number;
  purchaseIntent?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: "completed" | "draft" | "all";
  /**
   * Drill-down from the insights page: keep only responses that answered this
   * question with this option. Matched on question *text* rather than id so a
   * single link spans every product asking the same default question.
   */
  answerQuestion?: string;
  answerOption?: string;
};

const PAGE_SIZE = 20;

function parseCheckboxAnswer(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

async function getFilteredResponses(filters: ResponseFilters) {
  const statusFilter = filters.status ?? "completed";
  const where: Prisma.ResponseWhereInput =
    statusFilter === "all" ? {} : { status: statusFilter };

  if (filters.productId) where.productId = filters.productId;

  const customerWhere: Prisma.CustomerWhereInput = {};
  if (filters.gender) customerWhere.gender = filters.gender as Prisma.CustomerWhereInput["gender"];
  if (filters.profession) customerWhere.profession = { contains: filters.profession };
  if (filters.district) customerWhere.district = filters.district;
  if (filters.residenceType) customerWhere.residenceType = filters.residenceType;
  if (filters.age) customerWhere.age = filters.age;
  if (Object.keys(customerWhere).length > 0) where.customer = customerWhere;

  if (filters.dateFrom || filters.dateTo) {
    const range = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(`${filters.dateTo}T23:59:59.999Z`) } : {}),
    };
    // Drafts have no completedAt, so range-filter them by when they started.
    if (statusFilter === "completed") where.completedAt = range;
    else where.createdAt = range;
  }

  const responses = await prisma.response.findMany({
    where,
    include: {
      customer: true,
      product: { select: { id: true, title: true } },
      answers: { include: { productQuestion: true } },
    },
    // Latest activity first — works for drafts (no completedAt) too.
    orderBy: { updatedAt: "desc" },
  });

  const enriched = responses.map((r) => {
    const ratings = r.answers
      .map((a) => a.rating)
      .filter((v): v is number => typeof v === "number");
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    const purchaseIntentAnswer =
      r.answers.find((a) => a.productQuestion.questionType === "purchase_intent")?.answerValue ?? null;
    return { response: r, avgRating, purchaseIntentAnswer };
  });

  let filtered = enriched;
  if (filters.minAvgRating !== undefined) {
    const min = filters.minAvgRating;
    filtered = filtered.filter((e) => e.avgRating !== null && e.avgRating >= min);
  }
  if (filters.purchaseIntent) {
    filtered = filtered.filter((e) => e.purchaseIntentAnswer === filters.purchaseIntent);
  }
  if (filters.answerQuestion && filters.answerOption) {
    const question = filters.answerQuestion;
    const option = filters.answerOption;
    filtered = filtered.filter((e) =>
      e.response.answers.some((a) => {
        if (a.productQuestion.questionText !== question) return false;
        if (a.productQuestion.questionType === "rating") {
          // The insights page labels star buckets "4 ★"; compare the number.
          return typeof a.rating === "number" && `${a.rating} ★` === option;
        }
        if (a.productQuestion.questionType === "checkbox") {
          // One answer holds a JSON array, so "picked this option" is a
          // membership test, not equality.
          return parseCheckboxAnswer(a.answerValue).includes(option);
        }
        return a.answerValue === option;
      }),
    );
  }

  return filtered;
}

export async function queryResponses(filters: ResponseFilters & { page: number }) {
  const filtered = await getFilteredResponses(filters);
  const total = filtered.length;
  const start = (filters.page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);
  return { items: pageItems, total, pageSize: PAGE_SIZE, page: filters.page };
}

export async function queryAllResponsesForExport(filters: ResponseFilters) {
  return getFilteredResponses(filters);
}

export type QueriedResponse = Awaited<ReturnType<typeof getFilteredResponses>>[number];
