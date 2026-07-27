export type PriceOpinionRange = { min: number; max: number; step: number };

export const DEFAULT_PURCHASE_INTENT_OPTIONS: string[] = [
  "অবশ্যই কিনব",
  "সম্ভবত কিনব",
  "নিশ্চিত না",
  "সম্ভবত কিনব না",
  "অবশ্যই কিনব না",
];

export function parseOptions(raw: string | null | undefined): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function serializeOptions(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}

export function getChoiceOptions(
  questionType: string,
  raw: string | null | undefined,
): string[] {
  const parsed = parseOptions(raw);
  const isStringArray = Array.isArray(parsed) && parsed.every((v) => typeof v === "string");

  if (questionType === "purchase_intent") {
    return isStringArray && (parsed as string[]).length > 0
      ? (parsed as string[])
      : DEFAULT_PURCHASE_INTENT_OPTIONS;
  }

  return isStringArray ? (parsed as string[]) : [];
}

export function getPriceOpinionRange(raw: string | null | undefined): PriceOpinionRange {
  const parsed = parseOptions(raw) as Partial<PriceOpinionRange> | null;
  return {
    min: typeof parsed?.min === "number" ? parsed.min : 0,
    max: typeof parsed?.max === "number" ? parsed.max : 5000,
    step: typeof parsed?.step === "number" ? parsed.step : 50,
  };
}
