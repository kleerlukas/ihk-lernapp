import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { categoryById } from '../data/categories';
import { Feedback, ResultBadge } from '../components/Feedback';
import { IconArrowLeft, IconArrowRight, IconCheck, IconClock, IconClose, IconHalf, IconHelp, IconX } from '../components/Icons';
import { CalcView, FlashcardView, InputView, MatchView, McView, type Outcome } from '../components/QuestionViews';
import { useSwipe } from '../components/useSwipe';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { GRADE_TEXT, ihkGrade, type Result } from '../lib/progress';
import { calcItem, EXAM_SECONDS, MODE_TITLE, type Mode, type SessionItem } from '../lib/session';

interface Props {
  mode: Mode;
  title?: string;
  items: SessionItem[];
  onRecord: (key: string, result: Result) => void;
  onExamDone: (points: number, seconds: number) => void;
  onClose: () => void;
}

const itemCategory = (i: SessionItem) => (i.kind === 'question' ? i.question.category : i.task.category);

function ItemView(props: { item: SessionItem; outcome: Outcome | null; onAnswer: (o: Outcome) => void; hide: boolean; setActions: (n: ReactNode) => void }) {
  const { item, outcome, onAnswer, hide, setActions } = props;
  const common = { outcome, onAnswer, hideCorrection: hide, setActions };
  if (item.kind === 'calc') return <CalcView q={item.task} {...common} />;
  const q = item.question;
  switch (q.type) {
    case 'mc':
      return <McView q={q} {...common} />;
    case 'input':
      return <InputView q={q} {...common} />;
    case 'match':
      return <MatchView q={q} {...common} />;
    case 'flashcard':
      return <FlashcardView q={q} {...common} />;
  }
}

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

