"""Subprozessprüfungen des dokumentierten Linkwerkzeugs ohne dauerhafte Geheimnisse."""
import base64
from datetime import datetime, timedelta, timezone
import hashlib
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import unittest
from urllib.parse import parse_qs, urlsplit


SCRIPT = Path(__file__).resolve().parents[1] / "create-registration-link.py"


class RegistrationLinkTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="tnbp-link-test-")
        self.addCleanup(self.temporary.cleanup)
        self.folder = Path(self.temporary.name) / "geschuetzt"

    def run_generator(self, *args):
        return subprocess.run(
            [sys.executable, str(SCRIPT), "--output-dir", str(self.folder), *args],
            capture_output=True, text=True, check=False,
        )

    def config(self):
        return dict(line.split("=", 1) for line in (self.folder / "registration.env").read_text().splitlines())

    def link(self):
        return (self.folder / "registration-link.txt").read_text().strip()

    def test_fragment_hash_und_dateirechte(self):
        result = self.run_generator("--base-url", "https://example.invalid/privat")
        self.assertEqual(result.returncode, 0, result.stderr)
        url = urlsplit(self.link())
        self.assertEqual(url.path, "/privat/registrieren")
        self.assertEqual(url.query, "")
        token = parse_qs(url.fragment)["registrationToken"][0]
        self.assertRegex(token, r"^[A-Za-z0-9_-]{43}$")
        self.assertEqual(len(base64.urlsafe_b64decode(token + "=")), 32)
        self.assertEqual(self.config()["REGISTRATION_LINK_SHA256"], hashlib.sha256(token.encode("ascii")).hexdigest())
        self.assertEqual(self.config()["REGISTRATION_LINK_ENABLED"], "true")
        self.assertEqual(stat.S_IMODE(self.folder.stat().st_mode), 0o700)
        for name in ["registration.env", "registration-link.txt"]:
            self.assertEqual(stat.S_IMODE((self.folder / name).stat().st_mode), 0o600)
        self.assertNotIn(token, result.stdout + result.stderr)

    def test_rotation_ersetzt_geheimnis_und_hash(self):
        self.assertEqual(self.run_generator().returncode, 0)
        original_link, original_hash = self.link(), self.config()["REGISTRATION_LINK_SHA256"]
        self.assertEqual(self.run_generator().returncode, 0)
        self.assertNotEqual(self.link(), original_link)
        self.assertNotEqual(self.config()["REGISTRATION_LINK_SHA256"], original_hash)

    def test_widerruf_deaktiviert_und_entfernt_link(self):
        self.assertEqual(self.run_generator().returncode, 0)
        self.assertEqual(self.run_generator("--revoke").returncode, 0)
        self.assertEqual(self.config(), {"REGISTRATION_LINK_ENABLED": "false"})
        self.assertFalse((self.folder / "registration-link.txt").exists())

    def test_frueherer_ablauf_und_ungueltige_konfiguration(self):
        tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).replace(microsecond=0).isoformat()
        self.assertEqual(self.run_generator("--expires-at", tomorrow).returncode, 0)
        self.assertEqual(self.config()["REGISTRATION_LINK_EXPIRES_AT"], tomorrow.replace("+00:00", "Z"))
        for args in [
            ["--expires-at", "2020-01-01T00:00:00Z"],
            ["--expires-at", (datetime.now(timezone.utc) + timedelta(days=31)).isoformat()],
            ["--base-url", "https://example.invalid?abfrage=unerlaubt"],
        ]:
            with self.subTest(args=args):
                self.assertEqual(self.run_generator(*args).returncode, 2)


if __name__ == "__main__":
    unittest.main()
