import { describe, expect, it } from 'vitest';
import { cidrToMask, ipv4ToString, maskToCidr, parseIpv4, prefixForHosts, subnetInfo, vlsm } from './ipv4';
import { formatIpv6, nthSubnet, parseIpv6, subnetCount } from './ipv6';
import { capacityForMaxUsage, gibToTib, storageNeed, tibToGib } from './storage';
import { raidDisksNeeded, raidNetCapacity } from './raid';
import { downtimeHours, parallelAvailability, powerCostPerYear, transferSeconds } from './formulas';
import { hopsFromTtl, octalToRwx, rwxToOctal } from './misc';
import { GENERATORS } from './index';
import { createRng } from './types';
import { answerMatches } from '../lib/compare';

describe('IPv4', () => {
  it('Maske ↔ CIDR (Lernzettel-Tabelle)', () => {
    const table: [number, string][] = [
      [8, '255.0.0.0'], [12, '255.240.0.0'], [16, '255.255.0.0'], [19, '255.255.224.0'], [20, '255.255.240.0'],
      [21, '255.255.248.0'], [22, '255.255.252.0'], [23, '255.255.254.0'], [24, '255.255.255.0'], [25, '255.255.255.128'],
      [26, '255.255.255.192'], [27, '255.255.255.224'], [28, '255.255.255.240'], [29, '255.255.255.248'], [30, '255.255.255.252'],
      [32, '255.255.255.255'],
    ];
    for (const [c, m] of table) {
      expect(ipv4ToString(cidrToMask(c))).toBe(m);
      expect(maskToCidr(parseIpv4(m)!)).toBe(c);
    }
    expect(maskToCidr(parseIpv4('255.255.236.0')!)).toBeNull();
  });

  it('Hosts pro Präfix (Lernzettel-Tabelle)', () => {
    expect(subnetInfo('10.0.0.1', 22).hosts).toBe(1022);
    expect(subnetInfo('10.0.0.1', 19).hosts).toBe(8190);
    expect(subnetInfo('10.0.0.1', 27).hosts).toBe(30);
    expect(subnetInfo('10.0.0.1', 30).hosts).toBe(2);
  });

  it('Netz-ID, Broadcast, erste/letzte Adresse', () => {
    expect(subnetInfo('192.168.10.77', 26)).toMatchObject({
      network: '192.168.10.64',
      broadcast: '192.168.10.127',
      first: '192.168.10.65',
      last: '192.168.10.126',
      hosts: 62,
    });
    expect(subnetInfo('172.16.45.200', 20)).toMatchObject({
      network: '172.16.32.0',
      broadcast: '172.16.47.255',
      first: '172.16.32.1',
      last: '172.16.47.254',
      hosts: 4094,
    });
  });

  it('kleinstes passendes Präfix', () => {
    expect(prefixForHosts(300)).toBe(23);
    expect(prefixForHosts(62)).toBe(26);
    expect(prefixForHosts(63)).toBe(25);
    expect(prefixForHosts(2)).toBe(30);
  });

  it('VLSM: 10.20.64.0/22 → 300/120/50/20/2', () => {
    const r = vlsm('10.20.64.0', 22, [
      { name: 'A', hosts: 300 },
      { name: 'B', hosts: 120 },
      { name: 'C', hosts: 50 },
      { name: 'D', hosts: 20 },
      { name: 'E', hosts: 2 },
    ]);
    expect(r.map((x) => `${x.network}/${x.cidr}`)).toEqual([
      '10.20.64.0/23',
      '10.20.66.0/25',
      '10.20.66.128/26',
      '10.20.66.192/27',
      '10.20.66.224/30',
    ]);
  });

  it('VLSM sortiert selbst nach Größe', () => {
    const r = vlsm('192.168.1.0', 24, [
      { name: 'klein', hosts: 10 },
      { name: 'groß', hosts: 100 },
    ]);
    expect(r[0]).toMatchObject({ name: 'groß', network: '192.168.1.0', cidr: 25 });
    expect(r[1]).toMatchObject({ name: 'klein', network: '192.168.1.128', cidr: 28 });
  });

  it('VLSM wirft, wenn es nicht passt', () => {
    expect(() => vlsm('192.168.1.0', 24, [{ name: 'x', hosts: 300 }])).toThrow();
  });
});

