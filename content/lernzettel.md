---
autoExtract: false
# Dieser Lernzettel ist vollständig durch content/curated/*.json abgedeckt.
# Für neue Dateien: autoExtract weglassen (Standard: true) und category setzen.
---

# FISI AP2 – Lernzettel zum Auswendiglernen

## So nutzt du den Lernzettel

Dieser Zettel enthält nur Fakten, die du in der AP2 auswendig können musst. Grundlage sind alle FISI-Prüfungen von Winter 2021 bis Winter 2025 (Teil 1 „Konzeption und Administration von IT-Systemen“ und Teil 2 „Analyse und Entwicklung von Netzwerken“). Verstehen und Rechnen übst du mit dem separaten Übungsdokument.

**Lernreihenfolge nach Prüfungshäufigkeit** (★★★ = kam in fast jeder Prüfung):

| Block | Thema | Häufigkeit | Lernzeit |
| --- | --- | --- | --- |
| 1 | Ports, private IP-Bereiche, CIDR-Tabelle | ★★★ | Tag 1–2 |
| 2 | Einheiten (TiB/GiB), Übertragungszeit, RAID-Formeln | ★★★ | Tag 2–3 |
| 3 | Backup-Arten + Archivbit, 3-2-1, RTO/RPO | ★★☆ | Tag 3 |
| 4 | Schutzziele, TOM, DSGVO-Fristen, Krypto-Algorithmen | ★★★ | Tag 4 |
| 5 | IPv6, VLAN, WLAN, NAT/PAT | ★★★ | Tag 5 |
| 6 | Cloud-Modelle, Hypervisor, USV-Typen | ★★☆ | Tag 6 |
| 7 | C#-Grundsyntax, SQL, chmod | ★★★ | Tag 7 |

**Methode:** Jeden Tag einen Block lernen, am nächsten Morgen den Block vom Vortag aus dem Kopf aufschreiben (ohne Hilfe), dann vergleichen. Was falsch war, markierst du gelb und wiederholst es am Wochenende.

## Ports und Dienste

In Firewall-Regeln (kam in 2021, 2022, 2024 und 2025 dran) musst du Ports ohne Hilfe eintragen. Fett = unbedingt können.

| Dienst | Port | Protokoll | Merkhilfe |
| --- | --- | --- | --- |
| FTP (Daten / Steuerung) | **20 / 21** | TCP | 21 = Befehle |
| **SSH** / SCP / SFTP | **22** | TCP | verschlüsselte Fernwartung |
| Telnet | **23** | TCP | unverschlüsselt, nur zum Testen |
| **SMTP** (Server zu Server) | **25** | TCP | Mail einliefern |
| **DNS** | **53** | UDP (+ TCP bei Zonentransfer/großen Antworten) |  |
| **DHCP** (Server / Client) | **67 / 68** | UDP |  |
| TFTP | 69 | UDP | PXE-Boot, Firmware |
| **HTTP** | **80** | TCP |  |
| Kerberos | 88 | TCP/UDP | Active Directory |
| POP3 / POP3S | 110 / **995** | TCP |  |
| NTP | **123** | UDP | Zeitsynchronisation |
| **IMAP** / **IMAPS** | **143 / 993** | TCP |  |
| **SNMP** / SNMP-Trap | **161 / 162** | UDP | Monitoring |
| **LDAP** / LDAPS | **389 / 636** | TCP | Verzeichnisdienst |
| **HTTPS** | **443** | TCP (HTTP/3: UDP) |  |
| SMB / CIFS | **445** | TCP | Windows-Freigaben |
| SMTPS (implizites TLS) | **465** | TCP |  |
| Syslog | 514 | UDP |  |
| **SMTP Submission** (STARTTLS) | **587** | TCP | Client sendet Mail |
| MS SQL / MySQL | 1433 / 3306 | TCP |  |
| RADIUS (Auth / Accounting) | 1812 / 1813 | UDP | WPA-Enterprise |
| PostgreSQL | 5432 | TCP |  |
| **RDP** | **3389** | TCP | Remotedesktop |
| SIP / SIPS | **5060 / 5061** | UDP/TCP | VoIP-Signalisierung |
| IPsec IKE / NAT-T | 500 / 4500 | UDP | VPN |
| OpenVPN / WireGuard | 1194 / 51820 | UDP | VPN |
| MQTT / MQTT über TLS | 1883 / 8883 | TCP | IoT (kam Sommer 2025) |

**Port-Bereiche:** 0–1023 = Well-known Ports, 1024–49151 = Registered Ports, 49152–65535 = Dynamic/Private (Quell-Ports von Clients). In den Lösungen wird für Client-Quellports „beliebig zwischen 1024 und 65535“ akzeptiert.

**TCP vs. UDP:** TCP = verbindungsorientiert (3-Wege-Handshake SYN → SYN/ACK → ACK, Bestätigungen, Reihenfolge). UDP = verbindungslos, kein Handshake, schneller (DNS, VoIP, Streaming, DHCP).

