import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('api_release_stop_test', ROOT / 'scripts/api-release.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class StopRaceTest(unittest.TestCase):
    def test_verschwundenes_backend_erlaubt_abschluss_in_beiden_stoppwegen(self):
        self.check_stop_paths(backend_gone=True)

    def test_weiter_vorhandenes_backend_verhindert_abschluss_in_beiden_stoppwegen(self):
        self.check_stop_paths(backend_gone=False)

    def test_andere_arbeit_in_abschlussabfrage_verhindert_beide_abschluesse(self):
        self.check_stop_paths(backend_gone=True, other_work=True)

    def test_fehler_der_frischen_abfrage_verhindert_beide_abschluesse(self):
        self.check_stop_paths(backend_gone=True, query_failure=True)

    def check_stop_paths(self, backend_gone, other_work=False, query_failure=False):
        for recovery in (False, True):
            with self.subTest(recovery=recovery), tempfile.TemporaryDirectory() as temporary:
                guard = module.Guard.__new__(module.Guard)
                guard.folder = Path(temporary)
                guard.record_path = guard.folder / 'instance.json'
                guard.database = {'synthetic': 'database'}
                guard.certifying = False
                owner = module.digest(str(guard.folder.resolve()))
                identity = {'pid': 41, 'boot': 'previous-boot'}
                guard.write({'instance': 'synthetic-instance', 'application': 'tnbp-api-synthetic',
                             'process': identity, 'supervisor': identity})
                guard.write({'instance': 'synthetic-instance', 'application': 'tnbp-api-synthetic',
                             'controller': identity, 'database': guard.database, 'owner': owner}, 'lifecycle.json')
                guard.assert_owner = Mock()
                guard.close_admission = Mock()
                guard.assert_closed = Mock()
                guard.lifecycle = Mock()
                guard.previous_boot = Mock(return_value=True)
                session = {'pid': 42, 'application_name': 'tnbp-api-synthetic'}
                remaining = [{'pid': 43, 'application_name': 'tnbp-api-synthetic'}] if other_work else []
                guard.sessions = Mock(side_effect=[[session], remaining if backend_gone else [session]])
                def sql(query):
                    if 'FROM api_version.lifecycle' in query:
                        return json.dumps([{'active': True, 'owner_sha256': owner}])
                    if 'pg_terminate_backend(42,' in query:
                        return 'f'
                    if query == 'SELECT NOT EXISTS(SELECT FROM pg_stat_activity WHERE pid=42)':
                        if query_failure:
                            raise RuntimeError('Synthetischer Verbindungsverlust')
                        return 't' if backend_gone else 'f'
                    self.fail('Unerwartete SQL-Prüfung: ' + query)
                guard.sql = Mock(side_effect=sql)
                if not recovery:
                    guard.recover_lifecycle = Mock(return_value=False)
                action = guard.recover_lifecycle if recovery else guard.stop
                with patch.object(module, 'boot_id', return_value='current-boot'):
                    if backend_gone and not other_work and not query_failure:
                        action()
                        guard.lifecycle.assert_called_once_with(False)
                        guard.assert_closed.assert_called_once()
                        self.assertTrue(guard.read()['stopped'])
                        self.assertEqual(guard.sessions.call_count, 2)
                    else:
                        expected = ('Verbindungsverlust' if query_failure else 'nicht vollständig beendet'
                                    if other_work else 'konnte nicht beendet werden')
                        with self.assertRaisesRegex(RuntimeError, expected):
                            action()
                        guard.lifecycle.assert_not_called()
                        guard.assert_closed.assert_not_called()
                        self.assertFalse(guard.read().get('stopped', False))
