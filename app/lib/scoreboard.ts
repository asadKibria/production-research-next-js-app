import "server-only";
import { prisma } from "@/app/lib/prisma";
import { getChoiceOptions } from "@/app/lib/question-options";
import {
  bayesianAverage,
  classifyOption,
  median,
  optionWeight,
  orderedChoiceScore,
  percentile,
  topTwoBoxShare,
  type Sentiment,
} from "@/app/lib/insight-math";

/** Star scores that carry no information about which product to make. */
const RATING_SCALE = [5, 4, 3, 2, 1];
/** A star score at or below this reads as "did not love it". */
const LOW_RATING = 3;
/** A star score at or above this reads as "loved it". */
const HIGH_RATING = 4;

export type OptionBreakdown = {
  label: string;
  sentiment: Sentiment | null;
  count: number;
  /** productId → how many of this option's answers came from that product */
  byProduct: Record<string, number>;
};

export type QuestionBreakdown = {
  questionText: string;
  questionType: string;
  /** True when the options sit on a positive→negative scale we can read. */
  isScale: boolean;
  options: OptionBreakdown[];
  totalAnswers: number;
  /**
   * How many people answered this question at all. Differs from `totalAnswers`
   * on checkbox questions, where one person contributes several picks — the
   * shares have to be "% of people", not "% of picks", or a four-option
   * question reads as if everyone disliked everything.
   */
  respondentCount: number;
  respondentsByProduct: Record<string, number>;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
};

export type ProductScore = {
  productId: string;
  title: string;
  image: string | null;
  responseCount: number;
  /** Straight average of the overall-quality stars. */
  avgRating: number | null;
  ratingCount: number;
  /** Average pulled toward the global mean so tiny samples cannot top the board. */
  adjustedRating: number | null;
  /** Share choosing one of the two most positive purchase-intent options. */
  intentTop2Pct: number | null;
  intentCount: number;
  /** 0–100 weighted purchase-intent score, shrunk the same way as the rating. */
  adjustedIntent: number | null;
  medianPrice: number | null;
  priceP25: number | null;
  priceP75: number | null;
  priceCount: number;
  /** 0–100. Half stars, half purchase intent — the sort key for the board. */
  winnerScore: number | null;
};

export type ConflictKind = "hidden_gem" | "polite_praise";

export type Conflict = {
  kind: ConflictKind;
  responseId: string;
  customerName: string;
  productId: string;
  productTitle: string;
  rating: number | null;
  intentLabel: string | null;
  price: number | null;
  comment: string | null;
};

export type ScoreboardData = {
  products: ProductScore[];
  questions: QuestionBreakdown[];
  conflicts: Conflict[];
  globalAvgRating: number | null;
  totalResponses: number;
};

type Accumulator = {
  title: string;
  image: string | null;
  responses: number;
  ratingSum: number;
  ratingCount: number;
  /** Sum of 0–1 intent weights, for the shrunk intent score. */
  intentWeightSum: number;
  intentCounts: number[];
  intentTotal: number;
  prices: number[];
};

