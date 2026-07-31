import "server-only";
import { prisma } from "@/app/lib/prisma";
import { AGE_GROUP_VALUES } from "@/app/lib/age-groups";

const TREND_WEEKS = 8;

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getInsightsData() {
  const [
    totalProductsCount,
    totalResponsesCount,
    inProgressResponsesCount,
    registeredCustomersCount,
    completedResponses,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.response.count({ where: { status: "completed" } }),
    prisma.response.count({ where: { status: "draft" } }),
    prisma.customer.count(),
    prisma.response.findMany({
      where: { status: "completed" },
      include: {
        customer: true,
        product: { select: { id: true, title: true, image: true } },
        answers: { include: { productQuestion: { select: { questionType: true, questionText: true } } } },
      },
    }),
  ]);

  let ratingSum = 0;
  let ratingCount = 0;
  const productRatingMap = new Map<
    string,
    { title: string; image: string | null; sum: number; count: number; responses: number }
  >();
  const purchaseIntentCounts = new Map<string, number>();
  const purchaseIntentByProductMap = new Map<string, Map<string, number>>();
  let priceSum = 0;
  let priceCount = 0;
  const priceByProductMap = new Map<string, { title: string; sum: number; count: number }>();
  const genderCounts = new Map<string, number>();
  const districtCounts = new Map<string, number>();
  const professionCounts = new Map<string, number>();
  const ageCounts = new Map<string, number>();
  const residenceTypeCounts = new Map<string, number>();
  const seenCustomers = new Set<string>();
  const recentComments: {
    id: string;
    customerName: string;
    productTitle: string;
    text: string;
    rating: number | null;
    createdAt: Date;
  }[] = [];

  for (const response of completedResponses) {
    const productEntry = productRatingMap.get(response.productId) ?? {
      title: response.product.title,
      image: response.product.image,
      sum: 0,
      count: 0,
      responses: 0,
    };
    productEntry.responses += 1;

    for (const answer of response.answers) {
      if (typeof answer.rating === "number") {
        ratingSum += answer.rating;
        ratingCount += 1;
        productEntry.sum += answer.rating;
        productEntry.count += 1;
      }
      if (answer.productQuestion.questionType === "purchase_intent" && answer.answerValue) {
        purchaseIntentCounts.set(
          answer.answerValue,
          (purchaseIntentCounts.get(answer.answerValue) ?? 0) + 1,
        );
        const productMap = purchaseIntentByProductMap.get(response.productId) ?? new Map<string, number>();
        productMap.set(answer.answerValue, (productMap.get(answer.answerValue) ?? 0) + 1);
        purchaseIntentByProductMap.set(response.productId, productMap);
      }
      if (answer.productQuestion.questionType === "price_opinion" && answer.answerValue) {
        const value = Number(answer.answerValue);
        if (Number.isFinite(value)) {
          priceSum += value;
          priceCount += 1;

          const priceEntry = priceByProductMap.get(response.productId) ?? {
            title: response.product.title,
            sum: 0,
            count: 0,
          };
          priceEntry.sum += value;
          priceEntry.count += 1;
          priceByProductMap.set(response.productId, priceEntry);
        }
      }
      if (answer.productQuestion.questionType === "text" && answer.answerValue?.trim()) {
        recentComments.push({
          id: answer.id,
          customerName: response.customer.fullName,
          productTitle: response.product.title,
          text: answer.answerValue.trim(),
          rating: answer.rating,
          createdAt: answer.createdAt,
        });
      }
    }

    productRatingMap.set(response.productId, productEntry);

    if (!seenCustomers.has(response.customerId)) {
      seenCustomers.add(response.customerId);
      genderCounts.set(response.customer.gender, (genderCounts.get(response.customer.gender) ?? 0) + 1);
      districtCounts.set(
        response.customer.district,
        (districtCounts.get(response.customer.district) ?? 0) + 1,
      );
      professionCounts.set(
        response.customer.profession,
        (professionCounts.get(response.customer.profession) ?? 0) + 1,
      );
      ageCounts.set(response.customer.age, (ageCounts.get(response.customer.age) ?? 0) + 1);
      residenceTypeCounts.set(
        response.customer.residenceType,
        (residenceTypeCounts.get(response.customer.residenceType) ?? 0) + 1,
      );
    }
  }

  const productRanking = Array.from(productRatingMap.entries())
    .map(([productId, v]) => {
      const intentMap = purchaseIntentByProductMap.get(productId);
      let topPurchaseIntent: { label: string; percentage: number } | null = null;
      if (intentMap && intentMap.size > 0) {
        const entries = Array.from(intentMap.entries()).sort((a, b) => b[1] - a[1]);
        const total = entries.reduce((sum, [, c]) => sum + c, 0);
        topPurchaseIntent = { label: entries[0][0], percentage: (entries[0][1] / total) * 100 };
      }
      return {
        productId,
        title: v.title,
        image: v.image,
        avgRating: v.count > 0 ? v.sum / v.count : 0,
        responseCount: v.responses,
        topPurchaseIntent,
      };
    })
    .sort((a, b) => b.avgRating - a.avgRating);

  const sortByCountDesc = (a: { count: number }, b: { count: number }) => b.count - a.count;

  const purchaseIntentBreakdown = Array.from(purchaseIntentCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort(sortByCountDesc);
  const purchaseIntentTotal = purchaseIntentBreakdown.reduce((sum, x) => sum + x.count, 0);
  const purchaseIntentTop =
    purchaseIntentBreakdown.length > 0 && purchaseIntentTotal > 0
      ? {
          label: purchaseIntentBreakdown[0].label,
          percentage: (purchaseIntentBreakdown[0].count / purchaseIntentTotal) * 100,
        }
      : null;

  // Weekly response-volume trend (cumulative within the trailing window).
  const currentWeekStart = startOfWeek(new Date());
  const weekStarts: Date[] = [];
  for (let i = TREND_WEEKS - 1; i >= 0; i--) {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - i * 7);
    weekStarts.push(d);
  }
  const perWeekCounts = weekStarts.map((start, idx) => {
    const end = idx < weekStarts.length - 1 ? weekStarts[idx + 1] : null;
    return completedResponses.filter((r) => {
      if (!r.completedAt) return false;
      return r.completedAt >= start && (!end || r.completedAt < end);
    }).length;
  });
  let runningTotal = 0;
  const responseVolumeByWeek = perWeekCounts.map((count, idx) => {
    runningTotal += count;
    return { week: `সপ্তাহ ${idx + 1}`, count: runningTotal };
  });

  recentComments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return {
    totalProductsCount,
    totalResponsesCount,
    inProgressResponsesCount,
    registeredCustomersCount,
    totalCustomersCount: seenCustomers.size,
    averageRating: ratingCount > 0 ? ratingSum / ratingCount : 0,
    productRanking,
    topPerformer: productRanking[0] ?? null,
    purchaseIntentBreakdown,
    purchaseIntentTop,
    priceAnalysis: { average: priceCount > 0 ? priceSum / priceCount : 0, sampleSize: priceCount },
    priceByProduct: Array.from(priceByProductMap.entries()).map(([productId, v]) => ({
      productId,
      title: v.title,
      average: v.count > 0 ? v.sum / v.count : 0,
    })),
    genderBreakdown: Array.from(genderCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort(sortByCountDesc),
    districtBreakdown: Array.from(districtCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort(sortByCountDesc),
    professionBreakdown: Array.from(professionCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort(sortByCountDesc),
    ageDistribution: AGE_GROUP_VALUES.map((label) => ({ label, count: ageCounts.get(label) ?? 0 })).filter(
      (b) => b.count > 0,
    ),
    residenceTypeBreakdown: Array.from(residenceTypeCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort(sortByCountDesc),
    responseVolumeByWeek,
    recentComments: recentComments.slice(0, 5),
  };
}

export type InsightsData = Awaited<ReturnType<typeof getInsightsData>>;
