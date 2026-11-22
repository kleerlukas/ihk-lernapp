import type { CategoryId, CompareMode } from '../data/schema';

export interface CalcField {
  key: string;
  label: string;
  /** Musterlösung als Text, so wie sie angezeigt wird */
  answer: string;
  compare: CompareMode;
  unit?: string;
  /** Zahlenvergleich: erlaubte Abweichung (absolut) */
  tolerance?: number;
  /** Zahlenvergleich: erlaubte Abweichung (relativ, z. B. 0.005 = 0,5 %) */
  relTolerance?: number;
  placeholder?: string;
}

export interface CalcTask {
  generatorId: string;
  category: CategoryId;
  title: string;
  prompt: string;
  fields: CalcField[];
  /** Rechenweg, Schritt für Schritt */
  steps: string[];
  explanation: string;
  pitfall?: string;
  mnemonic?: string;
  needsReview?: boolean;
  reviewNote?: string;
}

export interface Generator {
  id: string;
  name: string;
  category: CategoryId;
  generate: (rng: Rng) => CalcTask;
}

export interface Rng {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(arr: readonly T[]) => T;
}

/** Mulberry32 – kleiner, seedbarer Zufallsgenerator (für reproduzierbare Tests). */
export function createRng(seed = Math.floor(Math.random() * 2 ** 32)): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}

/** Deutsche Zahlendarstellung: 1.234,56 */
export function de(n: number, maxDigits = 2): string {
  return n.toLocaleString('de-DE', { maximumFractionDigits: maxDigits });
}

export const round = (n: number, digits = 2) => Math.round(n * 10 ** digits) / 10 ** digits;
