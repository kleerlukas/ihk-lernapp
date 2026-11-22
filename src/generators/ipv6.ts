import { de, type CalcTask, type Generator } from './types';

/** IPv6 → 128-Bit-BigInt; akzeptiert Kurzschreibweise. null bei ungültiger Eingabe. */
export function parseIpv6(input: string): bigint | null {
  const s = input.trim().toLowerCase().replace(/\/\d+$/, '');
  if (!/^[0-9a-f:]+$/.test(s) || s.includes(':::')) return null;
  const parts = s.split('::');
  if (parts.length > 2) return null;
  const head = parts[0] ? parts[0].split(':') : [];
  const tail = parts.length === 2 && parts[1] ? parts[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (parts.length === 1 && head.length !== 8) return null;
  if (parts.length === 2 && missing < 1) return null;
  const blocks = [...head, ...Array(parts.length === 2 ? missing : 0).fill('0'), ...tail];
  if (blocks.length !== 8 || blocks.some((b) => !/^[0-9a-f]{1,4}$/.test(b))) return null;
  return blocks.reduce((acc, b) => (acc << 16n) | BigInt(parseInt(b, 16)), 0n);
}

/** Kürzeste Schreibweise nach RFC 5952 (längste Null-Folge ≥ 2 Blöcke → „::“). */
export function formatIpv6(n: bigint): string {
  const blocks: number[] = [];
  for (let i = 7; i >= 0; i--) blocks.push(Number((n >> BigInt(i * 16)) & 0xffffn));
  let bestStart = -1;
  let bestLen = 0;
  for (let i = 0; i < 8; ) {
    if (blocks[i] !== 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && blocks[j] === 0) j++;
    if (j - i > bestLen) {
      bestStart = i;
      bestLen = j - i;
    }
    i = j;
  }
  const hex = blocks.map((b) => b.toString(16));
  if (bestLen < 2) return hex.join(':');
  return `${hex.slice(0, bestStart).join(':')}::${hex.slice(bestStart + bestLen).join(':')}`;
}

export function subnetCount(oldPrefix: number, newPrefix: number): bigint {
  return 2n ** BigInt(newPrefix - oldPrefix);
}

/** Das n-te Teilnetz (n ab 1; das 1. Teilnetz beginnt bei der Basisadresse). */
export function nthSubnet(base: string, oldPrefix: number, newPrefix: number, n: number): string {
  const b = parseIpv6(base);
  if (b === null) throw new Error('Ungültige IPv6-Adresse');
  if (n < 1 || BigInt(n) > subnetCount(oldPrefix, newPrefix)) throw new Error('n außerhalb');
  const hostBits = BigInt(128 - newPrefix);
  const mask = ((1n << 128n) - 1n) ^ ((1n << BigInt(128 - oldPrefix)) - 1n);
  const net = (b & mask) + (BigInt(n - 1) << hostBits);
  return `${formatIpv6(net)}/${newPrefix}`;
}

const hex4 = (n: number) => n.toString(16).padStart(4, '0');

export const ipv6CountGenerator: Generator = {
  id: 'ipv6-count',
  name: 'IPv6: Anzahl Subnetze',
  category: 'ipv6',
  generate(rng): CalcTask {
    const [oldP, newP] = rng.pick([
      [48, 64],
      [56, 64],
      [48, 56],
      [32, 48],
      [48, 52],
      [56, 60],
    ] as const);
    const count = subnetCount(oldP, newP);
    const g3 = hex4(rng.int(1, 0xfffe));
    const byte = rng.int(0, 0xff).toString(16).padStart(2, '0');
    const base =
      oldP === 32 ? '2001:db8::/32' : oldP === 48 ? `2001:db8:${g3}::/48` : `${formatIpv6(parseIpv6(`2001:db8:${g3}:${byte}00::`)!)}/56`;
    return {
      generatorId: this.id,
      category: this.category,
      title: 'IPv6-Subnetze zählen',
      prompt: `Ein Unternehmen erhält ${base}. Wie viele /${newP}-Subnetze lassen sich daraus bilden?`,
      fields: [{ key: 'n', label: `Anzahl /${newP}-Netze`, answer: String(count), compare: 'number' }],
      steps: [
        `Anzahl = 2^(neuer Präfix − alter Präfix) = 2^(${newP} − ${oldP}) = 2^${newP - oldP}.`,
        `2^${newP - oldP} = ${de(Number(count))}.`,
      ],
      explanation: 'Jedes zusätzliche Präfix-Bit verdoppelt die Zahl der Subnetze. /48 → /64 sind 16 Bit, also 65.536 Netze.',
      mnemonic: '/48 → /64 = 65.536 · /56 → /64 = 256',
    };
  },
};

export const ipv6NthGenerator: Generator = {
  id: 'ipv6-nth',
  name: 'IPv6: n-tes Subnetz',
  category: 'ipv6',
  generate(rng): CalcTask {
    const use56 = rng.next() < 0.4;
    const g3 = rng.int(1, 0xfffe);
    const oldP = use56 ? 56 : 48;
    const base = use56 ? `2001:db8:${hex4(g3)}:${rng.int(0, 0xff).toString(16).padStart(2, '0')}00::` : `2001:db8:${hex4(g3)}::`;
    const baseShort = formatIpv6(parseIpv6(base)!);
    const max = use56 ? 256 : 4096;
    const n = rng.pick([rng.int(2, 16), rng.int(10, 40), rng.int(17, max)]);
    const result = nthSubnet(base, oldP, 64, n);
    const offset = (n - 1).toString(16);
    return {
      generatorId: this.id,
      category: this.category,
      title: 'IPv6: n-tes Subnetz',
      prompt: `Aus ${baseShort}/${oldP} werden /64-Netze gebildet. Das erste Netz ist ${baseShort}/64. Wie lautet das ${n}. /64-Netz?`,
      fields: [{ key: 'net', label: `${n}. Subnetz`, answer: result, compare: 'ipv6', placeholder: 'z. B. 2001:db8:1:a::/64' }],
      steps: [
        `Das 1. Netz hat den Index 0 → das ${n}. Netz hat den Index ${n} − 1 = ${n - 1}.`,
        `${n - 1} dezimal = ${offset} hexadezimal.`,
        `Der Index steht in den ${64 - oldP} Subnetz-Bits im 4. Block: ${use56 ? `${base.split(':')[3].slice(0, -2)}|${offset.padStart(2, '0')}` : offset.padStart(4, '0')}.`,
        `Ergebnis: ${result}.`,
      ],
      explanation:
        'Subnetze werden im 4. Block hexadezimal hochgezählt. Weil das erste Netz die Nummer 0 trägt, ist das n-te Netz n − 1 in Hex.',
      pitfall: 'Dezimal statt hexadezimal zählen (z. B. 17. Netz = :10:, nicht :17:).',
    };
  },
};