**ICMP hat keine Ports** (ping, tracert). Ping blockiert, Webseite geht trotzdem → Firewall sperrt ICMP (Prüfung 2021 und 2024).

## IPv4: Adressbereiche und CIDR-Tabelle

**Private Bereiche (RFC 1918)** – werden im Internet nicht geroutet, brauchen NAT. Wurde Winter 2024 direkt abgefragt.

| Bereich | CIDR | Maske | Frühere Klasse |
| --- | --- | --- | --- |
| 10.0.0.0 – 10.255.255.255 | 10.0.0.0/8 | 255.0.0.0 | A |
| 172.16.0.0 – 172.31.255.255 | 172.16.0.0/12 | 255.240.0.0 | B |
| 192.168.0.0 – 192.168.255.255 | 192.168.0.0/16 | 255.255.0.0 | C |

**Spezielle Bereiche**

| Bereich | Bedeutung |
| --- | --- |
| 127.0.0.0/8 | Loopback (127.0.0.1 = localhost) |
| 169.254.0.0/16 | APIPA / Link-local: Client hat **keinen DHCP-Server erreicht** (kam 2024 zweimal) |
| 100.64.0.0/10 | Carrier-Grade-NAT beim Provider (Mobilfunk, DS-Lite) |
| 224.0.0.0 – 239.255.255.255 | Multicast, früher Klasse D, beginnt binär mit 1110 (Sommer 2024) |
| 240.0.0.0/4 | Reserviert, früher Klasse E |
| 0.0.0.0/0 | Default-Route |
| 255.255.255.255 | Limited Broadcast (z. B. DHCP-Discover) |
| 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 | Dokumentationsnetze – stehen in den Prüfungen als „öffentliche“ Adressen |

Alles andere außerhalb dieser Bereiche gilt als öffentlich.

**CIDR-Tabelle** (Hosts = 2^Hostbits − 2, weil Netz-ID und Broadcast wegfallen):

| CIDR | Maske | Blockgröße | Nutzbare Hosts |
| --- | --- | --- | --- |
| /8 | 255.0.0.0 | 16.777.216 | 16.777.214 |
| /12 | 255.240.0.0 | 1.048.576 | 1.048.574 |
| /16 | 255.255.0.0 | 65.536 | 65.534 |
| /19 | 255.255.224.0 | 8.192 | 8.190 |
| /20 | 255.255.240.0 | 4.096 | 4.094 |
| /21 | 255.255.248.0 | 2.048 | 2.046 |
| /22 | 255.255.252.0 | 1.024 | 1.022 |
| /23 | 255.255.254.0 | 512 | 510 |
| /24 | 255.255.255.0 | 256 | 254 |
| /25 | 255.255.255.128 | 128 | 126 |
| /26 | 255.255.255.192 | 64 | 62 |
| /27 | 255.255.255.224 | 32 | 30 |
| /28 | 255.255.255.240 | 16 | 14 |
| /29 | 255.255.255.248 | 8 | 6 |
| /30 | 255.255.255.252 | 4 | 2 (Transfernetz zwischen Routern) |
| /32 | 255.255.255.255 | 1 | einzelner Host (in Firewall-Regeln) |

**Masken-Oktettwerte:** 128 – 192 – 224 – 240 – 248 – 252 – 254 – 255.

**Merksätze für Subnetting:**

- Netz-ID = erste Adresse, Broadcast = letzte Adresse, Gateway in der Prüfung meist = **letzte nutzbare** (Broadcast − 1).
- VLSM: immer das **größte** Subnetz zuerst vergeben, freier Rest liegt am Ende.
- Ein Netz n gleich große Teile: 2 Teile = +1 Bit, 4 Teile = +2 Bit, 8 Teile = +3 Bit am Präfix.
- Routing: Der Router wählt immer den **längsten passenden Präfix** (Longest Prefix Match); 0.0.0.0/0 greift nur, wenn nichts anderes passt.

## IPv6 Basics

IPv6 kam in 4 von 7 Netzwerk-Prüfungen, meistens als Subnetz-Rechnung von /48 oder /56 auf /64.

| Fakt | Wert |
| --- | --- |
| Adresslänge | 128 Bit, 8 Blöcke à 16 Bit (4 Hex-Ziffern) |
| Kürzen | führende Nullen pro Block weg; **einmal** `::` für aufeinanderfolgende Null-Blöcke |
| Standard-Subnetz | **/64** (64 Bit Präfix + 64 Bit Interface-ID), SLAAC braucht /64 |
| Adressen pro /64 | 2^64 ≈ 1,84 × 10^19 |
| Subnetze aus /48 → /64 | 2^16 = **65.536** |
| Subnetze aus /56 → /64 | 2^8 = **256** (z. B. 2001:db8:1234::/64 bis 2001:db8:1234:ff::/64) |
| Loopback | ::1 |
| Link-local | **fe80::/10** – jedes Interface hat eine, nicht geroutet |
| Unique Local („privat“) | fc00::/7, in der Praxis **fd00::/8** |
| Global Unicast | 2000::/3 (beginnt mit 2 oder 3) |
| Multicast | ff00::/8 (IPv6 hat **keinen Broadcast**) |
| Dokumentation | 2001:db8::/32 |
| ARP-Ersatz | NDP (Neighbor Discovery, über ICMPv6) |
| TTL-Ersatz | Hop Limit |

