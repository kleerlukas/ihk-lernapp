# Prüfbericht zur ersten Version

Stand: 22.11.2026

## Ergebnis

- `npm run test`: **76 Tests grün** (5 Testdateien: Generatoren, toleranter Vergleich, Leitner/Sitzungen, Inhalts-Pipeline, UI-Abläufe mit jsdom)
- `npm run build`: **ohne Fehler**, PWA mit Service Worker (13 Dateien vorab gecacht, ca. 620 KiB)
- **302 Fragen** (alle mit geprüftem Zitat aus dem Lernzettel) + **14 Rechen-Generatoren**

| Kategorie | Fragen |
| --- | --- |
| Ports & Protokolle | 45 |
| IPv4-Bereiche & CIDR | 32 |
| IPv6 | 22 |
| OSI, Geräte & Netzdienste | 27 |
| Einheiten & Formeln | 22 |
| RAID | 18 |
| Backup & Archivierung | 21 |
| Sicherheit, Krypto, TOM, DSGVO | 35 |
| WLAN, VLAN, NAT, Firewall | 26 |
| USV, Cloud, Virtualisierung | 20 |
| chmod, C#, SQL, UML | 34 |

Typen: 211 Multiple Choice, 55 Eingabe, 28 Zuordnung, 8 Karteikarten.

## Fragen mit `needsReview` – bitte prüfen

| ID | Grund |
| --- | --- |
| `ipv6-48-in-4` | Lernzettel Z. 143 sagt „der 4. Block läuft in Schritten von 4000“ – gemeint ist vermutlich der 4. Hex-Block der Adresse. Die Frage rechnet so (3. Teilnetz = `2001:db8:abcd:8000::/50`). |
| `osi-lwl-range` | Multimode „~ 300–550 m bei 10G“ ist nur eine ungefähre Spanne ohne Fasertyp. |
| `raid-50-60` | Spalte „Darf ausfallen“ ist für RAID 50/60 leer – dazu gibt es deshalb keine Frage, nur eine Karteikarte zu Aufbau und Mindestanzahl. |
| `cs-bits-needed` | 16 TiB → IHK-Lösung 34 Bit, streng genommen 35 Bit (der Lernzettel weist selbst darauf hin). |
| `win-schtasks` | Der Lernzettel zeigt nur den SCHTASKS-Befehl. Die Bedeutung der Parameter `/SC`, `/ST`, `/TN`, `/TR` habe ich in der Erklärung ergänzt. |
| Generator `storage-need`, Teil b) | „Maximalbelegung“ (Bedarf ÷ max. Belegung) steht nicht im Lernzettel. Teil a) folgt exakt der Lernzettel-Formel. In der App mit Hinweis „Inhalt noch nicht geprüft“ markiert. |

Die Liste findest du auch in der App unter **Einstellungen → Inhalte**.

## Stichprobe: 20 zufällige Fragen gegen den Lernzettel

Ausgewählt mit festem Zufallsstartwert, jede Frage mit der zitierten Stelle verglichen.

| # | ID | Lösung | Stelle im Lernzettel | OK |
| --- | --- | --- | --- | --- |
| 1 | virt-scale | horizontal = mehr Server, vertikal = mehr RAM/CPU | Virtualisierung, „Skalierung“ | ✓ |
| 2 | sql-varchar | VARCHAR bei variabler Länge | Datentypen-Regel | ✓ |
| 3 | cs-bits-needed | 34 Bit (IHK) | Datentypen, Winter 2021 | ✓ (needsReview) |
| 4 | sec-x509 | privater Schlüssel ist NICHT enthalten | X.509-Liste | ✓ |
| 5 | sql-iban | CHAR(22) | „IBAN DE = CHAR(22)“ | ✓ |
| 6 | osi-tls | Schicht 6 | OSI-Tabelle, „oft hier eingeordnet“ | ✓ |
| 7 | sec-ecdhe | Forward Secrecy | Krypto-Tabelle | ✓ |
| 8 | sec-collision | zwei Eingaben, gleicher Hash | „Hash ≠ Verschlüsselung“ | ✓ |
| 9 | port-mysql | 3306 | Port-Tabelle | ✓ |
| 10 | ipv6-slaac | Link-local → RA → Interface-ID | SLAAC-Absatz | ✓ |
| 11 | ipv4-split-8 | +3 Bit | Merksätze Subnetting | ✓ |
| 12 | sql-where-having | WHERE Zeilen, HAVING Gruppen | SQL-Abschnitt | ✓ |
| 13 | unit-avail-999 | 8,76 h | Verfügbarkeit | ✓ |
| 14 | cloud-paas | eigene Anwendung + Daten | Cloud-Tabelle | ✓ |
| 15 | raid-ex-5 | 6 Platten | Beispiel Sommer 2024 | ✓ |
| 16 | unit-2-16 | 65.536 | Regeln Einheiten | ✓ |
| 17 | bak-revision | vollständig, unveränderbar, nachvollziehbar, zugriffsgeschützt, verfügbar | Archivierung ≠ Backup | ✓ |
| 18 | port-dns-proto | UDP, TCP bei Zonentransfer | Port-Tabelle | ✓ |
| 19 | cs-types-match | byte/sbyte/short/bool-Bereiche | Datentypen-Tabelle | ✓ |
| 20 | ipv4-host-formula | Netz-ID und Broadcast fallen weg | CIDR-Tabelle | ✓ |

