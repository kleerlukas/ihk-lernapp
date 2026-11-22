import { de, round, type CalcTask, type Generator } from './types';

// ---------- Übertragungszeit ----------

/** Sekunden für `gib` GiB über `mbit` Mbit/s mit `overhead` (z. B. 0.1 = 10 %). */
export function transferSeconds(gib: number, mbit: number, overhead = 0): number {
  const bits = gib * 1024 ** 3 * 8;
  return (bits * (1 + overhead)) / (mbit * 1e6);
}

export const transferGenerator: Generator = {
  id: 'transfer-time',
  name: 'Übertragungszeit',
  category: 'einheiten',
  generate(rng): CalcTask {
    const gib = rng.pick([2, 5, 10, 20, 25, 50, 100, 200, 500]);
    const mbit = rng.pick([16, 50, 100, 250, 500, 1000]);
    const oh = rng.pick([0, 0.05, 0.1, 0.15, 0.2]);
    const s = transferSeconds(gib, mbit, oh);
    const bits = gib * 1024 ** 3 * 8;
    return {
      generatorId: this.id,
      category: this.category,
      title: 'Übertragungszeit',
      prompt: `${gib} GiB sollen über eine Leitung mit ${mbit} Mbit/s übertragen werden${oh ? `. Der Protokoll-Overhead beträgt ${de(oh * 100)} %` : ' (ohne Overhead)'}. Wie lange dauert das? (Sekunden und Minuten, 2 Nachkommastellen)`,
      fields: [
        { key: 's', label: 'Zeit', answer: de(round(s, 2)), unit: 's', compare: 'number', relTolerance: 0.002 },
        { key: 'min', label: 'Zeit', answer: de(round(s / 60, 2)), unit: 'min', compare: 'number', relTolerance: 0.003 },
      ],
      steps: [
        `Datenmenge binär: ${gib} GiB × 1.024³ = ${de(gib * 1024 ** 3)} Byte`,
        `In Bit: × 8 = ${de(bits)} bit`,
        oh ? `Mit Overhead: × ${de(1 + oh)} = ${de(bits * (1 + oh))} bit` : 'Kein Overhead.',
        `Rate dezimal: ${mbit} Mbit/s = ${de(mbit * 1e6)} bit/s`,
        `t = ${de(bits * (1 + oh))} ÷ ${de(mbit * 1e6)} = ${de(round(s, 2))} s = ${de(round(s / 60, 2))} min`,
      ],
      explanation: 'Speicher ist binär (GiB × 1.024³), Übertragungsraten sind immer dezimal (Mbit/s × 10^6). Bytes müssen in Bit umgerechnet werden (× 8).',
      pitfall: 'Mal 8 vergessen oder die Rate binär gerechnet.',
    };
  },
};

// ---------- Stromkosten ----------

/** Jahreskosten in € bei Dauerbetrieb. */
export function powerCostPerYear(watt: number, pricePerKWh: number): number {
  return (watt / 1000) * 24 * 365 * pricePerKWh;
}

export const powerGenerator: Generator = {
  id: 'power-cost',
  name: 'Stromkosten pro Jahr',
  category: 'einheiten',
  generate(rng): CalcTask {
    const devices = rng.int(1, 4);
    const watt = rng.pick([45, 65, 120, 150, 250, 350, 450, 600, 800]);
    const ct = rng.pick([25, 28, 30, 32, 35, 38, 40]);
    const totalW = devices * watt;
    const kwh = (totalW / 1000) * 8760;
    const cost = powerCostPerYear(totalW, ct / 100);
    return {
      generatorId: this.id,
      category: this.category,
      title: 'Stromkosten',
      prompt: `${devices === 1 ? 'Ein Server läuft' : `${devices} Server laufen`} rund um die Uhr und ${devices === 1 ? 'verbraucht' : 'verbrauchen je'} ${watt} W. Eine kWh kostet ${ct} ct. Wie hoch sind die Stromkosten pro Jahr (365 Tage)?`,
      fields: [
        { key: 'kwh', label: 'Verbrauch', answer: de(round(kwh, 2)), unit: 'kWh', compare: 'number', relTolerance: 0.001 },
        { key: 'eur', label: 'Kosten', answer: de(round(cost, 2)), unit: '€', compare: 'number', tolerance: 0.05 },
      ],
      steps: [
        devices > 1 ? `Gesamtleistung: ${devices} × ${watt} W = ${totalW} W` : `Leistung: ${totalW} W`,
        `In kW: ${totalW} W ÷ 1.000 = ${de(totalW / 1000, 3)} kW`,
        `Pro Jahr: ${de(totalW / 1000, 3)} kW × 24 h × 365 = ${de(round(kwh, 2))} kWh`,
        `Kosten: ${de(round(kwh, 2))} kWh × ${de(ct / 100)} € = ${de(round(cost, 2))} €`,
      ],
      explanation: 'Kosten = Leistung in kW × 24 × 365 × Preis pro kWh. Wichtig ist die Umrechnung von Watt in Kilowatt und von Cent in Euro.',
      pitfall: 'W nicht durch 1.000 geteilt oder Cent nicht in Euro umgerechnet.',
    };
  },
};