**SLAAC:** Client bildet Link-local-Adresse selbst → Router schickt Router Advertisement mit Präfix → Client hängt seine Interface-ID an (aus MAC via EUI-64 oder zufällig). Gateway = Absender des Router Advertisements.

**Warum trotzdem DHCPv6:** Protokollierung, wer welche Adresse hat; zusätzliche Optionen (NTP, TFTP, DNS-Suffix); zentrale Verwaltung.

**Schnellrechnung Subnetze:** Anzahl = 2^(neuer Präfix − alter Präfix). Beispiel /48 in 4 Teile = /50 → der 4. Block läuft in Schritten von 4000 (hex): ::, 4000::, 8000::, c000:: (Sommer 2024).

## OSI-Modell, Geräte und Protokolle

Merksatz von Schicht 1 bis 7: **„Bitte Denk Nicht Tag Für Tag An Pizza“** → Bitübertragung, Sicherung, Netzwerk, Transport, Sitzung, Darstellung, Anwendung.

| Schicht | Name | Einheit | Gerät | Protokolle / Beispiele |
| --- | --- | --- | --- | --- |
| 7 | Anwendung | Daten | Proxy, NGFW | HTTP(S), DNS, SMTP, IMAP, SSH, SNMP, DHCP |
| 6 | Darstellung | Daten | – | TLS (oft hier eingeordnet), Kodierung |
| 5 | Sitzung | Daten | – | Sitzungsaufbau |
| 4 | Transport | Segment | Paketfilter-Firewall | TCP, UDP, **Ports** |
| 3 | Netzwerk / Vermittlung | Paket | Router, Layer-3-Switch | IPv4, IPv6, ICMP, IPsec, OSPF |
| 2 | Sicherung | Frame | Switch, Accesspoint | Ethernet, **MAC-Adresse**, ARP, **VLAN-Tag 802.1Q**, STP |
| 1 | Bitübertragung | Bit | Hub, Repeater, Kabel, Medienkonverter | Kupfer, LWL, Funk |

**TCP/IP-Modell (4 Schichten):** Netzzugang (1+2) – Internet (3) – Transport (4) – Anwendung (5–7).

**Kurz-Definitionen, die gefragt wurden:**

- **ARP:** fragt per Broadcast „Wer hat IP x?“ → bekommt MAC-Adresse. Ziel nicht im eigenen Netz → ARP nach der MAC des **Gateways**.
- **Gratuitous ARP:** Client fragt nach seiner eigenen IP, um Adresskonflikte zu erkennen (Sommer 2025).
- **DHCP-Ablauf (DORA):** Discover (Broadcast) → Offer → Request → Acknowledge. Anderes VLAN → **DHCP-Relay / IP-Helper** nötig (Winter 2024).
- **DNS-Einträge:** A = IPv4, AAAA = IPv6, CNAME = Alias auf anderen Namen, MX = Mailserver, PTR = Rückwärts, NS = Nameserver, TXT = SPF/DKIM-Infos, SOA = Zonenstart.
- **DNS rekursiv vs. iterativ:** Client fragt rekursiv („gib mir die fertige Antwort“). Der Resolver fragt iterativ: Root-Server → .de-Server → ihk.de-Server.
- **TTL:** wird von jedem Router um 1 verringert. Start: Windows 128, Linux 64. Hops = Start-TTL − empfangene TTL.
- **Unicast / Multicast / Broadcast:** 1:1 / 1:Gruppe / 1:alle.
- **STP (Spanning Tree):** blockiert redundante Switch-Ports, um Schleifen zu vermeiden (Sommer 2025).
- **Link Aggregation (LACP, 802.3ad):** mehrere physische Links bündeln → mehr Durchsatz und Ausfallsicherheit.
- **Kupfer vs. LWL:** Kupfer max. **100 m**; LWL: weiter (Multimode \~ 300–550 m bei 10G, Singlemode km), unempfindlich gegen EMV, galvanische Trennung zwischen Gebäuden, abhörsicherer.
- **PoE-Budget:** Anzahl Geräte × Leistung ≤ Budget des Switches (8 APs × 17,9 W = 143,2 W).

## Einheiten und Formeln

Rechenaufgaben bringen in jeder Prüfung 5–15 Punkte. Die häufigste Falle ist der Unterschied zwischen Binär- und Dezimalpräfixen.

| Binär (IEC) | Wert | Dezimal (SI) | Wert |
| --- | --- | --- | --- |
| 1 KiB | 1.024 Byte | 1 kB | 1.000 Byte |
| 1 MiB | 1.024 KiB = 1.048.576 Byte | 1 MB | 1.000.000 Byte |
| 1 GiB | 1.024 MiB = 1.073.741.824 Byte | 1 GB | 10^9 Byte |
| 1 TiB | 1.024 GiB | 1 TB | 10^12 Byte |

