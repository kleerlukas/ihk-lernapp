import { useCallback, useEffect, useMemo, useState } from 'react';
import questionsFile from './data/questions.json';
import { parseQuestions, type CategoryId } from './data/schema';
import { categoryById } from './data/categories';
import { generatorById } from './generators';
import { ihkGrade, loadProgress, recordAnswer, saveProgress, type Progress, type Result } from './lib/progress';
import { activeQuestions, buildSession, type Mode, type SessionItem } from './lib/session';
import { IconChart, IconGear, IconGrid, IconHome } from './components/Icons';
import { Home } from './pages/Home';
import { Session } from './pages/Session';
import { Topics } from './pages/Topics';
import { Stats } from './pages/Stats';
import { Settings } from './pages/Settings';

type Tab = 'home' | 'topics' | 'stats' | 'settings';
interface ActiveSession {
  mode: Mode;
  title?: string;
  items: SessionItem[];
  id: number;
}

const HASH: Record<Exclude<Tab, 'home'>, string> = { topics: 'themen', stats: 'statistik', settings: 'einstellungen' };
function tabFromHash(): Tab {
  const h = typeof location === 'undefined' ? '' : location.hash.slice(1);
  return (Object.entries(HASH).find(([, v]) => v === h)?.[0] as Tab | undefined) ?? 'home';
}

// Fragen einmal beim Start validieren – kaputte Fragen werden übersprungen, nicht gecrasht
const loaded = parseQuestions(questionsFile);
const generatedAt = (questionsFile as { generatedAt?: string }).generatedAt ?? '–';

export default function App() {
  const { questions: allQuestions, errors } = loaded;
  const [progress, setProgressState] = useState<Progress>(loadProgress);
  // Standard: nur prüfungsrelevante Kern-Fragen. Extra-Fragen nur, wenn in den Einstellungen eingeschaltet.
  const showExtra = progress.settings.showExtra;
  const questions = useMemo(
    () => activeQuestions(allQuestions, showExtra),
    [allQuestions, showExtra],
  );
  const [tab, setTabState] = useState<Tab>(() => tabFromHash());
  // Unterseiten bekommen einen Hash (#themen …) → Zurück-Geste/-Taste des Browsers führt zur Startseite
  useEffect(() => {
    const onHash = () => setTabState(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const setTab = useCallback((t: Tab) => {
    setTabState(t);
    const want = t === 'home' ? '' : `#${HASH[t]}`;
    if (location.hash !== want) location.hash = want;
  }, []);
  const goHome = useCallback(() => setTab('home'), [setTab]);
  const [session, setSession] = useState<ActiveSession | null>(null);

  const setProgress = useCallback((p: Progress) => setProgressState(p), []);
  useEffect(() => saveProgress(progress), [progress]);

  // Wechsel zwischen Geräten/Tabs: Stand aus anderem Tab übernehmen
  useEffect(() => {
    const onStorage = () => setProgressState(loadProgress());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const start = useCallback(
    (mode: Mode, opts: { category?: CategoryId; generatorIds?: string[] } = {}) => {
      const items = buildSession(mode, questions, progress, opts);
      const title = opts.category
        ? categoryById(opts.category)?.name
        : opts.generatorIds?.length === 1
          ? generatorById(opts.generatorIds[0])?.name
          : undefined;
      setSession({ mode, items, title, id: Date.now() });
    },
    [questions, progress],
  );

  const onRecord = useCallback((key: string, result: Result) => setProgressState((p) => recordAnswer(p, key, result)), []);
  const onExamDone = useCallback(
    (points: number, seconds: number) =>
      setProgressState((p) => ({ ...p, exams: [...p.exams, { date: new Date().toISOString(), points, grade: ihkGrade(points), seconds }] })),
    [],
  );

  const nav = useMemo(
    () =>
      [
        ['home', 'Start', IconHome],
        ['topics', 'Themen', IconGrid],
        ['stats', 'Statistik', IconChart],
        ['settings', 'Einstellungen', IconGear],
      ] as const,
    [],
  );

  if (session) {
    return (
      <Session
        key={session.id}
        mode={session.mode}
        title={session.title}
        items={session.items}
        onRecord={onRecord}
        onExamDone={onExamDone}
        onClose={() => setSession(null)}
      />
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <main className="pt-safe flex-1 overflow-y-auto">
        {tab === 'home' && <Home questions={questions} progress={progress} loadErrors={errors} onStart={(m) => start(m)} onTopics={() => setTab('topics')} />}
        {tab === 'topics' && (
          <Topics questions={questions} progress={progress} onTopic={(c) => start('topic', { category: c })} onCalc={(g) => start('calc', { generatorIds: [g] })} onBack={goHome} />
        )}
        {tab === 'stats' && <Stats questions={questions} progress={progress} onBack={goHome} />}
        {tab === 'settings' && <Settings questions={allQuestions} progress={progress} loadErrors={errors} generatedAt={generatedAt} setProgress={setProgress} onBack={goHome} />}
      </main>
      <nav className="pb-safe shrink-0 border-t border-stone-200/70 bg-stone-100/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90" aria-label="Hauptnavigation">
        <ul className="mx-auto grid max-w-xl grid-cols-4">
          {nav.map(([id, label, Icon]) => (
            <li key={id}>
              <button
                onClick={() => setTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-0.5 pt-2 pb-1 text-[11px] font-medium ${
                  tab === id ? 'text-teal-700 dark:text-teal-400' : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                <Icon size={24} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
