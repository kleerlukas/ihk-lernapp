import type { CategoryId, Question } from '../data/schema';
import { GENERATORS, generateTask, type CalcTask } from '../generators';
import { isDue, today, type Progress } from './progress';

export type SessionItem =
  | { kind: 'question'; key: string; question: Question }
  | { kind: 'calc'; key: string; generatorId: string; task: CalcTask };

export type Mode = 'daily' | 'topic' | 'weak' | 'exam' | 'calc';

export const MODE_TITLE: Record<Mode, string> = {
  daily: 'Tägliches Lernen',
  topic: 'Thema',
  weak: 'Schwächen',
  exam: 'Prüfungssimulation',
  calc: 'Nur Rechnen',
};

export const EXAM_SIZE = 20;
export const EXAM_SECONDS = 30 * 60;

export const genKey = (id: string) => `gen:${id}`;

function shuffle<T>(arr: T[], rnd = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Standard: nur prüfungsrelevante Kern-Fragen; Extra-Fragen nur, wenn eingeschaltet. */
export function activeQuestions(questions: Question[], showExtra: boolean): Question[] {
  return showExtra ? questions : questions.filter((q) => q.relevanz !== 'extra');
}

const qItem = (q: Question): SessionItem => ({ kind: 'question', key: q.id, question: q });

export function calcItem(generatorId: string): SessionItem | null {
  const task = generateTask(generatorId);
  return task ? { kind: 'calc', key: genKey(generatorId), generatorId, task } : null;
}

const notNull = <T,>(x: T | null): x is T => x !== null;

/** Fällige Karten zählen (Fragen + Generatoren). */
export function dueCount(questions: Question[], p: Progress, day = today()): number {
  const keys = [...questions.map((q) => q.id), ...GENERATORS.map((g) => genKey(g.id))];
  return keys.filter((k) => isDue(p.cards[k], day)).length;
}

export function newCount(questions: Question[], p: Progress): number {
  return questions.filter((q) => !p.cards[q.id]).length;
}

/** Wie viele neue Karten heute noch drankommen dürfen. */
function newBudget(p: Progress, day: string): number {
  const introducedToday = Object.values(p.cards).filter((c) => c.seen === 1 && c.last?.startsWith(day)).length;
  return Math.max(0, p.settings.newPerDay - introducedToday);
}

/** Karten so mischen, dass Fragen der gleichen Kategorie nicht direkt hintereinander kommen. */
function interleave(items: SessionItem[]): SessionItem[] {
  const cat = (i: SessionItem) => (i.kind === 'question' ? i.question.category : i.task.category);
  const rest = shuffle(items);
  const out: SessionItem[] = [];
  while (rest.length) {
    const prev = out.length ? cat(out[out.length - 1]) : null;
    const idx = rest.findIndex((i) => cat(i) !== prev);
    out.push(rest.splice(idx === -1 ? 0 : idx, 1)[0]);
  }
  return out;
}

export function buildSession(
  mode: Mode,
  questions: Question[],
  p: Progress,
  opts: { category?: CategoryId; generatorIds?: string[] } = {},
): SessionItem[] {
  const day = today();
  const byBox = (a: Question, b: Question) => (p.cards[a.id]?.box ?? 0) - (p.cards[b.id]?.box ?? 0);

  switch (mode) {
    case 'daily': {
      const due = questions.filter((q) => isDue(p.cards[q.id], day)).sort(byBox).slice(0, 60);
      const fresh = shuffle(questions.filter((q) => !p.cards[q.id])).slice(0, newBudget(p, day));
      const dueGens = GENERATORS.filter((g) => isDue(p.cards[genKey(g.id)], day)).map((g) => g.id);
      const unseenGens = shuffle(GENERATORS.filter((g) => !p.cards[genKey(g.id)]).map((g) => g.id));
      const gens = [...dueGens, ...unseenGens].slice(0, 3);
      let items = [...due.map(qItem), ...fresh.map(qItem), ...gens.map(calcItem).filter(notNull)];
      if (items.length < 5) {
        // Nichts fällig → mit den schwächsten bereits gelernten Karten auffüllen
        const extra = questions
          .filter((q) => !items.some((i) => i.key === q.id))
          .sort(byBox)
          .slice(0, 10 - items.length);
        items = [...items, ...extra.map(qItem)];
      }
      return interleave(items);
    }
    case 'topic': {
      const qs = questions.filter((q) => q.category === opts.category);
      const sorted = [
        ...shuffle(qs.filter((q) => isDue(p.cards[q.id], day))),
        ...shuffle(qs.filter((q) => !p.cards[q.id])),
        ...qs.filter((q) => p.cards[q.id] && !isDue(p.cards[q.id], day)).sort(byBox),
      ].slice(0, 20);
      const gens = GENERATORS.filter((g) => g.category === opts.category).map((g) => g.id);
      const calc = shuffle(gens).slice(0, 3).map(calcItem).filter(notNull);
      return interleave([...sorted.map(qItem), ...calc]);
    }
    case 'weak': {
      const keys = Object.entries(p.cards)
        .filter(([, c]) => c.wrong + c.partial > 0)
        .sort(([, a], [, b]) => b.wrong + b.partial / 2 - (a.wrong + a.partial / 2) || a.box - b.box)
        .slice(0, 20)
        .map(([k]) => k);
      const items = keys
        .map((k) => {
          if (k.startsWith('gen:')) return calcItem(k.slice(4));
          const q = questions.find((x) => x.id === k);
          return q ? qItem(q) : null;
        })
        .filter(notNull);
      return shuffle(items);
    }
    case 'exam': {
      // 15 Wissensfragen (keine Selbstbewertung) + 5 Rechenaufgaben, über alle Kategorien verteilt
      const pool = shuffle(questions.filter((q) => q.type !== 'flashcard'));
      const picked: Question[] = [];
      const perCat = new Map<string, number>();
      for (const q of pool) {
        if (picked.length >= EXAM_SIZE - 5) break;
        const n = perCat.get(q.category) ?? 0;
        if (n >= 2) continue;
        perCat.set(q.category, n + 1);
        picked.push(q);
      }
      for (const q of pool) if (picked.length < EXAM_SIZE - 5 && !picked.includes(q)) picked.push(q);
      const gens = shuffle(GENERATORS.map((g) => g.id)).slice(0, 5);
      return shuffle([...picked.map(qItem), ...gens.map(calcItem).filter(notNull)]);
    }
    case 'calc': {
      const ids = opts.generatorIds?.length ? opts.generatorIds : GENERATORS.map((g) => g.id);
      const list = Array.from({ length: 10 }, (_, i) => ids[i % ids.length]);
      return shuffle(list).map(calcItem).filter(notNull);
    }
  }
}