**Regeln:**

- Speicher in der Prüfung meist **binär** (GiB, TiB) → mal/durch 1.024.
- **Übertragungsraten sind immer dezimal:** 1 Mbit/s = 1.000.000 bit/s, 1 Gbit/s = 10^9 bit/s.
- 1 Byte = 8 Bit. Bit klein **b**, Byte groß **B**.
- 10 Bit Zuwachs = Faktor 1.024 (2^10). 2^32 ≈ 4,29 Mrd., 2^16 = 65.536, 2^8 = 256.

**Formeln, die in den Prüfungen vorkamen:**

Übertragungszeit (mit Overhead):

```latex
t = \frac{\text{Datenmenge in Bit} \cdot (1 + \text{Overhead})}{\text{Datenrate in bit/s}}
```

Speicherbedarf (Altbestand + Zuwachs):

```latex
\text{Bedarf} = \text{Kapazität}_{alt} \cdot \text{Belegung} \cdot 1024 + \text{Zuwachs}_{GiB/Jahr} \cdot \text{Jahre}
```

Stromkosten pro Jahr:

```latex
\text{Kosten} = \text{Leistung in kW} \cdot 24 \cdot 365 \cdot \text{Preis pro kWh}
```

Verfügbarkeit: Ausfallzeit pro Jahr = (1 − Verfügbarkeit) × 8.760 h. 99 % = 87,6 h, 99,9 % = 8,76 h, 99,99 % = 52,6 min. Zwei unabhängige Leitungen parallel:

```latex
V_{gesamt} = 1 - (1 - V_1) \cdot (1 - V_2)
```

MTBF eines Verbunds aus n gleichen Platten = MTBF / n (Winter 2021: 800.000 h / 16 = 50.000 h ≈ 5,7 Jahre).

USV-Laufzeit: Akkuladung verhält sich linear zur Zeit (60 min = 100 % → 3 min = 5 %).

VoIP-Bandbreite = Anzahl Teilnehmer-Streams × Codec-Rate × (1 + Overhead). Ein internes Gespräch über eine Cloud-Anlage zählt **doppelt** (zwei Teilnehmer, Winter 2022).

DDR-RAM: DDR4-3200 = 3.200 MT/s effektiv; Datenrate = 3.200 × 8 Byte (64 Bit) = 25,6 GB/s (= PC4-25600); CL16 = 16 Taktzyklen Latenz.

## RAID-Level

RAID-Berechnungen kamen in 5 von 7 Prüfungen in Teil 1 vor. n = Anzahl Platten, C = Kapazität einer Platte.

| RAID | Prinzip | Min. Platten | Nettokapazität | Darf ausfallen |
| --- | --- | --- | --- | --- |
| 0 | Striping | 2 | n × C | **0** (keine Redundanz) |
| 1 | Spiegelung | 2 | C (bzw. n/2 × C) | 1 |
| 5 | Striping + einfache Parität | 3 | (n − 1) × C | 1 |
| 6 | Striping + doppelte Parität | 4 | (n − 2) × C | **2 beliebige** |
| 10 (1+0) | Spiegel-Paare, gestript | 4 | n/2 × C | 1 sicher, mehr nur wenn aus verschiedenen Spiegeln |
| 50 / 60 | mehrere RAID 5/6 gestript | 6 / 8 | pro Untergruppe −1 bzw. −2 |  |
| JBOD | Platten aneinandergehängt | 1 | Summe | 0 |

**Rechenweg „Wie viele Platten brauche ich?“:**

1. Benötigte Nettokapazität ÷ Plattengröße, **aufrunden** → Datenplatten.
2. RAID 5: +1 · RAID 6: +2 · RAID 10: ×2.
3. Hot-Spare: +1 (steht in den Aufgaben immer extra).

Beispiel Sommer 2024: 20 TiB mit 4-TiB-Platten → 5 Datenplatten → RAID 5 = 6, RAID 6 = 7, RAID 10 = 10.

**Hot-Spare:** läuft im System mit, wird nicht genutzt; fällt eine Platte aus, ersetzt sie sie automatisch und der Rebuild startet.

**Mixed-Platten:** Bei unterschiedlich großen Platten zählt pro Platte nur die Kapazität der **kleinsten**.

**RAID ist kein Backup** – schützt nicht vor Löschen, Ransomware oder Brand.

## Backup, Archivbit, 3-2-1, RTO/RPO

Die Frage „Welche Bänder brauche ich zur Wiederherstellung?“ kam in Winter 2022 und Winter 2023. Das Archivbit ist dabei der Schlüssel.

