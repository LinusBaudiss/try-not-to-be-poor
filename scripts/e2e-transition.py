#!/usr/bin/env python3
"""Administrativer Testtreiber mit flüchtigem PostgreSQL; keine öffentliche Betriebsroute."""
import json
import os
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / '.local/e2e-transition'
RELEASE = ROOT / 'backend/target/tnbp-0.1.0-SNAPSHOT.jar'

def main():
    os.umask(0o077)
    environment = os.environ.copy()
    environment.update(json.loads((FOLDER / 'environment.json').read_text()))
    command = ['python3', str(ROOT / 'scripts/api-release.py')]
    common = ['--release', str(RELEASE), '--state-dir', environment['E2E_GUARD_STATE_DIR']]
    subprocess.run(command + ['retire'] + common, env=environment, check=True)
    with (FOLDER / 'retired-api.log').open('w') as log:
        process = subprocess.Popen(command + ['start'] + common, env=environment, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
    try:
        deadline = time.monotonic() + 60
        while process.poll() is None and time.monotonic() < deadline:
            # Der gemeinsame Guard bestätigt erst Token UND registrierten Listener.
            if 'API über v2 bereit (retired).' in (FOLDER / 'retired-api.log').read_text(): break
            time.sleep(.1)
        else: raise RuntimeError((FOLDER / 'retired-api.log').read_text())
        destination = FOLDER / 'static'
        temporary = FOLDER / 'static.next'
        temporary.unlink(missing_ok=True)
        temporary.symlink_to(ROOT / 'frontend/dist/tnbp/browser', target_is_directory=True)
        temporary.replace(destination)
    except BaseException:
        # Auch fehlgeschlagene Ersatzstarts werden sofort über denselben registrierten Weg beendet.
        subprocess.run(command + ['stop'] + common, env=environment, check=True)
        process.wait(timeout=30)
        raise
    print('Realer API-/SPA-Wechsel abgeschlossen; temporärer Datenbestand erhalten.')

if __name__ == '__main__': main()
