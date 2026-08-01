"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/lib/i18n/LanguageProvider";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { saveAnswer, submitResponse, updateCurrentStep } from "@/app/lib/actions/wizard";
import { ImmersiveQuestionScreen } from "./ImmersiveQuestionScreen";
import {
  EMPTY_ANSWER,
  isAnswerValid,
  safeParseArray,
  type AnswerState,
  type WizardQuestion,
} from "./wizard-types";

export function WizardClient({
  responseId,
  productId,
  productTitle,
  productImage,
  questions,
  initialAnswers,
  initialStep,
  initialCustomOpinion,
}: {
  responseId: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  questions: WizardQuestion[];
  initialAnswers: Record<string, AnswerState>;
  initialStep: number;
  initialCustomOpinion: string | null;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const totalSteps = questions.length + 1;
  const [step, setStep] = useState(() => Math.min(Math.max(initialStep, 1), totalSteps));
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(initialAnswers);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [customOpinion, setCustomOpinion] = useState(initialCustomOpinion ?? "");
  const opinionDraftKey = `hizjaab_opinion_${responseId}`;

  // The closing remark is typed last, when a stray refresh is most annoying, so
  // it gets the same draft treatment as the customer form.
  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(opinionDraftKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setCustomOpinion((prev) => prev || stored);
    } catch {
      // ignore unavailable storage
    }
  }, [opinionDraftKey]);

  const isReview = step === totalSteps;
  const currentQuestion = !isReview ? questions[step - 1] : null;
  const currentAnswer = currentQuestion ? (answers[currentQuestion.id] ?? EMPTY_ANSWER) : null;

  function updateAnswer(questionId: string, patch: Partial<AnswerState>) {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...(prev[questionId] ?? EMPTY_ANSWER), ...patch } }));
  }

  function handleNext() {
    if (currentQuestion) {
      const a = answers[currentQuestion.id] ?? EMPTY_ANSWER;
      if (!isAnswerValid(currentQuestion, a)) {
        setError(t("wizard_validation_error"));
        return;
      }

      setError(null);
      const nextStep = step + 1;
      startTransition(async () => {
        await saveAnswer({
          responseId,
          productQuestionId: currentQuestion.id,
          answerValue: a.answerValue,
          rating: a.rating,
          nextStep,
        });
      });
      setStep(nextStep);
    } else {
      setError(null);
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    setError(null);
    const prevStep = Math.max(1, step - 1);
    setStep(prevStep);
    startTransition(async () => {
      await updateCurrentStep(responseId, prevStep);
    });
  }

  function handleEdit(targetStep: number) {
    setError(null);
    setStep(targetStep);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await submitResponse(responseId, customOpinion);
      if (result.ok) {
        try {
          window.sessionStorage.removeItem(opinionDraftKey);
        } catch {
          // ignore unavailable storage
        }
        router.push(`/survey/${productId}/complete`);
      } else {
        setError(result.error);
        if (result.missingQuestionId) {
          const idx = questions.findIndex((q) => q.id === result.missingQuestionId);
          if (idx >= 0) setStep(idx + 1);
        }
      }
    });
  }

  if (!isReview && currentQuestion) {
    return (
      <ImmersiveQuestionScreen
        // Remount per question so each one starts fresh: collapsed sheet,
        // reset image pan/zoom — a clean prop-driven reset instead of an
        // effect reaching back into state.
        key={currentQuestion.id}
        question={currentQuestion}
        productImage={productImage}
        answer={currentAnswer ?? EMPTY_ANSWER}
        onChange={(patch) => updateAnswer(currentQuestion.id, patch)}
        step={step}
        totalQuestions={questions.length}
        onNext={handleNext}
        onBack={handleBack}
        canGoBack={step > 1}
        pending={pending}
        error={error}
      />
    );
  }

  return (
    <main className="min-h-screen bg-paper px-6 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-base font-semibold text-ink-900">{productTitle}</h1>
          <LanguageToggle />
        </div>

        <div className="mb-2 flex items-center justify-between text-sm text-ink-700">
          <span>{t("wizard_review_title")}</span>
          <span>100%</span>
        </div>
        <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-cream-200">
          <div className="h-full w-full rounded-full bg-plum-900 transition-all duration-300" />
        </div>

        {error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <ReviewStep questions={questions} answers={answers} onEdit={handleEdit} />

        {/* Closing free-text remark — never required, but easy to miss at the
            bottom of a long review list, so it gets an accent border. */}
        <div className="mt-5 rounded-2xl border-2 border-taupe-400/70 bg-taupe-400/10 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <label htmlFor="customOpinion" className="text-sm font-medium text-ink-900">
              {t("wizard_opinion_title")}
            </label>
            <span className="text-xs text-taupe-600">{t("wizard_opinion_optional")}</span>
          </div>
          <textarea
            id="customOpinion"
            value={customOpinion}
            onChange={(e) => {
              setCustomOpinion(e.target.value);
              try {
                window.sessionStorage.setItem(opinionDraftKey, e.target.value);
              } catch {
                // ignore unavailable storage
              }
            }}
            rows={3}
            maxLength={2000}
            placeholder={t("wizard_opinion_placeholder")}
            className="mt-2.5 w-full rounded-xl border border-cream-200 bg-paper p-3 text-sm leading-relaxed text-ink-900 outline-none placeholder:text-ink-700/50 focus:border-plum-700"
          />
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={pending}
            className="rounded-full border border-cream-200 px-6 py-2.5 text-sm font-medium text-ink-700 disabled:opacity-40"
          >
            {t("wizard_back")}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending}
            className="rounded-full bg-plum-900 px-8 py-2.5 text-sm font-medium text-cream-050 disabled:opacity-60"
          >
            {t("wizard_submit")}
          </button>
        </div>
      </div>
    </main>
  );
}

function ReviewStep({
  questions,
  answers,
  onEdit,
}: {
  questions: WizardQuestion[];
  answers: Record<string, AnswerState>;
  onEdit: (step: number) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-4">
      {questions.map((q, idx) => {
        const a = answers[q.id];
        const displayAnswer =
          q.questionType === "checkbox" && a?.answerValue
            ? safeParseArray(a.answerValue).join("، ")
            : (a?.answerValue ?? "—");
        return (
          <div key={q.id} className="rounded-2xl border border-cream-200 bg-cream-050 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-ink-900">{q.questionText}</p>
              <button
                type="button"
                onClick={() => onEdit(idx + 1)}
                className="shrink-0 text-xs font-medium text-plum-900 underline"
              >
                {t("wizard_edit")}
              </button>
            </div>
            <p className="mt-1 text-sm text-ink-700">{displayAnswer}</p>
            {a?.rating ? (
              <p className="mt-1 text-xs text-taupe-600">{"★".repeat(a.rating)}</p>
            ) : null}
            {!isAnswerValid(q, a ?? EMPTY_ANSWER) ? (
              <p className="mt-1 text-xs text-red-500">{t("wizard_validation_error")}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
