export type QuestionType =
  | "multiple_choice"
  | "checkbox"
  | "text"
  | "rating"
  | "price_opinion"
  | "purchase_intent";

export type WizardQuestion = {
  id: string;
  questionText: string;
  questionType: QuestionType;
  questionImage: string | null;
  optionsRaw: string | null;
};

export type AnswerState = { answerValue: string | null; rating: number | null };

export const EMPTY_ANSWER: AnswerState = { answerValue: null, rating: null };

// Only choice-style questions need a separate star rating alongside the
// answer. Free text, price opinion, and purchase intent are already a
// complete qualitative/quantitative answer on their own.
export function questionRequiresRating(questionType: QuestionType): boolean {
  return questionType === "multiple_choice" || questionType === "checkbox";
}

export function isAnswerValid(question: WizardQuestion, answer: AnswerState): boolean {
  const hasAnswer =
    question.questionType === "rating"
      ? true
      : Boolean(answer.answerValue && answer.answerValue.trim().length > 0);

  if (!questionRequiresRating(question.questionType)) return hasAnswer;

  const hasRating = typeof answer.rating === "number" && answer.rating >= 1 && answer.rating <= 5;
  return hasRating && hasAnswer;
}

export function safeParseArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
