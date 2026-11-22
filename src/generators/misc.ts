import type { CalcTask, Generator } from './types';

// ---------- TTL → Hops ----------

export const START_TTL = { Windows: 128, Linux: 64 } as const;
export const hopsFromTtl = (os: keyof typeof START_TTL, received: number) => START_TTL[os] - received;

export const ttlGenerator: Generator = {
  id: 'ttl-hops',
  name: 'TTL → Hops',
  category: 'osi',
  generate(rng): CalcTask {
    const os = rng.pick(['Windows', 'Linux'] as const);
    const hops = rng.int(1, 25);
    const received = START_TTL[os] - hops;
    return {
      generatorId: this.id,
      category: this.category,
      title: 'TTL → Hops',
      prompt: `Ein ping auf einen ${os}-Server liefert in der Antwort TTL=${received}. Über wie viele Router (Hops) lief die Antwort?`,
      fields: [{ key: 'hops', label: 'Hops', answer: String(hops), compare: 'number' }],
      steps: [`Start-TTL ${os}: ${START_TTL[os]}`, `Hops = Start-TTL − empfangene TTL = ${START_TTL[os]} − ${received} = ${hops}`],
      explanation: 'Jeder Router verringert die TTL um 1. Kennt man den Startwert des Betriebssystems, ergibt die Differenz die Anzahl der Hops.',
      mnemonic: 'Windows 128, Linux 64',
    };
  },
};

// ---------- chmod ----------

const RWX = ['r', 'w', 'x'] as const;

export function octalToRwx(octal: string): string {
  if (!/^[0-7]{3}$/.test(octal)) throw new Error('3 Oktalziffern erwartet');
  return [...octal]
    .map((d) => {
      const n = Number(d);
      return RWX.map((c, i) => (n & (4 >> i) ? c : '-')).join('');
    })
    .join('');
}

export function rwxToOctal(rwx: string): string {
  if (!/^([r-][w-][x-]){3}$/.test(rwx)) throw new Error('9 Zeichen rwx erwartet');
  return [0, 3, 6]
    .map((o) => (rwx[o] === 'r' ? 4 : 0) + (rwx[o + 1] === 'w' ? 2 : 0) + (rwx[o + 2] === 'x' ? 1 : 0))
    .join('');
}

const digitExplain = (d: string) => {
  const n = Number(d);
  const parts = [n & 4 ? '4 (r)' : '', n & 2 ? '2 (w)' : '', n & 1 ? '1 (x)' : ''].filter(Boolean);
  return `${d} = ${parts.length ? parts.join(' + ') : '0'} → ${octalToRwx(d + '00').slice(0, 3)}`;
};

export const chmodGenerator: Generator = {
  id: 'chmod',
  name: 'chmod Oktal ↔ rwx',
  category: 'programmierung',
  generate(rng): CalcTask {
    const common = [7, 6, 5, 4, 0];
    const digit = () => String(rng.next() < 0.8 ? rng.pick(common) : rng.int(0, 7));
    const octal = digit() + digit() + digit();
    const rwx = octalToRwx(octal);
    const toRwx = rng.next() < 0.5;
    const who = ['Eigentümer', 'Gruppe', 'Andere'];
    return {
      generatorId: this.id,
      category: this.category,
      title: toRwx ? 'chmod: Oktal → rwx' : 'chmod: rwx → Oktal',
      prompt: toRwx
        ? `Welche Rechte (rwx-Schreibweise) setzt chmod ${octal} datei?`
        : `Eine Datei hat die Rechte ${rwx}. Mit welcher Oktalzahl setzt man sie per chmod?`,
      fields: [
        toRwx
          ? { key: 'rwx', label: 'Rechte', answer: rwx, compare: 'text', placeholder: 'rwxr-x---' }
          : { key: 'oct', label: 'Oktal', answer: octal, compare: 'text', placeholder: '750' },
      ],
      steps: [...octal].map((d, i) => `${who[i]}: ${digitExplain(d)}`),
      explanation: 'r = 4, w = 2, x = 1 – die Werte werden pro Gruppe addiert. Reihenfolge: Eigentümer – Gruppe – Andere.',
      mnemonic: '4 + 2 + 1 = rwx = 7',
    };
  },
};
