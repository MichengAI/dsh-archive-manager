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
  [![DSH kompatibel bis 0.2.2-rc.1](https://img.shields.io/badge/DSH-up%20to%200.2.2--rc.1-2563eb.svg)](#voraussetzungen)
</div>

> DSH Archive Manager ist ein von der Community gepflegtes Plugin für DeepSeek Harness (DSH) und kein offizielles Produkt von DeepSeek AI.

Dieses Dokument beschreibt Version **1.3.0**. Frühere Änderungen finden Sie im [Changelog](CHANGELOG.md).

## Funktionsübersicht

Legen Sie inaktive Unterhaltungen ab und holen Sie sie bei Bedarf zurück, um die tägliche Aufgabenliste übersichtlich zu halten.

- **Doppelansicht und primärer Seitenleisteneintrag**: Ein dauerhaftes Symbol in der Hauptseitenleiste öffnet eine großzügige, **960 px zentrierte Arbeitsbereichsansicht** für archivierte und nicht archivierte Sitzungen ohne beengte Dialog-Scrollbereiche.
- **Vollständiges Lebenszyklusmanagement**: Einzelne Chats, ganze Arbeitsbereiche mit einem Klick oder projektübergreifende Batches archivieren sowie Sitzungen direkt wiederherstellen oder fortsetzen.
- **Rechtsklick auf die gesamte Zeile in der Seitenleiste**: Klicken Sie mit der rechten Maustaste auf eine beliebige Stelle einer Arbeitsbereichs- oder Sitzungszeile, um das Aktionsmenü zu öffnen. Auf nicht gruppierten oder leeren Zeilen wird das native Systemmenü sicher durchgereicht.
- **Ruckelfreie Favoritensterne und Koexistenz mit Statuspunkten (#90, #92)**: Standardisierte Sternengröße von 16×16 px mit absoluter Positionierung über dem führenden Slot verhindert jedes Springen des Titels. Bei laufenden Aufgaben oder Genehmigungen bleibt der Statuspunkt des Hosts zu 100 % sichtbar, während der Stern als kompaktes 10 px Badge unten rechts erhalten bleibt.
- **Arbeitsbereich-Schnellaktionsmenü**: Ordnerpfad kopieren, Ordner direkt im Windows-Explorer oder macOS Finder öffnen und Sitzungen mit einem Klick archivieren.
- **Sitzungen zwischen Arbeitsbereichen verschieben**: Verschieben Sie Sitzungen über ein kaskadierendes Untermenü in andere Arbeitsbereiche, mit Prozessberuhigung, atomarer Umschreibung und NTFS-Doppelpunktschutz für IM-Sitzungen.
- **Einheitliche Akkordeonkarten und 40 px ultrakompakte Zeilen**: Projektgruppen im Stil des Skills Managers mit integrierten Einschubkarten (38 px Kopfzeile) und auf 40 px komprimierten Zeilen für verdoppelte Informationsdichte.
- **Native Kontrollkästchen im Dunkelmodus**: Komponenten nach offiziellen Host-Spezifikationen mit nativem `accent-color` fügen sich nahtlos in dunkle Designs ein.
- **Lichtundurchlässige Modaldialoge und barrierefreie Lokalisierung**: Breiter Vorschaudialog direkt am `body` gemountet (`portalToBody`) mit festem Hintergrund und Unschärfe, um Textdurchscheinen zu verhindern. Vollständige ARIA-Labels für den Schließen-Button (`common.close`).
- **Standardisierte Sektions-ID und Koexistenz (#91)**: Sektions-ID auf `archive-manager` mit Ausfallschutz (`try/catch`) umgestellt, um die problemlose Koexistenz mit Drittanbieter-Plugins zu gewährleisten.
- **Aufgeräumte einzeilige Werkzeugleiste**: Verwendet das native `Input`-Element mit offiziellem Suchsymbol und grünem Fokusrahmen. Vereint Suche, Anzeige- und Sortiermenü, Projektfilter und Datumsbereich in einer einzigen Zeile.
- **Volltextsuche und kombiniertes Menü im Codex-Stil**: Automatische Suche in Titeln und Nachrichtenverläufen (Benutzer und Assistent). Menü mit zwei Abschnitten zur Filterung (alle / nur Favoriten) und Sortierung.
- **Leichter DateRange-Selektor mit Kalender-Popover**: Ersetzt das native Datumselement zur Vermeidung von Farbinversionen und Fokusverlust im Dunkelmodus (#74). Einzeilige Kapsel mit Löschtaste, Schnellvoreinstellungen, 8 Sprachen für Wochentage und Monate sowie vollständiger Tastaturnavigation nach WAI-ARIA.
- **Automatische Bereinigung inaktiver Sitzungen**: Schwellenwert in Tagen festlegen, um inaktive Chats zu finden. Laufende Aufgaben, interaktive Prompts und Favoriten werden automatisch geschützt, mit sofortiger Rückgängig-Funktion (Undo).
- **Dauerhafte physische Löschung**: Vollständige physische Entfernung von Protokollen, Cache-Zeilen und Indizes mit detaillierter Fehler- und Wiederholungsfunktion.
- **Erkennung und Bereinigung verwaister Subagents**: Verwaiste Subagents, deren Hauptsitzung extern gelöscht wurde, erkennen, Speicherplatz berechnen und mit einem Klick physisch freigeben.
- **Unternehmensweite Sperre via Cordis-Konfiguration & Reverse-Proxy-Unterstützung**: Vollständiges Deaktivieren der Aktualisierungskomponente in der Cordis-Konfiguration (`updater: false` oder `onlineUpdate: false`) und dynamische Pfadauflösung über `document.baseURI`.

## Manuelle Rekonstruktion des Listen-Caches (#88)

Beim Öffnen des Archive Managers werden lediglich Header und zwischengespeicherte Projektionen normaler Sitzungen in registrierten Arbeitsbereichen, ungruppierten Listen und Archiven geprüft (Sitzungen von IM-Kanälen `im:` sind ausgeschlossen). Eine Reparaturkarte erscheint nur bei fehlenden oder inkompatiblen Caches, um Protokolle einzeln schreibgeschützt zu lesen und offizielle Projektionen mit `coldSnapshot` in `session_projcache` wiederherzustellen.

## Bereinigung verwaister Subagents

Wird eine Hauptsitzung außerhalb gelöscht, können Subagents auf der Festplatte verbleiben. Der Archive Manager erkennt diese im Aufräum-Panel und ermöglicht deren sichere physische Löschung.

## Suche und Vorschau

- Die Reiter „Archiviert“ und „Nicht archiviert“ teilen sich die Suche in Titeln und Inhalten, Projektfilter, Favoriten, Datumsfilter und Sortierung nach Erstellungsdatum.
- Die Vorschau rendert Markdown-Tabellen, Zitate und Codeblöcke mit Rollenbezeichnungen oder wechselt zum Originaltext mit Hervorhebung.
- Die Suche verarbeitet Batches von bis zu 20 Sitzungen nacheinander bei maximal 200 Abfragezeichen, ausgenommen Werkzeuge, Anhänge, Reasoning und Systemnachrichten.

## Installation

Ein funktionierendes DeepSeek Harness-Setup ist erforderlich (Beispiel mit dem Profil `web`):

### Installation durch einen Agenten
Senden Sie diese Anweisung an einen Agenten mit Terminal-Zugriff:

```text
Installiere die neueste Version von @michengai/dsh-archive-manager aus der offiziellen npm-Registry in mein DSH-Web-Profil, überprüfe die Aktivierung und erkläre das Neuladen.
```

### Manuelle Installation

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @michengai/dsh-archive-manager@latest --registry=https://registry.npmjs.org/
```

Starten Sie DSH Web neu und aktualisieren Sie die Seite (`Ctrl+Shift+R`). Öffnen Sie **Einstellungen → Archivierte Sitzungen** zur Verwendung.

- **Host-Kompatibilität**: Vollständige DeepSeek Harness `0.2.x`-Reihe (`>=0.2.0-rc.1 <0.3.0-0`), verifiziert auf allen Release Candidates (`0.2.0-rc.1` bis `0.2.2-rc.1`).
- Versionen vor `0.2.0-rc.1` werden nicht mehr unterstützt. Nutzer von `0.1.x` installieren bitte `1.0.20`.

## Plugin-Konfiguration

Verfügbar unter:
> **Seitenleiste → Plugins → Klick auf `Archive Manager`**

### 1. Position des Eintrags (`entryLocation`)
- **Beide Positionen (`both`)**: Zeigt das Symbol in der linken Seitenleiste an und behält den Menüeintrag unter **Einstellungen → Archivierte Sitzungen**.
- **Nur Seitenleiste (`sidebar`)**: Zeigt das Symbol in der Seitenleiste an und entfernt den Eintrag aus den Einstellungen für eine schlankere Oberfläche.
- **Nur Einstellungen (`settings`)** (Standard): Hält die Seitenleiste minimalistisch und bietet Zugriff unter **Einstellungen → Archivierte Sitzungen**.

### 2. Richtlinie für Online-Aktualisierungen (`onlineUpdate` / `updater`)
- In Firmenumgebungen können Updates direkt in der Cordis-Konfiguration deaktiviert werden:
  ```yaml
  updater: false # oder onlineUpdate: false
  ```
  Dadurch wird die Aktualisierungskomponente beim Serverstart vollständig deaktiviert.

## Bedienungsanleitung

| Aktion | Anleitung |
| --- | --- |
| **Einzelnen Chat archivieren** | Kontextmenü der Sitzung in der Seitenleiste öffnen und **Sitzung archivieren** wählen |
| **Arbeitsbereich archivieren** | Menü des Arbeitsbereichs öffnen und **Sitzung archivieren** wählen |
| **Suchen und filtern** | **Einstellungen → Archivierte Sitzungen** öffnen oder in der Seitenleiste auf **Archiv** klicken |
| **Interaktiver Kalender** | Auf die Datumskapsel klicken, um das Popover mit vollständiger Tastatursteuerung zu öffnen |
| **Schnellvorschau** | Auf einen Treffer oder **Mehr → Schnellvorschau** klicken, um den Kontext ohne Wiederherstellung zu prüfen |
| **Sortierung anpassen** | Nach zuletzt archiviert, Aktualisierungszeit, Erstellungszeit oder Titel sortieren |
| **Chat wiederherstellen** | Auf das Wiederherstellungssymbol der Zeile oder **Mehr → Wiederherstellen und öffnen** klicken |
| **Ganze Gruppe archivieren** | Unter **Nicht archiviert** im Menü **…** der Gruppe alle Sitzungen archivieren |
| **Zu Favoriten hinzufügen** | Auf das Sternsymbol der Zeile klicken, um sie als Favorit zu markieren |
| **Inaktive Chats bereinigen** | Unter **Nicht archiviert** Inaktivitätstage angeben, Vorschau prüfen und archivieren |
| **Sitzungs-ID kopieren** | Im Menü **Mehr** die Option **Sitzungs-ID kopieren** wählen |
| **Verwaiste Subagents bereinigen** | Im Bereinigungsbereich verwaiste Subagents erkennen und physisch löschen |

## Häufig gestellte Fragen (FAQ)

### Warum wird der Eintrag nach der Installation nicht angezeigt?
Starten Sie DSH Web neu und erzwingen Sie ein Neuladen im Browser (`Ctrl+Shift+R`). Stellen Sie sicher, dass das Plugin im aktiven Profil installiert wurde.

### Was ist der Unterschied zwischen Archivieren und Löschen?
Archivieren legt die Unterhaltung ab, damit sie später wiederhergestellt werden kann. **Endgültiges Löschen kann nicht rückgängig gemacht werden** und entfernt alle Daten physisch von der Festplatte.

### Kann es zusammen mit Codex UI verwendet werden?
Ja. [Codex UI](https://github.com/MichengAI/dsh-codex-ui) behält sein Design und seine Seitenleistenfunktionen, und Archive Manager bleibt unter **Einstellungen → Archivierte Sitzungen** verfügbar.

### Koexistenz mit anderen Archiv-Plugins
Das Plugin registriert sich unter der Sektions-ID `archive-manager` und kann problemlos parallel zu anderen Archiv-Plugins betrieben werden.

## Lizenz

Lizenziert unter der [Apache License 2.0](LICENSE).
