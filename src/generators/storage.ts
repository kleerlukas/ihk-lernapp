import { de, round, type CalcTask, type Generator } from './types';

export const tibToGib = (tib: number) => tib * 1024;
export const gibToTib = (gib: number) => gib / 1024;

/** Lernzettel: Bedarf = Kapazität_alt · Belegung · 1024 + Zuwachs_GiB/Jahr · Jahre  (Ergebnis in GiB) */
export function storageNeed(capTiB: number, usage: number, growthGiBPerYear: number, years: number): number {
  return capTiB * usage * 1024 + growthGiBPerYear * years;
}

/** Zu beschaffende Kapazität, damit der Bedarf höchstens `maxUsage` der Gesamtkapazität belegt. */
export function capacityForMaxUsage(needGiB: number, maxUsage: number): number {
  return needGiB / maxUsage;
}

export const unitGenerator: Generator = {
  id: 'storage-units',
  name: 'TiB ↔ GiB ↔ MiB',
  category: 'einheiten',
  generate(rng): CalcTask {
    const variant = rng.int(0, 3);
    if (variant === 0) {
      const tib = rng.pick([0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16]);
      return task(this, `Wie viele GiB sind ${de(tib)} TiB?`, de(tibToGib(tib)), 'GiB', [`${de(tib)} TiB × 1.024 = ${de(tibToGib(tib))} GiB`]);
    }
    if (variant === 1) {
      const gib = rng.pick([256, 512, 1536, 2048, 3072, 5120, 768, 10240]);
      return task(this, `Wie viele TiB sind ${de(gib)} GiB?`, de(gibToTib(gib), 4), 'TiB', [`${de(gib)} GiB ÷ 1.024 = ${de(gibToTib(gib), 4)} TiB`]);
    }
    if (variant === 2) {
      const gib = rng.pick([1, 2, 4, 8, 16, 32]);
      const mib = gib * 1024;
      return task(this, `Wie viele MiB sind ${gib} GiB?`, de(mib), 'MiB', [`${gib} GiB × 1.024 = ${de(mib)} MiB`]);
    }
    const tb = rng.pick([1, 2, 4, 8, 10, 12, 16, 20]);
    const tib = (tb * 1e12) / 1024 ** 4;
    return task(
      this,
      `Eine Festplatte hat laut Hersteller ${tb} TB (dezimal). Wie viele TiB sind das? (2 Nachkommastellen)`,
      de(round(tib, 2)),
      'TiB',
      [`${tb} TB = ${tb} × 10^12 Byte`, `1 TiB = 1.024^4 Byte = 1.099.511.627.776 Byte`, `${tb} × 10^12 ÷ 1.024^4 ≈ ${de(round(tib, 2))} TiB`],
      0.01,
      'Hersteller rechnen dezimal (TB), Betriebssysteme oft binär (TiB) – deshalb „fehlt“ scheinbar Speicher.',
    );
  },
};

function task(
  g: Generator,
  prompt: string,
  answer: string,
  unit: string,
  steps: string[],
  tolerance = 0.001,
  pitfall = 'Binärpräfixe (KiB, MiB, GiB, TiB) immer mit 1.024 umrechnen, nicht mit 1.000.',
): CalcTask {
  return {
    generatorId: g.id,
    category: g.category,
    title: 'Speichereinheiten',
    prompt,
    fields: [{ key: 'v', label: 'Ergebnis', answer, unit, compare: 'number', tolerance }],
    steps,
    explanation: 'Binärpräfixe gehen in Schritten von 1.024 (2^10). Speicher wird in der Prüfung meist binär gerechnet.',
    pitfall,
  };
}

export const storageNeedGenerator: Generator = {
  id: 'storage-need',
  name: 'Speicherbedarf mit Zuwachs',
  category: 'einheiten',
  generate(rng): CalcTask {
    const cap = rng.pick([2, 4, 6, 8, 10, 12, 16, 20]);
    const usage = rng.pick([0.4, 0.5, 0.6, 0.65, 0.7, 0.75, 0.8]);
    const growth = rng.pick([100, 200, 250, 300, 400, 500, 750, 1000, 1500]);
    const years = rng.int(2, 5);
    const max = rng.pick([0.7, 0.75, 0.8, 0.85, 0.9]);
    const need = storageNeed(cap, usage, growth, years);
    const total = capacityForMaxUsage(need, max);
    const pct = (x: number) => `${de(x * 100)} %`;
    return {
      generatorId: this.id,
      category: this.category,
      title: 'Speicherbedarf',
      prompt: `Ein Fileserver hat ${cap} TiB Kapazität, davon sind ${pct(usage)} belegt. Pro Jahr kommen ${de(growth)} GiB hinzu. Der neue Server soll ${years} Jahre reichen und darf höchstens zu ${pct(max)} belegt sein.\n\na) Wie viel Speicher (GiB) wird nach ${years} Jahren belegt sein?\nb) Welche Kapazität (GiB) muss der neue Server mindestens haben?`,
      fields: [
        { key: 'need', label: 'a) Bedarf', answer: de(round(need, 2)), unit: 'GiB', compare: 'number', tolerance: 0.5 },
        { key: 'total', label: 'b) Mindestkapazität', answer: de(round(total, 2)), unit: 'GiB', compare: 'number', relTolerance: 0.002 },
      ],
      steps: [
        `Altbestand: ${cap} TiB × ${de(usage)} × 1.024 = ${de(cap * usage * 1024)} GiB`,
        `Zuwachs: ${de(growth)} GiB × ${years} Jahre = ${de(growth * years)} GiB`,
        `a) Bedarf = ${de(cap * usage * 1024)} + ${de(growth * years)} = ${de(round(need, 2))} GiB`,
        `b) Maximalbelegung ${pct(max)}: ${de(round(need, 2))} GiB ÷ ${de(max)} = ${de(round(total, 2))} GiB (≈ ${de(round(total / 1024, 2))} TiB)`,
      ],
      explanation:
        'Erst den belegten Altbestand von TiB in GiB umrechnen (× 1.024), dann den Zuwachs über die Laufzeit addieren. Teil b) teilt durch die zulässige Maximalbelegung.',
      pitfall: 'TiB → GiB mit 1.024, nicht mit 1.000.',
      needsReview: true,
      reviewNote:
        'Teil b) (Teilen durch die Maximalbelegung) steht nicht im Lernzettel – dort ist nur Teil a) beschrieben. Bitte Rechenweg prüfen.',
    };
  },
};