**20 von 20 korrekt.** Zusätzlich prüft `npm run generate` bei jeder Frage automatisch, ob ihr Zitat (`ref`) wörtlich im Lernzettel steht – ein erfundenes Zitat führt zum Abbruch.

## Entscheidungen, die ich selbst getroffen habe

1. **Dateiname:** `FISI AP2 – Lernzettel zum Auswendiglernen.md` liegt unverändert im Projektordner. Eine Kopie liegt als `content/lernzettel.md` vor, mit einem kleinen Kopf (`autoExtract: false`). Die Zeilenangaben in der App beziehen sich auf diese Kopie (+4 Zeilen gegenüber dem Original; die Zeile mit Datum und Namen wurde für die Veröffentlichung entfernt).
2. **Handgeschriebene statt automatisch erzeugter Fragen für den Lernzettel:** Alle 302 Fragen sind kuratiert (bessere Falschantworten, Erklärungen). Die automatische Extraktion (Tabellen → MC/Zuordnung, `**Begriff:**` → Karteikarte) ist für neue Dateien in `content/` aktiv und getestet.
3. **Leitner-Abstände:** 0 / 1 / 3 / 7 / 14 Tage. „Unsicher“ und „teilweise richtig“ → ein Fach zurück, falsch → Fach 1. Eine neue Karte, die sofort gewusst wird, startet in Fach 2. Falsche Karten kommen zusätzlich in derselben Sitzung 4 Karten später noch einmal.
4. **Rechen-Generatoren zählen im Leitner-System** wie eine Karte pro Aufgabentyp (z. B. „VLSM“). Beim täglichen Lernen kommen bis zu 3 davon dran.
5. **Prüfungssimulation:** 15 Wissensfragen (max. 2 pro Kategorie, keine Karteikarten wegen Selbstbewertung) + 5 Rechenaufgaben, **30 Minuten** Timer, je Aufgabe 5 Punkte, Teilpunkte bei Zuordnung und mehrteiligen Rechnungen. **Während der Prüfung gibt es kein Sofort-Feedback** (wie in der echten Prüfung). Die Auflösung mit Erklärungen kommt am Ende pro Aufgabe zum Aufklappen.
6. **„Teilweise richtig“** gibt es bei Zuordnungen und mehrteiligen Rechenaufgaben (einige Felder richtig). MC und Einzeleingaben sind richtig oder falsch.
7. **Toleranz bei Rechenergebnissen:** Je nach Aufgabe ±0,2–0,3 % bzw. kleine absolute Toleranzen (z. B. ±0,05 € bei Stromkosten), damit unterschiedliches Runden nicht als falsch zählt.
8. **Speicherbedarf-Generator** fragt Teil a) nach Lernzettel-Formel und Teil b) mit Maximalbelegung (needsReview, siehe oben).
9. **Neue Karten pro Tag:** Standard 10, in den Einstellungen änderbar (0–50). Tagesziel Standard 30 (10–100).
10. **Import:** Wahl zwischen „Zusammenführen“ (pro Karte gewinnt der neuere Stand) und „Ersetzen“.
11. **Keine Routing-Bibliothek, keine Animations-Bibliothek:** Wischgesten und Flip-Animation sind selbst gebaut (kleineres Paket, offline schneller).
12. **Node.js 26** wurde per Homebrew installiert. Der GitHub-Workflow nutzt Node 22 (LTS).
13. **App-Icon** (Karteikarten mit Häkchen auf Teal) wird per `npm run icons` ohne Zusatzprogramme erzeugt.

## Was noch offen ist

- **Sichtprüfung im Browser/auf dem iPhone:** Der In-App-Browser durfte `localhost` nicht öffnen (Freigabe war nötig, während du weg warst), und ein Headless-Chromium ließ sich in der Sandbox nicht herunterladen. Getestet sind alle Abläufe deshalb automatisiert mit jsdom, aber Layout, Animationen und Wischgesten habe ich nicht selbst gesehen. Bitte einmal `npm run dev` starten und durchklicken.
- **Offline-Test** geht erst mit der veröffentlichten HTTPS-Version auf GitHub Pages (siehe README, Abschnitt 3).