function parseCheckbox(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Reads every completed response once and derives everything the insights page
 * and the dashboard ranking need. Read-only by design: this file must never
 * write, because it runs against the same database the live survey is filling
 * up right now.
 */
export async function getScoreboard(): Promise<ScoreboardData> {
  const responses = await prisma.response.findMany({
    where: { status: "completed" },
    select: {
      id: true,
      productId: true,
      customOpinion: true,
      customer: { select: { fullName: true } },
      product: { select: { title: true, image: true } },
      answers: {
        select: {
          answerValue: true,
          rating: true,
          productQuestion: {
            select: { questionText: true, questionType: true, options: true },
          },
        },
      },
    },
  });

  const byProduct = new Map<string, Accumulator>();
  const byQuestion = new Map<
    string,
    {
      questionText: string;
      questionType: string;
      isScale: boolean;
      /** Option label → counts, kept in the order the question declares them. */
      order: string[];
      counts: Map<string, { count: number; byProduct: Map<string, number> }>;
      respondents: number;
      respondentsByProduct: Map<string, number>;
    }
  >();
  const conflicts: Conflict[] = [];
  let globalRatingSum = 0;
  let globalRatingCount = 0;
  let globalIntentWeightSum = 0;
  let globalIntentCount = 0;

  const touchQuestion = (
    questionText: string,
    questionType: string,
    isScale: boolean,
    order: string[],
  ) => {
    const existing = byQuestion.get(questionText);
    if (existing) return existing;
    const created = {
      questionText,
      questionType,
      isScale,
      order,
      counts: new Map(),
      respondents: 0,
      respondentsByProduct: new Map<string, number>(),
    };
    byQuestion.set(questionText, created);
    return created;
  };

  const tally = (
    bucket: ReturnType<typeof touchQuestion>,
    label: string,
    productId: string,
  ) => {
    const entry = bucket.counts.get(label) ?? { count: 0, byProduct: new Map<string, number>() };
    entry.count += 1;
    entry.byProduct.set(productId, (entry.byProduct.get(productId) ?? 0) + 1);
    bucket.counts.set(label, entry);
  };

  /** Call once per person per question, however many options they ticked. */
  const countRespondent = (bucket: ReturnType<typeof touchQuestion>, productId: string) => {
    bucket.respondents += 1;
    bucket.respondentsByProduct.set(
      productId,
      (bucket.respondentsByProduct.get(productId) ?? 0) + 1,
    );
  };

  for (const response of responses) {
    const acc: Accumulator = byProduct.get(response.productId) ?? {
      title: response.product.title,
      image: response.product.image,
      responses: 0,
      ratingSum: 0,
      ratingCount: 0,
      intentWeightSum: 0,
      intentCounts: [],
      intentTotal: 0,
      prices: [],
    };
    acc.responses += 1;

    // Per-response signals, kept so the conflict pass can compare them.
    let responseRating: number | null = null;
    let responseIntentLabel: string | null = null;
    let responseIntentSentiment: Sentiment | null = null;
    let responsePrice: number | null = null;
    let responseComment: string | null = response.customOpinion?.trim() || null;

    for (const answer of response.answers) {
      const { questionText, questionType, options } = answer.productQuestion;

      if (questionType === "rating") {
        // Stars are the answer here. Anything else carrying a rating is legacy
        // data from before the survey stopped asking for one on every question.
        if (typeof answer.rating === "number") {
          responseRating = answer.rating;
          acc.ratingSum += answer.rating;
          acc.ratingCount += 1;
          globalRatingSum += answer.rating;
          globalRatingCount += 1;

          const bucket = touchQuestion(
            questionText,
            questionType,
            true,
            RATING_SCALE.map((n) => `${n} ★`),
          );
          tally(bucket, `${answer.rating} ★`, response.productId);
          countRespondent(bucket, response.productId);
        }
        continue;
      }

      if (questionType === "purchase_intent") {
        const declared = getChoiceOptions(questionType, options);
        const bucket = touchQuestion(questionText, questionType, true, declared);
        if (!answer.answerValue) continue;
        tally(bucket, answer.answerValue, response.productId);
        countRespondent(bucket, response.productId);

        const index = declared.indexOf(answer.answerValue);
        if (index >= 0) {
          const weight = optionWeight(index, declared.length);
          acc.intentWeightSum += weight;
          globalIntentWeightSum += weight;
          globalIntentCount += 1;
          if (acc.intentCounts.length !== declared.length) {
            acc.intentCounts = new Array(declared.length).fill(0);
          }
          acc.intentCounts[index] += 1;
          acc.intentTotal += 1;
          responseIntentSentiment = classifyOption(index, declared.length);
        }
        responseIntentLabel = answer.answerValue;
        continue;
      }

      if (questionType === "multiple_choice") {
        const declared = getChoiceOptions(questionType, options);
        const bucket = touchQuestion(questionText, questionType, true, declared);
        if (answer.answerValue) {
          tally(bucket, answer.answerValue, response.productId);
          countRespondent(bucket, response.productId);
        }
        continue;
      }

      if (questionType === "checkbox") {
        // Checkbox options are attributes ("দাম", "ডিজাইন"), not a good-to-bad
        // scale, so they get counted but never labelled positive or negative.
        const declared = getChoiceOptions(questionType, options);
        const bucket = touchQuestion(questionText, questionType, false, declared);
        if (!answer.answerValue) continue;
        const picks = parseCheckbox(answer.answerValue);
        if (picks.length === 0) continue;
        for (const picked of picks) {
          tally(bucket, picked, response.productId);
        }
        countRespondent(bucket, response.productId);
        continue;
      }

      if (questionType === "price_opinion" && answer.answerValue) {
        const value = Number(answer.answerValue);
        if (Number.isFinite(value)) {
          acc.prices.push(value);
          responsePrice = value;
        }
        continue;
      }

      if (questionType === "text" && answer.answerValue?.trim()) {
        responseComment = responseComment ?? answer.answerValue.trim();
      }
    }

    byProduct.set(response.productId, acc);

    // The whole point of the exercise: find the responses where the stars and
    // the buying signal disagree, because that is where a single number lies.
    if (responseRating !== null && responseIntentSentiment !== null) {
      const conflict = {
        responseId: response.id,
        customerName: response.customer.fullName,
        productId: response.productId,
        productTitle: response.product.title,
        rating: responseRating,
        intentLabel: responseIntentLabel,
        price: responsePrice,
        comment: responseComment,
      };
      if (responseRating <= LOW_RATING && responseIntentSentiment === "positive") {
        conflicts.push({ kind: "hidden_gem", ...conflict });
      } else if (responseRating >= HIGH_RATING && responseIntentSentiment === "negative") {
        conflicts.push({ kind: "polite_praise", ...conflict });
      }
    }
  }

  const globalAvgRating = globalRatingCount > 0 ? globalRatingSum / globalRatingCount : null;
  const globalMeanIntentWeight =
    globalIntentCount > 0 ? globalIntentWeightSum / globalIntentCount : null;

  const products: ProductScore[] = Array.from(byProduct.entries())
    .map(([productId, v]) => {
      const avgRating = v.ratingCount > 0 ? v.ratingSum / v.ratingCount : null;
      const adjustedRating =
        globalAvgRating !== null
          ? bayesianAverage(v.ratingSum, v.ratingCount, globalAvgRating)
          : avgRating;
      const adjustedIntentWeight =
        globalMeanIntentWeight !== null
          ? bayesianAverage(v.intentWeightSum, v.intentTotal, globalMeanIntentWeight)
          : null;
      const adjustedIntent = adjustedIntentWeight === null ? null : adjustedIntentWeight * 100;

      const ratingPart = adjustedRating === null ? null : ((adjustedRating - 1) / 4) * 100;
      const intentPart = adjustedIntent;
      const parts = [ratingPart, intentPart].filter((p): p is number => p !== null);
      const winnerScore =
        parts.length === 0 ? null : parts.reduce((sum, p) => sum + p, 0) / parts.length;

      return {
        productId,
        title: v.title,
        image: v.image,
        responseCount: v.responses,
        avgRating,
        ratingCount: v.ratingCount,
        adjustedRating,
        intentTop2Pct: v.intentTotal > 0 ? topTwoBoxShare(v.intentCounts) : null,
        intentCount: v.intentTotal,
        adjustedIntent,
        medianPrice: median(v.prices),
        priceP25: percentile(v.prices, 25),
        priceP75: percentile(v.prices, 75),
        priceCount: v.prices.length,
        winnerScore,
      };
    })
    .sort((a, b) => (b.winnerScore ?? -1) - (a.winnerScore ?? -1));

  const questions: QuestionBreakdown[] = Array.from(byQuestion.values()).map((q) => {
    // Every declared option stays in the list even at zero answers: dropping
    // empties would shift the remaining ones up the scale and quietly turn
    // "ভালো" into the most positive answer available.
    const labels = [
      ...q.order,
      ...Array.from(q.counts.keys()).filter((label) => !q.order.includes(label)),
    ];
    const options: OptionBreakdown[] = labels.map((label) => {
      const entry = q.counts.get(label);
      const declaredIndex = q.order.indexOf(label);
      return {
        label,
        sentiment:
          q.isScale && declaredIndex >= 0 ? classifyOption(declaredIndex, q.order.length) : null,
        count: entry?.count ?? 0,
        byProduct: entry ? Object.fromEntries(entry.byProduct) : {},
      };
    });

    const sumBy = (s: Sentiment) =>
      options.filter((o) => o.sentiment === s).reduce((sum, o) => sum + o.count, 0);

    return {
      questionText: q.questionText,
      questionType: q.questionType,
      isScale: q.isScale,
      options,
      totalAnswers: options.reduce((sum, o) => sum + o.count, 0),
      respondentCount: q.respondents,
      respondentsByProduct: Object.fromEntries(q.respondentsByProduct),
      positiveCount: sumBy("positive"),
      neutralCount: sumBy("neutral"),
      negativeCount: sumBy("negative"),
    };
  });

  return {
    products,
    questions,
    conflicts,
    globalAvgRating,
    totalResponses: responses.length,
  };
}

/**
 * One 0–100 number for how positively a scale question is answered overall.
 * Only the question's declared options carry a position on the scale, so
 * stragglers from edited option lists are left out rather than scored as the
 * worst possible answer.
 */
export function questionHealth(q: QuestionBreakdown): number | null {
  if (!q.isScale) return null;
  const declared = q.options.filter((o) => o.sentiment !== null);
  return orderedChoiceScore(declared.map((o) => o.count));
}
