import { CATEGORIES } from '../data/categories';
import type { Question } from '../data/schema';
import { addDays, GRADE_TEXT, streak, today, type Progress } from '../lib/progress';
import { categoryProgress } from './Topics';
import { PageHeader } from '../components/PageHeader';

export function Stats({ questions, progress, onBack }: { questions: Question[]; progress: Progress; onBack: () => void }) {
  const cards = Object.values(progress.cards);
  const answers = cards.reduce((s, c) => s + c.seen, 0);
  const correct = cards.reduce((s, c) => s + c.correct, 0);
  const partial = cards.reduce((s, c) => s + c.partial, 0);
  const rate = answers ? (correct + partial * 0.5) / answers : 0;
  const boxes = [1, 2, 3, 4, 5].map((b) => questions.filter((q) => progress.cards[q.id]?.box === b).length);
  const unseen = questions.filter((q) => !progress.cards[q.id]).length;
  const days = Array.from({ length: 14 }, (_, i) => addDays(today(), i - 13));
  const maxDay = Math.max(1, ...days.map((d) => progress.days[d]?.reviewed ?? 0));

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 pb-6 pt-4">
      <PageHeader title="Statistik" onBack={onBack} />

      <section className="grid grid-cols-3 gap-2.5">
        <Tile label="Trefferquote" value={answers ? `${Math.round(rate * 100)} %` : '–'} />
        <Tile label="Serie" value={`${streak(progress)} T.`} />
        <Tile label="Antworten" value={answers.toLocaleString('de-DE')} />
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
        <h2 className="mb-3 font-semibold">Fortschritt pro Kategorie</h2>
        <ul className="space-y-3">
          {CATEGORIES.map((c) => {
            const s = categoryProgress(questions, progress, c.id);
            const qs = questions.filter((q) => q.category === c.id);
            const cs = qs.map((q) => progress.cards[q.id]).filter(Boolean);
            const n = cs.reduce((a, x) => a + x!.seen, 0);
            const ok = cs.reduce((a, x) => a + x!.correct, 0);
            return (
              <li key={c.id}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="shrink-0 tabular-nums text-stone-500 dark:text-stone-400">
                    {Math.round(s.pct * 100)} %{n ? ` · ${Math.round((ok / n) * 100)} % richtig` : ''}
                  </span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800" role="progressbar" aria-valuenow={Math.round(s.pct * 100)} aria-valuemax={100} aria-label={c.name}>
                  <div className={`h-full rounded-full ${c.hue}`} style={{ width: `${s.pct * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">100 % = alle Karten der Kategorie in Fach 5.</p>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
        <h2 className="mb-3 font-semibold">Leitner-Fächer</h2>
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {[unseen, ...boxes].map((n, i) => {
            const max = Math.max(1, unseen, ...boxes);
            return (
              <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs font-semibold tabular-nums">{n}</span>
                <div className={`w-full rounded-t-lg ${i === 0 ? 'bg-stone-300 dark:bg-stone-700' : 'bg-teal-600'}`} style={{ height: `${(n / max) * 80 + 2}px`, opacity: i === 0 ? 1 : 0.45 + i * 0.11 }} />
                <span className="text-[11px] text-stone-500">{i === 0 ? 'neu' : `Fach ${i}`}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">Wiederholung nach 0 / 1 / 3 / 7 / 14 Tagen. Falsch → zurück in Fach 1.</p>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
        <h2 className="mb-3 font-semibold">Letzte 14 Tage</h2>
        <div className="flex items-end gap-1" style={{ height: 90 }}>
          {days.map((d) => {
            const n = progress.days[d]?.reviewed ?? 0;
            return (
              <div key={d} className="flex flex-1 flex-col items-center justify-end" title={`${d}: ${n} Karten`}>
                <div className={`w-full rounded-t ${n >= progress.settings.dailyGoal ? 'bg-teal-600' : 'bg-teal-600/45'}`} style={{ height: `${(n / maxDay) * 70 + (n ? 3 : 1)}px` }} />
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-stone-500">
          <span>vor 2 Wochen</span>
          <span>heute</span>
        </div>
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">Dunkle Balken = Tagesziel ({progress.settings.dailyGoal}) erreicht.</p>
      </section>

      {progress.exams.length > 0 && (
        <section className="rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
          <h2 className="mb-2 font-semibold">Prüfungssimulationen</h2>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {[...progress.exams].reverse().slice(0, 10).map((e) => (
              <li key={e.date} className="flex items-center justify-between py-2 text-sm">
                <span className="text-stone-500">{new Date(e.date).toLocaleDateString('de-DE')}</span>
                <span className="tabular-nums">{e.points.toLocaleString('de-DE')} Punkte</span>
                <span className="font-semibold">
                  Note {e.grade} <span className="font-normal text-stone-500">({GRADE_TEXT[e.grade]})</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-soft dark:bg-stone-900">
      <div className="text-xs text-stone-500 dark:text-stone-400">{label}</div>
      <div className="mt-0.5 text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
