import type { ReactNode } from 'react';
import type { Result } from '../lib/progress';
import type { SessionItem } from '../lib/session';
import { IconAlert, IconBulb, IconCheck, IconFlag, IconHalf, IconX } from './Icons';
import { RichText } from './CodeBlock';

const STYLE: Record<Result, { text: string; cls: string; Icon: typeof IconCheck }> = {
  correct: {
    text: 'Richtig',
    cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-900',
    Icon: IconCheck,
  },
  partial: {
    text: 'Teilweise richtig',
    cls: 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-900',
    Icon: IconHalf,
  },
  wrong: {
    text: 'Falsch',
    cls: 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:ring-rose-900',
    Icon: IconX,
  },
};

const DONT_KNOW = {
  text: 'Keine Ahnung – hier ist die Erklärung',
  cls: 'bg-sky-50 text-sky-900 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-100 dark:ring-sky-900',
  Icon: IconBulb,
};

/** Ergebnis-Abzeichen: Farbe + Icon + Text (nie Farbe allein). */
export function ResultBadge({ result, label, score, dontKnow }: { result: Result; label?: string; score?: number; dontKnow?: boolean }) {
  const s = dontKnow ? DONT_KNOW : STYLE[result];
  return (
    <div role="status" className={`flex items-center gap-2 rounded-2xl px-4 py-3 font-semibold ring-1 ${s.cls}`}>
      <s.Icon size={22} />
      <span>{label ?? s.text}</span>
      {score !== undefined && result === 'partial' && (
        <span className="ml-auto text-sm font-medium opacity-80">{Math.round(score * 100)} %</span>
      )}
    </div>
  );
}

export function solutionText(item: SessionItem): string {
  if (item.kind === 'calc') return item.task.fields.map((f) => `${f.label}: ${f.answer}${f.unit ? ` ${f.unit}` : ''}`).join('\n');
  const q = item.question;
  switch (q.type) {
    case 'mc':
      return q.choices[q.correct];
    case 'input':
      return `${q.accepted[0]}${q.unit ? ` ${q.unit}` : ''}`;
    case 'match':
      return q.pairs.map((p) => `${p.left} → ${p.right}`).join('\n');
    case 'flashcard':
      return q.answer;
  }
}

function Box({ icon, title, children, tone }: { icon: ReactNode; title: string; children: ReactNode; tone: string }) {
  return (
    <div className={`rounded-2xl p-3.5 ${tone}`}>
      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide opacity-80">
        {icon}
        {title}
      </div>
      <div className="text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}

export function Feedback({
  item,
  result,
  score,
  showSolution = true,
  compact = false,
  dontKnow = false,
}: {
  item: SessionItem;
  result: Result;
  score: number;
  showSolution?: boolean;
  /** Karteikarte: Antwort + Erklärung stehen schon auf der Rückseite */
  compact?: boolean;
  /** „Keine Ahnung“: Erklärung hervorheben, damit du es beim nächsten Mal weißt */
  dontKnow?: boolean;
}) {
  const isCalc = item.kind === 'calc';
  const meta = isCalc ? item.task : item.question;
  const explanation = meta.explanation;
  const review = isCalc ? item.task.needsReview : item.question.needsReview;
  const reviewNote = isCalc ? item.task.reviewNote : item.question.reviewNote;
  return (
    <div className="fade-up space-y-3" aria-live="polite">
      {!compact && <ResultBadge result={result} score={score} dontKnow={dontKnow} />}
      {showSolution && !compact && (
        <Box icon={<IconCheck size={14} />} title="Lösung" tone="bg-stone-100 dark:bg-stone-800/70">
          <RichText text={solutionText(item)} className="font-semibold" />
        </Box>
      )}
      {!compact &&
        (dontKnow ? (
          <Box icon={<IconBulb size={14} />} title="Warum das so ist" tone="bg-sky-50 text-sky-950 dark:bg-sky-950/50 dark:text-sky-100">
            <RichText text={explanation} />
          </Box>
        ) : (
          <p className="px-1 text-[15px] leading-relaxed text-stone-700 dark:text-stone-300">
            <RichText text={explanation} />
          </p>
        ))}
      {isCalc && (
        <Box icon={<IconCheck size={14} />} title="Rechenweg" tone="bg-sky-50 text-sky-950 dark:bg-sky-950/50 dark:text-sky-100">
          <ol className="list-decimal space-y-1 pl-5 font-mono text-[13px]">
            {item.task.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </Box>
      )}
      {meta.mnemonic && (
        <Box icon={<IconBulb size={14} />} title="Eselsbrücke" tone="bg-violet-50 text-violet-950 dark:bg-violet-950/50 dark:text-violet-100">
          <RichText text={meta.mnemonic} />
        </Box>
      )}
      {meta.pitfall && (
        <Box icon={<IconAlert size={14} />} title="Typische Falle" tone="bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          <RichText text={meta.pitfall} />
        </Box>
      )}
      {review && (
        <Box icon={<IconFlag size={14} />} title="Inhalt noch nicht geprüft" tone="bg-stone-100 text-stone-700 dark:bg-stone-800/70 dark:text-stone-300">
          {reviewNote ?? 'Diese Stelle im Lernzettel ist nicht eindeutig.'}
        </Box>
      )}
      {!isCalc && (
        <p className="px-1 text-xs text-stone-500 dark:text-stone-400">
          Quelle: {item.question.source.file} › {item.question.source.section}
          {item.question.source.line ? ` (Z. ${item.question.source.line})` : ''}
        </p>
      )}
    </div>
  );
}
