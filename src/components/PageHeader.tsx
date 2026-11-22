import { IconArrowLeft } from './Icons';

/** Kopfzeile für Unterseiten: immer sichtbarer Weg zurück zur Startseite (oben, unabhängig von der Leiste unten). */
export function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="flex items-center gap-3">
      <button
        onClick={onBack}
        className="flex min-h-11 items-center gap-1 rounded-full bg-white py-2 pr-4 pl-3 text-sm font-semibold shadow-soft active:scale-95 dark:bg-stone-900"
        aria-label="Zurück zur Startseite"
      >
        <IconArrowLeft size={18} /> Start
      </button>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
    </header>
  );
}
