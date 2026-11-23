/**
 * Hilfsfunktionen für `npm run generate`: Markdown lesen, Abschnitte finden,
 * Zitate (`ref`) prüfen und Fragen automatisch aus Tabellen/Definitionen ableiten.
 * Reine Funktionen ohne Dateizugriff → testbar.
 */
import type { CategoryId } from '../src/data/schema.ts';

export interface Frontmatter {
  autoExtract: boolean;
  category?: string;
  /** Standard-Relevanz für automatisch erzeugte Fragen dieser Datei (kern/extra). */
  relevanz?: 'kern' | 'extra';
}

export function parseFrontmatter(md: string): { meta: Frontmatter; body: string; offset: number } {
  const meta: Frontmatter = { autoExtract: true };
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return { meta, body: md, offset: 0 };
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^\s*([A-Za-z]+)\s*:\s*(.+?)\s*$/);
    if (!kv || line.trim().startsWith('#')) continue;
    if (kv[1] === 'autoExtract') meta.autoExtract = kv[2] !== 'false';
    if (kv[1] === 'category') meta.category = kv[2];
    if (kv[1] === 'relevanz' && (kv[2] === 'kern' || kv[2] === 'extra')) meta.relevanz = kv[2];
  }
  return { meta, body: md, offset: 0 };
}

/** Text für den Zitat-Vergleich vereinheitlichen (Markdown/LaTeX-Zeichen raus). */
export function normalizeForRef(s: string): string {
  return s
    .toLowerCase()
    .replace(/\\[a-z]+/g, ' ')
    .replace(/[*`|{}_^\\]/g, '')
    .replace(/[„“"]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function refFound(md: string, ref: string): boolean {
  return normalizeForRef(md).includes(normalizeForRef(ref));
}

export interface Section {
  title: string;
  line: number;
  /** Kategorie aus `<!-- category: x -->` direkt unter der Überschrift */
  category?: string;
  lines: { text: string; line: number }[];
}

export function splitSections(md: string): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;
  let inFence = false;
  md.split(/\r?\n/).forEach((text, i) => {
    if (/^```/.test(text)) inFence = !inFence;
    const h = !inFence && text.match(/^##\s+(.+?)\s*$/);
    if (h) {
      current = { title: h[1], line: i + 1, lines: [] };
      sections.push(current);
      return;
    }
    if (!current) return;
    const c = text.match(/<!--\s*category:\s*([a-z-]+)\s*-->/);
    if (c) current.category = c[1];
    current.lines.push({ text, line: i + 1 });
  });
  return sections;
}

export function findSectionLine(md: string, section: string): number | undefined {
  return splitSections(md).find((s) => s.title.trim() === section.trim())?.line;
}

