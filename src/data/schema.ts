import { z } from 'zod';

/** Kategorien-IDs. Neue Kategorien hier und in categories.ts ergänzen. */
export const CATEGORY_IDS = [
  'ports',
  'ipv4',
  'ipv6',
  'osi',
  'einheiten',
  'raid',
  'backup',
  'sicherheit',
  'netzwerk',
  'infrastruktur',
  'programmierung',
] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

const codeSchema = z.object({
  lang: z.enum(['csharp', 'sql', 'bash', 'text']),
  src: z.string().min(1),
});

const sourceSchema = z.object({
  file: z.string().min(1),
  section: z.string().min(1),
  line: z.number().int().positive().optional(),
});

const base = {
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'id: nur a-z, 0-9 und -'),
  category: z.enum(CATEGORY_IDS),
  prompt: z.string().min(3),
  code: codeSchema.optional(),
  /** Lösung als Text (für Anzeige). Bei Karteikarten Pflicht. */
  answer: z.string().optional(),
  explanation: z.string().min(10),
  mnemonic: z.string().optional(),
  pitfall: z.string().optional(),
  source: sourceSchema,
  /** Kurzes Zitat aus der Quelle – generate prüft, dass es dort wirklich steht. */
  ref: z.string().optional(),
  needsReview: z.boolean().optional(),
  reviewNote: z.string().optional(),
  origin: z.enum(['curated', 'extracted']).default('curated'),
  tags: z.array(z.string()).optional(),
};

export const mcSchema = z
  .object({
    ...base,
    type: z.literal('mc'),
    choices: z.array(z.string().min(1)).length(4),
    correct: z.number().int().min(0).max(3),
  })
  .refine((q) => new Set(q.choices).size === 4, { message: 'MC: Antworten müssen verschieden sein' });

export const COMPARE_MODES = ['text', 'number', 'ipv4', 'ipv6', 'cidr', 'list'] as const;
export type CompareMode = (typeof COMPARE_MODES)[number];

export const inputSchema = z.object({
  ...base,
  type: z.literal('input'),
  /** Alle akzeptierten Antworten; die erste ist die „offizielle“. */
  accepted: z.array(z.string().min(1)).min(1),
  compare: z.enum(COMPARE_MODES).default('text'),
  unit: z.string().optional(),
  placeholder: z.string().optional(),
});

export const matchSchema = z
  .object({
    ...base,
    type: z.literal('match'),
    pairs: z.array(z.object({ left: z.string().min(1), right: z.string().min(1) })).min(2).max(8),
    /** Optionale Auswahlliste rechts (sonst: alle verschiedenen rechten Werte). */
    options: z.array(z.string().min(1)).optional(),
  })
  .refine((q) => !q.options || q.pairs.every((p) => q.options!.includes(p.right)), {
    message: 'Zuordnung: jede Lösung muss in options vorkommen',
  });

export const flashcardSchema = z.object({
  ...base,
  type: z.literal('flashcard'),
  answer: z.string().min(1),
});

export const questionSchema = z.union([mcSchema, inputSchema, matchSchema, flashcardSchema]);

export type McQuestion = z.infer<typeof mcSchema>;
export type InputQuestion = z.infer<typeof inputSchema>;
export type MatchQuestion = z.infer<typeof matchSchema>;
export type FlashcardQuestion = z.infer<typeof flashcardSchema>;
export type Question = z.infer<typeof questionSchema>;
export type QuestionType = Question['type'];

export const questionFileSchema = z.object({
  version: z.literal(1),
  generatedAt: z.string(),
  questions: z.array(z.unknown()),
});

/**
 * Validiert jede Frage einzeln. Ungültige Fragen werden aussortiert statt die App
 * abstürzen zu lassen; die Fehler landen in `errors` und werden in der App angezeigt.
 */
export function parseQuestions(raw: unknown): { questions: Question[]; errors: string[] } {
  const errors: string[] = [];
  const questions: Question[] = [];
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { questions?: unknown }).questions)
      ? (raw as { questions: unknown[] }).questions
      : null;
  if (!list) return { questions, errors: ['Fragendatei hat kein gültiges Format'] };
  const seen = new Set<string>();
  list.forEach((item, i) => {
    const r = questionSchema.safeParse(item);
    const id = (item as { id?: string })?.id ?? `#${i}`;
    if (!r.success) {
      errors.push(`${id}: ${r.error.issues.map((x) => `${x.path.join('.')} ${x.message}`).join('; ')}`);
      return;
    }
    if (seen.has(r.data.id)) {
      errors.push(`${r.data.id}: doppelte ID`);
      return;
    }
    if (r.data.type === 'mc' && r.data.correct >= r.data.choices.length) {
      errors.push(`${id}: correct außerhalb der Antworten`);
      return;
    }
    seen.add(r.data.id);
    questions.push(r.data);
  });
  return { questions, errors };
}
