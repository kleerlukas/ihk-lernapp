import { de, round, type CalcTask, type Generator } from './types';

// ---------- USV-Laufzeit ----------

/** Verbrauchte Akkuladung in % bei linearer Entladung (gleiche Last). */
export function usvUsedPercent(outageMin: number, runtimeMin: number): number {
  return (outageMin / runtimeMin) * 100;
}

export const usvGenerator: Generator = {
  id: 'usv-runtime',
  name: 'USV-Laufzeit',
  category: 'infrastruktur',
  generate(rng): CalcTask {
    const runtime = rng.pick([20, 30, 40, 45, 60, 80, 90, 120]);
    const outage = rng.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 25, 30].filter((m) => m < runtime));
    const used = usvUsedPercent(outage, runtime);
    const rest = 100 - used;
    return {
      generatorId: this.id,
      category: this.category,
      title: 'USV-Laufzeit',
      prompt: `Die USV im Serverraum hält bei der aktuellen Last ${runtime} Minuten durch (Akku voll = 100 %). Es gibt einen Stromausfall von ${outage} Minuten. Wie viel Prozent der Akkuladung wurden verbraucht, wie viel bleiben, und wie viele Minuten könnte die USV danach noch überbrücken?`,
      fields: [
        { key: 'used', label: 'Verbraucht', answer: de(round(used, 2)), unit: '%', compare: 'number', tolerance: 0.01 },
        { key: 'rest', label: 'Restladung', answer: de(round(rest, 2)), unit: '%', compare: 'number', tolerance: 0.01 },
        { key: 'min', label: 'Restlaufzeit', answer: de(runtime - outage), unit: 'min', compare: 'number' },
      ],
      steps: [
        `Bei gleicher Last sinkt die Ladung linear: ${runtime} min = 100 %`,
        `Verbraucht: ${outage} ÷ ${runtime} × 100 = ${de(round(used, 2))} %`,
        `Rest: 100 % − ${de(round(used, 2))} % = ${de(round(rest, 2))} %`,
        `Restlaufzeit: ${runtime} min − ${outage} min = ${runtime - outage} min`,
      ],
      explanation: 'Verbrauchte Ladung in % = Ausfallminuten ÷ Laufzeit bei dieser Last × 100. Maßgeblich ist die Laufzeit bei der aktuellen Last, nicht pauschal 60 Minuten.',
      pitfall: 'Mit 60 Minuten statt mit der angegebenen Laufzeit gerechnet.',
    };
  },
};

// ---------- MTBF eines Verbunds ----------

export function mtbfArray(mtbfHours: number, count: number): number {
  return mtbfHours / count;
}

export const mtbfGenerator: Generator = {
  id: 'mtbf',
  name: 'MTBF eines Verbunds',
  category: 'einheiten',
  generate(rng): CalcTask {
    const mtbf = rng.pick([500_000, 600_000, 800_000, 1_000_000, 1_200_000, 1_500_000, 2_000_000]);
    const n = rng.pick([4, 5, 6, 8, 10, 12, 16, 20, 24]);
    const h = mtbfArray(mtbf, n);
    const years = h / 8760;
    return {
      generatorId: this.id,
      category: this.category,
      title: 'MTBF eines Verbunds',
      prompt: `Ein Storage-System enthält ${n} gleiche Festplatten mit einer MTBF von je ${de(mtbf)} h. Wie hoch ist die MTBF des Verbunds in Stunden und in Jahren (365 Tage, 2 Nachkommastellen)?`,
      fields: [
        { key: 'h', label: 'MTBF Verbund', answer: de(round(h, 2)), unit: 'h', compare: 'number', relTolerance: 0.001 },
        { key: 'y', label: 'MTBF Verbund', answer: de(round(years, 2)), unit: 'Jahre', compare: 'number', tolerance: 0.011 },
      ],
      steps: [
        `MTBF Verbund = MTBF ÷ Anzahl: ${de(mtbf)} h ÷ ${n} = ${de(round(h, 2))} h`,
        `Ein Jahr = 24 h × 365 = 8.760 h`,
        `${de(round(h, 2))} h ÷ 8.760 = ${de(round(years, 2))} Jahre`,
      ],
      explanation: 'Je mehr Platten, desto früher fällt statistisch irgendeine aus. Deshalb wird die MTBF durch die Anzahl geteilt.',
      pitfall: 'Multipliziert statt geteilt.',
    };
  },
};

// ---------- PoE-Budget ----------

export function poeRest(budget: number, loads: { count: number; watt: number }[]): { total: number; rest: number } {
  const total = loads.reduce((s, l) => s + l.count * l.watt, 0);
  return { total: round(total, 2), rest: round(budget - total, 2) };
}

export const poeGenerator: Generator = {
  id: 'poe-budget',
  name: 'PoE-Budget',
  category: 'netzwerk',
  generate(rng): CalcTask {
    const budget = rng.pick([120, 185, 240, 370, 400, 740]);
    const aps = { count: rng.int(2, 12), watt: rng.pick([6.5, 9, 12.95, 13, 15.4, 17.9, 25.5]) };
    const cams = { count: rng.int(0, 8), watt: rng.pick([4, 6, 7.5, 12.95]) };
    const phones = { count: rng.int(0, 10), watt: rng.pick([3.5, 4.5, 6]) };
    const loads = [aps, cams, phones];
    const { total, rest } = poeRest(budget, loads);
    const names = ['Accesspoints', 'Kameras', 'IP-Telefone'];
    const parts = loads
      .map((l, i) => ({ ...l, name: names[i] }))
      .filter((l) => l.count > 0);
    return {
      generatorId: this.id,
      category: this.category,
      title: 'PoE-Budget',
      prompt: `Ein Switch hat ein PoE-Budget von ${budget} W. Angeschlossen werden ${parts
        .map((p) => `${p.count} ${p.name} mit je ${de(p.watt)} W`)
        .join(', ')}. Wie hoch ist der Gesamtbedarf, und wie viel Watt bleiben übrig (negativ, wenn das Budget nicht reicht)?`,
      fields: [
        { key: 'total', label: 'Gesamtbedarf', answer: de(total), unit: 'W', compare: 'number', tolerance: 0.01 },
        { key: 'rest', label: 'Reserve', answer: de(rest), unit: 'W', compare: 'number', tolerance: 0.01 },
      ],
      steps: [
        ...parts.map((p) => `${p.name}: ${p.count} × ${de(p.watt)} W = ${de(round(p.count * p.watt, 2))} W`),
        `Gesamt: ${de(total)} W`,
        `Reserve: ${budget} W − ${de(total)} W = ${de(rest)} W${rest < 0 ? ' → das Budget reicht nicht' : ''}`,
      ],
      explanation: 'Summe der Leistung aller PoE-Geräte ≤ PoE-Budget des Switches. Zusätzlich muss jeder Port die Leistung seines Geräts liefern können (802.3af bis 15,4 W, 802.3at bis 30 W).',
      pitfall: 'Nur eine Gerätegruppe gerechnet oder die Anzahl vergessen.',
    };
  },
};