describe('IPv6', () => {
  it('Kurzschreibweise', () => {
    expect(formatIpv6(parseIpv6('2001:0db8:0000:0000:0000:0000:0000:0001')!)).toBe('2001:db8::1');
    expect(formatIpv6(parseIpv6('2001:db8:1234:00ff::')!)).toBe('2001:db8:1234:ff::');
    expect(formatIpv6(parseIpv6('::1')!)).toBe('::1');
    expect(parseIpv6('2001:db8::1::2')).toBeNull();
  });
  it('Anzahl Subnetze (Lernzettel)', () => {
    expect(subnetCount(48, 64)).toBe(65536n);
    expect(subnetCount(56, 64)).toBe(256n);
  });
  it('n-tes Subnetz – hexadezimal zählen', () => {
    // Lernzettel: /48 in 4 Teile = /50 → ::, 4000::, 8000::, c000::
    expect(nthSubnet('2001:db8:abcd::', 48, 50, 1)).toBe('2001:db8:abcd::/50');
    expect(nthSubnet('2001:db8:abcd::', 48, 50, 2)).toBe('2001:db8:abcd:4000::/50');
    expect(nthSubnet('2001:db8:abcd::', 48, 50, 3)).toBe('2001:db8:abcd:8000::/50');
    expect(nthSubnet('2001:db8:abcd::', 48, 50, 4)).toBe('2001:db8:abcd:c000::/50');
    // Lernzettel: 2001:db8:1234::/64 bis 2001:db8:1234:ff::/64
    expect(nthSubnet('2001:db8:1234::', 56, 64, 1)).toBe('2001:db8:1234::/64');
    expect(nthSubnet('2001:db8:1234::', 56, 64, 256)).toBe('2001:db8:1234:ff::/64');
    expect(nthSubnet('2001:db8:1234::', 48, 64, 17)).toBe('2001:db8:1234:10::/64');
    expect(() => nthSubnet('2001:db8:1234::', 56, 64, 257)).toThrow();
  });
});

describe('Speicher', () => {
  it('TiB ↔ GiB', () => {
    expect(tibToGib(4)).toBe(4096);
    expect(gibToTib(1536)).toBe(1.5);
  });
  it('Speicherbedarf mit Zuwachs (Lernzettel-Formel)', () => {
    // 10 TiB, 60 % belegt, 500 GiB/Jahr, 3 Jahre → 6144 + 1500 = 7644 GiB
    expect(storageNeed(10, 0.6, 500, 3)).toBeCloseTo(7644);
    // bei max. 80 % Belegung → 9555 GiB
    expect(capacityForMaxUsage(7644, 0.8)).toBeCloseTo(9555);
  });
});

describe('RAID', () => {
  it('Nettokapazität', () => {
    expect(raidNetCapacity(0, 4, 2)).toBe(8);
    expect(raidNetCapacity(5, 4, 4)).toBe(12);
    expect(raidNetCapacity(6, 6, 2)).toBe(8);
    expect(raidNetCapacity(10, 8, 4)).toBe(16);
    expect(() => raidNetCapacity(5, 2, 4)).toThrow();
  });
  it('Plattenanzahl – Beispiel Sommer 2024 (20 TiB, 4-TiB-Platten)', () => {
    expect(raidDisksNeeded(5, 20, 4, false)).toBe(6);
    expect(raidDisksNeeded(6, 20, 4, false)).toBe(7);
    expect(raidDisksNeeded(10, 20, 4, false)).toBe(10);
    expect(raidDisksNeeded(5, 20, 4, true)).toBe(7);
  });
  it('rundet Datenplatten auf', () => {
    expect(raidDisksNeeded(5, 10, 4, false)).toBe(4); // 2,5 → 3 + 1
  });
});

