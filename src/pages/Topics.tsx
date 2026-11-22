import { CATEGORIES } from '../data/categories';
import type { CategoryId, Question } from '../data/schema';
import { GENERATORS } from '../generators';
import { IconArrowRight, IconCalc } from '../components/Icons';
import { PageHeader } from '../components/PageHeader';
import { isDue, type Progress } from '../lib/progress';

interface Props {
  questions: Question[];
  progress: Progress;
  onTopic: (c: CategoryId) => void;
  onCalc: (generatorId: string) => void;
  onBack: () => void;
}

/** Fortschritt einer Kategorie: Durchschnitt der Fächer (ungesehen = 0, Fach 5 = 100 %). */
export function categoryProgress(questions: Question[], p: Progress, cat: CategoryId) {
  const qs = questions.filter((q) => q.category === cat);
  const sum = qs.reduce((s, q) => s + (p.cards[q.id]?.box ?? 0), 0);
  const seen = qs.filter((q) => p.cards[q.id]).length;
  const due = qs.filter((q) => isDue(p.cards[q.id])).length;
  return { total: qs.length, seen, due, pct: qs.length ? sum / (qs.length * 5) : 0 };
}

export function Topics({ questions, progress, onTopic, onCalc, onBack }: Props) {
  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 pb-6 pt-4">
      <PageHeader title="Themen" onBack={onBack} />
      <ul className="space-y-2.5">
        {CATEGORIES.map((c) => {
          const s = categoryProgress(questions, progress, c.id);
          return (
            <li key={c.id}>
              <button onClick={() => onTopic(c.id)} className="w-full rounded-2xl bg-white p-4 text-left shadow-soft transition active:scale-[0.98] dark:bg-stone-900">
                <div className="flex items-center gap-3">
                  <span className={`size-3 shrink-0 rounded-full ${c.hue}`} aria-hidden />
                  <span className="flex-1 font-semibold">{c.name}</span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    {s.total} Karten{s.due ? ` · ${s.due} fällig` : ''}
                  </span>
                  <IconArrowRight size={18} className="text-stone-400" />
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                  <div className="h-full rounded-full bg-teal-600" style={{ width: `${s.pct * 100}%` }} />
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <h2 className="flex items-center gap-2 pt-2 text-lg font-bold">
        <IconCalc size={20} /> Rechenaufgaben
      </h2>
      <p className="-mt-3 text-sm text-stone-500 dark:text-stone-400">Bei jedem Aufruf neue Zufallszahlen, mit Rechenweg.</p>
      <ul className="grid grid-cols-2 gap-2.5">
        {GENERATORS.map((g) => (
          <li key={g.id}>
            <button onClick={() => onCalc(g.id)} className="h-full min-h-16 w-full rounded-2xl bg-white p-3 text-left text-sm font-semibold shadow-soft transition active:scale-[0.97] dark:bg-stone-900">
              {g.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