| Verfahren | Sichert | Archivbit danach | Wiederherstellung braucht |
| --- | --- | --- | --- |
| **Vollbackup** | alles | **zurückgesetzt** (0) | nur dieses Band |
| **Differenziell** | alles mit Archivbit = 1 (seit letztem Voll) | **bleibt** (1) | Voll + **letzte** Differenzielle |
| **Inkrementell** | alles mit Archivbit = 1 (seit letzter Sicherung) | **zurückgesetzt** (0) | Voll + **alle** Inkrementellen danach |
| Klon / Image | 1:1-Abbild inkl. Dateisystem | unverändert | das Image |

Das Archivbit wird vom Betriebssystem auf 1 gesetzt, sobald eine Datei neu angelegt oder geändert wird. Eine versehentliche inkrementelle Sicherung mitten in einer Reihe differenzieller Sicherungen setzt die Bits zurück. Dann sichern die folgenden „Differenziellen“ nur noch die Änderungen seit dieser Inkrementellen (Winter 2022: Lösung V2, D3, D5).

**3-2-1-Regel:** **3** Kopien der Daten (Original + 2), auf **2** verschiedenen Medientypen, **1** Kopie außer Haus (offsite). Erweitert: 3-2-1-1-0 (eine Kopie offline/unveränderbar, 0 Fehler beim Restore-Test).

**RTO** (Recovery Time Objective) = wie lange ein System **ausfallen** darf, bis es wieder läuft. **RPO** (Recovery Point Objective) = wie viel **Datenverlust** (Zeitspanne seit letzter Sicherung) maximal hinnehmbar ist → bestimmt den Backup-Abstand.

**Weitere Begriffe:**

- **Archivierung ≠ Backup:** Archiv = Langzeitaufbewahrung, unveränderbar (WORM), revisionssicher. Revisionssicher heißt: vollständig, unveränderbar, nachvollziehbar, zugriffsgeschützt, verfügbar für die gesetzliche Frist. Aufbewahrungsfristen nach HGB/AO: Rechnungen und Buchungsbelege **8 Jahre** (seit 2025), Bücher und Jahresabschlüsse 10 Jahre, Handelsbriefe 6 Jahre.
- **D2D2T:** Disk-to-Disk-to-Tape – schnelles Restore von Platte, Band zusätzlich für Langzeit/offsite.
- **Snapshot:** Zustand zu einem Zeitpunkt, sehr schnell, aber kein vollwertiges Backup (liegt auf demselben System).
- **Deduplizierung:** gleiche Blöcke nur einmal speichern, Rest als Verweis. **Komprimierung:** Redundanz innerhalb der Daten entfernen (verlustfrei: ZIP, verlustbehaftet: JPEG, MP3).
- **LTO + LTFS:** Band günstig pro TB, lange haltbar, offline (Ransomware-Schutz); LTFS macht das Band per Drag & Drop wie eine Festplatte nutzbar.
- **Zuordnungseinheit (Clustergröße):** klein für viele kleine Dateien (weniger Verschnitt), groß für große Dateien wie Videos und Images (weniger Verwaltungsaufwand).

## Sicherheit: Schutzziele, Krypto, TOM, DSGVO

Sicherheit kam in jeder Teil-1-Prüfung vor, Zertifikate und TLS in 4 von 7 Netzwerk-Prüfungen.

**Schutzziele (CIA + A):**

- **Vertraulichkeit** (Confidentiality): nur Berechtigte können Daten lesen → Verschlüsselung.
- **Integrität** (Integrity): Daten wurden nicht unbemerkt verändert → Hash, Signatur.
- **Verfügbarkeit** (Availability): Daten/Dienste sind in der zugesicherten Zeit nutzbar → Redundanz, USV, Backup.
- **Authentizität**: Absender/Kommunikationspartner ist echt → Zertifikat, Signatur.

**Krypto-Algorithmen bewerten:**

| Verfahren | Art | Bewertung | Einsatz |
| --- | --- | --- | --- |
| DES (56 Bit) | symmetrisch | **unsicher** (Brute Force) | nicht mehr nutzen |
| 3DES | symmetrisch | veraltet, unsicher | nicht mehr nutzen |
| **AES-128 / AES-256** | symmetrisch | sicher, AES-256 empfohlen | Festplatten, WLAN (CCMP), TLS-Nutzdaten |
| **RSA** (≥ 3.072 Bit empfohlen) | asymmetrisch | sicher bei ausreichender Länge | Schlüsseltausch, Signatur, Zertifikate – nicht für große Datenmengen |
| ECC / ECDHE | asymmetrisch | sicher, kurze Schlüssel | TLS 1.3 |
| Diffie-Hellman | Schlüsselaustausch | sicher (ECDHE = Forward Secrecy) | gemeinsamen Session-Key über unsicheren Kanal erzeugen |
| **MD5** | Hash | **unsicher** (Kollisionen in Sekunden) | nur noch Prüfsummen ohne Sicherheitsanspruch |
| SHA-1 | Hash | unsicher | – |
| **SHA-256 / SHA-3** | Hash | sicher | Signaturen, Zertifikate, Integrität |

**Hash ≠ Verschlüsselung:** Hash ist eine Einwegfunktion mit fester Länge, nicht umkehrbar. Kollision = zwei verschiedene Eingaben mit gleichem Hash → gefälschte Zertifikate möglich.

