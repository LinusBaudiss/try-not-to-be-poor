# Historisches Nachweisarchiv für Story 5.1

Alle **484 ursprünglich versionierten Baseline-Dateien** des Stands `cc9e34acb513c7a06eb9c677f6fda9e9c74277c6` bleiben unverändert im [GitHub-Nachweis-Prerelease](https://github.com/LinusBaudiss/try-not-to-be-poor/releases/tag/evidence/story-5.1-cc9e34a) erhalten. Dies ist keine Produktionsfreigabe und keine zusätzliche Story-Abnahme.

Das Archiv enthält Rohlogs, Patches, fehlgeschlagene Versuche, Discoverydaten, die vollständigen lokalen Serien, originale XML-/Exec-/JaCoCo-Webberichte sowie die damaligen Inventare und Auswertungen. Unkomprimiert: 50.647.390 Bytes; gzip: 3.968.438 Bytes. Die lokale Archivprüfung und der erneute vollständige GitHub-Download am 14.11.2026 bestätigten alle 484 Pfade, Größen und SHA-256-Werte. Dateimodi sind im Manifest und Tar enthalten.

| Release-Datei | SHA-256 |
| --- | --- |
| `story-5.1-evidence-cc9e34a.tar.gz` | `f5c5a0806b0f2b45811777d840880ed5b39785814dfc593a2799d35b5443dfd4` |
| `files.sha256.json` | `c5412d802bee763ec14d20e7e63752ac74d19943da7505a2d93f80af4f8dba25` |

[archive-files.sha256.json](archive-files.sha256.json) ist die bytegleiche lokale Kopie des originalen Dateimanifests mit Pfad, Größe, Modus und Hash. [archive-SHA256SUMS](archive-SHA256SUMS) ist die bytegleiche Kopie der Release-Prüfsummen; die dort genannten **Originalnamen** gelten im Downloadverzeichnis.

## Download und getrennte Wiederherstellung

Für das private Repository ist authentifizierter GitHub-Zugang erforderlich. Im Repository ausführen; `gh release download` lädt die drei veröffentlichten Assets. Ein frisches temporäres Verzeichnis verhindert die Vermischung mit dem Checkout oder neuen Messungen.

```sh
(
set -e
archive_checksums="$PWD/_bmad-output/implementation-artifacts/test-baseline/archive-SHA256SUMS"
archive_dir=$(mktemp -d "${TMPDIR:-/tmp}/tnbp-story-5.1-XXXXXXXX")
gh release view evidence/story-5.1-cc9e34a --repo LinusBaudiss/try-not-to-be-poor
gh release download evidence/story-5.1-cc9e34a \
  --repo LinusBaudiss/try-not-to-be-poor --dir "$archive_dir" \
  --pattern story-5.1-evidence-cc9e34a.tar.gz \
  --pattern files.sha256.json --pattern SHA256SUMS
(cd "$archive_dir" && sha256sum --check SHA256SUMS)
# Gegen die unabhängig im Checkout bewahrten Prüfsummen vergleichen:
(cd "$archive_dir" && sha256sum --check \
  "$archive_checksums")
python3 - "$archive_dir" <<'PY'
import hashlib
import json
from pathlib import Path
import sys
import tarfile

base = Path(sys.argv[1])
manifest = json.loads((base / 'files.sha256.json').read_text())
entries = {entry['path']: entry for entry in manifest['files']}
assert len(entries) == len(manifest['files']) == 484
with tarfile.open(base / 'story-5.1-evidence-cc9e34a.tar.gz') as archive:
    members = archive.getmembers()
    # Nur die 484 bekannten Dateien plus eingebettetes Manifest zulassen;
    # absolute Pfade, Traversal, Links und doppelte Namen ablehnen.
    assert len({member.name for member in members}) == len(members)
    assert {member.name for member in members} == set(entries) | {'files.sha256.json'}
    for member in members:
        assert member.isfile()
        assert not Path(member.name).is_absolute() and '..' not in Path(member.name).parts
        data = archive.extractfile(member).read()
        if member.name == 'files.sha256.json':
            assert data == (base / 'files.sha256.json').read_bytes()
        else:
            entry = entries[member.name]
            assert len(data) == entry['size']
            assert hashlib.sha256(data).hexdigest() == entry['sha256']
            assert member.mode == int(entry['mode'], 8)
    destination = base / 'restored'
    destination.mkdir(exist_ok=False)
    archive.extractall(destination, filter='data')
print(f'484 Originaldateien geprüft; wiederhergestellt unter {destination}')
PY
)
```

Der alte Pfadaufbau bleibt unter `restored/_bmad-output/implementation-artifacts/test-baseline/` erhalten, beispielsweise `local-reference-02/tracked-input.patch`, `local-reference-02/01-measurement-failsafe-reports/`, `coverage-reference-630ad58/jacoco/index.html`, `attempt-*` und `recheck-*`. Relative Verweise der historischen Dokumente sind dort im damaligen Zusammenhang lesbar. Die Archivprüfung benötigt Python ≥ 3.12 für den expliziten sicheren Tar-Filter. Beim Entpacken können sichere Standardrechte enger als der ursprüngliche Modus gesetzt werden; der Originalmodus bleibt dokumentiert.

## Bewusst im Branch behalten

Lesbare Matrizen, Auswertungen und Generierungswerkzeuge bleiben direkt prüfbar: `source-matrix.csv`, `canonical-scenarios.csv`, `reviewed-scenario-manifest.json`, `semantic-summary.json`, CI-/Kostenableitungen und die Markdownberichte. Für die reproduzierbare Inventarprüfung bleiben `discovery/backend.tsv`, `browser.json`, `transition.json` und `automation.json` erhalten. Coverage behält `README.md`, `evidence.json` und `discovery-and-instrumented-costs.json`; die erfolgreiche Referenzserie behält `results.json`, `analysis.json` und `input-sha256.json`.

Die redundanten `source-inventory.json` und `observation-ledger.json` können mit `refresh-source-inventory.py`, die rohe `browser-loop-evidence.json` mit `extract-browser-loops.cjs` erneut erzeugt werden und sind ignoriert. Der geprüfte semantische Stand bleibt im Manifest; automatische Generierung ersetzt keine fachliche Zuordnung. Neue Messläufe gehören in einen freien, ignorierten Pfad unter `.local/test-baseline/`, wie in der Repository-README gezeigt. Historische Laufzeitwerte, Fachnenner und Zielvorgaben ändern sich durch diese Auslagerung nicht.
