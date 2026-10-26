- source_spec: `spec-1-2-anmelden-sitzung-verlaengern-und-beenden.md`
  summary: Anmeldedrosselung und begrenzte parallele Argon2-Prüfung anhand des Produktionslastprofils bewerten (hohe Auswirkung unbestätigt).
  evidence: Die Anmeldung hat keine Admission-/Ratenbegrenzung; jede Anfrage mit gültiger CSRF und Origin führt eine Argon2-Prüfung aus. Eine konkrete Ressourcenüberschreitung wurde nicht nachgewiesen. Zielhost, erwartete Last, parallele HTTP-Lastprüfung und Speicher-/CPU-Messung müssen geeignete Grenzen belegen; vor Produktionsbetrieb entscheiden.

- source_spec: `spec-3-1-eigenen-kontozugang-ueber-api-v2-nutzen.md`
  summary: Vorhandene Generatorausgaben bei Vertragsumbenennungen gegen veraltete Dateien absichern.
  evidence: Bereits der bisherige Java-/Angular-Generator bereinigt seine Zielordner nicht. Nach einer späteren Tag-/Modellumbenennung könnten alte generierte Dienste lokal Imports weiter erfüllen, während ein sauberer CI-Build diese nicht mehr findet. Die aktuelle Story übernimmt keine solchen Umbenennungen; eine Bereinigung muss die unter v1 verschachtelte v2-TypeScript-Ausgabe berücksichtigen.