export function stripMd(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\\([|*_])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

/** Kurzer, stabiler Hash (FNV-1a) → gleiche Frage behält ihre ID und damit den Lernfortschritt. */
export function shortHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

interface Table {
  header: string[];
  rows: string[][];
  line: number;
}

function parseTables(section: Section): Table[] {
  const tables: Table[] = [];
  let buf: { text: string; line: number }[] = [];
  const flush = () => {
    if (buf.length >= 3 && /^\|?\s*:?-{3,}/.test(buf[1].text.trim())) {
      const cells = (t: string) =>
        t
          .trim()
          .replace(/^\||\|$/g, '')
          .split(/(?<!\\)\|/)
          .map((c) => stripMd(c));
      tables.push({ header: cells(buf[0].text), rows: buf.slice(2).map((r) => cells(r.text)), line: buf[0].line });
    }
    buf = [];
  };
  for (const l of section.lines) {
    if (l.text.trim().startsWith('|')) buf.push(l);
    else flush();
  }
  flush();
  return tables;
}

function pickDistractors(correct: string, pool: string[], n: number, seed: string): string[] {
  const others = [...new Set(pool.filter((p) => p && p !== correct))];
  // deterministisch mischen, damit generate bei gleichem Inhalt gleiche Dateien erzeugt
  others.sort((a, b) => shortHash(seed + a).localeCompare(shortHash(seed + b)));
  return others.slice(0, n);
}

export interface ExtractOptions {
  file: string;
  defaultCategory: CategoryId;
}

/**
 * Erzeugt Fragen aus einer Markdown-Datei:
 * - pro Tabellenzelle (Spalte ≥ 2) eine MC-Frage (Falschantworten aus derselben Spalte)
 *   bzw. eine Karteikarte, wenn es zu wenige verschiedene Werte gibt
 * - pro Tabellenspalte eine Zuordnungsaufgabe (max. 6 Zeilen)
 * - pro `**Begriff:** Erklärung` eine Karteikarte
 * - ```quiz-Blöcke (JSON) werden 1:1 übernommen
 */
export function extractQuestions(md: string, opts: ExtractOptions): unknown[] {
  const out: unknown[] = [];
  const { meta } = parseFrontmatter(md);
  for (const sec of splitSections(md)) {
    const category = (sec.category ?? meta.category ?? opts.defaultCategory) as CategoryId;
    const source = { file: opts.file, section: sec.title, line: sec.line };
    const base = { category, source, origin: 'extracted' as const };

    // 1) eigene Fragen in ```quiz-Blöcken – auch bei autoExtract: false
    const text = sec.lines.map((l) => l.text).join('\n');
    for (const m of text.matchAll(/```quiz\s*\n([\s\S]*?)```/g)) {
      try {
        const parsed = JSON.parse(m[1]);
        for (const q of Array.isArray(parsed) ? parsed : [parsed]) {
          out.push({ ...base, origin: 'curated', ...q, source: { ...source, ...(q.source ?? {}) } });
        }
      } catch (e) {
        out.push({ id: `invalid-quiz-${shortHash(m[1])}`, error: `quiz-Block ist kein gültiges JSON: ${(e as Error).message}` });
      }
    }
    if (!meta.autoExtract) continue;

    // 2) Tabellen
    for (const t of parseTables(sec)) {
      if (t.header.length < 2 || t.rows.length < 2) continue;
      for (let col = 1; col < t.header.length; col++) {
        const colName = t.header[col];
        if (!colName) continue;
        const values = t.rows.map((r) => r[col] ?? '');
        const usable = t.rows.filter((r) => r[0] && r[col]);
        for (const row of usable) {
          const key = row[0];
          const correct = row[col];
          const prompt = `${sec.title}: ${t.header[0]} „${key}“ – ${colName}?`;
          const id = `x-${slug(opts.file)}-${shortHash(prompt)}`;
          const explanation = `Laut ${opts.file}, Abschnitt „${sec.title}“: ${t.header[0]} „${key}“ → ${colName}: ${correct}.`;
          const distractors = pickDistractors(correct, values, 3, prompt);
          if (distractors.length === 3) {
            out.push({ ...base, id, type: 'mc', prompt, choices: [correct, ...distractors], correct: 0, explanation });
          } else {
            out.push({ ...base, id, type: 'flashcard', prompt, answer: correct, explanation });
          }
        }
        const pairs = usable.slice(0, 6).map((r) => ({ left: r[0], right: r[col] }));
        if (pairs.length >= 3 && new Set(pairs.map((p) => p.left)).size === pairs.length) {
          const prompt = `${sec.title}: Ordne ${t.header[0]} → ${colName} zu.`;
          out.push({
            ...base,
            id: `x-${slug(opts.file)}-${shortHash(prompt + t.line)}`,
            type: 'match',
            prompt,
            pairs,
            explanation: `Zuordnung aus der Tabelle in ${opts.file}, Abschnitt „${sec.title}“.`,
          });
        }
      }
    }

    // 3) Definitionen: „- **Begriff:** Erklärung“ oder „**Begriff:** Erklärung“
    for (const l of sec.lines) {
      const d = l.text.match(/^\s*(?:[-*]\s+)?\*\*([^*]{2,60}?):?\*\*:?\s+(.{10,})$/);
      if (!d) continue;
      const term = stripMd(d[1]).replace(/:$/, '');
      const answer = stripMd(d[2]);
      const prompt = `Was bedeutet „${term}“?`;
      out.push({
        ...base,
        id: `x-${slug(opts.file)}-${shortHash(prompt + answer)}`,
        type: 'flashcard',
        prompt,
        answer,
        explanation: `Definition aus ${opts.file}, Abschnitt „${sec.title}“.`,
        source: { ...source, line: l.line },
      });
    }
  }
  return out;
}
