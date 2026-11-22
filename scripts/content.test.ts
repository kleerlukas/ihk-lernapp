import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractQuestions, findSectionLine, normalizeForRef, parseFrontmatter, refFound } from './content.ts';
import { parseQuestions } from '../src/data/schema.ts';
import questionsFile from '../src/data/questions.json';

const lernzettel = readFileSync(join(__dirname, '..', 'content', 'lernzettel.md'), 'utf8');

describe('Zitatprüfung (ref)', () => {
  it('findet echte Zitate trotz Markdown-Formatierung', () => {
    expect(refFound(lernzettel, '143 / 993')).toBe(true);
    expect(refFound(lernzettel, 'SMTP Submission (STARTTLS) 587')).toBe(true);
  });
  it('lehnt erfundene Zitate ab', () => {
    expect(refFound(lernzettel, 'IMAPS 994')).toBe(false);
    expect(refFound(lernzettel, 'RAID 7 Striping')).toBe(false);
  });
  it('normalisiert LaTeX und Tabellen', () => {
    expect(normalizeForRef('| **SSH** / SCP | **22** |')).toBe('ssh / scp 22');
  });
});

describe('Frontmatter und Abschnitte', () => {
  it('liest autoExtract: false', () => {
    expect(parseFrontmatter(lernzettel).meta.autoExtract).toBe(false);
  });
  it('findet Abschnittszeilen', () => {
    expect(findSectionLine(lernzettel, 'RAID-Level')).toBeGreaterThan(200);
  });
});

describe('Automatische Extraktion', () => {
  const md = `---
category: ports
---
## Neue Ports

| Dienst | Port |
| --- | --- |
| Alpha | 1001 |
| Beta | 1002 |
| Gamma | 1003 |
| Delta | 1004 |

- **Foo-Protokoll:** macht etwas sehr Wichtiges im Netz.

\`\`\`quiz
{ "id": "eigene-frage", "type": "input", "prompt": "Port von Alpha?", "accepted": ["1001"], "compare": "number", "explanation": "Steht so in der Tabelle oben." }
\`\`\`
`;
  const raw = extractQuestions(md, { file: 'neu.md', defaultCategory: 'ports' });
  const { questions, errors } = parseQuestions(raw);

  it('erzeugt gültige Fragen aus Tabellen, Definitionen und quiz-Blöcken', () => {
    expect(errors).toEqual([]);
    expect(questions.filter((q) => q.type === 'mc')).toHaveLength(4);
    expect(questions.filter((q) => q.type === 'match')).toHaveLength(1);
    expect(questions.find((q) => q.prompt.includes('Foo-Protokoll'))?.type).toBe('flashcard');
    expect(questions.find((q) => q.id === 'eigene-frage')?.category).toBe('ports');
  });
  it('MC-Falschantworten stammen aus derselben Spalte', () => {
    const mc = questions.find((q) => q.type === 'mc' && q.prompt.includes('Alpha'));
    expect(mc && mc.type === 'mc' && mc.choices.sort()).toEqual(['1001', '1002', '1003', '1004']);
  });
  it('IDs sind stabil', () => {
    const again = extractQuestions(md, { file: 'neu.md', defaultCategory: 'ports' });
    expect(again.map((q) => (q as { id: string }).id)).toEqual(raw.map((q) => (q as { id: string }).id));
  });
  it('funktioniert auch mit dem echten Lernzettel (ohne autoExtract-Sperre)', () => {
    const all = extractQuestions(lernzettel.replace('autoExtract: false', 'autoExtract: true'), {
      file: 'lernzettel.md',
      defaultCategory: 'ports',
    });
    const parsed = parseQuestions(all);
    expect(parsed.questions.length).toBeGreaterThan(100);
  });
});

describe('Generierte Fragendatenbank', () => {
  const { questions, errors } = parseQuestions(questionsFile);
  it('ist gültig und groß genug', () => {
    expect(errors).toEqual([]);
    expect(questions.length).toBeGreaterThanOrEqual(150);
  });
  it('deckt alle Kategorien ab', () => {
    const cats = new Set(questions.map((q) => q.category));
    expect(cats.size).toBe(11);
  });
  it('jede Frage hat ein geprüftes Zitat oder ist extrahiert', () => {
    for (const q of questions) if (q.origin === 'curated') expect(q.ref, q.id).toBeTruthy();
  });
});
