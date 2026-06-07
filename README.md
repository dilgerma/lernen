# Vincents Lernquest 🎮

Eine gamifizierte Lernplattform für Vincent. Jede Stunde Lernen schaltet eine Döner-Zutat frei – nach 5 Stunden gibt es einen echten Döner bei Papa.

---

## Starten

```bash
cp .env.example .env
# .env mit Supabase-Daten füllen (oder leer lassen – dann läuft alles ohne Datenbank)

npm install
npm run dev
```

Dann im Browser öffnen: **http://localhost:3000**

---

## Wie funktioniert das Spiel?

1. Vincent wählt ein Fach (z. B. Englisch)
2. Er wählt eine Übung (Vokabeln oder Übersetzung)
3. Er löst die Aufgabe – die Zeit wird gemessen
4. Die gelernte Zeit schaltet Döner-Zutaten frei:

| Zeit | Zutat |
|------|-------|
| 60 Min | 🥗 Salat |
| 120 Min | 🍅 Tomate |
| 180 Min | 🧅 Zwiebel |
| 240 Min | 🥩 Fleisch |
| 300 Min | 🧄 Soße |

Nach 300 Minuten (5 Stunden) erscheint die Döner-Feier-Seite – einlösen bei Papa gegen einen echten Döner. Dann startet der nächste Döner.

Der **Rang** (Rekrut → General) steigt mit den insgesamt geleisteten Minuten und setzt sich **nicht** zurück.

---

## Übungen hinzufügen

Alle Übungen liegen als JSON-Dateien in:

```
exercises/
├── englisch/
│   ├── vocabulary-1.json
│   ├── vocabulary-2.json
│   └── translation-1.json
├── franzoesisch/
│   └── vocabulary-1.json
└── mathe/          ← einfach einen neuen Ordner anlegen
    └── aufgaben-1.json
```

**Wichtig:** Der Ordnername wird als Fachname verwendet. Bekannte Ordnernamen werden automatisch mit Flagge angezeigt: `englisch` 🇬🇧, `franzoesisch` 🇫🇷, `spanisch` 🇪🇸, `mathe` 🔢, `deutsch` 🇩🇪. Jeder andere Ordnername funktioniert auch (ohne Flagge).

---

### Vokabelübung hinzufügen

Dateiname: beliebig, muss auf `.json` enden, z. B. `vocabulary-4.json` oder `kapitel-5-vokabeln.json`

```json
{
  "id": "eng-voc-4",
  "title": "Kapitel 4 – Essen & Trinken",
  "description": "Vokabeln rund ums Essen aus dem Schulbuch",
  "type": "vocabulary",
  "items": [
    { "question": "the apple",  "answers": ["der Apfel", "Apfel"] },
    { "question": "the bread",  "answers": ["das Brot", "Brot"] },
    { "question": "the milk",   "answers": ["die Milch", "Milch"] },
    { "question": "the water",  "answers": ["das Wasser", "Wasser"] },
    { "question": "hungry",     "answers": ["hungrig"] },
    { "question": "to eat",     "answers": ["essen"] },
    { "question": "to drink",   "answers": ["trinken"] }
  ]
}
```

**Felder:**

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `id` | ja | Eindeutige ID (beliebiger String, darf sich nicht wiederholen) |
| `title` | ja | Wird groß im Spiel angezeigt |
| `description` | ja | Kurze Beschreibung unter dem Titel |
| `type` | ja | Immer `"vocabulary"` für Vokabeln |
| `items` | ja | Liste der Vokabelpaare |
| `items[].question` | ja | Das angezeigte Wort (in der Fremdsprache) |
| `items[].answers` | ja | Array mit allen akzeptierten deutschen Antworten |

**Hinweise:**
- Groß-/Kleinschreibung wird beim Prüfen ignoriert
- Umlaute werden automatisch erkannt: `ä/ae`, `ö/oe`, `ü/ue`, `ß/ss` sind gleichwertig
- Mehrere Antworten im `answers`-Array erlauben, wenn mehrere Übersetzungen richtig sind
- Die Reihenfolge der Items wird beim Spielen zufällig gemischt
- Ein Array kann beliebig viele Items enthalten – ideal, um ganze Buchseiten einzutragen

---

### Übersetzungsübung hinzufügen

Dateiname: z. B. `translation-3.json`

```json
{
  "id": "eng-trans-3",
  "title": "Text übersetzen – Meine Stadt",
  "description": "Einen längeren Text über eine Stadt ins Deutsche übersetzen",
  "type": "translation",
  "source": "My city is not very big, but it is beautiful. There is a large park in the centre where people walk their dogs and children play football. On Saturdays there is a market where you can buy fresh fruit and vegetables.",
  "reference": "Meine Stadt ist nicht sehr groß, aber sie ist schön. Im Zentrum gibt es einen großen Park, wo die Menschen ihre Hunde spazieren führen und Kinder Fußball spielen. Samstags gibt es einen Markt, wo man frisches Obst und Gemüse kaufen kann.",
  "minimumScore": 0.6
}
```

