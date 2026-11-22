import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { FlashcardQuestion, InputQuestion, MatchQuestion, McQuestion } from '../data/schema';
import type { CalcTask } from '../generators';
import { anyAnswerMatches, answerMatches } from '../lib/compare';
import type { Result } from '../lib/progress';
import { CodeBlock, RichText } from './CodeBlock';
import { IconCheck, IconFlip, IconX } from './Icons';

export interface Outcome {
  result: Result;
  /** 0 … 1, für Punkte in der Prüfung */
  score: number;
  /** Eingaben, damit die Karte beim Zurückblättern so aussieht wie beantwortet */
  detail?: unknown;
  /** „Keine Ahnung“ gedrückt: zählt als falsch, Lösung wird ausführlich erklärt */
  dontKnow?: boolean;
}

export interface ViewProps<Q> {
  q: Q;
  outcome: Outcome | null;
  onAnswer: (o: Outcome) => void;
  /** Prüfungsmodus: nach dem Antworten keine richtig/falsch-Markierung */
  hideCorrection?: boolean;
  /** Bedienknöpfe für die Daumenleiste unten */
  setActions: (node: ReactNode) => void;
}

const fromScore = (score: number): Result => (score >= 0.999 ? 'correct' : score > 0 ? 'partial' : 'wrong');

const primaryBtn =
  'w-full rounded-2xl bg-teal-700 px-5 py-4 text-lg font-semibold text-white shadow-soft transition active:scale-[0.98] disabled:opacity-40 dark:bg-teal-600';

