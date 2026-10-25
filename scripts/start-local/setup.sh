#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$PROJECT_ROOT"

# Bestehende Konfiguration behalten; neue Geheimnisse ausschließlich geschützt schreiben.
python3 - <<'PY'
from pathlib import Path
import base64
import fcntl
import os
import secrets
import subprocess
import tempfile

folder = Path('.local')
folder.mkdir(mode=0o700, exist_ok=True)
folder.chmod(0o700)

# Auch die beiden Dateien des Registrierungslinks gehören zu einem Setup-Lauf.
lock = os.open(folder / 'setup.lock', os.O_RDWR | os.O_CREAT, 0o600)
fcntl.flock(lock, fcntl.LOCK_EX)

def create(name, content):
    destination = folder / name
    if destination.exists():
        return
    descriptor, temporary = tempfile.mkstemp(prefix='.setup-', dir=folder)
    try:
        with os.fdopen(descriptor, 'w') as output:
            output.write(content())
        # Erst vollständig geschrieben veröffentlichen, ohne eine vorhandene Datei zu ersetzen.
        try:
            os.link(temporary, destination)
        except FileExistsError:
            pass
    finally:
        os.unlink(temporary)

create('database.env', lambda: ''.join(
    name + '=' + secrets.token_urlsafe(32) + '\n'
    for name in ('DB_ADMIN_PASSWORD', 'DB_MIGRATION_PASSWORD', 'DB_RUNTIME_PASSWORD')
))
create('session.env', lambda: (
    'SESSION_SIGNING_KEY=' + base64.b64encode(secrets.token_bytes(32)).decode() + '\n'
    'SESSION_ISSUER=tnbp-local\nSESSION_AUDIENCE=tnbp-spa-local\n'
    'SESSION_ORIGIN=https://localhost:4200\n'
))

registration = folder / 'registration.env'
if not registration.exists():
    subprocess.run(['python3', 'scripts/create-registration-link.py',
                    '--base-url', 'https://localhost:4200'], check=True)
if ('REGISTRATION_LINK_ENABLED=true' in registration.read_text().splitlines()
        and not (folder / 'registration-link.txt').is_file()):
    raise SystemExit('Aktive Registrierung, aber .local/registration-link.txt fehlt. '
                     'Link bewusst neu erzeugen: python3 scripts/create-registration-link.py '
                     '--base-url https://localhost:4200; danach die API neu starten.')
PY

printf '%s\n' 'Lokale Konfiguration unter .local/ vorbereitet; bestehende Dateien bleiben erhalten.'
