- source_spec: `spec-1-2-anmelden-sitzung-verlaengern-und-beenden.md`
  summary: Anmeldedrosselung und begrenzte parallele Argon2-Prüfung anhand des Produktionslastprofils bewerten (hohe Auswirkung unbestätigt).
  evidence: Die Anmeldung hat keine Admission-/Ratenbegrenzung; jede Anfrage mit gültiger CSRF und Origin führt eine Argon2-Prüfung aus. Eine konkrete Ressourcenüberschreitung wurde nicht nachgewiesen. Zielhost, erwartete Last, parallele HTTP-Lastprüfung und Speicher-/CPU-Messung müssen geeignete Grenzen belegen; vor Produktionsbetrieb entscheiden.

- source_spec: `spec-3-1-eigenen-kontozugang-ueber-api-v2-nutzen.md`
  summary: Vorhandene Generatorausgaben bei Vertragsumbenennungen gegen veraltete Dateien absichern.
  evidence: Bereits der bisherige Java-/Angular-Generator bereinigt seine Zielordner nicht. Nach einer späteren Tag-/Modellumbenennung könnten alte generierte Dienste lokal Imports weiter erfüllen, während ein sauberer CI-Build diese nicht mehr findet. Die aktuelle Story übernimmt keine solchen Umbenennungen; eine Bereinigung muss die unter v1 verschachtelte v2-TypeScript-Ausgabe berücksichtigen.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-browserzugang-v2-und-rotes-abmelden.md`
  summary: Vorbestehende automatische Widerrufe nach Ablauf, Refreshfehler oder Loginabbruch müssen fehlgeschlagene Serverwiderrufe sichtbar und ausdrücklich wiederholbar machen.
  evidence: Review Blind 3; bereits der Basisstand verwirft in Session.end und Session.cancelLogin das boolesche Ergebnis von revoke. Bei HTTP-Fehler kann das Refresh-Cookie erhalten bleiben. Die explizite Abmeldung dieser Story verfolgt ihren Abschluss; automatische Aufrufer benötigen einen eigenen nachgewiesenen Fehler-/Retry-Ablauf.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-browserzugang-v2-und-rotes-abmelden.md`
  summary: Eingangsfokus nach Sitzungsende und tatsächliche Screenreader-Ankündigung der Anmeldung manuell prüfen und bei Bedarf nachführen.
  evidence: Review Blind 5; bereits die v1-Abmeldung entfernt die fokussierte Aktion und navigiert ohne ausdrücklich gesetzten Eingangsfokus. Programmatische Rollen, Status und Tastaturwege sind geprüft; die gesprochene Ausgabe und deren zeitliche Ankündigung benötigen einen eigenständigen Screenreader-Test.