function shuffledOrder(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Prompt({ text, code }: { text: string; code?: { lang: string; src: string } }) {
  return (
    <div className="space-y-3">
      <h2 className="text-[19px] font-semibold leading-snug text-balance">
        <RichText text={text} />
      </h2>
      {code && <CodeBlock lang={code.lang} src={code.src} />}
    </div>
  );
}

/* ---------------- Multiple Choice ---------------- */

export function McView({ q, outcome, onAnswer, hideCorrection, setActions }: ViewProps<McQuestion>) {
  const detail = outcome?.detail as { order: number[]; chosen: number } | undefined;
  const [order] = useState(() => detail?.order ?? shuffledOrder(q.choices.length));
  useEffect(() => setActions(null), [setActions]);
  const chosen = detail?.chosen;
  return (
    <div className="space-y-4">
      <Prompt text={q.prompt} code={q.code} />
      <div className="space-y-2.5" role="list">
        {order.map((idx, pos) => {
          const isChosen = chosen === idx;
          const isCorrect = idx === q.correct;
          let cls = 'border-stone-200 bg-white active:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:active:bg-stone-800';
          let mark: ReactNode = (
            <span className="grid size-7 shrink-0 place-items-center rounded-full border border-stone-300 text-xs font-bold text-stone-500 dark:border-stone-600">
              {String.fromCharCode(65 + pos)}
            </span>
          );
          if (outcome && !hideCorrection) {
            if (isCorrect) {
              cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50';
              mark = <IconCheck size={28} className="shrink-0 text-emerald-600 dark:text-emerald-400" />;
            } else if (isChosen) {
              cls = 'border-rose-500 bg-rose-50 dark:bg-rose-950/50';
              mark = <IconX size={28} className="shrink-0 text-rose-600 dark:text-rose-400" />;
            } else cls = 'border-stone-200 opacity-60 dark:border-stone-800';
          } else if (outcome && isChosen) {
            cls = 'border-teal-600 bg-teal-50 dark:bg-teal-950/50';
          }
          return (
            <button
              key={idx}
              role="listitem"
              disabled={!!outcome}
              onClick={() => onAnswer({ result: isCorrect ? 'correct' : 'wrong', score: isCorrect ? 1 : 0, detail: { order, chosen: idx } })}
              className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[16px] leading-snug transition ${cls}`}
            >
              {mark}
              <span className="flex-1">
                <RichText text={q.choices[idx]} />
              </span>
              {outcome && !hideCorrection && isChosen && (
                <span className="text-xs font-semibold uppercase opacity-70">deine Wahl</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Eingabe ---------------- */

const inputModeFor = (mode: string) => (mode === 'number' ? 'decimal' : 'text');

export function InputView({ q, outcome, onAnswer, hideCorrection, setActions }: ViewProps<InputQuestion>) {
  const [value, setValue] = useState((outcome?.detail as string) ?? '');
  const ref = useRef<HTMLInputElement>(null);
  const submit = () => {
    if (!value.trim()) return;
    const ok = anyAnswerMatches(value, q.accepted, q.compare);
    onAnswer({ result: ok ? 'correct' : 'wrong', score: ok ? 1 : 0, detail: value });
  };
  const submitRef = useRef(submit);
  submitRef.current = submit;
  useEffect(() => {
    setActions(
      outcome ? null : (
        <button className={primaryBtn} disabled={!value.trim()} onClick={() => submitRef.current()}>
          Prüfen
        </button>
      ),
    );
  }, [outcome, value, setActions]);
  const ok = outcome?.result === 'correct';
  return (
    <div className="space-y-4">
      <Prompt text={q.prompt} code={q.code} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
          ref.current?.blur();
        }}
      >
        <label className="block">
          <span className="sr-only">Deine Antwort</span>
          <div
            className={`flex items-center rounded-2xl border-2 bg-white px-4 dark:bg-stone-900 ${
              outcome && !hideCorrection
                ? ok
                  ? 'border-emerald-500'
                  : 'border-rose-500'
                : 'border-stone-200 focus-within:border-teal-600 dark:border-stone-700'
            }`}
          >
            <input
              ref={ref}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={!!outcome}
              inputMode={inputModeFor(q.compare)}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="done"
              placeholder={q.placeholder ?? 'Antwort eingeben'}
              className="min-w-0 flex-1 bg-transparent py-4 font-mono text-lg outline-none placeholder:font-sans placeholder:text-stone-400"
            />
            {q.unit && <span className="pl-2 text-stone-500">{q.unit}</span>}
            {outcome && !hideCorrection && (ok ? <IconCheck className="ml-2 text-emerald-600" /> : <IconX className="ml-2 text-rose-600" />)}
          </div>
        </label>
      </form>
    </div>
  );
}

/* ---------------- Zuordnung ---------------- */

export function MatchView({ q, outcome, onAnswer, hideCorrection, setActions }: ViewProps<MatchQuestion>) {
  const detail = outcome?.detail as { picks: Record<number, string>; order: number[] } | undefined;
  const [order] = useState(() => detail?.order ?? shuffledOrder(q.pairs.length));
  const [picks, setPicks] = useState<Record<number, string>>(detail?.picks ?? {});
  const options = useMemo(() => {
    const opts = q.options ?? [...new Set(q.pairs.map((p) => p.right))];
    // Sortieren, damit die Reihenfolge nichts verrät
    return [...opts].sort((a, b) => a.localeCompare(b, 'de', { numeric: true }));
  }, [q]);
  const chips = options.length <= 4 && options.every((o) => o.length <= 28);
  const complete = q.pairs.every((_, i) => picks[i]);
  const submit = () => {
    const right = q.pairs.filter((p, i) => picks[i] === p.right).length;
    const score = right / q.pairs.length;
    onAnswer({ result: fromScore(score), score, detail: { picks, order } });
  };
  const submitRef = useRef(submit);
  submitRef.current = submit;
  useEffect(() => {
    setActions(
      outcome ? null : (
        <button className={primaryBtn} disabled={!complete} onClick={() => submitRef.current()}>
          Prüfen
        </button>
      ),
    );
  }, [outcome, complete, setActions]);

  return (
    <div className="space-y-4">
      <Prompt text={q.prompt} code={q.code} />
      <ul className="space-y-2.5">
        {order.map((i) => {
          const pair = q.pairs[i];
          const pick = picks[i];
          const ok = pick === pair.right;
          const showMark = outcome && !hideCorrection;
          return (
            <li
              key={i}
              className={`rounded-2xl border-2 bg-white p-3 dark:bg-stone-900 ${
                showMark ? (ok ? 'border-emerald-500' : 'border-rose-500') : 'border-stone-200 dark:border-stone-700'
              }`}
            >
              <div className="mb-2 flex items-start gap-2 font-medium">
                {showMark && (ok ? <IconCheck className="mt-0.5 shrink-0 text-emerald-600" /> : <IconX className="mt-0.5 shrink-0 text-rose-600" />)}
                <RichText text={pair.left} />
              </div>
              {chips ? (
                <div className="flex flex-wrap gap-2">
                  {options.map((o) => (
                    <button
                      key={o}
                      disabled={!!outcome}
                      onClick={() => setPicks((p) => ({ ...p, [i]: o }))}
                      aria-pressed={pick === o}
                      className={`min-h-11 rounded-xl px-3.5 py-2 text-[15px] font-medium transition ${
                        pick === o
                          ? 'bg-teal-700 text-white dark:bg-teal-600'
                          : 'bg-stone-100 text-stone-700 active:bg-stone-200 dark:bg-stone-800 dark:text-stone-200'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              ) : (
                <select
                  value={pick ?? ''}
                  disabled={!!outcome}
                  onChange={(e) => setPicks((p) => ({ ...p, [i]: e.target.value }))}
                  className="min-h-12 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 dark:border-stone-700 dark:bg-stone-800"
                >
                  <option value="" disabled>
                    Auswählen …
                  </option>
                  {options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}
              {showMark && !ok && (
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
                  Richtig: <strong>{pair.right}</strong>
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------------- Karteikarte ---------------- */

const RATE: { result: Result; label: string; cls: string; Icon: typeof IconCheck }[] = [
  { result: 'wrong', label: 'Nicht gewusst', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200', Icon: IconX },
  { result: 'partial', label: 'Unsicher', cls: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200', Icon: IconFlip },
  { result: 'correct', label: 'Gewusst', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200', Icon: IconCheck },
];

export function FlashcardView({ q, outcome, onAnswer, setActions }: ViewProps<FlashcardQuestion>) {
  const [flipped, setFlipped] = useState(!!outcome);
  useEffect(() => {
    if (outcome) return setActions(null);
    setActions(
      flipped ? (
        <div className="grid grid-cols-3 gap-2">
          {RATE.map((r) => (
            <button
              key={r.result}
              onClick={() => onAnswer({ result: r.result, score: r.result === 'correct' ? 1 : r.result === 'partial' ? 0.5 : 0 })}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-sm font-semibold transition active:scale-95 ${r.cls}`}
            >
              <r.Icon size={22} />
              {r.label}
            </button>
          ))}
        </div>
      ) : (
        <button className={primaryBtn} onClick={() => setFlipped(true)}>
          Aufdecken
        </button>
      ),
    );
  }, [flipped, outcome, onAnswer, setActions]);

  const face = 'rounded-3xl bg-white p-6 shadow-lift dark:bg-stone-900 min-h-64 flex flex-col';
  return (
    <div className={`flip ${flipped ? 'flipped' : ''}`}>
      <div className="flip-inner">
        <button
          type="button"
          className={`${face} text-left`}
          onClick={() => setFlipped(true)}
          aria-hidden={flipped}
          tabIndex={flipped ? -1 : 0}
        >
          <span className="mb-3 text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">Karteikarte</span>
          <Prompt text={q.prompt} code={q.code} />
          <span className="mt-auto flex items-center gap-1.5 pt-6 text-sm text-stone-500">
            <IconFlip size={16} /> Tippen zum Umdrehen
          </span>
        </button>
        <div className={`${face} flip-back`} aria-hidden={!flipped}>
          <span className="mb-3 text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">Antwort</span>
          <p className="text-[17px] font-semibold leading-relaxed">
            <RichText text={q.answer} />
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-stone-600 dark:text-stone-300">
            <RichText text={q.explanation} />
          </p>
          {!outcome && <p className="mt-auto pt-6 text-sm text-stone-500">Wie gut wusstest du es?</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Rechenaufgabe ---------------- */

export function CalcView({ q, outcome, onAnswer, hideCorrection, setActions }: ViewProps<CalcTask>) {
  const [values, setValues] = useState<Record<string, string>>((outcome?.detail as Record<string, string>) ?? {});
  const complete = q.fields.every((f) => values[f.key]?.trim());
  const check = (key: string) => {
    const f = q.fields.find((x) => x.key === key)!;
    return answerMatches(values[key] ?? '', f.answer, f.compare, { ...f, germanExpected: true });
  };
  const submit = () => {
    const right = q.fields.filter((f) => check(f.key)).length;
    const score = right / q.fields.length;
    onAnswer({ result: fromScore(score), score, detail: values });
  };
  const submitRef = useRef(submit);
  submitRef.current = submit;
  useEffect(() => {
    setActions(
      outcome ? null : (
        <button className={primaryBtn} disabled={!complete} onClick={() => submitRef.current()}>
          Prüfen
        </button>
      ),
    );
  }, [outcome, complete, setActions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
        Rechenaufgabe · {q.title}
      </div>
      <Prompt text={q.prompt} />
      <form
        className="space-y-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (complete) submit();
        }}
      >
        {q.fields.map((f) => {
          const ok = outcome ? check(f.key) : null;
          const mark = outcome && !hideCorrection;
          return (
            <label key={f.key} className="block">
              <span className="mb-1 block text-sm font-medium text-stone-600 dark:text-stone-300">{f.label}</span>
              <div
                className={`flex items-center rounded-2xl border-2 bg-white px-4 dark:bg-stone-900 ${
                  mark ? (ok ? 'border-emerald-500' : 'border-rose-500') : 'border-stone-200 focus-within:border-teal-600 dark:border-stone-700'
                }`}
              >
                <input
                  value={values[f.key] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  disabled={!!outcome}
                  inputMode={inputModeFor(f.compare)}
                  autoCapitalize="off"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={f.placeholder ?? '…'}
                  className="min-w-0 flex-1 bg-transparent py-3.5 font-mono text-[17px] outline-none placeholder:text-stone-400"
                />
                {f.unit && <span className="pl-2 text-stone-500">{f.unit}</span>}
                {mark && (ok ? <IconCheck className="ml-2 text-emerald-600" /> : <IconX className="ml-2 text-rose-600" />)}
              </div>
              {mark && !ok && (
                <span className="mt-1 block text-sm text-stone-600 dark:text-stone-300">
                  Richtig: <strong className="font-mono">{f.answer}</strong> {f.unit}
                </span>
              )}
            </label>
          );
        })}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </div>
  );
}