**Hybride Verschlüsselung (TLS):** asymmetrisch für Authentifizierung und Schlüsseltausch, danach schnell symmetrisch (AES) für die Daten.

**Signieren und Verschlüsseln einer Mail (Winter 2024):**

- Signieren: mit dem **eigenen privaten** Schlüssel → Empfänger prüft mit dem **öffentlichen Schlüssel des Absenders**.
- Verschlüsseln: mit dem **öffentlichen Schlüssel des Empfängers** → Empfänger entschlüsselt mit **seinem privaten** Schlüssel.
- Der private Schlüssel einer CA wird **nie** weitergegeben. Ist er raus, ist die ganze CA kompromittiert → CA neu aufbauen, alle Zertifikate neu ausstellen (Winter 2023).

**X.509-Zertifikat enthält:** Version, Seriennummer, Inhaber (Subject), Aussteller (CA), Gültigkeitszeitraum, öffentlichen Schlüssel des Inhabers, Signaturalgorithmus, Signatur der CA.

**E-Mail-Schutz:** SPF = DNS-TXT-Eintrag: welche Server dürfen für die Domain senden. DKIM = Signatur im Mail-Header, Public Key im DNS. DMARC = Richtlinie, was bei Fehlschlag passiert.

**TOM-Kontrollen (oft als Ankreuz-Tabelle):**

| Kontrolle | Frage | Beispiele |
| --- | --- | --- |
| **Zutritt**skontrolle | Wer kommt ins **Gebäude/Raum**? | Chipkarte, RFID, Alarmanlage, Besucheranmeldung |
| **Zugang**skontrolle | Wer kommt ans **System**? | Passwortregeln, Biometrie, 2FA, Bildschirmsperre |
| **Zugriff**skontrolle | Wer darf welche **Daten** sehen/ändern? | Berechtigungskonzept, Verschlüsselung von Datenträgern, Benutzerprofile |
| Weitergabekontrolle | Schutz bei Übertragung/Transport | VPN, TLS, verschlüsselte USB-Sticks |
| Eingabekontrolle | Wer hat was geändert? | Protokollierung, Logs |
| Verfügbarkeitskontrolle | Schutz vor Verlust | Backup, USV, RAID |

**DSGVO-Fakten:**

- Datenpanne → Meldung an die **Aufsichtsbehörde innerhalb von 72 Stunden** (Art. 33).
- Bei **hohem Risiko** für Betroffene → Betroffene unverzüglich informieren (Art. 34).
- Jede Panne dokumentieren, Datenschutzbeauftragten einbinden.
- Grundsätze: Zweckbindung, **Datenminimierung/-sparsamkeit**, Speicherbegrenzung (Löschfristen), Richtigkeit, Integrität und Vertraulichkeit.
- **Anonymisierung:** Personenbezug unwiderruflich entfernt. **Pseudonymisierung:** ersetzt durch Kennung, mit Zuordnungstabelle umkehrbar, gilt weiter als personenbezogen.
- Festplatten entsorgen: Formatieren reicht nicht → mehrfaches Überschreiben, Degausser oder mechanische Zerstörung durch zertifizierten Dienstleister (DIN 66399) mit Vernichtungsnachweis.

**Malware:** Virus = hängt sich an Programme, braucht Wirt. Wurm = verbreitet sich selbst übers Netz. Trojaner = tarnt sich als nützliches Programm. Ransomware = verschlüsselt und erpresst.

**Prinzipien:** Least Privilege (nur nötige Rechte), Zero Trust („never trust, always verify“ – auch intern jede Verbindung prüfen), Härtung (unnötige Dienste aus, Standardpasswörter ändern, Updates, Secure Boot, BIOS-Passwort).

## WLAN, VLAN, NAT, Firewall, USV, Cloud, Virtualisierung

**WLAN**

| Begriff | Bedeutung |
| --- | --- |
| 802.11n / ac / ax / be | Wi-Fi 4 / 5 / 6 (6E: 6 GHz) / 7 |
| 2,4 GHz | größere Reichweite, nur 3 überlappungsfreie Kanäle (**1, 6, 11**), viele Störer |
| 5 GHz | mehr Kanäle, höherer Durchsatz, geringere Reichweite |
| SSID / BSSID | Name des WLANs / MAC-Adresse des Accesspoints |
| Hidden SSID | SSID-Broadcast im Beacon abgeschaltet – kein echter Schutz |
| WPA2/3-**Personal** (PSK) | ein gemeinsames Passwort für alle |
| WPA2/3-**Enterprise** (802.1X) | eigene Zugangsdaten/Zertifikat pro Nutzer, Prüfung über **RADIUS** mit EAP |
| WPA3 | SAE statt PSK-Handshake → Schutz gegen Offline-Wörterbuchangriffe |
| RADIUS = **AAA** | **A**uthentication (wer bist du), **A**uthorization (was darfst du), **A**ccounting (was hast du genutzt) |
| WLAN-Controller | zentrale Konfiguration und Überwachung vieler APs |
| Captive Portal / Voucher | Gast-Login-Seite mit Ticket: zeitlich/volumenbegrenzt, AGB bestätigen |

