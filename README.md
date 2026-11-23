# FISI AP2 Lernkarten

Lern-App im Karteikarten-Stil für die schriftliche IHK-Abschlussprüfung Teil 2 (Fachinformatiker/in Systemintegration). Optimiert fürs iPhone, läuft komplett offline und braucht kein Konto.

- **404 Fragen** in 11 Kategorien: Multiple Choice, Eingabe, Zuordnung, Karteikarte. 302 davon stammen aus dem Lernzettel, 102 aus den Ergänzungen (`content/ergaenzungen.md`)
- **Prüfungsrelevanz:** Jede Frage ist als `kern` (kam in den IHK-Prüfungen FISI 2021–2025 vor) oder `extra` (Nice-to-know) eingestuft. Standardmäßig lernst du nur Kern-Fragen. Extra-Fragen schaltest du unter **Einstellungen → Auch Extra-Fragen anzeigen** dazu
- **17 Rechen-Generatoren** mit Zufallszahlen und Rechenweg (Subnetting, VLSM, IPv6, RAID, Übertragungszeit, Stromkosten, Verfügbarkeit, MTBF, USV-Laufzeit, PoE-Budget, TTL, chmod …)
- **Leitner-System** mit 5 Fächern, Modi „Tägliches Lernen“, „Thema“, „Schwächen“, „Prüfungssimulation“ (Note nach IHK-Schlüssel), „Nur Rechnen“
- Statistik, Lernserie, Tagesziel, Export/Import des Lernstands

---

## 1. Lokal starten

Du brauchst einmalig **Node.js** (Version 20 oder neuer).

**Mac:** Terminal öffnen und eingeben (falls Homebrew installiert ist):

```bash
brew install node
```

