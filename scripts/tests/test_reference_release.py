from pathlib import Path
import io
import os
import shutil
import subprocess
import tarfile
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
REFERENCE = '607db4ab33cd83bc90949d5b88a9cfd37aeed42b'
TREE = '750ce7764a0e9c997ff9e724f84001d9125b8168'

class ReferenceReleaseTest(unittest.TestCase):
    def fixture(self, folder):
        (folder / 'scripts').mkdir()
        shutil.copy(ROOT / 'scripts/build-reference-release.sh', folder / 'scripts/build-reference-release.sh')
        source = folder / 'source.tar'
        with tarfile.open(source, 'w') as archive:
            for name, text, mode in [
                ('backend/pom.xml', '<project/>', 0o644),
                ('backend/mvnw', '''#!/usr/bin/env bash
set -euo pipefail
[[ " $* " == *" clean package "* ]]
[[ ${REFERENCE_BUILD_FAIL:-0} == 0 ]] || exit 17
ROOT=$(cd -- "$(dirname -- "$0")" && pwd)
mkdir -p "$ROOT/target"
printf fresh-reference > "$ROOT/target/tnbp-0.1.0-SNAPSHOT.jar"
''', 0o755),
            ]:
                data = text.encode(); entry = tarfile.TarInfo(name); entry.mode = mode; entry.size = len(data)
                archive.addfile(entry, io.BytesIO(data))
        binaries = folder / 'bin'; binaries.mkdir()
        git = binaries / 'git'
        git.write_text('''#!/usr/bin/env python3
import os, shutil, sys
if sys.argv[1] == 'rev-parse':
 print("REFERENCE" if sys.argv[-1].endswith('^{commit}') else "TREE")
elif sys.argv[1] == 'archive':
 destination=next(arg.split('=',1)[1] for arg in sys.argv if arg.startswith('--output='))
 shutil.copyfile(os.environ['REFERENCE_SOURCE_TAR'],destination)
else: raise SystemExit(9)
'''.replace('REFERENCE"', REFERENCE+'"').replace('TREE"', TREE+'"'))
        git.chmod(0o755)
        old = folder / '.cache' / ('reference-release-'+REFERENCE) / 'backend/target/tnbp-0.1.0-SNAPSHOT.jar'
        old.parent.mkdir(parents=True); old.write_text('unusable-old-cache')
        environment = os.environ.copy()
        environment.update(PATH=str(binaries)+os.pathsep+environment['PATH'], REFERENCE_SOURCE_TAR=str(source))
        return environment, old

    def test_every_result_is_fresh_even_if_a_previous_cache_was_changed(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary); environment, old = self.fixture(folder)
            paths = []
            for attempt in range(2):
                result = subprocess.run(['bash', str(folder/'scripts/build-reference-release.sh')], env=environment, text=True, capture_output=True)
                self.assertEqual(result.returncode, 0, result.stderr)
                jar = Path(result.stdout.splitlines()[-1]); paths.append(jar)
                self.assertEqual(jar.read_text(), 'fresh-reference')
                jar.write_text('modified-after-build')
            self.assertNotEqual(paths[0], paths[1])
            self.assertEqual(old.read_text(), 'unusable-old-cache')

    def test_failed_clean_build_never_returns_an_existing_cache(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder=Path(temporary); environment, old=self.fixture(folder)
            environment['REFERENCE_BUILD_FAIL']='1'
            result=subprocess.run(['bash',str(folder/'scripts/build-reference-release.sh')],env=environment,text=True,capture_output=True)
            self.assertNotEqual(result.returncode,0)
            self.assertNotIn(str(old),result.stdout)
            self.assertEqual(list((folder/'.cache').glob('reference-release-'+REFERENCE+'-*/backend/target/*.jar')),[])
