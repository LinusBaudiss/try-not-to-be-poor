import importlib.util
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('api_release_certificate_test', ROOT / 'scripts/api-release.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class CertificateDurabilityTest(unittest.TestCase):
    def test_both_revocations_sync_the_directory_before_any_further_work(self):
        for phase in ('begin', 'failure'):
            with self.subTest(phase=phase), tempfile.TemporaryDirectory() as temporary:
                folder = Path(temporary)
                guard = module.Guard.__new__(module.Guard)
                guard.folder = folder
                guard.database = None
                guard.args = SimpleNamespace(release='synthetic.jar', check_port=0)
                guard.write({'stale': True}, 'rollback.json')
                events = []
                real_sync = guard.sync_directory
                def synced():
                    real_sync()
                    events.append((folder / 'rollback.json').exists())
                guard.sync_directory = synced
                guard.artifact = Mock(return_value=folder / 'synthetic.jar')
                guard.snapshot = Mock(return_value={'schema': 'a'*64, 'roles': 'b'*64})
                guard.no_process = Mock()
                guard.confirm = Mock()
                guard.close_admission = Mock(side_effect=lambda: self.assertFalse(events[-1]))
                if phase == 'begin':
                    def state():
                        self.assertEqual(events, [False])
                        raise RuntimeError('stop after durable beginning')
                    guard.state = state
                else:
                    guard.state = Mock(return_value={'signed_progress_used': False, 'monthly_effects_used': False})
                failed = [False]
                def lifecycle(active):
                    if active is False and not failed[0]:
                        failed[0] = True
                        self.assertTrue((folder / 'rollback.json').exists())
                        raise RuntimeError('stop after certificate write')
                guard.lifecycle = lifecycle
                (folder / 'scripts').mkdir()
                (folder / 'scripts/check-rollback-release.py').write_text('def run_check(*args): pass\n')
                with patch.dict(module.Guard.certify.__globals__, ROOT=folder), patch.object(module, 'release_hash', return_value='c'*64):
                    with self.assertRaisesRegex(RuntimeError, 'stop after'):
                        guard.certify()
                self.assertFalse((folder / 'rollback.json').exists())
                self.assertEqual(events, [False] if phase == 'begin' else [False, True, False])
