---
autoExtract: false
relevanz: kern
# Ergänzungen zum Lernzettel: Themen aus den IHK-Prüfungen FISI 2021–2025,
# die im Lernzettel fehlen oder zu knapp sind. Nur Lehrbuchwissen.
# Die Fragen dazu stehen in content/curated/12-ergaenzungen.json.
---

# Ergänzungen zum Lernzettel

## USV, Skalierung und Deployment

- **VFD (Offline/Standby-USV):** Im Normalbetrieb hängen die Verbraucher direkt am Stromnetz. Erst bei einem Ausfall schaltet die USV auf den Akku um (Umschaltzeit wenige Millisekunden). Ausgang abhängig von Spannung und Frequenz des Netzes. Günstig, für Arbeitsplatz-PCs.
- **VI (Line-Interactive-USV):** wie VFD, regelt aber zusätzlich Über- und Unterspannung mit einem Spannungsregler aus, ohne auf Akku umzuschalten. Die Frequenz bleibt vom Netz abhängig.
- **VFI (Online-/Doppelwandler-USV):** Der Strom wird ständig gleichgerichtet und wieder in Wechselstrom umgewandelt. Die Verbraucher hängen immer am Wechselrichter → keine Umschaltzeit, Ausgang unabhängig von Spannung und Frequenz. Für Server und Serverräume.
- **USV-Laufzeit:** Bei gleicher Last sinkt die Akkuladung linear mit der Zeit. Verbrauchte Ladung in % = Ausfallminuten ÷ Laufzeit bei dieser Last × 100.
- **Horizontale Skalierung (scale out):** weitere Server hinzufügen, Last per Loadbalancer verteilen. Kein Neustart nötig, erhöht auch die Ausfallsicherheit.
- **Vertikale Skalierung (scale up):** einen Server aufrüsten (mehr CPU, RAM). Einfach, aber begrenzt durch die Hardware und meist mit Ausfallzeit verbunden.
- **Blue-Green-Deployment:** Die neue Version wird auf der inaktiven Umgebung installiert und getestet, dann schaltet der Loadbalancer um. Bei Fehlern schaltet man einfach zurück (schneller Rollback, kaum Ausfallzeit).

## MTBF und Verfügbarkeit

- **MTBF** (Mean Time Between Failures) = mittlere Betriebszeit zwischen zwei Ausfällen, meist in Stunden angegeben.
- **MTBF eines Verbunds** aus n gleichen Komponenten (z. B. Platten im RAID): MTBF ÷ n. Je mehr Platten, desto früher fällt statistisch irgendeine aus.
- **Umrechnung in Jahre:** Stunden ÷ 8.760 (24 h × 365 Tage).
- **Verfügbarkeit in %** = (Gesamtzeit − Ausfallzeit) ÷ Gesamtzeit × 100.

## Backup-Speicher und Archivierung

- **Deduplizierung:** erkennt identische Dateien oder Datenblöcke und speichert sie nur einmal, alle weiteren Vorkommen werden durch Verweise ersetzt. Spart viel Platz bei vielen ähnlichen Daten (z. B. VM-Backups).
- **Komprimierung:** verkleinert die Daten innerhalb einer Datei durch geschickte Kodierung. Verlustfrei (z. B. ZIP) oder verlustbehaftet (z. B. JPEG, MP3). Für Backups nur verlustfrei.
- **Clustergröße klein:** wenig Verschnitt, gut für viele kleine Dateien.
- **Clustergröße groß:** weniger Verwaltungsaufwand und schneller bei großen Dateien, aber mehr ungenutzter Platz bei kleinen Dateien.
- **Revisionssichere Archivierung:** Daten vollständig, unveränderbar, nachvollziehbar und zugriffsgeschützt über die gesamte Aufbewahrungsfrist aufbewahren.
- **WORM** (Write Once Read Many): Daten können einmal geschrieben, danach nur noch gelesen, aber nicht verändert oder gelöscht werden. Es gibt WORM-Bänder und WORM-Speichersysteme.
- **LTO-Band:** hohe Kapazität, niedrige Kosten pro TB, lange haltbar und offline lagerbar (Schutz vor Ransomware). Nachteil: sequenzieller Zugriff, einzelne Dateien wiederherzustellen dauert länger.
- **LTFS** (Linear Tape File System): Das Band erscheint wie ein Laufwerk mit Dateisystem, Dateien lassen sich ohne spezielle Backup-Software lesen und schreiben.

