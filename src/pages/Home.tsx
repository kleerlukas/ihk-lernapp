import type { Question } from '../data/schema';
import { IconAlert, IconArrowRight, IconCalc, IconClock, IconFlame, IconGrid, IconTarget } from '../components/Icons';
import { streak, today, type Progress } from '../lib/progress';
import { dueCount, newCount, type Mode } from '../lib/session';

interface Props {
  questions: Question[];
  progress: Progress;
  loadErrors: string[];
  onStart: (mode: Mode) => void;
  onTopics: () => void;
}

export function Home({ questions, progress, loadErrors, onStart, onTopics }: Props) {
  const due = dueCount(questions, progress);
  const fresh = Math.min(newCount(questions, progress), progress.settings.newPerDay);
  const s = streak(progress);
  const todayStats = progress.days[today()] ?? { reviewed: 0, correct: 0 };
  const goal = progress.settings.dailyGoal;
  const goalPct = Math.min(1, todayStats.reviewed / goal);
  const learned = questions.filter((q) => (progress.cards[q.id]?.box ?? 0) >= 4).length;
  const weak = Object.values(progress.cards).filter((c) => c.wrong + c.partial > 0).length;
  const dateText = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 pb-6">
      <header className="pt-4">
        <p className="text-sm text-stone-500 dark:text-stone-400">{dateText}</p>
        <h1 className="text-2xl font-bold tracking-tight">FISI AP2 lernen</h1>
      </header>

      {loadErrors.length > 0 && (
        <div className="flex gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-100" role="alert">
          <IconAlert className="shrink-0" />
          {loadErrors.length} Frage(n) sind fehlerhaft und wurden übersprungen. Details unter Einstellungen.
        </div>
      )}

      <section className="rounded-3xl bg-white p-5 shadow-lift dark:bg-stone-900">
        <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Heute fällig</p>
        <p className="mt-0.5 text-4xl font-bold tabular-nums">
          {due} <span className="text-xl font-semibold text-stone-500">Karten</span>
        </p>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">+ bis zu {fresh} neue Karten und Rechenaufgaben</p>
        <button
          onClick={() => onStart('daily')}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 py-4.5 text-lg font-semibold text-white shadow-soft transition active:scale-[0.98] dark:bg-teal-600"
        >
          Lernen starten <IconArrowRight />
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
          <div className="flex items-center gap-1.5 text-sm font-medium text-stone-500 dark:text-stone-400">
            <IconFlame size={18} className="text-orange-500" /> Serie
          </div>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {s} <span className="text-base font-semibold text-stone-500">{s === 1 ? 'Tag' : 'Tage'}</span>
          </p>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
          <div className="flex items-center gap-1.5 text-sm font-medium text-stone-500 dark:text-stone-400">
            <IconTarget size={18} className="text-teal-600" /> Tagesziel
          </div>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {todayStats.reviewed}
            <span className="text-base font-semibold text-stone-500"> / {goal}</span>
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800" role="progressbar" aria-valuenow={todayStats.reviewed} aria-valuemax={goal} aria-label="Tagesziel">
            <div className="h-full rounded-full bg-teal-600" style={{ width: `${goalPct * 100}%` }} />
          </div>
          {goalPct >= 1 && <p className="mt-1 text-xs font-semibold text-teal-700 dark:text-teal-400">✓ Ziel erreicht</p>}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium text-stone-500 dark:text-stone-400">Sicher gelernt (Fach 4–5)</span>
          <span className="font-semibold tabular-nums">
            {learned} / {questions.length}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(learned / Math.max(1, questions.length)) * 100}%` }} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <ModeTile icon={<IconGrid />} title="Thema wählen" text="Nur eine Kategorie" onClick={onTopics} />
        <ModeTile icon={<IconAlert />} title="Schwächen" text={weak ? `${weak} Karten mit Fehlern` : 'Noch keine Fehler'} onClick={() => onStart('weak')} disabled={!weak} />
        <ModeTile icon={<IconClock />} title="Prüfung" text="20 Fragen · 30 min · Note" onClick={() => onStart('exam')} />
        <ModeTile icon={<IconCalc />} title="Nur Rechnen" text="Zufällige Rechenaufgaben" onClick={() => onStart('calc')} />
      </section>
    </div>
  );
}

function ModeTile({ icon, title, text, onClick, disabled }: { icon: React.ReactNode; title: string; text: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-28 flex-col items-start gap-2 rounded-3xl bg-white p-4 text-left shadow-soft transition active:scale-[0.97] disabled:opacity-50 dark:bg-stone-900"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">{icon}</span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-xs text-stone-500 dark:text-stone-400">{text}</span>
      </span>
    </button>
  );
}
