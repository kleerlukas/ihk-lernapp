import type { CompareMode } from '../data/schema';
import { cidrToMask, maskToCidr, parseIpv4 } from '../generators/ipv4';
import { parseIpv6 } from '../generators/ipv6';

/** Text vereinheitlichen: Groß/Klein, Leerzeichen, typografische Zeichen. */
export function normalizeText(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[–—−]/g, '-')
    .replace(/[„“"'’]/g, '')
    .replace(/\s+/g, '')
    .replace(/[.!]+$/, '');
}

/**
 * Zahl aus Nutzereingabe lesen. Liefert alle plausiblen Deutungen, weil „1.024“
 * sowohl 1024 (deutsch) als auch 1,024 (englisch) heißen kann.
 */
export function parseNumberCandidates(input: string): number[] {
  let s = input.trim().replace(/\s|'/g, '').replace(/[−–]/g, '-');
  s = s.replace(/^[^\d\-.,]+|[^\d.,]+$/g, ''); // Einheiten wie „GiB“, „€“, „h“ abschneiden
  if (!/^-?[\d.,]+$/.test(s)) return [];
  const out = new Set<number>();
  const add = (x: string) => {
    const n = Number(x);
    if (x !== '' && Number.isFinite(n)) out.add(n);
  };
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) add(s.replace(/\./g, '').replace(',', '.'));
    else add(s.replace(/,/g, ''));
  } else if (hasComma) {
    if (/^-?\d{1,3}(,\d{3})+$/.test(s)) add(s.replace(/,/g, ''));
    if ((s.match(/,/g) ?? []).length === 1) add(s.replace(',', '.'));
  } else if (hasDot) {
    if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) add(s.replace(/\./g, ''));
    if ((s.match(/\./g) ?? []).length === 1) add(s);
  } else add(s);
  return [...out];
}

/** Zahl im deutschen Format (wie von `de()` erzeugt) eindeutig lesen. */
export function parseGerman(s: string): number {
  return Number(s.replace(/\./g, '').replace(',', '.').replace(/[^\d.\-e]/g, ''));
}

export interface NumberTolerance {
  tolerance?: number;
  relTolerance?: number;
}

export function numberMatches(input: string, expected: number, tol: NumberTolerance = {}): boolean {
  const abs = Math.max(tol.tolerance ?? 0, Math.abs(expected) * (tol.relTolerance ?? 0), 1e-9 + Math.abs(expected) * 1e-9);
  return parseNumberCandidates(input).some((n) => Math.abs(n - expected) <= abs);
}

function parseCidr(s: string): number | null {
  const t = s.trim().replace(/\s/g, '');
  const m = t.match(/^\/?(\d{1,3})$/);
  if (m) {
    const n = Number(m[1]);
    return n <= 128 ? n : null;
  }
  const mask = parseIpv4(t.replace(/^\//, ''));
  return mask === null ? null : maskToCidr(mask);
}

function ipv6Matches(input: string, expected: string): boolean {
  const [eAddr, ePre] = expected.trim().split('/');
  const [iAddr, iPre] = input.trim().split('/');
  if (iPre !== undefined && ePre !== undefined && Number(iPre) !== Number(ePre)) return false;
  const a = parseIpv6(iAddr);
  const b = parseIpv6(eAddr);
  return a !== null && a === b;
}

function splitList(s: string): string[] {
  return s
    .split(/[,;/|\n]+|\s+und\s+|\s*→\s*|\s+-\s+/)
    .map(normalizeText)
    .filter(Boolean);
}

/** Prüft eine Eingabe gegen eine Musterlösung. */
export function answerMatches(
  input: string,
  expected: string,
  mode: CompareMode,
  tol: NumberTolerance & { germanExpected?: boolean } = {},
): boolean {
  if (!input.trim()) return false;
  switch (mode) {
    case 'number': {
      const exp = tol.germanExpected ? parseGerman(expected) : Number(expected);
      return Number.isFinite(exp) && numberMatches(input, exp, tol);
    }
    case 'ipv4': {
      const a = parseIpv4(input.replace(/\s/g, ''));
      return a !== null && a === parseIpv4(expected);
    }
    case 'cidr': {
      const a = parseCidr(input);
      return a !== null && a === parseCidr(expected);
    }
    case 'ipv6':
      return ipv6Matches(input, expected);
    case 'list': {
      const a = splitList(input);
      const b = splitList(expected);
      return a.length === b.length && a.every((x, i) => x === b[i]);
    }
    case 'text':
    default:
      return normalizeText(input) === normalizeText(expected);
  }
}

export function anyAnswerMatches(input: string, accepted: string[], mode: CompareMode, tol?: NumberTolerance): boolean {
  return accepted.some((a) => answerMatches(input, a, mode, tol));
}

// für Tests
export const _internal = { parseCidr, splitList, cidrToMask };