**Felder:**

| Feld | Pflicht | Beschreibung |
|------|---------|--------------|
| `id` | ja | Eindeutige ID |
| `title` | ja | Wird groß im Spiel angezeigt |
| `description` | ja | Kurze Beschreibung |
| `type` | ja | Immer `"translation"` für Übersetzungen |
| `source` | ja | Der Text, der übersetzt werden soll |
| `reference` | ja | Die Musterlösung (wird als Hilfe angeboten, wenn Vincent möchte) |
| `minimumScore` | nein | Mindest-Trefferquote 0–1 (Standard: `0.6`). Bei `0.6` müssen 60% der Wörter stimmen. |

**Hinweise:**
- Die Bewertung zählt, wie viele Wörter der Übersetzung mit der Musterlösung übereinstimmen
- Reihenfolge spielt keine Rolle – nur ob die Wörter vorkommen
- `minimumScore: 0.5` ist großzügig, `0.8` ist streng
- Für kurze Sätze eher `0.65`, für lange Texte eher `0.55`
- Die Musterlösung wird als Hilfe angezeigt, wenn Vincent selbst darauf klickt

---

### Neues Fach anlegen

Einfach einen neuen Ordner unter `exercises/` anlegen:

```bash
mkdir exercises/latein
# Dann JSON-Dateien hineinkopieren
```

Das Fach erscheint automatisch auf der Startseite. Für eine eigene Flagge/Bezeichnung die Datei `src/slices/exercises/routes.ts` erweitern:

```typescript
const SUBJECT_META: Record<string, { label: string; flag: string }> = {
  englisch:     { label: 'Englisch',    flag: '🇬🇧' },
  franzoesisch: { label: 'Französisch', flag: '🇫🇷' },
  latein:       { label: 'Latein',      flag: '🏛️' },  // ← neu
};
```

---

## Übungen aus Schulbuch-Fotos erstellen

Wenn du ein Foto oder einen Scan einer Schulbuchseite hast, kannst du daraus schnell eine JSON-Datei machen:

1. Vokabeln von der Seite abtippen oder aus dem Bild kopieren
2. Eine neue JSON-Datei nach dem Schema oben anlegen
3. Im `items`-Array alle Vokabeln eintragen
4. Datei in den richtigen Ordner legen – fertig

Pro Buchseite empfiehlt sich **eine Datei**. Den Dateinamen kannst du nach Kapitel benennen, z. B. `kapitel-7-vokabeln.json`.

---

## Projektstruktur

```
exercises/              ← Alle Übungen als JSON-Dateien
├── englisch/
│   ├── vocabulary-1.json
│   └── translation-1.json
└── franzoesisch/
    └── vocabulary-1.json

src/slices/
├── exercises/          ← API: Übungen lesen und ausliefern
│   ├── Exercise.ts         Typen
│   ├── ExerciseLoader.ts   JSON-Dateien einlesen
│   └── routes.ts           API-Endpunkte
└── score/              ← API: Punkte speichern
    ├── Score.ts            Rang- und Döner-Logik
    ├── ScoreStore.ts       Datenbank-Persistenz (mit Datei-Fallback)
    └── routes.ts           API-Endpunkte

public/
└── index.html          ← Das komplette Frontend (eine Datei)
```

---

## API-Endpunkte

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| `GET` | `/api/subjects` | Alle Fächer |
| `GET` | `/api/subjects/:fach/exercises` | Übungsliste für ein Fach |
| `GET` | `/api/exercises/:fach/:datei` | Vollständige Übung laden |
| `GET` | `/api/score` | Aktueller Stand (Rang, Döner, Minuten) |
| `POST` | `/api/score/add-minutes` | Minuten nach einer Übung eintragen |
| `POST` | `/api/score/reset-doner` | Döner einlösen, neu starten |

---

## Datenbank

Der Score wird in einer Tabelle `player_score` gespeichert. Die Tabelle wird beim ersten Start **automatisch angelegt** – kein manuelles SQL nötig.

Falls keine Datenbank konfiguriert ist (`SUPABASE_DB_URL` fehlt), wird der Score in `data/score.json` gespeichert.

---

## Umgebungsvariablen

```env
# Supabase (optional – ohne DB läuft alles mit Datei-Fallback)
SUPABASE_DB_URL=postgresql://...

PORT=3000
```
