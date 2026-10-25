---
title: "PRD-Addendum: Architektur und Übergang"
created: 2026-10-25
updated: 2026-10-25
---

# PRD-Addendum: Architektur und Übergang

Dieses Addendum verweist auf die für das PRD bereits beschlossene technische Ausgestaltung. Maßgeblich ist die [Architecture Spine, aktualisiert am 25.10.2026](../../architecture/architecture-try-not-to-be-poor-2026-10-19/ARCHITECTURE-SPINE.md). Der dort beschriebene Zielzustand ist noch umzusetzen; Detailentscheidungen werden hier nicht neu getroffen.

## Zuständigkeiten und Datenzugriff

AD-1 trennt `access`, `expenses`, `budget`, `savingsgoals` und `monthlysurplus` mit eigenem Datenbesitz und öffentlichen Anwendungsfunktionen. Modulübergreifende Änderungen werden von außen koordiniert; fremde Tabellen und interne Implementierungen werden nicht direkt verwendet. Das ersetzt im Ziel das bisher gemeinsame Ausgaben-/Budgetmodul.

AD-3 und AD-4 erhalten den bestehenden JWT-, Refresh-Cookie- und CSRF-Vertrag sowie flüchtigen Browserzustand. Webzugriffe leiten das Konto aus dem verifizierten Zugang ab. Hintergrundarbeit erhält getrennte, begrenzte Autorisierung. Erzwungene Row-Level Security und unprivilegierte Laufzeitrollen schützen beide Wege; der Job verwendet keine simulierten Nutzerzugänge oder öffentlichen Jobendpunkte.

## Konsistenz der Monatsautomatik

AD-7 bis AD-9 sichern gemeinsame Transaktionen, einheitliche Serialisierung je Konto und dauerhafte Monatsnachweise. Sie bewahren historische Budget-/Zielstände, zuletzt berücksichtigte Überschüsse und durch Ziellöschung verbrauchte Bindungen einschließlich Nullmonaten. Die sichtbare fachliche Größe bleibt ein Gesamtfortschritt; es werden keine separaten manuellen oder automatischen Unterkonten eingeführt.

Die letzte Architekturpräzisierung verlangt keinen Nachhollauf vor Ziellöschung und hält die manuelle Gesamteingabe auch bei wegen Betragsgrenzen blockierter Verarbeitung offen. Klassen, Spalten, Indizes und Batchgrößen gehören in die Folge-Stories. Der Hintergrundlauf muss fair nachholen, Wiederholungen verkraften und Verarbeitung sowie Fehler ohne sensible Protokollinhalte beobachtbar machen.

## Vertragswechsel und Datenmigration

AD-2 und AD-10 beschließen API v2 mit eigenem OpenAPI-Vertrag und generierten Schnittstellen einschließlich Zugang; v1 bleibt bis zur Stilllegung eingefroren. Migrationen erfolgen additiv durch neue Flyway-Dateien und erhalten Bestandsdaten. Bereits initialisierte Datenbankvolumes müssen erforderliche Rollen wiederholbar erhalten.

Der Freigabenachweis umfasst Migration, vollständigen v2-Zugang, Sicherheitsregeln, die kontrollierte Beendigung sämtlicher zugelassener v1-Vorgänge sowie den Aktualisierungspfad alter Oberflächen. Monatsautomatik und vorzeichenbehaftete Fortschritte bleiben bis dahin gesperrt. Nach ersten entsprechenden Datenwirkungen ist nur eine v2-kompatible Korrektur oder geprüfte Wiederherstellung zulässig. Die Produktgrenze steht in PRD §8.4; konkrete Pfade, DTOs und Fehlerantworten sind vor Implementierung ihrer Verbraucher festzulegen.

## Betriebsgrenze

AD-6 sieht einen Einzelhost mit gemeinsamem Java-Artefakt, PostgreSQL und HTTPS-Betrieb vor. Produktionsauslegung, feste Laufzeitversionen, Datensicherung und Wiederherstellungsnachweise bleiben vor Rollout zu konkretisieren. Verschlüsselte Backups außerhalb des VPS und ein getesteter Wiederherstellungsweg sind Voraussetzung. Die offenen Datenlebenszyklus- und Betriebspunkte mit Verantwortlichkeit und Klärungsbedingung stehen in PRD §9; dieses Addendum erteilt keine Betriebsfreigabe.
