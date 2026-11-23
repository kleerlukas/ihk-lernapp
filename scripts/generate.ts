/**
 * npm run generate
 *
 * Liest content/*.md und content/curated/*.json, prüft alles und schreibt
 * src/data/questions.json. Bricht mit Fehlercode ab, wenn eine Frage ungültig
 * ist oder ein Zitat (`ref`) nicht in der Quelldatei steht.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseQuestions, CATEGORY_IDS, type CategoryId, type Question } from '../src/data/schema.ts';
import { extractQuestions, findSectionLine, parseFrontmatter, refFound } from './content.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'content');
const curatedDir = join(contentDir, 'curated');
const outFile = join(root, 'src', 'data', 'questions.json');

const errors: string[] = [];
const warnings: string[] = [];
const raw: Record<string, unknown>[] = [];

// 1) Markdown-Quellen laden
const mdFiles = existsSync(contentDir) ? readdirSync(contentDir).filter((f) => f.endsWith('.md')).sort() : [];
const md = new Map<string, string>();
for (const f of mdFiles) md.set(f, readFileSync(join(contentDir, f), 'utf8'));

// 2) Kuratierte Fragen
const curatedFiles = existsSync(curatedDir) ? readdirSync(curatedDir).filter((f) => f.endsWith('.json')).sort() : [];
for (const f of curatedFiles) {
  let data: { file?: string; category?: string; section?: string; relevanz?: string; questions?: Record<string, unknown>[] };
  try {
    data = JSON.parse(readFileSync(join(curatedDir, f), 'utf8'));
  } catch (e) {
    errors.push(`curated/${f}: kein gültiges JSON – ${(e as Error).message}`);
    continue;
  }
  for (const q of data.questions ?? []) {
    if (!q.relevanz && !data.relevanz) errors.push(`curated/${f} › ${q.id}: "relevanz" fehlt ("kern" oder "extra")`);
    const src = (q.source ?? {}) as Record<string, unknown>;
    raw.push({
      category: data.category,
      relevanz: data.relevanz,
      origin: 'curated',
      ...q,
      source: { file: data.file, section: data.section, ...src },
      _from: `curated/${f}`,
    });
  }
}

// 3) Automatisch aus Markdown ableiten
for (const [f, text] of md) {
  const { meta } = parseFrontmatter(text);
  const cat = meta.category ?? 'netzwerk';
  if (meta.autoExtract && !meta.category) {
    warnings.push(`${f}: keine "category" im Frontmatter – nutze "${cat}". Erlaubt: ${CATEGORY_IDS.join(', ')}`);
  }
  if (!(CATEGORY_IDS as readonly string[]).includes(cat)) {
    errors.push(`${f}: unbekannte category "${cat}". Erlaubt: ${CATEGORY_IDS.join(', ')}`);
    continue;
  }
  for (const q of extractQuestions(text, { file: f, defaultCategory: cat as CategoryId })) {
    const qq = q as Record<string, unknown>;
    if (qq.error) errors.push(`${f}: ${qq.error}`);
    else raw.push({ relevanz: meta.relevanz ?? 'kern', ...qq, _from: f });
  }
}

// 4) Quelle prüfen: Datei existiert, Abschnitt existiert, Zitat steht drin
for (const q of raw) {
  const src = q.source as { file?: string; section?: string; line?: number };
  const where = `${q._from} › ${q.id}`;
  const text = src?.file ? md.get(src.file) : undefined;
  if (!text) {
    errors.push(`${where}: Quelldatei "${src?.file}" nicht in content/ gefunden`);
    continue;
  }
  const line = src.section ? findSectionLine(text, src.section) : undefined;
  if (!line) errors.push(`${where}: Abschnitt "## ${src.section}" nicht in ${src.file} gefunden`);
  else if (!src.line) src.line = line;
  if (typeof q.ref === 'string' && !refFound(text, q.ref)) {
    errors.push(`${where}: Zitat nicht in ${src.file} gefunden: "${q.ref}"`);
  }
}

// 5) Schema-Validierung
const cleaned = raw.map(({ _from, ...q }) => q);
const { questions, errors: schemaErrors } = parseQuestions(cleaned);
errors.push(...schemaErrors);

// 6) Ausgabe
const byCat = new Map<string, number>();
for (const q of questions) byCat.set(q.category, (byCat.get(q.category) ?? 0) + 1);
const review = questions.filter((q) => q.needsReview);

writeFileSync(
  outFile,
  JSON.stringify({ version: 1, generatedAt: new Date().toISOString().slice(0, 10), questions } satisfies {
    version: 1;
    generatedAt: string;
    questions: Question[];
  }, null, 1) + '\n',
);

console.log(`\n✔ ${questions.length} Fragen → src/data/questions.json`);
for (const c of CATEGORY_IDS) console.log(`  ${c.padEnd(15)} ${String(byCat.get(c) ?? 0).padStart(4)}`);
const types = new Map<string, number>();
for (const q of questions) types.set(q.type, (types.get(q.type) ?? 0) + 1);
const extra = questions.filter((q) => q.relevanz === 'extra').length;
console.log(`  Relevanz: kern ${questions.length - extra}, extra ${extra}`);
console.log(`  Typen: ${[...types].map(([t, n]) => `${t} ${n}`).join(', ')}`);
if (review.length) {
  console.log(`\n⚑ ${review.length} Fragen mit needsReview:`);
  for (const q of review) console.log(`  - ${q.id}: ${q.reviewNote ?? ''}`);
}
for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length) {
  console.error(`\n✖ ${errors.length} Fehler:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