describe('Formeln', () => {
  it('Übertragungszeit: GiB binär, Mbit/s dezimal', () => {
    // 1 GiB über 100 Mbit/s = 8.589.934.592 bit / 1e8 = 85,89934592 s
    expect(transferSeconds(1, 100)).toBeCloseTo(85.89934592, 6);
    expect(transferSeconds(1, 100, 0.1)).toBeCloseTo(94.489280512, 6);
  });
  it('Stromkosten', () => {
    // 500 W, 0,30 €/kWh: 0,5 × 8760 × 0,3 = 1314 €
    expect(powerCostPerYear(500, 0.3)).toBeCloseTo(1314);
  });
  it('Verfügbarkeit (Lernzettel-Merkwerte)', () => {
    expect(downtimeHours(0.99)).toBeCloseTo(87.6);
    expect(downtimeHours(0.999)).toBeCloseTo(8.76);
    expect(downtimeHours(0.9999) * 60).toBeCloseTo(52.56, 2);
    expect(parallelAvailability(0.99, 0.98)).toBeCloseTo(0.9998);
  });
  it('TTL → Hops', () => {
    expect(hopsFromTtl('Windows', 117)).toBe(11);
    expect(hopsFromTtl('Linux', 57)).toBe(7);
  });
  it('chmod', () => {
    expect(octalToRwx('664')).toBe('rw-rw-r--');
    expect(octalToRwx('750')).toBe('rwxr-x---');
    expect(rwxToOctal('rwxr-xr--')).toBe('754');
    for (const o of ['000', '777', '640', '531']) expect(rwxToOctal(octalToRwx(o))).toBe(o);
  });
});

describe('Alle Generatoren', () => {
  for (const g of GENERATORS) {
    it(`${g.id}: 300 Aufgaben ohne Fehler, Musterlösung wird als richtig erkannt`, () => {
      for (let seed = 1; seed <= 300; seed++) {
        const t = g.generate(createRng(seed));
        expect(t.fields.length).toBeGreaterThan(0);
        expect(t.steps.length).toBeGreaterThan(0);
        expect(t.prompt).not.toMatch(/NaN|undefined|Infinity/);
        for (const f of t.fields) {
          expect(f.answer).not.toMatch(/NaN|undefined/);
          expect(answerMatches(f.answer, f.answer, f.compare, { ...f, germanExpected: true }), `${g.id} seed ${seed} ${f.key}`).toBe(true);
        }
      }
    });
  }

  it('erzeugt bei jedem Aufruf neue Zahlen', () => {
    const prompts = new Set(Array.from({ length: 20 }, (_, i) => GENERATORS[0].generate(createRng(i + 1000)).prompt));
    expect(prompts.size).toBeGreaterThan(15);
  });

  it('VLSM-Generator: Netze überlappen nicht und liegen im Basisnetz', () => {
    const g = GENERATORS.find((x) => x.id === 'ipv4-vlsm')!;
    for (let seed = 1; seed <= 200; seed++) {
      const t = g.generate(createRng(seed));
      const base = t.prompt.match(/Teile (\S+)\/(\d+)/)!;
      const start = parseIpv4(base[1])!;
      const end = start + 2 ** (32 - Number(base[2]));
      let prevEnd = start;
      for (const f of t.fields) {
        const [net, c] = f.answer.split('/');
        const n = parseIpv4(net)!;
        expect(n).toBeGreaterThanOrEqual(prevEnd);
        expect(n % 2 ** (32 - Number(c))).toBe(0);
        prevEnd = n + 2 ** (32 - Number(c));
      }
      expect(prevEnd).toBeLessThanOrEqual(end);
    }
  });
});