**VLAN (IEEE 802.1Q)**

- VLAN-Tag = **4 Byte** im Ethernet-Frame, VLAN-ID = **12 Bit** → IDs 1–4094.
- **Untagged/Access-Port:** Endgerät, genau ein VLAN. **Tagged/Trunk-Port:** Switch–Switch, Switch–Router, AP mit mehreren SSIDs.
- **Native VLAN:** wird auf dem Trunk ohne Tag übertragen; nicht VLAN 1 lassen (VLAN-Hopping).
- Portbasiert = Port bestimmt VLAN. Dynamisch = Nutzer/MAC/802.1X bestimmt VLAN.
- Zwischen VLANs braucht es **Routing** (Router-on-a-Stick mit Subinterfaces wie eth1.11 oder Layer-3-Switch).
- Vorteile: kleinere Broadcast-Domänen, Sicherheit durch Trennung, Flexibilität, weniger Hardware, QoS (Voice-VLAN).

**NAT / PAT**

- **Source-NAT/PAT (Masquerading):** private Quell-IP + Quell-Port → öffentliche IP + neuer Port. Viele Geräte, eine öffentliche IP.
- **Destination-NAT / Port-Forwarding:** öffentliche IP:Port → interner Server (Webserver in der DMZ).
- **CGNAT:** Provider gibt nur private Adresse (100.64.0.0/10 oder 10.x) → von außen nicht erreichbar.

**Firewall**

- **Paketfilter:** prüft IP, Port, Protokoll jedes Pakets einzeln (Layer 3/4).
- **SPI (Stateful):** merkt sich Verbindungen in einer State-Tabelle → Antworten werden automatisch erlaubt.
- **NGFW:** zusätzlich Anwendungserkennung (Layer 7), IDS/IPS, Virenscan, TLS-Inspection, URL-Filter.
- Regeln von oben nach unten, erste passende gewinnt, **letzte Regel: alles verbieten** (deny any).
- **DMZ:** eigenes Netz für Server, die von außen erreichbar sein müssen, durch Firewall vom LAN getrennt.

**USV-Typen (Sommer 2023)**

| Typ | Abkürzung | Bedeutung | Eigenschaft |
| --- | --- | --- | --- |
| Offline / Standby | **VFD** | Voltage and Frequency Dependent | billig, Umschaltzeit ca. 2–10 ms |
| Line-Interactive | **VI** | Voltage Independent | gleicht Spannungsschwankungen aus, kurze Umschaltzeit |
| Online / Doppelwandler | **VFI** | Voltage and Frequency Independent | keine Umschaltzeit, teuer, schlechterer Wirkungsgrad |

**Cloud**

| Modell | Kunde verwaltet | Beispiel |
| --- | --- | --- |
| **IaaS** | Betriebssystem, Software, Daten | virtuelle Server mieten |
| **PaaS** | eigene Anwendung + Daten | Laufzeitumgebung/Datenbank-Plattform für Entwickler |
| **SaaS** | nur Nutzung | E-Mail, Office im Browser |

Bereitstellung: Public, Private, Hybrid, Community Cloud. Typische Vorteile: Skalierbarkeit, Pay-per-Use („Measured Service“), keine eigene Hardware. Nachteile: Abhängigkeit vom Anbieter (Vendor Lock-in), Datenschutz/Serverstandort, Internetanbindung als Single Point of Failure.

**Virtualisierung**

- **Hypervisor Typ 1** (bare metal): direkt auf der Hardware, für Server – VMware ESXi/vSphere, Microsoft Hyper-V, Proxmox VE/KVM, Xen.
- **Hypervisor Typ 2** (hosted): läuft als Programm auf einem Betriebssystem, für Test/Entwicklung – VirtualBox, VMware Workstation, Parallels.
- **Container** (Docker): virtualisieren Anwendungen, teilen sich den Kernel des Host-Betriebssystems → leichter und schneller als VMs, aber weniger isoliert.
- **Skalierung:** horizontal (scale out) = mehr Server; vertikal (scale up) = mehr RAM/CPU in einem Server.
- **Blue-Green-Deployment:** zwei Umgebungen, neue Version auf der inaktiven installieren, Loadbalancer schaltet um, alte als Fallback.

**Lizenzen:** User-CAL = pro Nutzer (lohnt sich, wenn Nutzer mehrere Geräte haben). Device-CAL = pro Gerät (lohnt sich bei Schichtbetrieb/geteilten Geräten). Patch/Update = Fehlerbehebung, meist kostenlos, gleiche Hauptversion. Upgrade = neue Hauptversion, neue Funktionen, oft kostenpflichtig.

## Linux-Rechte, C#-Syntax, SQL, UML