export function Session({ mode, title, items: initial, onRecord, onExamDone, onClose }: Props) {
  const exam = mode === 'exam';
  const [items, setItems] = useState(initial);
  const [outcomes, setOutcomes] = useState<(Outcome | null)[]>(() => initial.map(() => null));
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(initial.length === 0);
  const [actions, setActionsState] = useState<ReactNode>(null);
  const setActions = useCallback((n: ReactNode) => setActionsState(n), []);
  const requeued = useRef(new Set<string>());
  const startedAt = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const scroller = useRef<HTMLDivElement>(null);
  const [askClose, setAskClose] = useState(false);

  const item = items[index];
  const outcome = outcomes[index] ?? null;
  const elapsed = Math.floor((now - startedAt.current) / 1000);
  const remaining = EXAM_SECONDS - elapsed;

  useEffect(() => {
    if (!exam || done) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [exam, done]);

  const examPoints = useMemo(() => {
    const per = 100 / items.length;
    return Math.round(outcomes.reduce((s, o) => s + (o ? o.score * per : 0), 0) * 10) / 10;
  }, [outcomes, items.length]);

  // Refs, damit verzögerte Aufrufe (Timer, setTimeout) immer den aktuellen Stand sehen
  const outcomesRef = useRef(outcomes);
  outcomesRef.current = outcomes;
  const doneRef = useRef(done);
  doneRef.current = done;

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    if (exam) {
      const list = outcomesRef.current;
      const pts = Math.round(list.reduce((s, o) => s + (o ? (o.score * 100) / list.length : 0), 0) * 10) / 10;
      onExamDone(pts, Math.min(EXAM_SECONDS, Math.floor((Date.now() - startedAt.current) / 1000)));
    }
  }, [exam, onExamDone]);

  useEffect(() => {
    if (exam && remaining <= 0) finish();
  }, [exam, remaining, finish]);

  const onAnswer = useCallback(
    (o: Outcome) => {
      setOutcomes((prev) => prev.map((x, i) => (i === index ? o : x)));
      onRecord(item.key, o.result);
      // Falsch beantwortete Karten kommen in derselben Sitzung noch einmal (nicht in der Prüfung)
      if (!exam && o.result === 'wrong' && !requeued.current.has(item.key)) {
        requeued.current.add(item.key);
        const again = item.kind === 'calc' ? calcItem(item.generatorId) : item;
        if (again) {
          const pos = Math.min(items.length, index + 4);
          setItems((prev) => [...prev.slice(0, pos), again, ...prev.slice(pos)]);
          setOutcomes((prev) => [...prev.slice(0, pos), null, ...prev.slice(pos)]);
        }
      }
      if (exam) setTimeout(() => goNext(), 250);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, item, exam, items.length, onRecord],
  );

  const dontKnow = () => onAnswer({ result: 'wrong', score: 0, dontKnow: true });

  const goNext = () => {
    setActionsState(null);
    setIndex((i) => {
      if (i + 1 >= items.length) {
        setTimeout(finish, 0);
        return i;
      }
      return i + 1;
    });
    scroller.current?.scrollTo?.({ top: 0 });
  };
  const goPrev = () => {
    if (index === 0) return;
    setIndex(index - 1);
    scroller.current?.scrollTo?.({ top: 0 });
  };

  const swipe = useSwipe({ onLeft: goNext, onRight: goPrev, canLeft: !!outcome, canRight: index > 0 && !exam });

  if (done) {
    return <Summary mode={mode} items={items} outcomes={outcomes} points={examPoints} seconds={Math.min(elapsed, EXAM_SECONDS)} onClose={onClose} />;
  }

  const cat = categoryById(itemCategory(item));
  const answeredCount = outcomes.filter(Boolean).length;

  return (
    <div className="flex h-dvh flex-col">
      {askClose && (
        <ConfirmSheet
          title={exam ? 'Prüfung abbrechen?' : 'Sitzung beenden?'}
          text={exam ? 'Das Ergebnis wird nicht gespeichert. Deine bisherigen Antworten zählen aber für die Wiederholung.' : 'Deine bisherigen Antworten sind gespeichert.'}
          confirmLabel={exam ? 'Abbrechen' : 'Beenden'}
          danger={exam}
          onConfirm={onClose}
          onCancel={() => setAskClose(false)}
        />
      )}
      <header className="pt-safe shrink-0 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (answeredCount === 0 ? onClose() : setAskClose(true))}
            className="grid size-11 place-items-center rounded-full bg-white shadow-soft active:scale-95 dark:bg-stone-900"
            aria-label="Sitzung beenden"
          >
            <IconClose />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{title ?? MODE_TITLE[mode]}</div>
            <div className="text-xs text-stone-500 dark:text-stone-400">
              Karte {index + 1} von {items.length}
            </div>
          </div>
          {exam && (
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-sm font-semibold ${
                remaining < 300 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' : 'bg-white shadow-soft dark:bg-stone-900'
              }`}
              aria-label={`Restzeit ${fmtTime(remaining)}`}
            >
              <IconClock size={16} />
              {fmtTime(remaining)}
            </div>
          )}
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800" role="progressbar" aria-valuenow={index + 1} aria-valuemax={items.length}>
          <div className="h-full rounded-full bg-teal-600 transition-all duration-300" style={{ width: `${((index + (outcome ? 1 : 0)) / items.length) * 100}%` }} />
        </div>
      </header>

      <div ref={scroller} className="flex-1 overflow-y-auto px-4 pb-6 pt-4" {...swipe.handlers} style={{ touchAction: 'pan-y' }}>
        <div
          key={`${index}-${item.key}`}
          className="card-in mx-auto max-w-xl"
          style={{ transform: swipe.dx ? `translateX(${swipe.dx}px) rotate(${swipe.dx / 40}deg)` : undefined, transition: swipe.dx ? 'none' : 'transform .25s' }}
        >
          {cat && (
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-stone-500 dark:text-stone-400">
              <span className={`size-2 rounded-full ${cat.hue}`} aria-hidden />
              {cat.name}
            </div>
          )}
          {item.kind === 'question' && item.question.type === 'flashcard' ? (
            <ItemView item={item} outcome={outcome} onAnswer={onAnswer} hide={exam} setActions={setActions} />
          ) : (
            <div className="rounded-3xl bg-white p-5 shadow-lift dark:bg-stone-900">
              <ItemView item={item} outcome={outcome} onAnswer={onAnswer} hide={exam} setActions={setActions} />
            </div>
          )}
          {outcome && !exam && (
            <div className="mt-4">
              {item.kind === 'question' && item.question.type === 'flashcard' ? (
                <div className="fade-up space-y-3">
                  <ResultBadge
                    result={outcome.result}
                    label={{ correct: 'Gewusst', partial: 'Unsicher', wrong: 'Nicht gewusst' }[outcome.result]}
                  />
                  <Feedback item={item} result={outcome.result} score={outcome.score} compact />
                </div>
              ) : (
                <Feedback item={item} result={outcome.result} score={outcome.score} dontKnow={outcome.dontKnow} />
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="pb-safe shrink-0 border-t border-stone-200/70 bg-stone-100/90 px-4 pt-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
        <div className="mx-auto max-w-xl">
          {outcome ? (
            <div className="flex gap-2">
              {!exam && index > 0 && (
                <button onClick={goPrev} className="grid size-14 place-items-center rounded-2xl bg-white shadow-soft active:scale-95 dark:bg-stone-900" aria-label="Zurück">
                  <IconArrowLeft />
                </button>
              )}
              <button
                onClick={goNext}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 py-4 text-lg font-semibold text-white shadow-soft active:scale-[0.98] dark:bg-teal-600"
              >
                {index + 1 >= items.length ? 'Abschließen' : 'Weiter'} <IconArrowRight />
              </button>
            </div>
          ) : (
            <div className="flex items-stretch gap-2">
              {!(item.kind === 'question' && item.question.type === 'flashcard') && (
                <button
                  onClick={dontKnow}
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-white px-4 py-3 text-[15px] font-semibold text-stone-700 shadow-soft active:scale-[0.97] dark:bg-stone-900 dark:text-stone-200"
                >
                  <IconHelp size={20} /> Keine Ahnung
                </button>
              )}
              <div className="min-w-0 flex-1">
                {actions ?? (
                  <p className="flex h-full items-center justify-center px-1 py-3 text-center text-sm text-stone-500 dark:text-stone-400">
                    Antwort antippen
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

function Summary({
  mode,
  items,
  outcomes,
  points,
  seconds,
  onClose,
}: {
  mode: Mode;
  items: SessionItem[];
  outcomes: (Outcome | null)[];
  points: number;
  seconds: number;
  onClose: () => void;
}) {
  const count = (r: Result) => outcomes.filter((o) => o?.result === r).length;
  const exam = mode === 'exam';
  const grade = ihkGrade(points);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="flex h-dvh flex-col">
      <div className="pt-safe flex-1 overflow-y-auto px-4 pb-6">
        <div className="mx-auto max-w-xl space-y-5 pt-4">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-full bg-white shadow-soft active:scale-95 dark:bg-stone-900" aria-label="Zur Startseite">
              <IconClose />
            </button>
            <h1 className="text-2xl font-bold">{exam ? 'Prüfung beendet' : items.length ? 'Geschafft!' : 'Nichts zu lernen'}</h1>
          </div>
          {!items.length && <p className="text-stone-600 dark:text-stone-300">In diesem Modus gibt es gerade keine Karten. Beantworte zuerst ein paar Fragen.</p>}
          {exam && (
            <div className="rounded-3xl bg-white p-6 text-center shadow-lift dark:bg-stone-900">
              <div className="text-sm font-medium text-stone-500">Ergebnis</div>
              <div className="mt-1 text-5xl font-bold tabular-nums">
                {points.toLocaleString('de-DE')} <span className="text-2xl text-stone-400">/ 100</span>
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200">
                Note {grade} – {GRADE_TEXT[grade]}
              </div>
              <div className="mt-3 text-sm text-stone-500">Zeit: {fmtTime(seconds)} min · IHK-Schlüssel: ab 92 = 1, 81 = 2, 67 = 3, 50 = 4, 30 = 5</div>
            </div>
          )}
          {items.length > 0 && (
            <div className="grid grid-cols-3 gap-2 text-center">
              {(
                [
                  ['correct', 'Richtig', IconCheck, 'text-emerald-700 dark:text-emerald-400'],
                  ['partial', 'Teilweise', IconHalf, 'text-amber-700 dark:text-amber-400'],
                  ['wrong', 'Falsch', IconX, 'text-rose-700 dark:text-rose-400'],
                ] as const
              ).map(([r, label, Icon, cls]) => (
                <div key={r} className="rounded-2xl bg-white p-3 shadow-soft dark:bg-stone-900">
                  <Icon className={`mx-auto ${cls}`} />
                  <div className="mt-1 text-2xl font-bold tabular-nums">{count(r)}</div>
                  <div className="text-xs text-stone-500">{label}</div>
                </div>
              ))}
            </div>
          )}
          {exam && (
            <div className="space-y-2">
              <h2 className="font-semibold">Auswertung</h2>
              {items.map((it, i) => {
                const o = outcomes[i];
                const r: Result = o?.result ?? 'wrong';
                const prompt = it.kind === 'calc' ? it.task.prompt : it.question.prompt;
                return (
                  <div key={i} className="rounded-2xl bg-white shadow-soft dark:bg-stone-900">
                    <button className="flex w-full items-start gap-3 p-3 text-left" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                      {r === 'correct' ? (
                        <IconCheck className="shrink-0 text-emerald-600" />
                      ) : r === 'partial' ? (
                        <IconHalf className="shrink-0 text-amber-600" />
                      ) : (
                        <IconX className="shrink-0 text-rose-600" />
                      )}
                      <span className="line-clamp-2 flex-1 text-sm">
                        {i + 1}. {prompt}
                      </span>
                      <span className="text-xs tabular-nums text-stone-500">{o ? '' : 'offen'}</span>
                    </button>
                    {open === i && (
                      <div className="border-t border-stone-100 p-3 dark:border-stone-800">
                        <Feedback item={it} result={r} score={o?.score ?? 0} dontKnow={o?.dontKnow} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <footer className="pb-safe shrink-0 px-4 pt-3">
        <button onClick={onClose} className="mx-auto block w-full max-w-xl rounded-2xl bg-teal-700 px-5 py-4 text-lg font-semibold text-white shadow-soft dark:bg-teal-600">
          Zur Startseite
        </button>
      </footer>
    </div>
  );
}
