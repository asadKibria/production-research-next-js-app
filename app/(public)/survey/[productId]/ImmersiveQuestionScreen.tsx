"use client";

import { useEffect, useRef, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { ZoomableImage } from "@/app/components/ZoomableImage";
import { useLanguage } from "@/app/lib/i18n/LanguageProvider";
import { getChoiceOptions, getPriceOpinionRange } from "@/app/lib/question-options";
import {
  questionRequiresRating,
  safeParseArray,
  type AnswerState,
  type WizardQuestion,
} from "./wizard-types";

const PEEK_VH = 0.32;
const SHEET_VH = 0.82;

export function ImmersiveQuestionScreen({
  question,
  productImage,
  answer,
  onChange,
  step,
  totalQuestions,
  onNext,
  onBack,
  canGoBack,
  pending,
  error,
}: {
  question: WizardQuestion;
  productImage: string | null;
  answer: AnswerState;
  onChange: (patch: Partial<AnswerState>) => void;
  step: number;
  totalQuestions: number;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  pending: boolean;
  error: string | null;
}) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [collapsedOffset, setCollapsedOffset] = useState(320);
  const sheetRef = useRef<HTMLDivElement>(null);
  const image = question.questionImage ?? productImage;
  const progressPct = Math.round((step / totalQuestions) * 100);

  useEffect(() => {
    function measure() {
      if (!sheetRef.current) return;
      const sheetHeight = sheetRef.current.offsetHeight;
      const peekHeight = window.innerHeight * PEEK_VH;
      setCollapsedOffset(Math.max(40, sheetHeight - peekHeight));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  function handleDragEnd(_e: unknown, info: PanInfo) {
    const shouldExpand = info.offset.y < -50 || info.velocity.y < -350;
    const shouldCollapse = info.offset.y > 50 || info.velocity.y > 350;
    if (shouldExpand) setExpanded(true);
    else if (shouldCollapse) setExpanded(false);
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-plum-950">
      <ZoomableImage src={image ?? "/brand/hero.jpg"} alt="" />

      {/* subtle top scrim so the floating controls stay legible on bright photos */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />

      {/* progress bar */}
      <div className="absolute inset-x-0 top-0 z-20 h-1 bg-white/20">
        <div
          className="h-full bg-cream-050 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* floating top bar */}
      <div className="absolute inset-x-0 top-4 z-20 flex items-center justify-between px-4">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack || pending}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-cream-050 backdrop-blur-md disabled:opacity-30"
          aria-label={t("wizard_back")}
        >
          <ChevronLeft />
        </button>
        <span className="rounded-full bg-black/25 px-4 py-1.5 text-xs font-medium text-cream-050 backdrop-blur-md">
          {t("wizard_question_of")} {step} {t("wizard_of")} {totalQuestions}
        </span>
        <LanguagePill />
      </div>

      {/* bottom sheet */}
      <motion.div
        ref={sheetRef}
        drag="y"
        dragConstraints={{ top: 0, bottom: collapsedOffset }}
        dragElastic={0.12}
        animate={{ y: expanded ? 0 : collapsedOffset }}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        onDragEnd={handleDragEnd}
        style={{ height: `${SHEET_VH * 100}dvh` }}
        className="absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden rounded-t-[2rem] border-t border-white/25 bg-plum-950/55 shadow-[0_-8px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex shrink-0 flex-col items-center gap-2 pb-2 pt-3"
          aria-label="toggle"
        >
          <span className="h-1.5 w-12 rounded-full bg-white/40" />
        </button>

        <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-8">
          <h2 className="text-balance text-xl font-semibold leading-snug text-cream-050 sm:text-2xl">
            {question.questionText}
          </h2>

          {questionRequiresRating(question.questionType) || question.questionType === "rating" ? (
            <div className="mt-4">
              <GlassRatingInput
                value={answer.rating}
                onChange={(rating) =>
                  onChange(
                    question.questionType === "rating"
                      ? { rating, answerValue: String(rating) }
                      : { rating },
                  )
                }
              />
            </div>
          ) : (
            <p className="mt-2 text-sm text-cream-050/60">{t("wizard_swipe_hint")}</p>
          )}

          <div className="mt-6 flex-1">
            <GlassAnswerControl question={question} answer={answer} onChange={onChange} />
          </div>

          {error ? (
            <p className="mt-4 rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-100">{error}</p>
          ) : null}

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={!canGoBack || pending}
              className="rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-cream-050 disabled:opacity-30"
            >
              {t("wizard_back")}
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={pending}
              className="flex-1 rounded-full bg-cream-050 px-6 py-3 text-sm font-semibold text-plum-950 shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {t("wizard_next")}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function GlassRatingInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star`}
          aria-pressed={value !== null && value >= n}
          className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg transition-colors ${
            value !== null && value >= n
              ? "border-taupe-400 bg-taupe-400/90 text-plum-950"
              : "border-white/30 text-cream-050/70"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function GlassAnswerControl({
  question,
  answer,
  onChange,
}: {
  question: WizardQuestion;
  answer: AnswerState;
  onChange: (patch: Partial<AnswerState>) => void;
}) {
  const { t } = useLanguage();

  if (question.questionType === "text") {
    return (
      <textarea
        value={answer.answerValue ?? ""}
        onChange={(e) => onChange({ answerValue: e.target.value })}
        rows={4}
        placeholder={t("wizard_text_placeholder")}
        className="w-full rounded-2xl border border-white/25 bg-white/10 p-4 text-sm text-cream-050 placeholder:text-cream-050/40 outline-none focus:border-white/50"
      />
    );
  }

  if (question.questionType === "rating") {
    return null;
  }

  if (question.questionType === "price_opinion") {
    const range = getPriceOpinionRange(question.optionsRaw);
    const value = answer.answerValue ? Number(answer.answerValue) : range.min;
    return (
      <div className="flex flex-col gap-3">
        <input
          type="range"
          min={range.min}
          max={range.max}
          step={range.step}
          value={value}
          onChange={(e) => onChange({ answerValue: e.target.value })}
          className="w-full"
          style={{ accentColor: "#d2bcaf" }}
        />
        <span className="font-display text-2xl font-semibold text-cream-050">
          {t("price_opinion_currency")} {value}
        </span>
      </div>
    );
  }

  const options = getChoiceOptions(question.questionType, question.optionsRaw);

  if (question.questionType === "checkbox") {
    const selected = answer.answerValue ? safeParseArray(answer.answerValue) : [];
    return (
      <div className="flex flex-col gap-2.5">
        {options.map((opt) => {
          const checked = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                const next = checked ? selected.filter((o) => o !== opt) : [...selected, opt];
                onChange({ answerValue: JSON.stringify(next) });
              }}
              aria-pressed={checked}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm transition-colors ${
                checked
                  ? "border-cream-050 bg-cream-050 text-plum-950"
                  : "border-white/25 bg-white/5 text-cream-050"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                  checked ? "border-plum-950 bg-plum-950 text-cream-050" : "border-white/40"
                }`}
              >
                {checked ? <CheckIcon /> : null}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt) => {
        const checked = answer.answerValue === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange({ answerValue: opt })}
            aria-pressed={checked}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm transition-colors ${
              checked
                ? "border-cream-050 bg-cream-050 text-plum-950"
                : "border-white/25 bg-white/5 text-cream-050"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                checked ? "border-plum-950" : "border-white/40"
              }`}
            >
              {checked ? <span className="h-2.5 w-2.5 rounded-full bg-plum-950" /> : null}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function LanguagePill() {
  const { locale, setLocale, t } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "bn" ? "en" : "bn")}
      className="rounded-full bg-black/25 px-4 py-1.5 text-xs font-medium text-cream-050 backdrop-blur-md"
    >
      {t("nav_lang_toggle")}
    </button>
  );
}

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