// ---------- Verfügbarkeit ----------

export const downtimeHours = (availability: number) => (1 - availability) * 8760;
export const parallelAvailability = (v1: number, v2: number) => 1 - (1 - v1) * (1 - v2);

export const availabilityGenerator: Generator = {
  id: 'availability',
  name: 'Verfügbarkeit & Ausfallzeit',
  category: 'einheiten',
  generate(rng): CalcTask {
    const pct = (v: number) => `${de(v * 100, 4)} %`;
    if (rng.next() < 0.5) {
      const v = rng.pick([0.95, 0.98, 0.99, 0.995, 0.999, 0.9995, 0.9999]);
      const h = downtimeHours(v);
      return {
        generatorId: this.id,
        category: this.category,
        title: 'Ausfallzeit',
        prompt: `Ein Provider garantiert ${pct(v)} Verfügbarkeit. Wie viele Stunden darf die Leitung pro Jahr (8.760 h) maximal ausfallen?`,
        fields: [
          { key: 'h', label: 'Ausfallzeit', answer: de(round(h, 2)), unit: 'h', compare: 'number', tolerance: 0.01 },
          { key: 'min', label: 'Ausfallzeit', answer: de(round(h * 60, 1)), unit: 'min', compare: 'number', tolerance: 0.6 },
        ],
        steps: [
          `Ausfallanteil: 1 − ${de(v, 4)} = ${de(round(1 - v, 6), 6)}`,
          `× 8.760 h = ${de(round(h, 2))} h`,
          `× 60 = ${de(round(h * 60, 1))} min`,
        ],
        explanation: 'Ausfallzeit pro Jahr = (1 − Verfügbarkeit) × 8.760 h. Merkwerte: 99 % = 87,6 h, 99,9 % = 8,76 h, 99,99 % = 52,6 min.',
      };
    }
    const v1 = rng.pick([0.95, 0.97, 0.98, 0.99, 0.995]);
    const v2 = rng.pick([0.9, 0.95, 0.97, 0.98, 0.99]);
    const v = parallelAvailability(v1, v2);
    return {
      generatorId: this.id,
      category: this.category,
      title: 'Zwei Leitungen parallel',
      prompt: `Ein Standort hat zwei unabhängige Internetleitungen mit ${pct(v1)} und ${pct(v2)} Verfügbarkeit. Wie hoch ist die Gesamtverfügbarkeit (in %, 4 Nachkommastellen)?`,
      fields: [{ key: 'v', label: 'Gesamtverfügbarkeit', answer: de(round(v * 100, 4), 4), unit: '%', compare: 'number', tolerance: 0.00051 }],
      steps: [
        `Ausfallwahrscheinlichkeiten: 1 − ${de(v1, 4)} = ${de(round(1 - v1, 4), 4)} und 1 − ${de(v2, 4)} = ${de(round(1 - v2, 4), 4)}`,
        `Beide gleichzeitig: ${de(round(1 - v1, 4), 4)} × ${de(round(1 - v2, 4), 4)} = ${de(round((1 - v1) * (1 - v2), 6), 6)}`,
        `V = 1 − ${de(round((1 - v1) * (1 - v2), 6), 6)} = ${de(round(v, 6), 6)} = ${de(round(v * 100, 4), 4)} %`,
      ],
      explanation: 'Parallel geschaltet fällt das System nur aus, wenn beide Leitungen gleichzeitig ausfallen: V = 1 − (1 − V1) × (1 − V2).',
      pitfall: 'V1 × V2 wäre eine Reihenschaltung – das Ergebnis wäre schlechter statt besser.',
    };
  },
};
