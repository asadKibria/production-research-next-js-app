/**
 * Pure helpers for turning raw survey answers into numbers an admin can act on.
 * No database access here on purpose — both the dashboard and the insights page
 * feed their own query results through these, so the two can never drift.
 */

/** A choice sitting on the positive-to-negative scale of its question. */
export type Sentiment = "positive" | "neutral" | "negative";

/**
 * Scores a choice by where it sits in its question's option list, on a 0–1
 * scale. This assumes options are configured best-first, which is how every
 * default template is written ("খুব ভালো" → "ভালো লাগেনি", "অবশ্যই কিনব" →
 * "অবশ্যই কিনব না"). The insights page says so out loud rather than hiding it,
 * because an admin who lists options worst-first would otherwise read the
 * numbers upside down.
 */
export function optionWeight(index: number, total: number): number {
  if (total <= 1) return 1;
  return 1 - index / (total - 1);
}

/**
 * Bands the 0–1 weight into three buckets. The cut points are chosen so the
 * real question shapes land where a human would put them: on a 4-option
 * question the top two are positive, the third neutral, the last negative; on
 * the 5-option purchase-intent question both "কিনব না" options are negative.
 */
export function classifyWeight(weight: number): Sentiment {
  if (weight >= 0.6) return "positive";
  if (weight <= 0.3) return "negative";
  return "neutral";
}

export function classifyOption(index: number, total: number): Sentiment {
  return classifyWeight(optionWeight(index, total));
}

/**
 * Share of answers landing on the two most positive options — the "top-2-box"
 * number market research runs on. It is far more decisive than an average,
 * because "অবশ্যই কিনব" and "সম্ভবত কিনব" are the only answers that ever turn
 * into an order.
 */
export function topTwoBoxShare(counts: number[]): number | null {
  const total = counts.reduce((sum, c) => sum + c, 0);
  if (total === 0) return null;
  const boxes = counts.length >= 4 ? 2 : 1;
  const top = counts.slice(0, boxes).reduce((sum, c) => sum + c, 0);
  return (top / total) * 100;
}

/** Weighted 0–100 score across an ordered option list. */
export function orderedChoiceScore(counts: number[]): number | null {
  const total = counts.reduce((sum, c) => sum + c, 0);
  if (total === 0) return null;
  const weighted = counts.reduce(
    (sum, count, index) => sum + count * optionWeight(index, counts.length),
    0,
  );
  return (weighted / total) * 100;
}

export function median(values: number[]): number | null {
  return percentile(values, 50);
}

/** Nearest-rank percentile. Returns null for an empty sample. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (rank - lower);
}

/**
 * Pulls a small sample's average toward the overall average, so a product with
 * three five-star responses does not outrank one with forty responses at 4.4.
 * `priorWeight` is "how many imaginary average responses to add" — 5 is enough
 * to stop a 1–3 response product from topping the board without muting a
 * product that has genuinely been rated by a crowd.
 */
export function bayesianAverage(
  sum: number,
  count: number,
  prior: number,
  priorWeight = 5,
): number | null {
  if (count === 0) return null;
  return (prior * priorWeight + sum) / (priorWeight + count);
}