## Lizenzen, Updates und Mobile Device Management

- **User-CAL:** Lizenz pro Benutzer, egal mit wie vielen Geräten er zugreift. Lohnt sich, wenn ein Mitarbeiter mehrere Geräte nutzt (PC, Notebook, Smartphone).
- **Device-CAL:** Lizenz pro Gerät, egal wie viele Benutzer es nutzen. Lohnt sich bei Schichtbetrieb und geteilten Geräten.
- **Patch/Update:** behebt Fehler und Sicherheitslücken innerhalb derselben Hauptversion, meist kostenlos.
- **Upgrade:** Wechsel auf eine neue Hauptversion mit neuen Funktionen, oft kostenpflichtig.
- **Mobile Device Management (MDM):** zentrale Verwaltung von Smartphones und Tablets. Richtlinien durchsetzen (PIN-Pflicht, Verschlüsselung), Apps verteilen, Gerät aus der Ferne sperren.
- **Remote Wipe:** Bei Verlust oder Diebstahl wird das Gerät aus der Ferne gelöscht.
- **Lockdown:** Das Gerät wird auf bestimmte Apps und Funktionen beschränkt (z. B. Kiosk-Modus).
- **Container bei BYOD** (Bring Your Own Device): Dienstliche Apps und Daten liegen in einem getrennten, verschlüsselten Bereich. Die Firma kann nur diesen Container löschen, private Daten bleiben unberührt.

## E-Mail-Sicherheit: Phishing, Spam, SPF, DKIM

- **Spam:** unerwünschte Massen-E-Mail, meist Werbung. Lästig, aber nicht unbedingt ein Angriff.
- **Phishing:** gefälschte E-Mail, die zur Eingabe von Zugangsdaten oder zum Öffnen eines Anhangs bzw. Links verleiten soll. Ziel ist Betrug oder Schadsoftware.
- **Merkmale einer Phishing-Mail:** Absenderadresse oder Domain weicht leicht ab, Zeitdruck oder Drohung, Aufforderung Zugangsdaten einzugeben, Linkziel passt nicht zum angezeigten Text, unpersönliche Anrede, unerwarteter Anhang.
- **SPF** (Sender Policy Framework): TXT-Eintrag im DNS der Absenderdomain. Er listet die Mailserver, die für diese Domain senden dürfen. Der empfangende Server prüft, ob der einliefernde Server dazugehört.
- **DKIM** (DomainKeys Identified Mail): Der sendende Server signiert die Mail, die Signatur steht im Mail-Header. Der öffentliche Schlüssel steht als TXT-Eintrag im DNS der Absenderdomain. Der Empfänger prüft damit, dass die Mail von der Domain stammt und unterwegs nicht verändert wurde.

## Härtung, Least Privilege, Zero Trust, Datenschutz

- **System-Härtung:** Angriffsfläche verkleinern: nicht benötigte Dienste, Ports und Software entfernen, Standardpasswörter ändern, Updates einspielen, nicht benötigte Benutzerkonten deaktivieren.
- **Least Privilege:** Jeder Benutzer und jeder Dienst bekommt nur die Rechte, die er für seine Aufgabe wirklich braucht.
- **Zero Trust:** „Never trust, always verify“. Kein Gerät und kein Benutzer gilt automatisch als vertrauenswürdig, auch nicht im internen Netz. Jeder Zugriff wird einzeln geprüft.
- **Anonymisierung:** Der Personenbezug wird unwiderruflich entfernt. Die Daten fallen danach nicht mehr unter die DSGVO.
- **Pseudonymisierung:** Namen werden durch Kennzeichen ersetzt. Mit einer getrennt aufbewahrten Zuordnungstabelle lässt sich die Person wieder ermitteln. Die Daten bleiben personenbezogen, die DSGVO gilt weiter.

## UML und OOP

