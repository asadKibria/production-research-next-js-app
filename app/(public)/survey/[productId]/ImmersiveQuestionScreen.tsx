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
/** Upper bound only — the sheet is otherwise sized by its own content. */
const SHEET_MAX_VH = 0.86;
const HINT_SEEN_KEY = "hizjaab_sheet_hint_seen";
const ZOOM_COACH_KEY = "hizjaab_zoom_coach_seen";

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
  const [collapsedOffset, setCollapsedOffset] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showZoomCoach, setShowZoomCoach] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const image = question.questionImage ?? productImage;
  const progressPct = Math.round((step / totalQuestions) * 100);

  // The sheet is content-sized, so remeasure whenever that content changes
  // (option lists differ per question, and an error message can appear).
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const measure = () => {
      const peekHeight = window.innerHeight * PEEK_VH;
      setCollapsedOffset(Math.max(0, el.offsetHeight - peekHeight));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Coach the swipe once per session, and never again after it is understood.
  // Deferred a beat so the hint animates in rather than appearing mid-paint,
  // and so sessionStorage is only read on the client.
  useEffect(() => {
    if (sessionStorage.getItem(HINT_SEEN_KEY)) return;
    const timer = setTimeout(() => setShowHint(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // The zoom gesture gets its own one-off coach mark, and only fades in after a
  // beat so it never competes with the photo landing.
  useEffect(() => {
    if (sessionStorage.getItem(ZOOM_COACH_KEY)) return;
    const show = setTimeout(() => setShowZoomCoach(true), 900);
    const hide = setTimeout(() => {
      setShowZoomCoach(false);
      sessionStorage.setItem(ZOOM_COACH_KEY, "1");
    }, 6000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  function markHintSeen() {
    setShowHint(false);
    sessionStorage.setItem(HINT_SEEN_KEY, "1");
  }

  function open() {
    setExpanded(true);
    markHintSeen();
  }

  function handleDragEnd(_e: unknown, info: PanInfo) {
    const shouldExpand = info.offset.y < -40 || info.velocity.y < -300;
    const shouldCollapse = info.offset.y > 40 || info.velocity.y > 300;
    if (shouldExpand) open();
    else if (shouldCollapse) setExpanded(false);
  }

  // Nothing to drag when the whole sheet already fits in the peek height.
  const draggable = collapsedOffset > 8;

  return (
    <div className="fixed inset-0 overflow-hidden bg-plum-950">
      <ZoomableImage
        src={image ?? "/brand/hero.jpg"}
        alt=""
        coachMark={showZoomCoach ? <ZoomCoachMark label={t("wizard_zoom_coach")} /> : null}
      />

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
        drag={draggable ? "y" : false}
        dragConstraints={{ top: 0, bottom: collapsedOffset }}
        dragElastic={0.06}
        dragMomentum={false}
        animate={{ y: expanded || !draggable ? 0 : collapsedOffset }}
        transition={{ type: "spring", damping: 30, stiffness: 420, mass: 0.7 }}
        style={{ maxHeight: `${SHEET_MAX_VH * 100}dvh`, willChange: "transform" }}
        onDragEnd={handleDragEnd}
        /*
          No backdrop-blur here. A blurred backdrop over a full-bleed photo has
          to be recomposited every frame of the drag, which is what made this
          sheet crawl on phones. A near-opaque background reads the same and
          keeps the drag on the compositor.
        */
        className="absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden rounded-t-[2rem] border-t border-white/20 bg-plum-950/95 shadow-[0_-8px_40px_rgba(0,0,0,0.45)]"
      >
        <button
          type="button"
          onClick={() => (expanded ? setExpanded(false) : open())}
          className="relative flex shrink-0 flex-col items-center gap-1 pb-2 pt-3"
          aria-label={t("wizard_drag_up_hint")}
          aria-expanded={expanded}
        >
          <span
            className={`h-1.5 w-12 rounded-full transition-colors ${
              showHint && !expanded ? "bg-cream-050" : "bg-white/40"
            }`}
          />
          {showHint && !expanded && draggable ? (
            <motion.span
              className="flex items-center gap-1.5 text-[11px] font-medium text-cream-050/90"
              animate={{ y: [0, -5, 0], opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronUp />
              {t("wizard_drag_up_hint")}
            </motion.span>
          ) : null}
        </button>

        <div className="flex flex-col overflow-y-auto overscroll-contain px-6 pb-8">
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

          <div className="mt-6">
            <GlassAnswerControl question={question} answer={answer} onChange={onChange} />
          </div>

          {error ? (
            <p className="mt-4 rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-100">{error}</p>
          ) : null}

          {/* Sits directly under the answers — no stretched gap above it */}
          <div className="mt-6 flex items-center gap-3">
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

/**
 * Pinch gesture hint. Sits above the photo, below the sheet, and is removed by
 * ZoomableImage as soon as the customer touches the image.
 */
function ZoomCoachMark({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="pointer-events-none absolute left-1/2 top-[22%] z-10 flex -translate-x-1/2 flex-col items-center gap-2.5"
    >
      <motion.span
        className="flex h-16 w-16 items-center justify-center rounded-full border border-white/50 bg-black/25 text-cream-050"
        animate={{ scale: [1, 0.78, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M11 8v6M8 11h6M20 20l-4.5-4.5" strokeLinecap="round" />
        </svg>
      </motion.span>
      <span className="max-w-[15rem] rounded-full bg-black/45 px-3.5 py-1.5 text-center text-[11px] font-medium leading-snug text-cream-050">
        {label}
      </span>
    </motion.div>
  );
}

function ChevronUp() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
