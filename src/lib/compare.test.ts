import { describe, expect, it } from 'vitest';
import { answerMatches, parseNumberCandidates } from './compare';

describe('tolerante Eingabe', () => {
  it('Text: Groß/Klein und Leerzeichen egal', () => {
    expect(answerMatches('  Hop limit ', 'Hop Limit', 'text')).toBe(true);
    expect(answerMatches('RW-RW-R--', 'rw-rw-r--', 'text')).toBe(true);
    expect(answerMatches('rw-rw-r-x', 'rw-rw-r--', 'text')).toBe(false);
  });
  it('Zahlen: Komma/Punkt und Tausenderpunkte', () => {
    expect(answerMatches('8,76', '8.76', 'number')).toBe(true);
    expect(answerMatches('8.76', '8.76', 'number')).toBe(true);
    expect(answerMatches('1.073.741.824', '1073741824', 'number')).toBe(true);
    expect(answerMatches('1 073 741 824', '1073741824', 'number')).toBe(true);
    expect(answerMatches('1.024', '1024', 'number')).toBe(true);
    expect(answerMatches('8,76 h', '8.76', 'number')).toBe(true);
    expect(answerMatches('8,77', '8.76', 'number')).toBe(false);
    expect(answerMatches('abc', '1', 'number')).toBe(false);
  });
  it('Zahlen im deutschen Format als Musterlösung', () => {
    expect(answerMatches('7644', '7.644', 'number', { germanExpected: true })).toBe(true);
    expect(answerMatches('1314,0', '1.314', 'number', { germanExpected: true })).toBe(true);
    expect(answerMatches('85,9', '85,9', 'number', { germanExpected: true, relTolerance: 0.002 })).toBe(true);
  });
  it('Toleranz', () => {
    expect(answerMatches('85,9', '85.8993', 'number', { relTolerance: 0.002 })).toBe(true);
    expect(answerMatches('86,5', '85.8993', 'number', { relTolerance: 0.002 })).toBe(false);
  });
  it('Zahlkandidaten', () => {
    expect(parseNumberCandidates('1,5')).toEqual([1.5]);
    expect(parseNumberCandidates('1.234,5')).toEqual([1234.5]);
    expect(parseNumberCandidates('1,234.5')).toEqual([1234.5]);
  });
  it('IPv4', () => {
    expect(answerMatches(' 255.255.255.192 ', '255.255.255.192', 'ipv4')).toBe(true);
    expect(answerMatches('255.255.255.224', '255.255.255.192', 'ipv4')).toBe(false);
  });
  it('CIDR: mit/ohne Slash oder als Maske', () => {
    expect(answerMatches('27', '/27', 'cidr')).toBe(true);
    expect(answerMatches('/ 27', '/27', 'cidr')).toBe(true);
    expect(answerMatches('255.255.255.224', '/27', 'cidr')).toBe(true);
    expect(answerMatches('/26', '/27', 'cidr')).toBe(false);
  });
  it('IPv6: Kurz- und Langschreibweise', () => {
    expect(answerMatches('2001:DB8::1', '2001:db8::1', 'ipv6')).toBe(true);
    expect(answerMatches('2001:0db8:0:0:0:0:0:1', '2001:db8::1', 'ipv6')).toBe(true);
    expect(answerMatches('2001:db8:1234:00ff:0000::/64', '2001:db8:1234:ff::/64', 'ipv6')).toBe(true);
    expect(answerMatches('2001:db8:1234:ff::', '2001:db8:1234:ff::/64', 'ipv6')).toBe(true);
    expect(answerMatches('2001:db8:1234:ff::/56', '2001:db8:1234:ff::/64', 'ipv6')).toBe(false);
    expect(answerMatches('2001:db8:1234:255::/64', '2001:db8:1234:ff::/64', 'ipv6')).toBe(false);
  });
  it('Listen', () => {
    expect(answerMatches('67 / 68', '67/68', 'list')).toBe(true);
    expect(answerMatches('67, 68', '67/68', 'list')).toBe(true);
    expect(answerMatches('68/67', '67/68', 'list')).toBe(false);
    expect(answerMatches('1,6,11', '1, 6, 11', 'list')).toBe(true);
    expect(answerMatches('discover, offer, request, acknowledge', 'Discover, Offer, Request, Acknowledge', 'list')).toBe(true);
    expect(answerMatches('Discover → Offer → Request → Acknowledge', 'Discover, Offer, Request, Acknowledge', 'list')).toBe(true);
  });
});
