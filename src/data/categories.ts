import type { CategoryId } from './schema';

export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  /** Tailwind-Farbklasse für Akzente (nie alleiniges Signal). */
  hue: string;
}

export const CATEGORIES: Category[] = [
  { id: 'ports', name: 'Ports & Protokolle', short: 'Ports', hue: 'bg-sky-500' },
  { id: 'ipv4', name: 'IPv4-Bereiche & CIDR', short: 'IPv4', hue: 'bg-teal-500' },
  { id: 'ipv6', name: 'IPv6', short: 'IPv6', hue: 'bg-emerald-500' },
  { id: 'osi', name: 'OSI, Geräte & Netzdienste', short: 'OSI', hue: 'bg-cyan-600' },
  { id: 'einheiten', name: 'Einheiten & Formeln', short: 'Einheiten', hue: 'bg-amber-500' },
  { id: 'raid', name: 'RAID', short: 'RAID', hue: 'bg-orange-500' },
  { id: 'backup', name: 'Backup & Archivierung', short: 'Backup', hue: 'bg-yellow-600' },
  { id: 'sicherheit', name: 'Sicherheit, Krypto, TOM, DSGVO', short: 'Sicherheit', hue: 'bg-rose-500' },
  { id: 'netzwerk', name: 'WLAN, VLAN, NAT, Firewall', short: 'WLAN/VLAN', hue: 'bg-indigo-500' },
  { id: 'infrastruktur', name: 'USV, Cloud, Virtualisierung', short: 'Cloud/USV', hue: 'bg-violet-500' },
  { id: 'programmierung', name: 'chmod, C#, SQL, UML', short: 'Code', hue: 'bg-fuchsia-500' },
];

export const categoryById = (id: string): Category | undefined => CATEGORIES.find((c) => c.id === id);