Alternativ den Installer von [nodejs.org](https://nodejs.org) nehmen (LTS-Version).

Dann im Terminal in den Projektordner wechseln:

```bash
cd ~/Documents/Abschlussprüfung/ihk-lernapp
```

Abhängigkeiten installieren (nur beim ersten Mal):

```bash
npm install
```

App starten:

```bash
npm run dev
```

Im Terminal erscheint eine Adresse wie `http://localhost:5173`. Öffne sie im Browser. Mit `Ctrl + C` beendest du den Server.

**Auf dem iPhone im selben WLAN testen:**

```bash
npm run dev -- --host
```

Das Terminal zeigt dann zusätzlich eine „Network“-Adresse (z. B. `http://192.168.178.20:5173`). Diese im iPhone-Safari öffnen. Achtung: Offline-Modus und „Zum Home-Bildschirm“ funktionieren erst richtig mit der veröffentlichten Version (HTTPS, siehe Schritt 2).

### Weitere Befehle

| Befehl | Was er macht |
| --- | --- |
| `npm run test` | Alle Tests (Generatoren, Vergleichslogik, Leitner, Fragendatenbank) |
| `npm run build` | Fragen neu erzeugen, prüfen und die fertige App nach `dist/` bauen |
| `npm run preview` | Den gebauten Stand aus `dist/` lokal ansehen (inkl. Offline-Funktion) |
| `npm run generate` | Nur die Fragendatenbank neu erzeugen (siehe Schritt 4) |
| `npm run icons` | App-Icons in `public/` neu erzeugen |

---

## 2. Auf GitHub Pages veröffentlichen

Damit du die App überall (auch unterwegs) aufrufen kannst, wird sie kostenlos auf GitHub Pages gehostet. Das passiert automatisch per GitHub Actions bei jedem Push.

1. **GitHub-Konto anlegen** auf [github.com](https://github.com), falls noch nicht vorhanden.
2. **Neues Repository erstellen:** oben rechts „+“ → „New repository“. Name z. B. `ihk-lernapp`. Sichtbarkeit „Public“ (GitHub Pages ist bei privaten Repos nur mit Bezahl-Account möglich). **Keine** README/gitignore anhaken. „Create repository“.
3. **Projekt hochladen.** Im Terminal im Projektordner:

   ```bash
   git init
   ```

   ```bash
   git add .
   ```

   ```bash
   git commit -m "Erste Version der Lern-App"
   ```

   ```bash
   git branch -M main
   ```

   Die nächste Zeile kopierst du von GitHub (Seite deines neuen Repos, Abschnitt „…or push an existing repository“), sie sieht so aus:

   ```bash
   git remote add origin https://github.com/DEIN-NAME/ihk-lernapp.git
   ```

   ```bash
   git push -u origin main
   ```

   Beim ersten Push fragt Git nach Anmeldedaten. Am einfachsten geht das mit der [GitHub CLI](https://cli.github.com) (`brew install gh`, dann `gh auth login`) oder mit GitHub Desktop.

4. **GitHub Pages einschalten:** Im Repository → **Settings** → links **Pages** → bei „Build and deployment“ unter **Source** „**GitHub Actions**“ auswählen.
5. **Warten:** Im Tab **Actions** läuft jetzt „Deploy auf GitHub Pages“ (ca. 1–2 Minuten). Ein grüner Haken heißt: fertig.
6. **Adresse:** `https://DEIN-NAME.github.io/ihk-lernapp/` – steht auch unter Settings → Pages.

Bei jedem weiteren `git push` wird die App automatisch neu gebaut und veröffentlicht. Schlagen die Tests fehl, wird nichts veröffentlicht (dein Stand bleibt online, wie er war).

> Der Workflow liegt in `.github/workflows/deploy.yml`. Der Repository-Name wird automatisch als Basis-Pfad gesetzt – du musst nichts anpassen, auch wenn du das Repo anders nennst.

---

## 3. Auf dem iPhone als App installieren

1. Die GitHub-Pages-Adresse in **Safari** öffnen (nicht Chrome – nur Safari kann auf iOS Web-Apps installieren).
2. Unten auf das **Teilen-Symbol** tippen (Quadrat mit Pfeil nach oben).
3. Nach unten scrollen → **„Zum Home-Bildschirm“** → „Hinzufügen“.
4. Die App jetzt über das neue Icon auf dem Home-Bildschirm starten. Sie läuft im Vollbild ohne Safari-Leiste.
5. **Offline-Test:** App einmal öffnen (dabei werden alle Daten gespeichert), dann Flugmodus an und App neu starten – sie funktioniert weiter.

**Updates:** Nach einem neuen `git push` lädt die App die neue Version beim nächsten Start mit Netz automatisch im Hintergrund. Spätestens nach dem zweiten Start ist sie aktiv.

### Lernstand zwischen MacBook und iPhone übertragen

Der Fortschritt wird nur auf dem jeweiligen Gerät gespeichert (kein Server, kein Login).

1. Auf Gerät A: **Einstellungen → Exportieren**. Auf dem iPhone öffnet sich das Teilen-Menü → „In Dateien sichern“ oder AirDrop.
2. Auf Gerät B: **Einstellungen → Importieren** → Datei auswählen.
3. **„Zusammenführen“** wählen: Pro Karte gilt der jeweils neuere Stand. „Ersetzen“ überschreibt alles.

> Tipp: Exportiere ab und zu als Sicherung. Wenn du in Safari „Website-Daten löschen“ ausführst, ist der Lernstand sonst weg.

---

## 4. Neue Inhalte hinzufügen

Alle Fragen entstehen aus den Dateien im Ordner `content/`. Die App selbst liest nur die erzeugte Datei `src/data/questions.json`.

```
content/
├── lernzettel.md           ← dein Lernzettel (Quelle für alle Fragen)
├── curated/                ← von Hand geschriebene Fragen (je Kategorie eine Datei)
│   ├── 01-ports.json
│   └── …
└── (deine neuen .md-Dateien)
```

### Variante A: Neue Markdown-Datei – Fragen werden automatisch erzeugt

1. Lege eine Datei an, z. B. `content/dns-vertiefung.md`.
2. Oben einen Kopf mit der Kategorie einfügen:

   ```markdown
   ---
   category: osi
   relevanz: kern
   ---

   ## DNS-Vertiefung

   | Eintrag | Bedeutung |
   | --- | --- |
   | SRV | Dienst mit Port |
   | CAA | erlaubte Zertifizierungsstellen |
   | HINFO | Hardware-Info |
   | NAPTR | Namensumschreibung |

   - **Zonentransfer:** Kopie der Zone vom primären auf den sekundären Nameserver.
   ```

   Erlaubte Kategorien: `ports`, `ipv4`, `ipv6`, `osi`, `einheiten`, `raid`, `backup`, `sicherheit`, `netzwerk`, `infrastruktur`, `programmierung`.
   Eine abweichende Kategorie für einen Abschnitt setzt du mit `<!-- category: raid -->` direkt unter der `##`-Überschrift.

3. Im Terminal:

   ```bash
   npm run generate
   ```

   Das Script erzeugt daraus automatisch:
   - aus **Tabellen**: pro Zelle eine Multiple-Choice-Frage (Falschantworten kommen aus derselben Spalte – deshalb mindestens 4 Zeilen) und pro Spalte eine Zuordnungsaufgabe,
   - aus **`**Begriff:** Erklärung`**-Zeilen: eine Karteikarte.

4. Mit `npm run dev` ansehen, dann committen und pushen – fertig.

### Variante B: Eigene Fragen von Hand

Entweder als ` ```quiz `-Block direkt in der Markdown-Datei (JSON, ein Objekt oder eine Liste):

````markdown
```quiz
{
  "id": "dns-srv-port",
  "type": "mc",
  "prompt": "Was enthält ein SRV-Eintrag zusätzlich zum Namen?",
  "choices": ["Port des Dienstes", "IPv6-Adresse", "Mailserver-Priorität", "TTL des Resolvers"],
  "correct": 0,
  "explanation": "Ein SRV-Eintrag beschreibt einen Dienst mit Zielhost und Port.",
  "ref": "SRV | Dienst mit Port"
}
```
````

… oder in einer eigenen Datei unter `content/curated/` nach dem Vorbild der vorhandenen Dateien.

**Fragetypen und Pflichtfelder:**

| `type` | Pflichtfelder | Hinweis |
| --- | --- | --- |
| `mc` | `choices` (genau 4), `correct` (0–3) | Antworten werden in der App gemischt |
| `input` | `accepted` (Liste), `compare` | `compare`: `text`, `number`, `ipv4`, `ipv6`, `cidr`, `list` |
| `match` | `pairs` (2–8 × `left`/`right`), optional `options` | |
| `flashcard` | `answer` | Selbstbewertung Gewusst/Unsicher/Nicht gewusst |

Für alle gilt: `id` (klein, nur `a-z 0-9 -`, eindeutig), `prompt`, `explanation` und `relevanz` (`"kern"` oder `"extra"`). In `content/curated/` muss `relevanz` an jeder Frage oder einmal oben in der Datei stehen, sonst bricht `npm run generate` ab. Bei automatisch erzeugten Fragen gilt `relevanz` aus dem Kopf der Markdown-Datei (Standard: `kern`). Optional: `mnemonic` (Eselsbrücke), `pitfall` (typische Falle), `code` (`{ "lang": "csharp" | "sql" | "bash", "src": "…" }`), `needsReview` + `reviewNote`.

**`ref` – die Quellenprüfung:** Trage in `ref` ein kurzes Zitat aus der Markdown-Datei ein. `npm run generate` bricht mit Fehler ab, wenn dieses Zitat dort nicht vorkommt (Formatierung wie `**` oder `|` wird ignoriert). So bleibt jede Frage am Lernzettel festgemacht.

> **Wichtig:** Die `id` einer Frage nicht mehr ändern – daran hängt dein Lernfortschritt.

### Was passiert bei Fehlern?

- `npm run generate` und `npm run build` zeigen genau an, welche Frage in welcher Datei fehlerhaft ist, und brechen ab.
- Sollte trotzdem eine kaputte Frage in die App gelangen, wird sie beim Start übersprungen und unter **Einstellungen → Inhalte** aufgelistet. Die App stürzt nicht ab.

### Prüfungsrelevanz: kern oder extra?

- **kern:** kam in den IHK-Prüfungen FISI 2021–2025 vor oder ist Grundlage dafür (z. B. Subnetting, RAID, Backup-Arten, die wichtigen Ports wie 22, 53, 443, 3389).
- **extra:** fachlich richtig, aber in diesen Prüfungen nicht abgefragt (z. B. die Ports von MySQL oder MQTT, Wi-Fi-Generationsnamen, Aufbewahrungsfristen im Detail).

Extra-Fragen werden nie gelöscht. Sie tauchen nur in keinem Lernmodus auf, solange der Schalter in den Einstellungen aus ist. Dein Lernfortschritt bei ihnen bleibt erhalten.

### Die Ergänzungen

`content/ergaenzungen.md` enthält Prüfungsthemen, die im Lernzettel fehlen oder zu knapp sind (z. B. TLS-Handshake, nslookup-Ausgabe, MDM, SPF/DKIM, Router-on-a-Stick). Die Fragen dazu stehen in `content/curated/12-ergaenzungen.json`, ihre Zitate werden gegen `ergaenzungen.md` geprüft.

### Der Lernzettel selbst

`content/lernzettel.md` hat im Kopf `autoExtract: false`, weil alle Inhalte bereits als handgeschriebene Fragen in `content/curated/` stecken (mit besseren Falschantworten). Wenn du den Lernzettel änderst, passe die betroffenen Fragen in `content/curated/` an – `npm run generate` meldet dir Fragen, deren Zitat nicht mehr passt.

---

## 5. So funktioniert das Lernen

| Modus | Inhalt |
| --- | --- |
| Tägliches Lernen | alle fälligen Karten + bis zu 10 neue (einstellbar) + bis zu 3 Rechenaufgaben |
| Thema wählen | bis zu 20 Karten einer Kategorie + passende Rechenaufgaben |
| Schwächen | die 20 Karten, die du am häufigsten falsch hattest |
| Prüfungssimulation | 20 Aufgaben (15 Wissen, 5 Rechnen), 30 Minuten, Punkte und Note nach IHK-Schlüssel |
| Nur Rechnen | 10 zufällige Rechenaufgaben (oder gezielt ein Typ unter „Themen“) |

**Leitner-Fächer:** richtig → ein Fach höher, teilweise/unsicher → ein Fach tiefer, falsch → Fach 1. Wiederholung nach 0 / 1 / 3 / 7 / 14 Tagen. Falsch beantwortete Karten kommen außerdem in derselben Sitzung ein paar Karten später noch einmal.

**Bedienung:** Antwort antippen bzw. eingeben → „Prüfen“. Weißt du es nicht, tippe **„Keine Ahnung“**: Du bekommst sofort Lösung, Erklärung, Eselsbrücke/typische Falle (bei Rechenaufgaben den Rechenweg), die Karte geht zurück in Fach 1 und kommt in derselben Sitzung noch einmal. Danach mit „Weiter“ oder **nach links wischen** zur nächsten Karte, **nach rechts wischen** zurück.

**Eingaben werden tolerant verglichen:** Groß-/Kleinschreibung und Leerzeichen egal, `8,76` = `8.76`, `1.024` = `1024`, `/27` = `27` = `255.255.255.224`, IPv6 in Kurz- oder Langform.

---

## Technik

Vite · React · TypeScript · Tailwind CSS · Zod · Vitest · vite-plugin-pwa (Workbox) · highlight.js

```
src/
├── data/          schema.ts (Zod), categories.ts, questions.json (erzeugt)
├── generators/    Rechen-Generatoren + Tests
├── lib/           compare.ts (tolerante Eingabe), progress.ts (Leitner, Speicher), session.ts (Modi)
├── components/    Fragetypen, Feedback, Code-Highlighting, Wischgesten
└── pages/         Start, Sitzung, Themen, Statistik, Einstellungen
scripts/           generate.ts, content.ts (Extraktion), icons.ts
```