In **jeder** Teil-1-Prüfung gab es eine Programmieraufgabe mit 15–20 Punkten (C#-ähnlich, mit Syntax-Anlage). Die Muster wiederholen sich: Summe, Mittelwert, Zählen, Maximum, Fehler im Code finden.

**chmod (Winter 2023)**

| Ziffer | Rechte | Bedeutung |
| --- | --- | --- |
| 7 | rwx | 4 + 2 + 1 |
| 6 | rw- | lesen + schreiben |
| 5 | r-x | lesen + ausführen |
| 4 | r-- | nur lesen |
| 0 | --- | nichts |

Reihenfolge: **Eigentümer – Gruppe – Andere**. `chmod 664 datei` = rw-rw-r--. Erstes Zeichen bei `ls -l`: `-` Datei, `d` Verzeichnis, `l` Link. Weitere Befehle: `chown user:gruppe datei`, `usermod -aG gruppe user`.

**C#-Bausteine, die du blind schreiben können musst:**

```csharp
int[] werte = new int[] { 33, 44, 40, 52 };   // Index 0 bis Length-1
int summe = 0, anzahl = 0, max = 0;
for (int i = 0; i < werte.Length; i++)
{
    summe = summe + werte[i];                  // Summe
    if (werte[i] > 80) { anzahl++; }           // Zählen
    if (werte[i] > max) { max = werte[i]; }    // Maximum
}
int mittel = summe / werte.Length;             // int / int = Ganzzahl, Rest fällt weg!
if (mittel > 75)
{
    MessageBox.Show("Text", "Titel");
}
else
{
    Console.WriteLine("Mittelwert: " + mittel);
}
```

**Typische Fehlerquellen (Fehler-finden-Aufgaben):** Schleife startet bei 1 statt 0, Bedingung `< 6` statt `< Length`, `>=` statt `>`, Wert in falscher Variable/falschem Index gespeichert, Summe vor der zweiten Schleife nicht auf 0 zurückgesetzt.

**Exceptions:** Index außerhalb des Arrays, Division durch 0, Datei nicht gefunden, Lesen über Dateiende, NullReference.

**Syntax- vs. Semantikfehler:** Syntax = Grammatik verletzt (Semikolon fehlt, `innt`), Compiler meldet es. Semantik = läuft, liefert aber falsches Ergebnis (falsche Variable, falscher Operator).

**Datentypen und Wertebereiche:**

| Typ | Bit | Bereich |
| --- | --- | --- |
| byte | 8 | 0 bis 255 |
| sbyte | 8 | −128 bis 127 |
| short | 16 | −32.768 bis 32.767 |
| int | 32 | **−2.147.483.648 bis 2.147.483.647** |
| long | 64 | ca. ±9,2 × 10^18 |
| bool | – | true / false |

Benötigte Bits für Werte bis x: kleinstes n mit 2^n > x. Beispiel Winter 2021: 16 TiB = 2^44 Byte = 2^34 KiB → die IHK-Lösung nennt **34 Bit** (10 Bit je Präfixstufe TiB/GiB/MiB + 4 Bit für 16). Streng genommen braucht der Endwert 2^34 selbst ein 35. Bit – in der Prüfung den IHK-Rechenweg hinschreiben.

**OOP:** Klasse = Bauplan, Objekt = Instanz. **Kapselung** = Attribute private, Zugriff nur über Methoden (Getter/Setter). **Vererbung** = abgeleitete Klasse übernimmt Attribute/Methoden der Basisklasse.

**UML:** statisch = Klassen-, Objekt-, Paket-, Komponentendiagramm. Dynamisch = Aktivitäts-, Sequenz-, Zustands-, Anwendungsfalldiagramm. **Aggregation** (leere Raute) = Teil kann ohne Ganzes existieren (Abteilung–Mitarbeiter). **Komposition** (gefüllte Raute) = Teil stirbt mit dem Ganzen (Gebäude–Raum).

**SQL-Grundgerüst:**

```sql
SELECT k.Ort, COUNT(*) AS Anzahl
FROM Kunde k
INNER JOIN Werbeaktion w ON k.KundenNr = w.KundenNr
WHERE k.PLZ LIKE '8%' AND w.Datum < '2021-12-31'
GROUP BY k.Ort
HAVING COUNT(*) > 5
ORDER BY Anzahl DESC;

CREATE TABLE Werbeaktion (
  WerbungsID INT NOT NULL,
  Werbepartner VARCHAR(50),
  Datum DATE,
  KundenNr INT,
  PRIMARY KEY (WerbungsID),
  FOREIGN KEY (KundenNr) REFERENCES Kunde(KundenNr)
);
```

Datentypen-Regel: feste Länge → `CHAR(n)` (PLZ = CHAR(5), IBAN DE = CHAR(22)); variable Länge → `VARCHAR(n)`; Telefonnummer immer Text, nie INT (führende 0). WHERE filtert Zeilen, HAVING filtert Gruppen.

**Windows-Aufgabenplanung (Sommer 2023):** `SCHTASKS /Create /TN "CPU MON" /TR d:\util\moncpu.exe /SC DAILY /ST 16:10`