- **Statische Diagramme (Struktur):** Klassendiagramm, Objektdiagramm, Komponentendiagramm, Verteilungsdiagramm, Paketdiagramm.
- **Dynamische Diagramme (Verhalten):** Anwendungsfalldiagramm, Aktivitätsdiagramm, Sequenzdiagramm, Zustandsdiagramm.
- **Aggregation:** „hat ein“, leere Raute am Ganzen. Das Teil kann auch ohne das Ganze existieren (Team und Spieler).
- **Komposition:** „besteht aus“, gefüllte Raute am Ganzen. Das Teil existiert nur mit dem Ganzen und wird mit ihm gelöscht (Gebäude und Raum).
- **Kapselung:** Attribute sind private, der Zugriff erfolgt nur über öffentliche Methoden (Getter/Setter). So kann die Klasse ungültige Werte abfangen.
- **Vererbung:** Eine Unterklasse übernimmt Attribute und Methoden der Oberklasse und kann sie erweitern oder überschreiben. UML: Pfeil mit leerer Dreiecksspitze zeigt auf die Oberklasse.

## SQL: Tabellen anlegen und Datentypen

```sql
CREATE TABLE Kunde (
  KundenNr INT PRIMARY KEY,
  Name     VARCHAR(50) NOT NULL,
  PLZ      CHAR(5),
  IBAN     CHAR(22),
  Telefon  VARCHAR(20)
);

CREATE TABLE Bestellung (
  BestellNr INT PRIMARY KEY,
  KundenNr  INT NOT NULL,
  Datum     DATE,
  FOREIGN KEY (KundenNr) REFERENCES Kunde(KundenNr)
);
```

- **PRIMARY KEY:** identifiziert jede Zeile eindeutig, darf nicht NULL sein und nicht doppelt vorkommen.
- **FOREIGN KEY:** verweist auf den Primärschlüssel einer anderen Tabelle. Die Datenbank verhindert so Verweise auf nicht vorhandene Datensätze (referenzielle Integrität).
- **CHAR(n):** feste Länge, gut für Werte, die immer gleich lang sind (PLZ mit 5 Stellen, deutsche IBAN mit 22 Zeichen).
- **VARCHAR(n):** variable Länge bis n Zeichen (Namen, E-Mail, Telefonnummer).
- **PLZ und Telefonnummer nie als Zahl:** Führende Nullen gingen verloren (01067 Dresden), Telefonnummern enthalten oft +, Leerzeichen oder Schrägstriche, und mit beiden wird nicht gerechnet.

## Programmieren: Fehlerarten, Exceptions, Pseudocode

