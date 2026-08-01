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

// Stars belong to exactly one question — the dedicated `rating` one ("overall
// quality"). Asking for a star score alongside every choice made the wizard
// feel like homework and produced averages nobody could interpret. Every other
// type is already a complete answer on its own. Kept in sync with
// `submitResponse` in app/lib/actions/wizard.ts.
export function questionRequiresRating(questionType: QuestionType): boolean {
  return questionType === "rating";
}

// Free text is the one question nobody should be forced to answer — a customer
// with nothing extra to say should still be able to move on. Kept in sync with
// `submitResponse` in app/lib/actions/wizard.ts.
export function questionIsOptional(questionType: QuestionType): boolean {
  return questionType === "text";
}

export function isAnswerValid(question: WizardQuestion, answer: AnswerState): boolean {
  if (questionIsOptional(question.questionType)) return true;

  // The rating question is answered by the stars themselves, and a star score
  // is mandatory — it is what the whole product ranking is built on.
  if (questionRequiresRating(question.questionType)) {
    return typeof answer.rating === "number" && answer.rating >= 1 && answer.rating <= 5;
  }

  return Boolean(answer.answerValue && answer.answerValue.trim().length > 0);
}

export function safeParseArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
