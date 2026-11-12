<p align="center">
  <img src="assets/branding/dsh-banner-en.webp" alt="DSH Archive Manager" width="100%">
</p>

<div align="center">

  # DSH Archive Manager

  **Sichere Verwaltung archivierter Sitzungen in DeepSeek Harness**

  [简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

  [Änderungsprotokoll](CHANGELOG.md) · [Apache-2.0](LICENSE)

  [![Lizenz: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)
  [![npm Paket](https://img.shields.io/npm/v/%40michengai%2Fdsh-archive-manager.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![npm Downloads](https://img.shields.io/npm/dt/%40michengai%2Fdsh-archive-manager.svg?label=npm%20downloads)](https://www.npmjs.com/package/@michengai/dsh-archive-manager)
  [![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-archive-manager)
  [![DSH kompatibel bis 0.2.2-rc.2](https://img.shields.io/badge/DSH-up%20to%200.2.2--rc.2-2563eb.svg)](#installation)
</div>

> DSH Archive Manager ist ein von der Community gepflegtes Plugin für DeepSeek Harness (DSH) und kein offizielles Produkt von DeepSeek AI.

Dieses Dokument beschreibt Version **1.3.2**. Frühere Änderungen finden Sie im [Changelog](CHANGELOG.md).

## Funktionsübersicht

Legen Sie inaktive Unterhaltungen ab und holen Sie sie bei Bedarf zurück, um Ihre tägliche Aufgabenliste übersichtlich zu halten.

- **Zwei Zugänge & große Arbeitsbereichsansicht**: Verwalten Sie Sitzungen unter **Einstellungen → Archivierte Sitzungen** oder aktivieren Sie das Symbol in der Hauptseitenleiste für ein zentriertes Vollbild-Panel im Arbeitsbereich.
- **Archivieren & Wiederherstellen**: Archivieren Sie einzelne Chats, ganze Arbeitsbereiche oder projektübergreifende Stapel und stellen Sie Sitzungen direkt wieder her oder setzen sie fort.
- **Volltextsuche & Schnellvorschau**: Durchsuchen Sie Titel und Nachrichtenverlauf gemeinsam, kombinieren Sie Projekt-, Favoriten- und Datumsfilter mit flexibler Sortierung und prüfen Sie den Kontext in Markdown oder hervorgehobenem Klartext ohne Wiederherstellung.
- **Favoriten & Bereinigung inaktiver Chats**: Markieren Sie wichtige Chats mit einem Stern und filtern Sie nach **Nur Favoriten**; finden und archivieren Sie inaktive Sitzungen nach Tagen mit automatischem Schutz für laufende Aufgaben, ausstehende Eingaben und Favoriten sowie sofortigem Rückgängigmachen.
- **Seitenleisten-Aktionen & Verschieben zwischen Arbeitsbereichen**: Rechtsklicken Sie in der Seitenleiste auf Arbeitsbereichs- oder Sitzungszeilen, um zu favorisieren, zu archivieren, reguläre Sitzungen in einen anderen Arbeitsbereich zu verschieben oder Projektordner zu kopieren bzw. zu öffnen.
- **Bereinigung verwaister Subagents & endgültiges Löschen**: Erkennen und entfernen Sie verwaiste Subagents, deren Hauptsitzung extern gelöscht wurde, und bereinigen Sie unerwünschte Sitzungen und Protokolle nach Bestätigung dauerhaft.
- **Mehrsprachig & Reverse-Proxy-fähig**: Unterstützt alle 8 integrierten Sprachen von DeepSeek Harness, folgt dem hellen/dunklen Design und funktioniert hinter Reverse Proxies mit Pfadpräfix.

## Screenshots

### 1. Archiv-Verwaltungspanel

Suchen, favorisieren, voranzeigen, wiederherstellen und bereinigen unter **Einstellungen → Archivierte Sitzungen → Archiviert**:

![Archiviert: gemeinsame Suchfilter, Favoriten und kompakte Zeilen](assets/screenshots/archived-sessions.webp)

Wechseln Sie zu **Nicht archiviert**, um inaktive Sitzungen vorab zu prüfen oder ganze Projekte zu archivieren:

![Nicht archiviert: intelligente Bereinigung und Projektarchivierung](assets/screenshots/unarchived-sessions.webp)

### 2. Hauptarbeitsbereichs-Panel (direkt über die Seitenleiste)

Bei aktiviertem Seitenleisteneintrag öffnet ein Klick auf das linke Navigationssymbol direkt die vollständige Ansicht:

![Hauptarbeitsbereich: direkter Seitenleisteneintrag](assets/screenshots/main-view-panel.webp)

### 3. Kontextmenüs & Verschieben in der Seitenleiste

Rechtsklicken Sie auf eine beliebige Arbeitsbereichs- oder Sitzungszeile in der Seitenleiste für Schnellaktionen und das Verschieben zwischen Projekten:

| Arbeitsbereichs-Aktionen (Ordner kopieren/öffnen) | Sitzung in anderen Arbeitsbereich verschieben |
| :---: | :---: |
| <img src="assets/screenshots/workspace-context-menu.webp" alt="Arbeitsbereichs-Aktionsmenü" width="100%"> | <img src="assets/screenshots/session-move-menu.webp" alt="Sitzung-verschieben-Menü" width="100%"> |

## Installation

Ein funktionierendes DeepSeek Harness-Setup ist erforderlich. Die Beispiele verwenden das Profil `web`; passen Sie es an Ihre Umgebung an.

- **Host-Kompatibilität**: DeepSeek Harness `0.2.x`-Reihe (`>=0.2.0-rc.1 <0.3.0-0`), verifiziert auf allen `0.2.x`-Release-Candidates (`0.2.0-rc.1` bis `0.2.2-rc.2`; Zwischen-Alphas werden nicht unterstützt).
- Hosts vor `0.2.0-rc.1` werden nicht mehr unterstützt, und Breaking-Updates der Generation `0.3.0` werden durch das Versions-Gate abgefangen. Nutzer auf `0.1.x` installieren bitte Version `1.0.20`.
- **Reverse-Proxy-Unterstützung**: Funktioniert hinter Reverse Proxies mit Pfadpräfix (z. B. `/app/dsh/`).

### Installation durch einen Agenten (empfohlen)

Senden Sie diese Anweisung an einen Agenten mit Terminal-Zugriff:

```text
Installiere die neueste Version von @michengai/dsh-archive-manager aus der offiziellen npm-Registry in mein DSH-Web-Profil, überprüfe die Aktivierung und erkläre das Neuladen.
```

### Manuelle Installation & Aktualisierung

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/
```

Starten Sie DSH Web neu, laden Sie den Browser hart neu (`Ctrl+Shift+R`) und öffnen Sie **Einstellungen → Archivierte Sitzungen**. Zum Aktualisieren führen Sie den Befehl erneut aus.

## Plugin-Konfiguration

Öffnen Sie **Seitenleiste → Plugins → `Archive Manager`**, um Folgendes einzustellen:

- **Einstiegsplatzierung (`entryLocation`)**
  - **Beide (`both`)**: Zeigt das Symbol in der linken Seitenleiste an und behält **Einstellungen → Archivierte Sitzungen**.
  - **Nur Seitenleiste (`sidebar`)**: Zeigt das Symbol nur in der linken Seitenleiste und blendet den Eintrag in den Einstellungen aus.
  - **Nur Einstellungen (`settings`)** (Standard): Bietet den Zugang ausschließlich unter **Einstellungen → Archivierte Sitzungen**.
- **Favoritenstern in der Seitenleiste (`sidebarFavoriteStar`)**
  - **Alle anzeigen (`all`)** (Standard): Zeigt den Stern beim Überfahren mit der Maus und bei favorisierten Sitzungen.
  - **Nur Favoriten (`favorites`)**: Zeigt den Stern dauerhaft nur bei favorisierten Sitzungen; blendet Hover-Sterne bei anderen Zeilen aus.
  - **Vollständig ausblenden (`none`)**: Blendet Sterne in der Seitenleiste aus (Favoriten können weiterhin über das Kontextmenü gesetzt und mit **Nur Favoriten** gefiltert werden).

## Bedienungsanleitung

| Aktion | Anleitung |
| --- | --- |
| **Sitzungen archivieren** | Wählen Sie **Sitzung archivieren** im Kontextmenü der Seitenleiste oder wählen Sie unter **Nicht archiviert** mehrere Sitzungen aus |
| **Arbeitsbereich / Gruppe archivieren** | Wählen Sie **Arbeitsbereich archivieren** im Arbeitsbereichs-Menü oder nutzen Sie **…** an einer Projektgruppe unter **Nicht archiviert** (ignoriert Suchfilter) |
| **Suchen & Filtern** | Die Suche durchsucht Titel und Nachrichten gemeinsam; kombinierbar mit **Nur Favoriten**, Sortierung, Projektfilter und Datumsbereich (Kalender mit Voreinstellungen & Tastaturnavigation) |
| **Schnellvorschau** | Klicken Sie auf einen Treffer-Ausschnitt oder **Weitere Aktionen → Schnellvorschau**, um den Kontext ohne Wiederherstellung anzusehen |
| **Ansehen oder wiederherstellen** | Auf den Titel klicken, um im archivierten Zustand weiterzulesen/-chatten; Wiederherstellungssymbol oder **Weitere Aktionen → Wiederherstellen und öffnen** wählen |
| **Favorisieren** | Sternsymbol in der Zeile oder im Kontextmenü anklicken und im Ansichtsmenü nach **Nur Favoriten** filtern |
| **Inaktive Chats bereinigen** | Unter **Nicht archiviert** Inaktivitätstage (1–36.500) angeben, Kandidaten prüfen und bestätigen; über **Archivierung rückgängig machen** vor dem Schließen/Neuladen zurücknehmen |
| **Zwischen Arbeitsbereichen verschieben** | Rechtsklick auf eine reguläre Sitzung in der Seitenleiste und **In Arbeitsbereich verschieben** wählen |
| **Verwaiste Subagents bereinigen** | Werden Subagents ohne übergeordnete Sitzung erkannt, im Aufräum-Panel per Klick physisch löschen und Speicherplatz freigeben |
| **Listen-Cache rekonstruieren** | Falls offizielle Listen-Caches fehlen, erscheint bei Bedarf eine Karte zum schreibgeschützten Einlesen der Protokolle und Wiederherstellen der Titel |
| **Endgültig löschen** | Sitzungen auswählen und **Löschen** klicken (oder über das Kontextmenü), um Protokolle und Caches nach Bestätigung dauerhaft zu entfernen |
| **Sitzungs-ID kopieren** | **Sitzungs-ID kopieren** im Menü **Weitere Aktionen** wählen |

### Hinweise

- **Favoriten & Schutz inaktiver Sitzungen**: Favoriten werden vom Host gespeichert und bleiben beim Archivieren oder Wiederherstellen erhalten. Die Bereinigung inaktiver Chats schließt Favoriten, die geöffnete Sitzung, laufende Sitzungen und ausstehende Aktionen automatisch aus; Favoriten lassen sich weiterhin manuell archivieren. Eine automatische Hintergrundarchivierung findet nicht statt.
- **Suchumfang**: Die Volltextsuche umfasst Benutzer- und Assistenten-Nachrichten und schließt Werkzeugausgaben, Anhänge, Reasoning und Systemnachrichten aus. Es gibt keinen persistenten Volltextindex; bei umfangreichen Verläufen empfiehlt sich eine Eingrenzung über Projekt, Datum oder Favoriten.
- **Stapelaktionen & Rückgängigmachen**: Stapel-Archivierung, -Wiederherstellung und -Löschung setzen bei einzelnen Fehlern fort und erlauben das gezielte Wiederholen fehlgeschlagener Einträge. **Archivierung rückgängig machen** ist nur verfügbar, solange die aktuelle Verwaltungsseite geöffnet bleibt. Endgültiges Löschen kann nicht rückgängig gemacht werden.

## Häufig gestellte Fragen (FAQ)

### Warum wird der Eintrag nach der Installation nicht angezeigt?

Starten Sie DSH Web neu, laden Sie die Seite hart neu (`Ctrl+Shift+R`) und prüfen Sie, ob im aktiven Profil installiert wurde. Falls weiterhin kein Eintrag erscheint, prüfen Sie mit folgendem Befehl, ob `ui-workspace-archive-manager` enthalten ist und `cordis.patch.yml` des Profils `workspace`, `session-projection-cache` oder `ui-workspace` nicht deaktiviert:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh --profile web --dump-config
```

### Was ist der Unterschied zwischen Archivieren und endgültigem Löschen?

Archivieren legt eine Unterhaltung ab, sodass Sie sie jederzeit wiederherstellen können. **Endgültiges Löschen kann nicht rückgängig gemacht werden** und entfernt Protokolle, Cache-Einträge und Anhänge der Sitzung (Ihr Projektverzeichnis wird niemals gelöscht). Eine Bestätigung ist immer erforderlich.

### Kann es zusammen mit Codex UI oder anderen Archiv-Plugins verwendet werden?

Ja. Es funktioniert problemlos neben [Codex UI](https://github.com/MichengAI/dsh-codex-ui); sind weitere Archiv-Plugins installiert, registriert jedes seinen eigenen Eintrag in den Einstellungen unabhängig voneinander.

Bei anderen Problemen öffnen Sie bitte ein [Issue](https://github.com/MichengAI/dsh-archive-manager/issues) mit DSH- und Plugin-Version, Schritten zur Reproduktion und Fehlerdetails.

## Installation aus dem Quellcode

<details>
<summary>Aufklappen für Entwicklung oder Tests unveröffentlichter Änderungen</summary>

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

git clone https://github.com/MichengAI/dsh-archive-manager.git
Set-Location .\dsh-archive-manager
pnpm install --frozen-lockfile
pnpm build
dsh plugin --profile web add .
```

Starten Sie danach DSH Web neu und laden Sie den Browser neu. Nach Änderungen in [src](src) vor dem Commit `pnpm build` ausführen (Prüfungen: `pnpm typecheck`, `pnpm test`, `pnpm verify`).

</details>

## DSH-Produktökosystem

Für eine Desktop-Arbeitsumgebung laden Sie [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases) herunter. In bestehenden [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)-Installationen können Plugins bei Bedarf ergänzt werden:

| Plugin | Hauptfunktionen |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Projekte organisieren, Aufgaben suchen und Chatverläufe durchblättern |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Spezialisierte Agenten für Ihre Aufgaben auswählen und herbeirufen |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Lokale Fähigkeiten suchen, aktivieren, erstellen und importieren |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Archivierte Gespräche durchsuchen, wiederherstellen und physisch bereinigen |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Aufgaben über Messaging-Apps senden und Antworten empfangen |
| [Automation](https://github.com/MichengAI/dsh-automation) | Wiederkehrende Aufgaben planen und Ausführungen überwachen |
| [BTW](https://github.com/MichengAI/dsh-btw) | Nebenfragen stellen, ohne die aktuelle Hauptaufgabe zu unterbrechen |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | Mit `/simplify` geänderten Code direkt in Git-Commits optimieren |
| [PUA](https://github.com/MichengAI/dsh-pua) | Den Agenten zu Ursachenforschung und strikter Verifikation vor Abschluss anleiten |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | Unabhängige Code-Reviews mit `/review` direkt in der aktuellen Unterhaltung anfordern |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Benachrichtigungen und Werkzeuggenehmigungen über ein Desktop-Haustier steuern |

## Lizenz

Lizenziert unter der [Apache License 2.0](LICENSE).
