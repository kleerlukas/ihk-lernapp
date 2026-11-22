import { z } from 'zod';

export type Result = 'correct' | 'partial' | 'wrong';

/** Leitner: Abstand in Tagen je Fach (Fach 1 = heute nochmal). */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14] as const;
export const BOXES = 5;

const cardStateSchema = z.object({
  box: z.number().int().min(1).max(5),
  due: z.string(),
  seen: z.number().int().min(0),
  correct: z.number().int().min(0),
  partial: z.number().int().min(0),
  wrong: z.number().int().min(0),
  last: z.string().optional(),
  lastResult: z.enum(['correct', 'partial', 'wrong']).optional(),
});
export type CardState = z.infer<typeof cardStateSchema>;

const examSchema = z.object({
  date: z.string(),
  points: z.number(),
  grade: z.number().int().min(1).max(6),
  seconds: z.number(),
});
export type ExamResult = z.infer<typeof examSchema>;

export const progressSchema = z.object({
  version: z.literal(1),
  cards: z.record(z.string(), cardStateSchema),
  days: z.record(z.string(), z.object({ reviewed: z.number(), correct: z.number() })),
  settings: z.object({
    dailyGoal: z.number().int().min(5).max(500),
    newPerDay: z.number().int().min(0).max(100),
  }),
  exams: z.array(examSchema),
});
export type Progress = z.infer<typeof progressSchema>;

export const emptyProgress = (): Progress => ({
  version: 1,
  cards: {},
  days: {},
  settings: { dailyGoal: 30, newPerDay: 10 },
  exams: [],
});

/** Lokales Datum als YYYY-MM-DD (nicht UTC – sonst springt der Tag um 1 Uhr nachts). */
export function today(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return today(new Date(y, m - 1, d + n));
}

/** Neues Fach nach einer Antwort. */
export function nextBox(box: number, result: Result): number {
  if (result === 'correct') return Math.min(BOXES, box + 1);
  if (result === 'partial') return Math.max(1, box - 1);
  return 1;
}

/** Antwort verbuchen (reine Funktion → testbar). */
export function recordAnswer(p: Progress, key: string, result: Result, day = today()): Progress {
  const old: CardState = p.cards[key] ?? { box: 1, due: day, seen: 0, correct: 0, partial: 0, wrong: 0 };
  // Neue Karte, die direkt gewusst wird, startet in Fach 2
  const box = old.seen === 0 && result === 'correct' ? 2 : nextBox(old.box, result);
  const card: CardState = {
    ...old,
    box,
    due: addDays(day, BOX_INTERVAL_DAYS[box - 1]),
    seen: old.seen + 1,
    correct: old.correct + (result === 'correct' ? 1 : 0),
    partial: old.partial + (result === 'partial' ? 1 : 0),
    wrong: old.wrong + (result === 'wrong' ? 1 : 0),
    last: new Date().toISOString(),
    lastResult: result,
  };
  const d = p.days[day] ?? { reviewed: 0, correct: 0 };
  return {
    ...p,
    cards: { ...p.cards, [key]: card },
    days: { ...p.days, [day]: { reviewed: d.reviewed + 1, correct: d.correct + (result === 'correct' ? 1 : 0) } },
  };
}

export const isDue = (c: CardState | undefined, day = today()) => !!c && c.due <= day;

/** Lernserie: aufeinanderfolgende Tage mit mind. einer Karte (heute zählt, wenn schon gelernt). */
export function streak(p: Progress, day = today()): number {
  let d = p.days[day]?.reviewed ? day : addDays(day, -1);
  let n = 0;
  while (p.days[d]?.reviewed) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Zwei Fortschrittsstände zusammenführen (z. B. MacBook + iPhone): pro Karte gewinnt der neuere Stand. */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const cards = { ...a.cards };
  for (const [k, v] of Object.entries(b.cards)) {
    const cur = cards[k];
    if (!cur || (v.last ?? '') > (cur.last ?? '')) cards[k] = v;
  }
  const days = { ...a.days };
  for (const [k, v] of Object.entries(b.days)) {
    const cur = days[k];
    days[k] = !cur || v.reviewed > cur.reviewed ? v : cur;
  }
  const seen = new Set(a.exams.map((e) => e.date));
  return {
    version: 1,
    cards,
    days,
    settings: b.settings,
    exams: [...a.exams, ...b.exams.filter((e) => !seen.has(e.date))].sort((x, y) => x.date.localeCompare(y.date)),
  };
}

const STORAGE_KEY = 'ap2-lernapp-progress-v1';

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const r = progressSchema.safeParse(JSON.parse(raw));
    if (r.success) return r.data;
    // Defekten Stand sichern statt wegwerfen
    localStorage.setItem(`${STORAGE_KEY}-defekt-${Date.now()}`, raw);
  } catch {
    /* privater Modus o. Ä. */
  }
  return emptyProgress();
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* Speicher voll / blockiert – App läuft trotzdem weiter */
  }
}

export function parseImport(text: string): { ok: true; progress: Progress } | { ok: false; error: string } {
  try {
    const r = progressSchema.safeParse(JSON.parse(text));
    if (!r.success) return { ok: false, error: 'Die Datei ist kein gültiger Lernstand dieser App.' };
    return { ok: true, progress: r.data };
  } catch {
    return { ok: false, error: 'Die Datei ist kein gültiges JSON.' };
  }
}

/** IHK-Notenschlüssel */
export function ihkGrade(points: number): number {
  if (points >= 92) return 1;
  if (points >= 81) return 2;
  if (points >= 67) return 3;
  if (points >= 50) return 4;
  if (points >= 30) return 5;
  return 6;
}

export const GRADE_TEXT = ['', 'sehr gut', 'gut', 'befriedigend', 'ausreichend', 'mangelhaft', 'ungenügend'];