- **Syntaxfehler:** Verstoß gegen die Regeln der Sprache, z. B. fehlendes Semikolon oder Klammer. Der Compiler meldet ihn, das Programm lässt sich nicht übersetzen.
- **Semantischer (logischer) Fehler:** Das Programm läuft, liefert aber ein falsches Ergebnis, z. B. < statt <= oder falsche Startzahl in der Schleife.
- **Laufzeitfehler (Exception):** tritt erst während der Ausführung auf. Typisch: Zugriff auf einen Index außerhalb des Arrays (IndexOutOfRangeException in C#) oder ganzzahlige Division durch 0 (DivideByZeroException). Abfangen mit try-catch.
- **Vorteile von Pseudocode:** unabhängig von einer Programmiersprache, auch für Nicht-Programmierer lesbar, Konzentration auf die Logik statt auf Syntax, später in jede Sprache umsetzbar.
- **Schreibtischtest:** Das Programm wird von Hand Schritt für Schritt durchgegangen, die Werte der Variablen werden nach jedem Schritt in einer Tabelle notiert.
- **Wertebereiche in C#:** byte (8 Bit) 0 bis 255, sbyte −128 bis 127, int (32 Bit) −2.147.483.648 bis 2.147.483.647.

## TLS, Diffie-Hellman und Zertifikate

**TLS-Handshake (vereinfacht, Reihenfolge):**

1. Client Hello: Client schickt unterstützte TLS-Versionen, Cipher Suites und eine Zufallszahl.
2. Server Hello: Server wählt Version und Cipher Suite und schickt sein Zertifikat.
3. Client prüft das Zertifikat (Signatur der CA, Gültigkeit, Name).
4. Schlüsselaustausch (z. B. ECDHE): Beide berechnen denselben Sitzungsschlüssel.
5. Finished: Ab jetzt werden die Daten symmetrisch verschlüsselt (z. B. AES).

- **Hybride Verschlüsselung:** asymmetrisch für Authentifizierung und Schlüsselaustausch, symmetrisch für die eigentlichen Daten, weil symmetrische Verfahren viel schneller sind.
- **Diffie-Hellman:** Beide Seiten berechnen aus öffentlich ausgetauschten Werten und eigenen geheimen Werten denselben Schlüssel, ohne ihn je zu übertragen. Diffie-Hellman allein authentifiziert nicht, deshalb braucht man zusätzlich Zertifikate gegen Man-in-the-Middle.
- **TLS 1.3 gegenüber TLS 1.2:** schnellerer Handshake mit nur einem Roundtrip, nur noch Schlüsselaustausch mit Forward Secrecy (ECDHE/DHE), unsichere Verfahren wie der RSA-Schlüsseltausch und RC4 sind entfernt, das Zertifikat wird bereits verschlüsselt übertragen.
- **Inhalt eines X.509-Zertifikats:** Version, Seriennummer, Signaturalgorithmus, Aussteller (CA), Gültigkeitszeitraum, Inhaber (Subject), öffentlicher Schlüssel des Inhabers, Erweiterungen (z. B. alternative Namen), Signatur der CA. Der private Schlüssel ist nie enthalten.
- **Privater Schlüssel der CA weitergegeben:** Mit ihm kann jeder gültige Zertifikate fälschen. Das CA-Zertifikat muss widerrufen und aus allen Vertrauensspeichern entfernt werden, eine neue CA mit neuem Schlüsselpaar wird erstellt und alle Zertifikate werden neu ausgestellt.
- **Widerruf prüfen:** über Sperrlisten (CRL) oder online per OCSP.

## DNS und nslookup

```text
C:\> nslookup www.beispiel.de
Server:  dc01.firma.local
Address:  192.168.10.5

Nicht autorisierende Antwort:
Name:    web01.beispiel.de
Address:  203.0.113.20
Aliases:  www.beispiel.de
```

- **Server / Address (oben):** der DNS-Server, den der Client gefragt hat (hier der interne Domain Controller).
- **Nicht autorisierende Antwort:** Die Antwort kommt nicht vom zuständigen Nameserver der Zone, sondern z. B. aus dem Cache des Resolvers.
- **Name:** der eigentliche (kanonische) Name des Hosts.
- **Address:** die IP-Adresse zum Namen.
- **Aliases:** Der gefragte Name ist ein Alias, es gibt also einen CNAME-Eintrag, der auf den Namen unter Name zeigt.
- **A** = Name → IPv4, **AAAA** = Name → IPv6, **CNAME** = Alias → anderer Name, **MX** = Mailserver der Domain mit Priorität (kleinere Zahl = bevorzugt).
- **Falscher CNAME:** Zeigt ein Alias auf den falschen Zielnamen, landen alle Clients auf dem falschen Server, obwohl der A-Eintrag des richtigen Servers stimmt.
- **Rekursive Anfrage:** Der Client fragt seinen Resolver und erwartet eine fertige Antwort.
- **Iterative Anfrage:** Der Resolver fragt nacheinander Root-Server, TLD-Server und den zuständigen Nameserver. Jeder verweist auf den nächsten.

## SNMP

- **SNMP get:** Der Manager (Monitoring-Server) fragt einen Wert beim Agenten aktiv ab (Polling), UDP 161.
- **SNMP Trap:** Der Agent meldet ein Ereignis unaufgefordert an den Manager, UDP 162. So erfährt man sofort von Fehlern statt erst bei der nächsten Abfrage.
- **SNMPv3** bietet Authentifizierung und Verschlüsselung. SNMPv1/v2c übertragen den Community-String im Klartext.

## WLAN-Planung, PoE und Gast-WLAN

- **SSID:** der Name des WLANs.
- **BSSID:** die MAC-Adresse der Funkschnittstelle des Accesspoints. Mehrere APs mit derselben SSID haben unterschiedliche BSSIDs.
- **Kanal:** Im 2,4-GHz-Band sind die Kanäle 20 MHz breit, liegen aber nur 5 MHz auseinander. Nur 1, 6 und 11 überlappen sich nicht. Benachbarte APs auf überlappenden Kanälen stören sich gegenseitig.
- **Signalstärke** in dBm: −50 dBm ist besser als −80 dBm (näher an 0 = stärker).
- **Versteckte SSID:** Der Name wird nicht in den Beacons gesendet, taucht aber in den Anfragen der Clients auf und ist mit jedem WLAN-Scanner sichtbar. Kein Sicherheitsgewinn.
- **PoE-Standards:** 802.3af (PoE) bis 15,4 W pro Port, 802.3at (PoE+) bis 30 W pro Port, 802.3bt (PoE++) bis 60 bzw. 90 W pro Port.
- **PoE-Budget:** Summe der Leistung aller PoE-Geräte ≤ PoE-Budget des Switches. Zusätzlich muss jeder Port die Leistung des angeschlossenen Geräts liefern können.
- **Gast-WLAN:** eigene SSID in eigenem VLAN, nur Zugang ins Internet, kein Zugriff aufs Firmennetz, Clients untereinander isoliert. Zugang über ein Captive Portal mit Vouchern (zeitlich begrenzte Zugangscodes), dort werden auch die Nutzungsbedingungen bestätigt.

## VLAN in der Praxis

- **Native VLAN:** das VLAN, dessen Frames auf einem Trunk ohne Tag übertragen werden. Es muss auf beiden Seiten des Trunks gleich eingestellt sein.
- **Portbasiertes (statisches) VLAN:** Jeder Switchport wird fest einem VLAN zugeordnet.
- **Dynamisches VLAN:** Das VLAN wird anhand des Geräts oder Benutzers zugewiesen, z. B. nach Anmeldung per 802.1X teilt der RADIUS-Server das VLAN mit. Der Benutzer landet an jeder Dose im richtigen VLAN.
- **Router-on-a-Stick:** Ein physisches Router-Interface wird als Trunk an den Switch angeschlossen. Für jedes VLAN gibt es ein Subinterface (z. B. eth0.10, eth0.20) mit eigener IP-Adresse, die das Gateway des VLANs ist.
- **DHCP-Relay:** DHCP-Anfragen sind Broadcasts und gelangen nicht über den Router. Der Router nimmt sie als DHCP-Relay entgegen und leitet sie als Unicast an den DHCP-Server im anderen Netz weiter.
- **Voice-VLAN:** IP-Telefone liegen in einem eigenen VLAN, damit Sprache priorisiert werden kann (QoS). Hängt ein PC am Telefon, läuft sein Verkehr untagged im Daten-VLAN, der des Telefons tagged im Voice-VLAN.

## Switching und Verkabelung

- **Spanning Tree (STP):** verhindert Schleifen bei redundanten Verbindungen zwischen Switches, indem es redundante Ports blockiert. Fällt eine Verbindung aus, wird ein blockierter Port aktiviert. Ohne STP entsteht bei einer Schleife ein Broadcast-Sturm.
- **Link Aggregation:** mehrere physische Verbindungen zwischen zwei Geräten werden zu einer logischen gebündelt. Mehr Bandbreite und Ausfallsicherheit, STP blockiert die Einzelleitungen nicht.
- **Kupfer (Twisted Pair):** maximal 100 m pro Strecke.
- **Glasfaser:** deutlich größere Entfernungen, unempfindlich gegen elektromagnetische Störungen, keine elektrische Verbindung zwischen Gebäuden (keine Probleme durch Potenzialunterschiede), schwerer abzuhören.
- **SFP-Fehlersuche:** Passen die Module auf beiden Seiten zusammen (Multimode/Singlemode, Wellenlänge, Geschwindigkeit)? Passt die Faser zum Modul? Sind Sende- und Empfangsfaser vertauscht? Sind die Stecker sauber? Wird das Modul vom Switch unterstützt?

## WAN-Anschlüsse

- **DSL Geschäftskunde:** feste öffentliche IP-Adresse(n), vertraglich zugesicherte Entstörzeit (SLA), oft symmetrische Bandbreite.
- **DSL Privatkunde:** meist wechselnde IP-Adresse, asymmetrische Bandbreite (Download schneller als Upload), keine garantierte Entstörzeit.
- **GPON** (Gigabit Passive Optical Network): Eine Glasfaser wird über passive Splitter auf viele Teilnehmer aufgeteilt. Shared Medium: Alle Teilnehmer an einem Splitter teilen sich die Bandbreite.
- **LTE als Backup-Leitung:** Mobilfunkprovider nutzen oft Carrier-Grade-NAT. Der Anschluss hat dann keine eigene öffentliche IPv4-Adresse, eingehende Verbindungen (Portweiterleitung, VPN-Server) sind nicht möglich.

## VPN

- **Site-to-Site-VPN:** verbindet zwei Standorte dauerhaft über ihre Router bzw. Firewalls. Für die Endgeräte ist das VPN unsichtbar, sie brauchen keinen VPN-Client.
- **Remote-Access-VPN (Client-to-Site):** Ein einzelnes Gerät (z. B. im Homeoffice) verbindet sich mit einem VPN-Client ins Firmennetz.
- **Pre-Shared Key (PSK):** ein gemeinsamer geheimer Schlüssel für alle. Einfach einzurichten, aber wird er bekannt, muss er überall getauscht werden.
- **Zertifikate:** jedes Gerät oder jeder Benutzer hat ein eigenes Zertifikat. Einzeln widerrufbar und gut skalierbar, dafür ist eine PKI nötig.

## NGFW und TLS-Inspection

- **TLS-Inspection:** Die NGFW bricht verschlüsselte Verbindungen auf, um Schadcode und verbotene Inhalte zu erkennen. Sie baut selbst die Verbindung zum Server auf und stellt dem Client ein eigenes Zertifikat für die Webseite aus, signiert mit der CA der Firewall.
- Damit das ohne Warnung funktioniert, muss das CA-Zertifikat der Firewall auf allen Clients als vertrauenswürdig installiert sein.
- **Typische Browser-Fehlermeldungen:** NET::ERR_CERT_AUTHORITY_INVALID = Aussteller unbekannt bzw. nicht vertrauenswürdig (z. B. Firewall-CA fehlt auf dem Client). NET::ERR_CERT_DATE_INVALID = Zertifikat abgelaufen oder Uhrzeit des Clients falsch. NET::ERR_CERT_COMMON_NAME_INVALID = Zertifikat gilt nicht für den aufgerufenen Namen.
- Für sensible Seiten (z. B. Online-Banking) richtet man Ausnahmen ein, die Mitarbeiter müssen über die Überwachung informiert werden.

## ARP, DHCP und Multicast

- **ARP:** ermittelt im lokalen Netz die MAC-Adresse zu einer IPv4-Adresse. Die Anfrage geht als Broadcast an alle, die Antwort als Unicast zurück. Ergebnisse landen im ARP-Cache (anzeigen mit arp -a).
- **Gratuitous ARP:** Ein Gerät gibt ungefragt seine eigene IP- und MAC-Adresse bekannt. Damit werden doppelte IP-Adressen erkannt und die ARP-Caches nach einem Wechsel (z. B. Failover einer virtuellen IP) aktualisiert.
- **DHCP-Ablauf DORA:** Discover (Client sucht per Broadcast einen Server), Offer (Server bietet eine Adresse an), Request (Client fordert die angebotene Adresse an), Acknowledge (Server bestätigt). Server nutzt UDP 67, Client UDP 68.
- **Multicast-Bereich:** 224.0.0.0 bis 239.255.255.255 (224.0.0.0/4). Ein Paket an eine Multicast-Adresse erreicht alle Mitglieder dieser Gruppe.

## IPv6: SLAAC und DHCPv6

- **Link-local-Adresse:** Jede IPv6-Schnittstelle bildet sich automatisch eine Adresse aus fe80::/10. Sie gilt nur im lokalen Netzsegment und wird nicht geroutet.
- **SLAAC:** Der Client schickt eine Router Solicitation, der Router antwortet mit einem Router Advertisement mit dem /64-Präfix. Der Client hängt seine Interface-ID an und hat so eine globale Adresse. Standard-Gateway ist die Link-local-Adresse des Routers.
- **Warum trotzdem DHCPv6:** um zentral DNS-Server und weitere Optionen zu verteilen und nachvollziehen zu können, welches Gerät welche Adresse hat.
