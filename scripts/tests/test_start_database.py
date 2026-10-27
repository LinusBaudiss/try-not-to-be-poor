import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


class StartDatabaseTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        script_dir = self.root / "scripts/start-local"
        script_dir.mkdir(parents=True)
        source = Path(__file__).resolve().parents[1] / "start-local/start-database.sh"
        self.script = script_dir / "start-database.sh"
        shutil.copyfile(source, self.script)
        (self.root / ".local").mkdir()
        (self.root / ".local/database.env").write_text("# synthetic test configuration\n")
        tools = self.root / "bin"
        tools.mkdir()
        docker = tools / "docker"
        docker.write_text(f"#!{sys.executable}\n" + '''import json, os, sys
args = sys.argv[1:]
with open(os.environ['TNBP_TEST_DOCKER_LOG'], 'a') as stream:
    stream.write(json.dumps(args) + '\\n')
if args == ['compose', 'version']:
    sys.exit(0)
if args == ['compose', 'up', '--help']:
    print('  --wait Wait for services')
    sys.exit(0)
if 'up' in args:
    sys.exit(int(os.environ.get('TNBP_TEST_START_EXIT', '0')))
if 'exec' in args:
    sys.exit(int(os.environ.get('TNBP_TEST_GRANTS_EXIT', '0')))
sys.exit(99)
''')
        docker.chmod(0o700)
        self.log = self.root / "docker.jsonl"
        self.env = dict(os.environ, PATH=str(tools) + os.pathsep + os.environ["PATH"], TNBP_TEST_DOCKER_LOG=str(self.log))

    def run_script(self):
        return subprocess.run(["bash", str(self.script)], env=self.env, capture_output=True, text=True)

    def operations(self):
        return [args for args in map(json.loads, self.log.read_text().splitlines()) if "--env-file" in args]

    def test_jeder_start_gleicht_nach_bereitschaft_die_rechte_administrativ_ab(self):
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        prefix = ["compose", "--env-file", ".local/database.env", "-f", "deploy/compose.local.yaml"]
        self.assertEqual(self.operations(), [
            prefix + ["up", "-d", "--wait"],
            prefix + ["exec", "-T", "postgres", "psql", "--set", "ON_ERROR_STOP=1", "--username", "tnbp_admin",
                      "--dbname", "tnbp", "--file", "/opt/tnbp/provision-finance-grants.sql"],
        ])

    def test_fehlgeschlagener_datenbankstart_fuehrt_keinen_rechteabgleich_aus(self):
        self.env["TNBP_TEST_START_EXIT"] = "23"
        self.assertEqual(self.run_script().returncode, 23)
        self.assertEqual(len(self.operations()), 1)
        self.assertIn("up", self.operations()[0])

    def test_fehlgeschlagener_rechteabgleich_verhindert_den_erfolgreichen_start(self):
        self.env["TNBP_TEST_GRANTS_EXIT"] = "29"
        self.assertEqual(self.run_script().returncode, 29)
        self.assertEqual(len(self.operations()), 2)


if __name__ == "__main__":
    unittest.main()
