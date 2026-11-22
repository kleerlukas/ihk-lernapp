import { de, type CalcTask, type Generator } from './types';

export type RaidLevel = 0 | 1 | 5 | 6 | 10;

/** Nettokapazität laut Lernzettel-Tabelle. */
export function raidNetCapacity(level: RaidLevel, disks: number, size: number): number {
  switch (level) {
    case 0:
      return disks * size;
    case 1:
      return size; // klassisch 2 Platten gespiegelt
    case 5:
      if (disks < 3) throw new Error('RAID 5 braucht mind. 3 Platten');
      return (disks - 1) * size;
    case 6:
      if (disks < 4) throw new Error('RAID 6 braucht mind. 4 Platten');
      return (disks - 2) * size;
    case 10:
      if (disks < 4 || disks % 2) throw new Error('RAID 10 braucht eine gerade Anzahl ≥ 4');
      return (disks / 2) * size;
  }
}

/** Rechenweg „Wie viele Platten brauche ich?“: aufrunden → +1/+2/×2 → +Hot-Spare */
export function raidDisksNeeded(level: 5 | 6 | 10, netto: number, size: number, hotSpare: boolean): number {
  const data = Math.ceil(netto / size - 1e-9);
  let disks = level === 5 ? data + 1 : level === 6 ? data + 2 : data * 2;
  if (level === 5) disks = Math.max(disks, 3);
  if (level === 6) disks = Math.max(disks, 4);
  if (level === 10) disks = Math.max(disks, 4);
  return disks + (hotSpare ? 1 : 0);
}

export const raidDisksGenerator: Generator = {
  id: 'raid-disks',
  name: 'RAID: Plattenanzahl',
  category: 'raid',
  generate(rng): CalcTask {
    const level = rng.pick([5, 6, 10] as const);
    const size = rng.pick([2, 4, 6, 8, 10, 12, 16]);
    const netto = rng.int(2, 12) * rng.pick([2, 4, 5]);
    const spare = rng.next() < 0.6;
    const unit = rng.pick(['TiB', 'TB']);
    const data = Math.ceil(netto / size - 1e-9);
    const total = raidDisksNeeded(level, netto, size, spare);
    const redundancy = level === 5 ? `${data} + 1` : level === 6 ? `${data} + 2` : `${data} × 2`;
    return {
      generatorId: this.id,
      category: this.category,
      title: `RAID ${level}: Plattenanzahl`,
      prompt: `Benötigt werden ${netto} ${unit} Nettokapazität als RAID ${level} mit ${size}-${unit}-Platten${spare ? ' und einer Hot-Spare' : ' (ohne Hot-Spare)'}. Wie viele Platten werden insgesamt benötigt?`,
      fields: [{ key: 'n', label: 'Platten gesamt', answer: String(total), compare: 'number' }],
      steps: [
        `Datenplatten: ${netto} ÷ ${size} = ${de(netto / size)} → aufrunden → ${data}`,
        `RAID ${level}: ${redundancy} = ${total - (spare ? 1 : 0)}`,
        spare ? `+ 1 Hot-Spare = ${total}` : 'Keine Hot-Spare.',
      ],
      explanation: 'Erst die reinen Datenplatten bestimmen (aufrunden), dann die Redundanz des RAID-Levels addieren. Eine Hot-Spare kommt extra dazu.',
      pitfall: 'Hot-Spare vergessen oder Datenplatten abgerundet.',
      mnemonic: 'RAID 5: +1 · RAID 6: +2 · RAID 10: ×2 · Hot-Spare: +1',
    };
  },
};

export const raidCapacityGenerator: Generator = {
  id: 'raid-capacity',
  name: 'RAID: Nettokapazität',
  category: 'raid',
  generate(rng): CalcTask {
    const level = rng.pick([0, 5, 6, 10] as const);
    const disks = level === 10 ? rng.pick([4, 6, 8, 10, 12]) : rng.int(level === 6 ? 4 : 3, 12);
    const size = rng.pick([1, 2, 4, 8, 12, 16, 18]);
    const unit = rng.pick(['TiB', 'TB']);
    const net = raidNetCapacity(level, disks, size);
    const formula = { 0: 'n × C', 5: '(n − 1) × C', 6: '(n − 2) × C', 10: 'n/2 × C' }[level];
    const filled = { 0: `${disks} × ${size}`, 5: `(${disks} − 1) × ${size}`, 6: `(${disks} − 2) × ${size}`, 10: `${disks}/2 × ${size}` }[level];
    const fail = { 0: '0', 5: '1', 6: '2 beliebige', 10: '1 sicher (mehr nur aus verschiedenen Spiegeln)' }[level];
    return {
      generatorId: this.id,
      category: this.category,
      title: `RAID ${level}: Nettokapazität`,
      prompt: `Ein RAID ${level} besteht aus ${disks} Platten mit je ${size} ${unit}. Wie groß ist die Nettokapazität?`,
      fields: [{ key: 'net', label: 'Nettokapazität', answer: String(net), unit, compare: 'number' }],
      steps: [`RAID ${level}: Netto = ${formula}`, `${filled} = ${net} ${unit}`, `Ausfallen dürfen: ${fail}.`],
      explanation: 'RAID 5 opfert eine Platte für die Parität, RAID 6 zwei, RAID 10 die Hälfte für die Spiegelung. RAID 0 hat keine Redundanz.',
    };
  },
};
