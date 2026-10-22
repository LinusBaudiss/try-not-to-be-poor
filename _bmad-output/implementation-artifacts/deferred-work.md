- source_spec: `spec-1-2-anmelden-sitzung-verlaengern-und-beenden.md`
  summary: Anmeldedrosselung und begrenzte parallele Argon2-Prüfung anhand des Produktionslastprofils bewerten (hohe Auswirkung unbestätigt).
  evidence: Die Anmeldung hat keine Admission-/Ratenbegrenzung; jede Anfrage mit gültiger CSRF und Origin führt eine Argon2-Prüfung aus. Eine konkrete Ressourcenüberschreitung wurde nicht nachgewiesen. Zielhost, erwartete Last, parallele HTTP-Lastprüfung und Speicher-/CPU-Messung müssen geeignete Grenzen belegen; vor Produktionsbetrieb entscheiden.
