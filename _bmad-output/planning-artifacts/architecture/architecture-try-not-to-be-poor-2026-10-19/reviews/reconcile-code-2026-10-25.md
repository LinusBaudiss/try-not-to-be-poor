# Brownfield-Abgleich mit dem implementierten Bestand

Stand: 2026-10-25. Ziel: `../ARCHITECTURE-SPINE.md` in der Fassung mit AD-1 bis AD-10.

## Urteil

**Keine belegbare ausgelassene Übergangsanforderung, kein Widerspruch zu ausdrücklich fortgeltendem Bestandsverhalten und keine technisch unmögliche Rechte-/Transaktionskonstruktion gefunden.** Die Spine ist aus Sicht dieses Code-Abgleichs für die weitere Implementierungsplanung tragfähig. Es gibt keine P1-/P2-Befunde aus dieser Prüfung.

Geprüft wurde die bestätigte **Zielarchitektur**: fünf Fachmodule, äußere Koordination, eine Java-Anwendung mit gesonderter Jobrolle und gemeinsam gebundenen Transaktionen sowie vollständiges v2 mit Stilllegung von v1 vor neuen signierten Fortschrittswerten oder Monatswirkungen. Dass der Bestand diese Änderungen noch nicht implementiert, ist daher kein Befund. Neue Produktentscheidungen wurden nicht abgeleitet.

## Abgleich und belastbare Evidenz

### 1. Modulschnitt, Datenmigration und historische Budgetstände

Der Bestand besitzt `expense_budget.budgets` mit dem Schlüssel `(user_id, valid_from)` und einer monatsbezogenen Budgethistorie. `BudgetRepository.current` wählt den jüngsten gültigen Stand; `save` überschreibt nur den Eintrag des jeweiligen Wirksamkeitsmonats. Ausgaben besitzen eine unveränderliche ID, einen Eigentümer und ein gespeichertes Kalenderdatum. Beim Bearbeiten werden ausschließlich Name und Betrag geschrieben.

Belege: `backend/src/main/resources/db/migration/V3__budgets.sql:4–18`, `V4__expenses.sql:1–17`, `V5__expense_mutations.sql:1–2`; `backend/src/main/java/de/linus/tnbp/expensebudget/BudgetRepository.java:17–29`, `ExpenseRepository.java:40–61`.

AD-1 trennt die Datenbesitzer ausdrücklich. AD-5 erhält Wirksamkeitsmonate und unveränderliche Ausgabedaten. AD-10 verlangt neue Flyway-Migrationen mit Erhalt von IDs, Eigentümern, Ausgabedaten und historischen Budgetständen; vorhandene Migrationen bleiben unverändert. Ein rückwirkender Einsatz des heutigen Budgets oder eine Umdeutung bisherigen manuellen Fortschritts ist ausgeschlossen. Der bisherige gemeinsame SQL-Snapshot wird durch AD-7 ausdrücklich durch öffentliche Modulzugänge in einer gemeinsamen Snapshot-Transaktion ersetzt.

### 2. Gemeinsame Transaktion, Sperren und Kalender

Die bestehenden Finanzservices verwenden `TransactionTemplate` und liefern erst nach dessen erfolgreicher Rückkehr Erfolg. Ausgabenmutationen serialisieren sich bereits mit `pg_advisory_xact_lock(hashtextextended(?, 14))`; dieser Schlüssel funktioniert auch ohne vorhandene Finanzzeile. Die Monatsübersicht liest Budget und Ausgabensumme derzeit mit einer einzigen SQL-Anweisung aus demselben Snapshot.

Belege: `backend/src/main/java/de/linus/tnbp/expensebudget/ExpenseService.java:28–64`, `ExpenseRepository.java:20–29`, `MonthSummaryRepository.java:19–27`; `backend/src/main/java/de/linus/tnbp/savingsgoals/SavingsGoalService.java:23–51`.

AD-7 erhält den vorhandenen Sperrschlüssel samt Seed 14 und erweitert ihn auf sämtliche Finanzmutationen und den Job. Die gemeinsame physische Verbindung/Transaktion ist ausdrücklich vorgeschrieben; Rollenwechsel, zweite Rollenverbindungen und innere Commits sind ausgeschlossen. READ COMMITTED nach Sperrerwerb sowie ein danach erfasster fachlicher Zeitpunkt vermeiden eine neu eingeführte Monatsgrenzenlücke. Für zusammengesetzte Leseansichten ist read-only REPEATABLE READ festgelegt. Damit sind die bei einer Modultrennung sonst drohenden inkonsistenten Teilabfragen und Teilbestätigungen abgedeckt.

### 3. RLS und gesonderte Jobrolle

Die vorhandenen Finanztabellen erzwingen RLS und vergleichen `user_id` mit transaktionslokalem `app.user_id`. Die Laufzeitrolle besitzt begrenzte Spaltenrechte und ist nicht Tabellenbesitzer. Die Rollenprovisionierung erzeugt Migrator und Runtime ausdrücklich ohne Superuser, BYPASSRLS und CREATEROLE. Die aktuelle Startprüfung prüft die vorhandene Runtime-Verbindung auf privilegierte Rechte und Tabellenbesitz.

Belege: `backend/src/main/resources/db/migration/V3__budgets.sql:10–18`, `V4__expenses.sql:11–17`, `V6__savings_goals.sql:15–22`, `V7__savings_goal_progress.sql:1`, `V8__savings_goal_mutations.sql:1`; `deploy/init-db.sh:3–9`; `backend/src/main/java/de/linus/tnbp/access/DatabaseRoleVerifier.java:17–26`.

