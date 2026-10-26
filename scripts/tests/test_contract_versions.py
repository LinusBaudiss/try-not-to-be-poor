"""Prüft die Versionssteuerung des echten Shellskripts in isolierten Git-Repositories.

Diese automatischen Skripttests verwenden Testdoubles für Generator, Builds und
oasdiff. Die Negativproben mit den echten Werkzeugen wurden getrennt manuell
ausgeführt; check-contract.sh führt sie nicht automatisch aus.
"""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "check-contract.sh"
CONTRACTS = ("api-contract/openapi.yaml", "api-contract/v2/openapi.yaml")


class ContractVersionsTest(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="tnbp-contract-test-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        for folder in ("scripts", "backend", "frontend", ".cache/tools", "bin"):
            (self.root / folder).mkdir(parents=True)
        shutil.copyfile(SCRIPT, self.root / "scripts/check-contract.sh")
        self.executable("scripts/generator.sh", "#!/bin/sh\nset -eu\ntest -f \"$3\"\nprintf 'VALIDATE %s\\n' \"$3\"\n")
        self.executable("backend/mvnw", "#!/bin/sh\nprintf 'JAVA %s\\n' \"$*\"\n")
        self.executable("bin/npm", "#!/bin/sh\nprintf 'NPM %s\\n' \"$*\"\n")
        self.executable(".cache/tools/oasdiff-1.30.0", """#!/usr/bin/env python3
import json, pathlib, sys
if sys.argv[1:] == ['--version']:
    print('oasdiff 1.30.0 testdouble')
    sys.exit(0)
assert sys.argv[1] == 'breaking'
assert sys.argv[4:] == ['--fail-on', 'ERR', '--allow-external-refs=false']
before = json.loads(pathlib.Path(sys.argv[2]).read_text())
after = json.loads(pathlib.Path(sys.argv[3]).read_text())
assert before['version'] == after['version'], 'Versionen wurden vermischt'
print('COMPARE ' + before['version'] + ' ' + before['revision'] + ' -> ' + after['revision'])
sys.exit(12 if after.get('incompatible') else 0)
""")
        self.git("init", "--quiet")
        self.git("config", "user.email", "contract-test@example.invalid")
        self.git("config", "user.name", "Contract Test")

    def executable(self, path, source):
        destination = self.root / path
        destination.write_text(source)
        destination.chmod(0o755)

    def git(self, *args):
        return subprocess.run(["git", *args], cwd=self.root, check=True,
                              capture_output=True, text=True).stdout.strip()

    def contract(self, index, revision="basis", incompatible=False):
        path = self.root / CONTRACTS[index]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"version": f"v{index + 1}", "revision": revision,
                                    "incompatible": incompatible}))

    def commit(self):
        self.git("add", ".")
        self.git("commit", "--quiet", "-m", "synthetische Basis")
        return self.git("rev-parse", "HEAD")

    def check(self, base=None):
        environment = os.environ.copy()
        environment["PATH"] = str(self.root / "bin") + os.pathsep + environment["PATH"]
        environment.pop("CONTRACT_BASE_REF", None)
        if base is not None:
            environment["CONTRACT_BASE_REF"] = base
        return subprocess.run(["sh", "scripts/check-contract.sh"], cwd=self.root,
                              env=environment, capture_output=True, text=True)

    def test_jede_version_verwendet_ihre_eigene_explizite_basis(self):
        for index in range(2):
            self.contract(index)
        base = self.commit()
        for index in range(2):
            self.contract(index, "zwischenstand")
        self.commit()
        for index in range(2):
            self.contract(index, "neu")
        result = self.check(base)
        self.assertEqual(result.returncode, 0, result.stderr)
        for version in ("v1", "v2"):
            self.assertIn(f"COMPARE {version} basis -> neu", result.stdout)
        for contract in CONTRACTS:
            self.assertIn("VALIDATE " + contract, result.stdout)
        self.assertIn("JAVA -B -f backend/pom.xml -DskipTests compile", result.stdout)
        self.assertIn("NPM --prefix frontend run generate:api", result.stdout)
        self.assertIn("NPM --prefix frontend run check:contracts", result.stdout)
        self.assertIn("NPM --prefix frontend run build", result.stdout)

    def test_fehlende_v2_basis_ist_ein_eigener_erstvertrag(self):
        self.contract(0)
        self.commit()
        self.contract(1, "erstvertrag")
        result = self.check()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("COMPARE v1 basis -> basis", result.stdout)
        self.assertIn("Erstvertrag", result.stdout)
        self.assertIn(CONTRACTS[1], result.stdout)
        self.assertNotIn("COMPARE v2", result.stdout)

    def test_inkompatible_aenderung_jeder_version_stoppt_vor_builds(self):
        for index in range(2):
            self.contract(index)
        self.commit()
        for broken in range(2):
            with self.subTest(version=broken + 1):
                for index in range(2):
                    self.contract(index, "neu", incompatible=index == broken)
                result = self.check()
                self.assertEqual(result.returncode, 12, result.stderr)
                self.assertIn(f"COMPARE v{broken + 1} basis -> neu", result.stdout)
                self.assertNotIn("JAVA ", result.stdout)
                self.assertNotIn("NPM ", result.stdout)

    def test_erstcommit_und_basis_ohne_vertraege(self):
        self.commit()
        for index in range(2):
            self.contract(index)
        for base in (None, "0" * 40):
            with self.subTest(base=base):
                result = self.check(base)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertNotIn("COMPARE", result.stdout)
                self.assertIn("NPM --prefix frontend run check:contracts", result.stdout)

    def test_ungueltige_basis_wird_nicht_als_erstvertrag_verschluckt(self):
        for index in range(2):
            self.contract(index)
        self.commit()
        result = self.check("ungueltige-basis")
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("JAVA ", result.stdout)


if __name__ == "__main__":
    unittest.main()
