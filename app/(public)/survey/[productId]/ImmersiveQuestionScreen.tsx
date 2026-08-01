"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ZoomableImage } from "@/app/components/ZoomableImage";
import { useLanguage } from "@/app/lib/i18n/LanguageProvider";
import { getChoiceOptions, getPriceOpinionRange } from "@/app/lib/question-options";
import {
  questionIsOptional,
  questionRequiresRating,
  safeParseArray,
  type AnswerState,
  type WizardQuestion,
} from "./wizard-types";

/** Upper bound only — the sheet is otherwise sized by its own content. */
const SHEET_MAX_VH = 0.86;
/** Travel before a touch counts as a drag instead of a tap. */
const DRAG_THRESHOLD = 5;
/** Travel that commits to the other state on release. */
const SNAP_DISTANCE = 44;
/** px/ms — a flick this fast commits regardless of how far it travelled. */
const SNAP_VELOCITY = 0.4;
const SETTLE_MS = 300;
const SETTLE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

const SHEET_OPENS_KEY = "hizjaab_sheet_opens";
/** Once the sheet has been opened this many times, the customer knows. */
const HINT_MAX_OPENS = 3;
const ZOOM_USED_KEY = "hizjaab_zoom_used";
const ZOOM_COACH_SHOWN_KEY = "hizjaab_zoom_coach_shown";
const ZOOM_COACH_MAX = 3;
/** Long enough to read a full Bangla sentence and act on it. */
const ZOOM_COACH_MS = 11000;

/* The first measurement has to land before the browser paints, otherwise the
   sheet flashes open on load. useLayoutEffect would warn during SSR, so it is
   only picked up on the client. */
const useMeasureEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function readCount(key: string) {
  const raw = sessionStorage.getItem(key);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

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
  const headerRef = useRef<HTMLDivElement>(null);
  const image = question.questionImage ?? productImage;
  const progressPct = Math.round((step / totalQuestions) * 100);

  /*
    The sheet is dragged by hand rather than by framer-motion. Every frame of a
    drag writes straight to the node's transform — no React render, no
    per-frame constraint measuring — which is what makes it keep up with the
    finger on a mid-range phone. Only the resting state lives in React.
  */
  const offsetRef = useRef(0);
  const collapsedOffsetRef = useRef(0);
  const expandedRef = useRef(false);
  const settledRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    startOffset: number;
    lastY: number;
    lastTime: number;
    velocity: number;
    moved: boolean;
  } | null>(null);
  /** A finished drag must not turn into a tap on whatever was under the finger. */
  const suppressClickRef = useRef(false);

  const applyOffset = useCallback((y: number, animate: boolean) => {
    const el = sheetRef.current;
    if (!el) return;
    offsetRef.current = y;
    el.style.transition = animate ? `transform ${SETTLE_MS}ms ${SETTLE_EASING}` : "none";
    el.style.transform = `translate3d(0, ${y}px, 0)`;
  }, []);

  const settle = useCallback(
    (next: boolean) => {
      expandedRef.current = next;
      applyOffset(next ? 0 : collapsedOffsetRef.current, true);
      setExpanded(next);
      if (next) {
        const opens = readCount(SHEET_OPENS_KEY) + 1;
        sessionStorage.setItem(SHEET_OPENS_KEY, String(opens));
        setShowHint(false);
      }
    },
    [applyOffset],
  );

  // The sheet is content-sized and the collapsed peek is exactly its header, so
  // remeasure whenever either changes (option lists differ per question, an
  // error message can appear, the keyboard can resize the viewport).
  useMeasureEffect(() => {
    const sheet = sheetRef.current;
    const header = headerRef.current;
    if (!sheet || !header) return;
    const measure = () => {
      const offset = Math.max(0, sheet.offsetHeight - header.offsetHeight);
      collapsedOffsetRef.current = offset;
      setCollapsedOffset(offset);
      if (!dragRef.current) {
        applyOffset(expandedRef.current ? 0 : offset, settledRef.current);
        settledRef.current = true;
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sheet);
    observer.observe(header);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [applyOffset]);

  // Coach the swipe until the customer has clearly got it, then stop for good.
  // Deferred a beat so the hint animates in rather than appearing mid-paint,
  // and so sessionStorage is only read on the client.
  useEffect(() => {
    if (readCount(SHEET_OPENS_KEY) >= HINT_MAX_OPENS) return;
    const timer = setTimeout(() => setShowHint(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // The zoom gesture gets its own coach mark. It stays up long enough to read,
  // and only stops appearing once the customer has actually zoomed once.
  useEffect(() => {
    if (sessionStorage.getItem(ZOOM_USED_KEY)) return;
    if (readCount(ZOOM_COACH_SHOWN_KEY) >= ZOOM_COACH_MAX) return;
    const show = setTimeout(() => {
      setShowZoomCoach(true);
      sessionStorage.setItem(ZOOM_COACH_SHOWN_KEY, String(readCount(ZOOM_COACH_SHOWN_KEY) + 1));
    }, 700);
    const hide = setTimeout(() => setShowZoomCoach(false), 700 + ZOOM_COACH_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  function handleZoomUsed() {
    sessionStorage.setItem(ZOOM_USED_KEY, "1");
    setShowZoomCoach(false);
  }

  // Nothing to drag when the whole sheet already fits above the fold.
  const draggable = collapsedOffset > 8;

  function handlePointerDown(e: React.PointerEvent) {
    if (!draggable || dragRef.current) return;
    suppressClickRef.current = false;
    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startOffset: offsetRef.current,
      lastY: e.clientY,
      lastTime: e.timeStamp,
      velocity: 0,
      moved: false,
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const travelled = e.clientY - drag.startY;

    if (!drag.moved) {
      if (Math.abs(travelled) < DRAG_THRESHOLD) return;
      drag.moved = true;
      // Mouse pointers have no implicit capture, so take it explicitly once we
      // know this is a real drag — before that, capture would eat the tap.
      try {
        headerRef.current?.setPointerCapture(e.pointerId);
      } catch {
        // pointer already gone; the drag still works without capture
      }
    }

    const dt = e.timeStamp - drag.lastTime;
    if (dt > 0) drag.velocity = (e.clientY - drag.lastY) / dt;
    drag.lastY = e.clientY;
    drag.lastTime = e.timeStamp;

    // Rubber band past both ends so the sheet never feels stuck.
    const max = collapsedOffsetRef.current;
    const raw = drag.startOffset + travelled;
    const y = raw < 0 ? raw * 0.25 : raw > max ? max + (raw - max) * 0.25 : raw;
    applyOffset(y, false);
  }

  function handlePointerUp(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    try {
      if (headerRef.current?.hasPointerCapture(e.pointerId)) {
        headerRef.current.releasePointerCapture(e.pointerId);
      }
    } catch {
      // capture was already released with the pointer
    }
    if (!drag.moved) return; // a tap — the click handler takes it from here

    suppressClickRef.current = true;
    const travelled = e.clientY - drag.startY;
    let next = expandedRef.current;
    if (drag.velocity < -SNAP_VELOCITY) next = true;
    else if (drag.velocity > SNAP_VELOCITY) next = false;
    else if (travelled < -SNAP_DISTANCE) next = true;
    else if (travelled > SNAP_DISTANCE) next = false;
    settle(next);
  }

  function handleHeaderClickCapture(e: React.MouseEvent) {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  }

  function handleHeaderClick(e: React.MouseEvent) {
    // Taps on the stars answer the question; taps on the rest of the header
    // toggle the sheet.
    if ((e.target as HTMLElement).closest("[data-sheet-control]")) return;
    if (!draggable) return;
    settle(!expandedRef.current);
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-plum-950">
      <ZoomableImage
        src={image ?? "/brand/hero.jpg"}
        alt=""
        coachMark={showZoomCoach ? <ZoomCoachMark label={t("wizard_zoom_coach")} /> : null}
        onZoom={handleZoomUsed}
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
      <div
        ref={sheetRef}
        style={{ maxHeight: `${SHEET_MAX_VH * 100}dvh`, willChange: "transform" }}
        /*
          No backdrop-blur and no translucency here. Both have to be
          recomposited over the full-bleed photo on every frame of the drag,
          which is what made this sheet crawl on phones. The opaque plum reads
          the same and keeps the drag on the compositor.
        */
        className="absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden rounded-t-[2rem] border-t border-white/20 bg-plum-950 shadow-[0_-8px_40px_rgba(0,0,0,0.45)]"
      >
        {/*
          The whole header — grabber, question and stars — is the drag surface,
          so the customer can grab anywhere in the part of the sheet they can
          actually see. touch-action:none hands every vertical pixel to us
          instead of letting the browser start a scroll first.
        */}
        <div
          ref={headerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClickCapture={handleHeaderClickCapture}
          onClick={handleHeaderClick}
          style={{ touchAction: draggable ? "none" : undefined }}
          className={`shrink-0 select-none px-6 pb-5 ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
        >
          <div className="flex flex-col items-center gap-1 pb-2 pt-3">
            <button
              type="button"
              data-sheet-control
              onClick={() => draggable && settle(!expandedRef.current)}
              aria-label={t("wizard_drag_up_hint")}
              aria-expanded={expanded}
              className="flex w-full flex-col items-center gap-1 py-1"
            >
              <span
                className={`h-1.5 w-12 rounded-full transition-colors ${
                  showHint && !expanded ? "bg-cream-050" : "bg-white/40"
                }`}
              />
              {showHint && !expanded && draggable ? (
                <span className="nudge-up flex items-center gap-1.5 pt-0.5 text-xs font-medium text-cream-050">
                  <ChevronUp />
                  {t("wizard_drag_up_hint")}
                </span>
              ) : null}
            </button>
          </div>

          <h2 className="text-balance text-xl font-semibold leading-snug text-cream-050 sm:text-2xl">
            {question.questionText}
            {questionIsOptional(question.questionType) ? (
              <span className="ml-2 whitespace-nowrap align-middle text-xs font-medium text-cream-050/60">
                {t("wizard_optional_badge")}
              </span>
            ) : null}
          </h2>

          {questionRequiresRating(question.questionType) ? (
            <div className="mt-4">
              <GlassRatingInput
                value={answer.rating}
                onChange={(rating) => onChange({ rating, answerValue: String(rating) })}
              />
            </div>
          ) : (
            <p className="mt-2 text-sm text-cream-050/60">
              {questionIsOptional(question.questionType)
                ? t("wizard_optional_hint")
                : t("wizard_swipe_hint")}
            </p>
          )}
        </div>

        <div className="flex min-h-0 flex-col overflow-y-auto overscroll-contain px-6 pb-8">
          <GlassAnswerControl question={question} answer={answer} onChange={onChange} />

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
      </div>
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
          /* Marks this as a control, so a tap here rates instead of toggling
             the sheet — while a drag that starts here still moves the sheet. */
          data-sheet-control
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
    <div className="coach-in pointer-events-none absolute left-1/2 top-[22%] z-10 flex -translate-x-1/2 flex-col items-center gap-2.5">
      <span className="coach-pulse flex h-16 w-16 items-center justify-center rounded-full border border-white/50 bg-black/25 text-cream-050">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M11 8v6M8 11h6M20 20l-4.5-4.5" strokeLinecap="round" />
        </svg>
      </span>
      <span className="max-w-[15rem] rounded-full bg-black/45 px-3.5 py-1.5 text-center text-[11px] font-medium leading-snug text-cream-050">
        {label}
      </span>
    </div>
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
