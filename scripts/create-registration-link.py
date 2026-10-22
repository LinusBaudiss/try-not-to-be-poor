#!/usr/bin/env python3
"""Registrierungslink und geschützte externe Konfiguration erzeugen/widerrufen."""
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import os
from pathlib import Path
import secrets
import tempfile
from urllib.parse import urlsplit, urlunsplit


def protected_write(path: Path, value: str) -> None:
    descriptor, temporary = tempfile.mkstemp(prefix=".registration-", dir=path.parent)
    try:
        os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "w", encoding="utf-8") as output:
            output.write(value)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://localhost:4200", help="Öffentliche SPA-Basisadresse ohne Fragment/Abfrage")
    parser.add_argument("--output-dir", type=Path, default=Path(".local"), help="Geschütztes Verzeichnis außerhalb versionierter Dateien")
    parser.add_argument("--expires-at", help="Optionales früheres Ende als ISO-8601 mit Zeitzone")
    parser.add_argument("--revoke", action="store_true", help="Registrierung nach API-Neustart sperren; Konten bleiben erhalten")
    args = parser.parse_args()
    target = args.output_dir
    target.mkdir(mode=0o700, parents=True, exist_ok=True)
    target.chmod(0o700)
    config = target / "registration.env"
    link_file = target / "registration-link.txt"
    if args.revoke:
        protected_write(config, "REGISTRATION_LINK_ENABLED=false\n")
        link_file.unlink(missing_ok=True)
        print(f"Widerruf in {config}. Konfiguration laden und API neu starten; vorhandene Konten bleiben erhalten.")
        return
    address = urlsplit(args.base_url)
    if address.scheme not in ("http", "https") or not address.netloc or address.query or address.fragment or address.username or address.password:
        parser.error("Die Basisadresse muss eine HTTP(S)-Adresse ohne Zugangsdaten, Abfrage oder Fragment sein.")
    issued = datetime.now(timezone.utc).replace(microsecond=0)
    expires = None
    if args.expires_at:
        try:
            expires = datetime.fromisoformat(args.expires_at.replace("Z", "+00:00"))
        except ValueError:
            parser.error("Das Ablaufdatum muss ISO-8601 entsprechen.")
        if expires.tzinfo is None or not issued < expires <= issued + timedelta(days=30):
            parser.error("Das Ablaufdatum muss mit Zeitzone in den kommenden 30 Tagen liegen.")
    token = secrets.token_urlsafe(32)
    digest = hashlib.sha256(token.encode("ascii")).hexdigest()
    url = urlunsplit((address.scheme, address.netloc, address.path.rstrip("/") + "/registrieren", "", "registrationToken=" + token))
    stamp = lambda value: value.isoformat().replace("+00:00", "Z")
    protected_write(config, "\n".join([
        "REGISTRATION_LINK_ENABLED=true",
        "REGISTRATION_LINK_SHA256=" + digest,
        "REGISTRATION_LINK_ISSUED_AT=" + stamp(issued),
        "REGISTRATION_LINK_EXPIRES_AT=" + (stamp(expires) if expires else ""),
        "",
    ]))
    protected_write(link_file, url + "\n")
    print(f"Konfiguration: {config}; Link: {link_file} (je Modus 0600).")
    print("Konfiguration laden und API neu starten. Die Rotation sperrt frühere Links und erhält vorhandene Konten.")


if __name__ == "__main__":
    main()
