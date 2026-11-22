import { de, type CalcTask, type Generator, type Rng } from './types';

export function parseIpv4(s: string): number | null {
  const m = s.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const o = m.slice(1).map(Number);
  if (o.some((x) => x > 255)) return null;
  return ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0;
}

export function ipv4ToString(n: number): string {
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

export function cidrToMask(cidr: number): number {
  return cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
}

export function maskToCidr(mask: number): number | null {
  const inv = ~mask >>> 0;
  if ((inv & (inv + 1)) !== 0) return null; // keine durchgehende Folge von Einsen
  let c = 0;
  for (let i = 31; i >= 0; i--) if ((mask >>> i) & 1) c++;
  return c;
}

export interface SubnetInfo {
  network: string;
  broadcast: string;
  first: string;
  last: string;
  hosts: number;
  mask: string;
  blockSize: number;
}

export function subnetInfo(ip: string, cidr: number): SubnetInfo {
  const n = parseIpv4(ip);
  if (n === null || cidr < 0 || cidr > 30) throw new Error(`Ungültig: ${ip}/${cidr}`);
  const mask = cidrToMask(cidr);
  const net = (n & mask) >>> 0;
  const bc = (net | (~mask >>> 0)) >>> 0;
  return {
    network: ipv4ToString(net),
    broadcast: ipv4ToString(bc),
    first: ipv4ToString(net + 1),
    last: ipv4ToString(bc - 1),
    hosts: 2 ** (32 - cidr) - 2,
    mask: ipv4ToString(mask),
    blockSize: 2 ** (32 - cidr),
  };
}

/** Kleinstes Präfix, das `hosts` nutzbare Adressen bietet. */
export function prefixForHosts(hosts: number): number {
  let bits = 2;
  while (2 ** bits - 2 < hosts) bits++;
  return 32 - bits;
}

export interface VlsmAllocation {
  name: string;
  hosts: number;
  cidr: number;
  network: string;
  broadcast: string;
  usable: number;
}

/** VLSM: größtes Netz zuerst, lückenlos ab Netz-ID. */
export function vlsm(base: string, baseCidr: number, needs: { name: string; hosts: number }[]): VlsmAllocation[] {
  const start = parseIpv4(base);
  if (start === null) throw new Error('Ungültige Basisadresse');
  const end = start + 2 ** (32 - baseCidr);
  let ptr = start;
  const sorted = [...needs].sort((a, b) => b.hosts - a.hosts);
  return sorted.map((need) => {
    const cidr = prefixForHosts(need.hosts);
    const size = 2 ** (32 - cidr);
    if (ptr % size !== 0) ptr = Math.ceil(ptr / size) * size;
    if (ptr + size > end) throw new Error(`Kein Platz mehr für ${need.name}`);
    const a: VlsmAllocation = {
      name: need.name,
      hosts: need.hosts,
      cidr,
      network: ipv4ToString(ptr),
      broadcast: ipv4ToString(ptr + size - 1),
      usable: size - 2,
    };
    ptr += size;
    return a;
  });
}

const randomPrivateIp = (rng: Rng) =>
  rng.pick([
    () => `10.${rng.int(0, 255)}.${rng.int(0, 255)}.${rng.int(1, 254)}`,
    () => `172.${rng.int(16, 31)}.${rng.int(0, 255)}.${rng.int(1, 254)}`,
    () => `192.168.${rng.int(0, 255)}.${rng.int(1, 254)}`,
  ])();

export const subnetGenerator: Generator = {
  id: 'ipv4-subnet',
  name: 'IPv4-Subnetting',
  category: 'ipv4',
  generate(rng): CalcTask {
    const cidr = rng.int(18, 30);
    const ip = randomPrivateIp(rng);
    const s = subnetInfo(ip, cidr);
    const hostBits = 32 - cidr;
    const rest = cidr % 8;
    const octet = Math.floor(cidr / 8) + 1; // Oktett, in dem die Grenze liegt
    const step = 2 ** (8 - rest);
    return {
      generatorId: this.id,
      category: this.category,
      title: 'IPv4-Subnetting',
      prompt: `Gegeben ist der Host ${ip}/${cidr}. Bestimme Netz-ID, Broadcast, erste und letzte nutzbare Adresse sowie die Anzahl nutzbarer Hosts.`,
      fields: [
        { key: 'net', label: 'Netz-ID', answer: s.network, compare: 'ipv4' },
        { key: 'bc', label: 'Broadcast', answer: s.broadcast, compare: 'ipv4' },
        { key: 'first', label: 'Erste nutzbare', answer: s.first, compare: 'ipv4' },
        { key: 'last', label: 'Letzte nutzbare', answer: s.last, compare: 'ipv4' },
        { key: 'hosts', label: 'Nutzbare Hosts', answer: String(s.hosts), compare: 'number' },
      ],
      steps: [
        `/${cidr} → Maske ${s.mask}, ${hostBits} Hostbits.`,
        rest
          ? `Grenze im ${octet}. Oktett: Blockgröße 256 − ${256 - step} = ${step}. Netze beginnen dort bei Vielfachen von ${step}.`
          : `Grenze liegt auf einer Oktettgrenze – das ${octet}. Oktett ist komplett Hostanteil.`,
        `Netz-ID = ${s.network} (erste Adresse), Broadcast = ${s.broadcast} (letzte Adresse).`,
        `Nutzbar: ${s.first} bis ${s.last}.`,
        `Hosts = 2^${hostBits} − 2 = ${de(s.hosts)}.`,
      ],
      explanation:
        'Die Netz-ID ist die erste, der Broadcast die letzte Adresse des Blocks. Beide sind nicht nutzbar, deshalb 2^Hostbits − 2.',
      pitfall: 'Gateway in der Prüfung meist = letzte nutzbare Adresse (Broadcast − 1).',
    };
  },
};

export const maskGenerator: Generator = {
  id: 'ipv4-mask',
  name: 'Maske ↔ CIDR',
  category: 'ipv4',
  generate(rng): CalcTask {
    const cidr = rng.int(8, 30);
    const mask = ipv4ToString(cidrToMask(cidr));
    const toMask = rng.next() < 0.5;
    const full = Math.floor(cidr / 8);
    const rest = cidr % 8;
    return {
      generatorId: this.id,
      category: this.category,
      title: toMask ? 'CIDR → Maske' : 'Maske → CIDR',
      prompt: toMask ? `Wie lautet die Subnetzmaske zu /${cidr}?` : `Welche CIDR-Länge hat die Maske ${mask}?`,
      fields: toMask
        ? [{ key: 'mask', label: 'Maske', answer: mask, compare: 'ipv4' }]
        : [{ key: 'cidr', label: 'CIDR', answer: `/${cidr}`, compare: 'cidr' }],
      steps: [
        `${full} volle Oktette × 8 Bit = ${full * 8} Bit (je 255).`,
        rest
          ? `Restliche ${rest} Bit im nächsten Oktett: ${[128, 64, 32, 16, 8, 4, 2, 1].slice(0, rest).join(' + ')} = ${256 - 2 ** (8 - rest)}.`
          : 'Keine Restbits.',
        `→ /${cidr} = ${mask}.`,
      ],
      explanation: 'Die CIDR-Zahl ist die Anzahl der Einsen in der Maske. Pro Oktett: 128 – 192 – 224 – 240 – 248 – 252 – 254 – 255.',
      mnemonic: '128 – 192 – 224 – 240 – 248 – 252 – 254 – 255',
    };
  },
};

const DEPTS = ['Verwaltung', 'Produktion', 'Vertrieb', 'IT', 'Lager', 'Entwicklung', 'Gäste', 'Transfernetz'];

export const vlsmGenerator: Generator = {
  id: 'ipv4-vlsm',
  name: 'VLSM-Aufteilung',
  category: 'ipv4',
  generate(rng): CalcTask {
    const baseCidr = rng.pick([22, 23, 24]);
    const total = 2 ** (32 - baseCidr);
    const a = rng.pick([10, 172, 192]);
    const b = a === 10 ? rng.int(0, 255) : a === 172 ? rng.int(16, 31) : 168;
    const thirdStep = 2 ** Math.max(0, 24 - baseCidr);
    const c = Math.floor(rng.int(0, 255) / thirdStep) * thirdStep;
    const base = `${a}.${b}.${c}.0`;
    // Bedarf so wählen, dass alles passt
    let needs: { name: string; hosts: number }[] = [];
    for (let tries = 0; tries < 50; tries++) {
      const count = rng.int(3, 5);
      const names = [...DEPTS].sort(() => rng.next() - 0.5).slice(0, count);
      needs = names.map((name) => ({
        name,
        hosts: name === 'Transfernetz' ? 2 : rng.int(5, Math.max(10, Math.floor(total / (count + 1)))),
      }));
      const used = needs.reduce((s, n) => s + 2 ** (32 - prefixForHosts(n.hosts)), 0);
      if (used <= total) break;
      needs = [];
    }
    if (!needs.length) needs = [{ name: 'Verwaltung', hosts: 20 }, { name: 'Lager', hosts: 10 }, { name: 'Transfernetz', hosts: 2 }];
    const alloc = vlsm(base, baseCidr, needs);
    return {
      generatorId: this.id,
      category: this.category,
      title: 'VLSM',
      prompt: `Teile ${base}/${baseCidr} per VLSM auf (größtes Netz zuerst, lückenlos ab der Netz-ID):\n${needs
        .map((n) => `• ${n.name}: ${n.hosts} Hosts`)
        .join('\n')}\nGib jedes Teilnetz als Netz-ID/Präfix an.`,
      fields: alloc.map((x) => ({
        key: x.name,
        label: `${x.name} (${x.hosts})`,
        answer: `${x.network}/${x.cidr}`,
        compare: 'text',
        placeholder: 'z. B. 10.0.0.0/24',
      })),
      steps: [
        'Sortieren nach Größe (größtes zuerst).',
        ...alloc.map(
          (x) =>
            `${x.name}: ${x.hosts} Hosts → 2^${32 - x.cidr} − 2 = ${x.usable} ≥ ${x.hosts} → /${x.cidr} → ${x.network} – ${x.broadcast}`,
        ),
        'Der freie Rest liegt am Ende.',
      ],
      explanation:
        'Für jedes Netz das kleinste Präfix wählen, dessen 2^Hostbits − 2 reicht. Wer mit dem größten Netz beginnt, landet automatisch auf sauberen Blockgrenzen.',
      pitfall: 'Kleinstes Netz zuerst führt zu Lücken und falsch ausgerichteten Netzen.',
    };
  },
};
