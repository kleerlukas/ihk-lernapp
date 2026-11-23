import { maskGenerator, subnetGenerator, vlsmGenerator } from './ipv4';
import { ipv6CountGenerator, ipv6NthGenerator } from './ipv6';
import { storageNeedGenerator, unitGenerator } from './storage';
import { raidCapacityGenerator, raidDisksGenerator } from './raid';
import { availabilityGenerator, powerGenerator, transferGenerator } from './formulas';
import { chmodGenerator, ttlGenerator } from './misc';
import { mtbfGenerator, poeGenerator, usvGenerator } from './hardware';
import { createRng, type CalcTask, type Generator } from './types';

export const GENERATORS: Generator[] = [
  subnetGenerator,
  maskGenerator,
  vlsmGenerator,
  ipv6CountGenerator,
  ipv6NthGenerator,
  unitGenerator,
  storageNeedGenerator,
  raidDisksGenerator,
  raidCapacityGenerator,
  transferGenerator,
  powerGenerator,
  availabilityGenerator,
  mtbfGenerator,
  usvGenerator,
  poeGenerator,
  ttlGenerator,
  chmodGenerator,
];

export const generatorById = (id: string) => GENERATORS.find((g) => g.id === id);

/** Erzeugt eine neue Aufgabe. Fängt Fehler ab, damit ein defekter Generator die App nicht stoppt. */
export function generateTask(id: string, seed?: number): CalcTask | null {
  const g = generatorById(id);
  if (!g) return null;
  try {
    return g.generate(createRng(seed));
  } catch (e) {
    console.error(`Generator ${id} fehlgeschlagen`, e);
    return null;
  }
}

export type { CalcTask, Generator } from './types';
