# Drittanbieterbestandteile

## Lokale Passwortsperrliste

`backend/src/main/resources/access/password-blocklist.txt` enthält unverändert die
100.000 Zeilen aus SecLists `Passwords/Common-Credentials/xato-net-10-million-passwords-100000.txt`.

- Quelle: https://github.com/danielmiessler/SecLists/blob/dc92be047e52575f08fcc0a1056967d3f435f579/Passwords/Common-Credentials/xato-net-10-million-passwords-100000.txt
- Version: Commit `dc92be047e52575f08fcc0a1056967d3f435f579`, abgerufen am 22.10.2026.
- SHA-256: `1472aafa2561df5e3293aee252aee3ca660c12b399a283cf808bb01b39be388b`.
- Verarbeitung: ausschließlich lokal; zum Vergleich NFC und Kleinschreibung. Die Datei bleibt unverändert, einschließlich kurzer Einträge, die bereits an der Längenprüfung scheitern.
- Lizenz: MIT; ursprünglicher Lizenztext folgt.

`backend/src/main/resources/access/password-blocklist-supplement.txt` ergänzt
10.828 passende, bisher nicht enthaltene Einträge aus derselben SecLists-Version:

- Quelle: https://github.com/danielmiessler/SecLists/blob/dc92be047e52575f08fcc0a1056967d3f435f579/Passwords/Common-Credentials/xato-net-10-million-passwords-1000000.txt
- Upstream-Datei: 1.000.000 Zeilen, SHA-256 `424a3e03a17df0a2bc2b3ca749d81b04e79d59cb7aeec8876a5a3f308d0caf51`.
- Auswahl: Reihenfolge und Schreibweise aus Upstream erhalten; nach NFC 15–64 Codepunkte,
  keine Unicode-Kategorien `Cc/Cf/Cs/Cn/Co/Zl/Zp`. Nach NFC/Kleinschreibung bereits
  vorhandene Einträge und Duplikate auslassen. Die unveränderte Top100k-Datei bleibt erhalten.
- Zusatzdatei SHA-256: `545432ce6c749096918522e2ce23f45fd1a4f793c117787cffc4b6ea5d75a727`.
- Enthält insbesondere `123456789012345` aus Upstream-Rang 245.085.
- Abgerufen am 22.10.2026; dieselbe MIT-Lizenz gilt für beide Dateien.

```text
MIT License

Copyright (c) 2018 Daniel Miessler

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Weitere Build-Abhängigkeiten und ihre Lizenzen sind über `backend/pom.xml` und
`frontend/package-lock.json` nachvollziehbar. Generierter Client und Interfaces
werden aus dem eigenen Vertrag erzeugt und nicht manuell gepflegt.
