import { useRef, useState } from 'react';
import type { Question } from '../data/schema';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { PageHeader } from '../components/PageHeader';
import { emptyProgress, mergeProgress, parseImport, today, type Progress } from '../lib/progress';

interface Props {
  questions: Question[];
  progress: Progress;
  loadErrors: string[];
  generatedAt: string;
  setProgress: (p: Progress) => void;
  onBack: () => void;
}

export function Settings({ questions, progress, loadErrors, generatedAt, setProgress, onBack }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState<Progress | null>(null);
  const [ask, setAsk] = useState<'replace' | 'reset' | null>(null);
  const review = questions.filter((q) => q.needsReview);

  const set = (patch: Partial<Progress['settings']>) => setProgress({ ...progress, settings: { ...progress.settings, ...patch } });

  async function exportFile() {
    const name = `ap2-lernstand-${today()}.json`;
    const blob = new Blob([JSON.stringify(progress, null, 1)], { type: 'application/json' });
    const file = new File([blob], name, { type: 'application/json' });
    // iPhone: Teilen-Menü (in Dateien sichern, AirDrop …); sonst normaler Download
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'AP2-Lernstand' });
        setMsg('Lernstand geteilt.');
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg(`Gespeichert als ${name}.`);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const r = parseImport(await f.text());
    if (!r.ok) return setMsg(r.error);
    setPending(r.progress);
    setMsg(null);
  }

  const row = 'flex items-center justify-between gap-3 py-3';
  const btn = 'min-h-12 rounded-2xl px-4 py-3 font-semibold transition active:scale-[0.98]';

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 pb-6 pt-4">
      {ask === 'replace' && pending && (
        <ConfirmSheet
          title="Lernstand ersetzen?"
          text="Der aktuelle Lernstand auf diesem Gerät wird komplett durch die Datei ersetzt."
          confirmLabel="Ersetzen"
          danger
          onCancel={() => setAsk(null)}
          onConfirm={() => {
            setProgress(pending);
            setPending(null);
            setAsk(null);
            setMsg('Lernstand ersetzt.');
          }}
        />
      )}
      {ask === 'reset' && (
        <ConfirmSheet
          title="Fortschritt löschen?"
          text="Der gesamte Lernfortschritt auf diesem Gerät wird gelöscht. Das lässt sich nicht rückgängig machen. Tipp: vorher exportieren."
          confirmLabel="Löschen"
          danger
          onCancel={() => setAsk(null)}
          onConfirm={() => {
            setProgress({ ...emptyProgress(), settings: progress.settings });
            setAsk(null);
            setMsg('Fortschritt zurückgesetzt.');
          }}
        />
      )}
      <PageHeader title="Einstellungen" onBack={onBack} />

      <section className="divide-y divide-stone-100 rounded-3xl bg-white px-4 shadow-soft dark:divide-stone-800 dark:bg-stone-900">
        <label className={row}>
          <span>
            <span className="block font-medium">Tagesziel</span>
            <span className="text-xs text-stone-500">Karten pro Tag</span>
          </span>
          <select
            value={progress.settings.dailyGoal}
            onChange={(e) => set({ dailyGoal: Number(e.target.value) })}
            className="min-h-11 rounded-xl border border-stone-200 bg-stone-50 px-3 dark:border-stone-700 dark:bg-stone-800"
          >
            {[10, 15, 20, 25, 30, 40, 50, 60, 80, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className={row}>
          <span>
            <span className="block font-medium">Neue Karten pro Tag</span>
            <span className="text-xs text-stone-500">im Modus „Tägliches Lernen“</span>
          </span>
          <select
            value={progress.settings.newPerDay}
            onChange={(e) => set({ newPerDay: Number(e.target.value) })}
            className="min-h-11 rounded-xl border border-stone-200 bg-stone-50 px-3 dark:border-stone-700 dark:bg-stone-800"
          >
            {[0, 5, 10, 15, 20, 30, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-3 rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
        <h2 className="font-semibold">Lernstand übertragen</h2>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          Der Fortschritt liegt nur auf diesem Gerät. Exportiere ihn als Datei und importiere sie auf dem anderen Gerät (z. B. per AirDrop oder iCloud Drive).
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={exportFile} className={`${btn} bg-teal-700 text-white dark:bg-teal-600`}>
            Exportieren
          </button>
          <button onClick={() => fileRef.current?.click()} className={`${btn} bg-stone-100 dark:bg-stone-800`}>
            Importieren
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
        {pending && (
          <div className="space-y-2 rounded-2xl bg-teal-50 p-3 text-sm dark:bg-teal-950/50">
            <p>
              Datei enthält {Object.keys(pending.cards).length} Karten-Stände. Wie übernehmen?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`${btn} bg-teal-700 text-white dark:bg-teal-600`}
                onClick={() => {
                  setProgress(mergeProgress(progress, pending));
                  setPending(null);
                  setMsg('Zusammengeführt – pro Karte gilt der neuere Stand.');
                }}
              >
                Zusammenführen
              </button>
              <button
                className={`${btn} bg-white dark:bg-stone-800`}
                onClick={() => setAsk('replace')}
              >
                Ersetzen
              </button>
            </div>
          </div>
        )}
        {msg && (
          <p className="text-sm text-stone-700 dark:text-stone-200" role="status">
            {msg}
          </p>
        )}
      </section>

      <section className="space-y-2 rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
        <h2 className="font-semibold">Inhalte</h2>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          {questions.length} Fragen · 14 Rechen-Generatoren · Stand {generatedAt}
        </p>
        {loadErrors.length > 0 && (
          <details className="rounded-2xl bg-amber-50 p-3 text-sm dark:bg-amber-950/40" open>
            <summary className="font-semibold">{loadErrors.length} fehlerhafte Fragen übersprungen</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 font-mono text-xs">
              {loadErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </details>
        )}
        {review.length > 0 && (
          <details className="rounded-2xl bg-stone-100 p-3 text-sm dark:bg-stone-800/70">
            <summary className="font-semibold">{review.length} Fragen mit Prüfvermerk (needsReview)</summary>
            <ul className="mt-2 space-y-2">
              {review.map((q) => (
                <li key={q.id}>
                  <span className="font-mono text-xs">{q.id}</span>
                  <br />
                  {q.reviewNote}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
        <button
          className={`${btn} w-full bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200`}
          onClick={() => setAsk('reset')}
        >
          Fortschritt zurücksetzen
        </button>
      </section>
    </div>
  );
}
