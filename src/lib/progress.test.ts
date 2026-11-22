import { describe, expect, it } from 'vitest';
import { addDays, emptyProgress, ihkGrade, mergeProgress, nextBox, recordAnswer, streak } from './progress';
import { buildSession, dueCount } from './session';
import { parseQuestions } from '../data/schema';
import questionsFile from '../data/questions.json';

const { questions } = parseQuestions(questionsFile);

describe('Leitner', () => {
  it('Fachwechsel', () => {
    expect(nextBox(1, 'correct')).toBe(2);
    expect(nextBox(5, 'correct')).toBe(5);
    expect(nextBox(4, 'partial')).toBe(3);
    expect(nextBox(1, 'partial')).toBe(1);
    expect(nextBox(5, 'wrong')).toBe(1);
  });
  it('falsche Karten kommen sofort wieder, sichere selten', () => {
    let p = emptyProgress();
    p = recordAnswer(p, 'a', 'wrong', '2026-11-22');
    expect(p.cards.a).toMatchObject({ box: 1, due: '2026-11-22', wrong: 1 });
    p = recordAnswer(p, 'a', 'correct', '2026-11-22');
    expect(p.cards.a).toMatchObject({ box: 2, due: '2026-11-23' });
    p = recordAnswer(p, 'a', 'correct', '2026-11-23');
    p = recordAnswer(p, 'a', 'correct', '2026-11-26');
    p = recordAnswer(p, 'a', 'correct', '2026-12-03');
    expect(p.cards.a).toMatchObject({ box: 5, due: '2026-12-17' });
  });
  it('neue, direkt gewusste Karte startet in Fach 2', () => {
    const p = recordAnswer(emptyProgress(), 'b', 'correct', '2026-11-22');
    expect(p.cards.b.box).toBe(2);
  });
  it('Datum rechnet über Monatsgrenzen', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('Serie, Merge, Note', () => {
  it('Lernserie', () => {
    let p = emptyProgress();
    for (const d of ['2026-11-19', '2026-11-20', '2026-11-21']) p = recordAnswer(p, 'x', 'correct', d);
    expect(streak(p, '2026-11-22')).toBe(3); // heute noch nichts gelernt → Serie läuft weiter
    p = recordAnswer(p, 'x', 'correct', '2026-11-22');
    expect(streak(p, '2026-11-22')).toBe(4);
    expect(streak(p, '2026-11-24')).toBe(0);
  });
  it('Merge nimmt den neueren Kartenstand', () => {
    const a = emptyProgress();
    a.cards.k = { box: 2, due: '2026-11-01', seen: 1, correct: 1, partial: 0, wrong: 0, last: '2026-11-01T10:00:00Z' };
    const b = emptyProgress();
    b.cards.k = { box: 4, due: '2026-11-10', seen: 3, correct: 3, partial: 0, wrong: 0, last: '2026-11-05T10:00:00Z' };
    b.cards.n = { box: 1, due: '2026-11-05', seen: 1, correct: 0, partial: 0, wrong: 1, last: '2026-11-05T10:00:00Z' };
    const m = mergeProgress(a, b);
    expect(m.cards.k.box).toBe(4);
    expect(m.cards.n).toBeTruthy();
  });
  it('IHK-Notenschlüssel', () => {
    expect([100, 92, 91.9, 81, 80, 67, 66, 50, 49, 30, 29, 0].map(ihkGrade)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);
  });
});

describe('Sitzungen', () => {
  it('tägliches Lernen ohne Fortschritt: neue Karten + Rechenaufgaben', () => {
    const s = buildSession('daily', questions, emptyProgress());
    expect(s.filter((i) => i.kind === 'question')).toHaveLength(10);
    expect(s.filter((i) => i.kind === 'calc').length).toBeGreaterThan(0);
  });
  it('Prüfung: 20 Aufgaben, keine Karteikarten', () => {
    const s = buildSession('exam', questions, emptyProgress());
    expect(s).toHaveLength(20);
    expect(s.some((i) => i.kind === 'question' && i.question.type === 'flashcard')).toBe(false);
  });
  it('Thema: nur eine Kategorie', () => {
    const s = buildSession('topic', questions, emptyProgress(), { category: 'raid' });
    expect(s.every((i) => (i.kind === 'question' ? i.question.category : i.task.category) === 'raid')).toBe(true);
  });
  it('Nur Rechnen: nur Generatoren', () => {
    const s = buildSession('calc', questions, emptyProgress());
    expect(s).toHaveLength(10);
    expect(s.every((i) => i.kind === 'calc')).toBe(true);
  });
  it('Schwächen: häufig falsche zuerst', () => {
    let p = emptyProgress();
    p = recordAnswer(p, questions[0].id, 'wrong');
    p = recordAnswer(p, questions[1].id, 'wrong');
    p = recordAnswer(p, questions[1].id, 'wrong');
    p = recordAnswer(p, questions[2].id, 'correct');
    const s = buildSession('weak', questions, p);
    expect(s.map((i) => i.key).sort()).toEqual([questions[0].id, questions[1].id].sort());
  });
  it('fällige Karten zählen', () => {
    let p = emptyProgress();
    p = recordAnswer(p, questions[0].id, 'wrong');
    expect(dueCount(questions, p)).toBe(1);
  });
});