AD-4 verlangt ausdrücklich getrennte Web-/Jobverbindungs- und Transaktionskontexte, erzwungene RLS auch für den Worker sowie erneute Aktivierungsprüfung im gesperrten Kontokontext. Die kontoübergreifende Ermittlung ist von Finanzzugriffen getrennt: eine begrenzte Discovery-Funktion mit eigener NOLOGIN-Eigentümerrolle und expliziter RLS-Lesepolicy benötigt weder Tabellenbesitz noch BYPASSRLS. Ein solches Modell ist unter den formulierten Grenzen umsetzbar; es setzt kein simuliertes Nutzer-JWT und keinen Rollenwechsel innerhalb der Fachtransaktion voraus.

**Konkrete Folgepflicht bei der Umsetzung, kein zusätzlicher Architektur-Befund:** Die neuen Rollen müssen vor darauf verweisenden Flyway-Migrationen auch in einer bereits initialisierten Datenbank administrativ bereitgestellt werden. Der vorhandene Migrator besitzt NOCREATEROLE; das Compose-Setup bindet das Rolleninitialisierungsskript an die Datenbank-Erstanlage und behält einen benannten Datenträger. Nur `init-db.sh` zu erweitern wäre deshalb kein vollständiger Upgradepfad. AD-10 Schritt 1 und der Structural Seed „Rollenprovisionierung“ enthalten die hierfür nötige Voraussetzung bereits. Auch die Testfixture und die Startprüfung müssen beide neuen Verbindungskontexte abdecken, wie AD-4 verlangt.

Weitere Belege: `deploy/compose.local.yaml:13–22`, `README.md:94–111`; `backend/src/test/java/de/linus/tnbp/access/PostgresFixture.java:14–33`.

### 4. Versionierung und sichere Freigabereihenfolge

Der einzige bestehende Vertrag hat `/api/v1` als Serverpfad. Anfrage und Antwort für Sparfortschritt enthalten `minimum: 0`. Auch Datenbankconstraint, Backendvalidierung und Frontendberechnung gehen von nichtnegativen Fortschritten aus. Der bestehende Vertragscheck vergleicht `api-contract/openapi.yaml` mit derselben Datei des Basiscommits und kompiliert die tatsächlich verwendeten Java-/TypeScript-Ausgaben.

Belege: `api-contract/openapi.yaml:6–7`, `:556–564`, `:583–600`; `backend/src/main/resources/db/migration/V6__savings_goals.sql:10–12`; `backend/src/main/java/de/linus/tnbp/savingsgoals/SavingsGoalService.java:32–38`; `frontend/src/app/shared/savings-progress.ts:4–18`; `scripts/check-contract.sh:5`, `:30–49`; `scripts/generate-client.sh:4–9`; `backend/pom.xml:27–33`.

AD-2 legt getrennte Verträge, Generatornamensräume und Kompatibilitätsprüfungen je Hauptversion fest und behandelt v2 nicht als kompatible v1-Revision. AD-10 sperrt neue Monatswirkungen und manuelle Negativwerte, solange v1 unterstützt wird. Erst nach Abweisung neuer v1-Zugriffe und Beendigung laufender v1-Mutationen werden die neuen Wirkungen freigegeben; danach ist ein Code-Rückfall auf v1 ausgeschlossen. Die geforderte Übergangsprüfung, dass v1 keine negativen Antworten erhält, schließt die konkrete Brownfield-Inkompatibilität ab.

### 5. Sitzungen, Sicherheit und flüchtige Browserdaten

Der aktuelle Backendschutz zählt die v1-Routen für Bearerzugang, CSRF-Ausnahmen, Origin-Prüfung und `no-store` ausdrücklich auf. Die Refresh-Cookies gelten hostweit, sind HttpOnly/Secure/SameSite=Strict. Das Frontend ruft Login, Refresh, Logout und CSRF ausdrücklich unter v1 auf; der Interceptor erkennt ebenfalls ausschließlich v1. Die Session serialisiert Cookieänderungen über einen originweiten Web Lock und verwirft verspätete Ergebnisse anhand einer Generation. Der Interceptor prüft dieselbe Sitzungsgrenze auch nach einer Antwort.

Belege: `backend/src/main/java/de/linus/tnbp/access/AccessConfiguration.java:44–111`, `SessionHttp.java:8–11`, `SessionService.java:55–92`; `frontend/src/app/session/session.ts:50–81`, `:112–120`, `:125–152`, `:156–171`; `frontend/src/app/session/session.interceptor.ts:6–25`; `frontend/proxy.conf.json:1–7`.

AD-3 erhält die vorhandenen Refreshgrenzen und Sicherheitsanforderungen, die flüchtige Tokenhaltung sowie den Cleanup bei Ablauf/Abmeldung/Kontowechsel. AD-10 Schritt 2 nennt ausdrücklich alle v2-Zugangsrouten, Security-/CSRF-/Origin-Regeln, `no-store`, Proxy und Interceptor; Schritt 3 verlangt einen Aktualisierungspfad für veraltete Frontends. Die Generationenkontrollen und Entwurfsgrenzen werden ebenfalls ausdrücklich fortgeführt. Damit ist weder ein versehentlich nur teilweise auf v2 umgestellter Zugang noch eine neue Persistenz von Finanzdaten durch die Zielarchitektur gedeckt.

## Prüfgrenzen

Dies war ein statischer Architektur-/Code-Abgleich. Es wurden keine Implementierungsänderungen, Migrationen oder Tests ausgeführt. Die bestehende Architekturdatei und die Memlogs wurden nicht geändert. Konkrete v2-DTOs, neue Rollen-DDL, DataSource-Bindungen und ausführbare Architekturchecks sind nach der Spine in den Implementierungsstories festzulegen und durch die bereits vorgeschriebenen echten PostgreSQL-/Browserprüfungen zu belegen; ihre heutige Abwesenheit ist kein Mangel dieser Zielarchitektur.
