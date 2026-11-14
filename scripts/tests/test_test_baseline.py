import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('test_baseline', Path(__file__).parents[1] / 'test-baseline.py')
baseline = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(baseline)


def run(kind='measurement', seconds=100, status='passed'):
    return {'kind': kind, 'seconds': seconds, 'status': status,
            'groups': [{'name': name, 'seconds': seconds / 6, 'exit_code': 0} for name, _ in baseline.GROUPS]}


class BaselineTest(unittest.TestCase):
    def test_output_inside_cleaned_directory_is_rejected_before_writing(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(baseline, 'ROOT', Path(tmp)):
            output = Path(tmp, 'backend/target/evidence')
            with self.assertRaisesRegex(ValueError, 'disposable build outputs'):
                baseline.main(['--output', str(output), '--cache-note', 'test'])
            self.assertFalse(output.exists())

    def test_backend_reports_are_cleared_without_removing_compiled_classes(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(baseline, 'ROOT', Path(tmp)):
            target = Path(tmp, 'backend/target')
            for directory in ('surefire-reports', 'failsafe-reports', 'classes'):
                path = target / directory
                path.mkdir(parents=True)
                (path / 'previous').write_text('stale')
            baseline.clear_backend_reports()
            self.assertFalse((target / 'surefire-reports').exists())
            self.assertFalse((target / 'failsafe-reports').exists())
            self.assertTrue((target / 'classes/previous').exists())

    def test_median_excludes_failed_warmup_and_clean(self):
        result = baseline.summarize([run(seconds=90), run(seconds=100), run(seconds=200),
                                     run(seconds=1, status='failed'), run('warmup', 1000), run('clean', 2000)])
        self.assertEqual(result['median_seconds'], 100)
        self.assertEqual(result['target_seconds_70_percent'], 70)
        self.assertTrue(result['local_evidence_complete'])

    def test_missing_group_nonzero_or_reordered_groups_are_not_complete(self):
        missing = run()
        missing['groups'].pop()
        nonzero = run()
        nonzero['groups'][0]['exit_code'] = 1
        reordered = run()
        reordered['groups'].reverse()
        result = baseline.summarize([missing, nonzero, reordered])
        self.assertIsNone(result['median_seconds'])
        self.assertFalse(result['local_evidence_complete'])

    def test_clean_and_warmup_and_three_samples_required(self):
        self.assertFalse(baseline.summarize([run()] * 3)['local_evidence_complete'])
        self.assertFalse(baseline.summarize([run(), run('clean'), run('warmup')])['local_evidence_complete'])
        self.assertIsNone(baseline.summarize([run()])['median_seconds'])
        self.assertIsNone(baseline.summarize([run(), run()])['target_seconds_70_percent'])

    def test_duplicate_execution_is_not_a_new_case(self):
        with tempfile.TemporaryDirectory() as tmp:
            Path(tmp, 'TEST-a.xml').write_text('<testsuite><testcase classname="A" name="case[1]"/><testcase classname="A" name="case[2]"/></testsuite>')
            Path(tmp, 'TEST-b.xml').write_text('<testsuite><testcase classname="A" name="case[1]"/></testsuite>')
            self.assertEqual(baseline.report_counts(tmp), {'executions': 3, 'distinct_execution_ids': 2, 'duplicate_executions': 1})

    def test_preflight_records_missing_tools(self):
        with patch.object(baseline.shutil, 'which', return_value=None):
            errors, _ = baseline.preflight()
        self.assertIn('missing tool: java', errors)
        self.assertIn('missing tool: unzip', errors)

    def test_preflight_failure_writes_evidence_without_running_groups(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp, 'evidence')
            with patch.object(baseline, 'preflight', return_value=(['port 8080 unavailable'], {})), \
                 patch.object(baseline, 'revision', return_value={}), \
                 patch.object(baseline, 'capture', return_value=''), \
                 patch.object(baseline.subprocess, 'check_output', return_value=b''):
                self.assertEqual(baseline.main(['--output', str(output), '--cache-note', 'test']), 2)
            self.assertIn('port 8080 unavailable', (output / 'results.json').read_text())

    def test_fewer_than_three_measurements_rejected(self):
        with self.assertRaises(SystemExit):
            baseline.main(['--output', '/unused', '--cache-note', 'test', '--measurements', '2'])

    def test_existing_output_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileExistsError):
                baseline.main(['--output', tmp, '--cache-note', 'test'])

    def test_incomplete_warmup_does_not_make_evidence_complete(self):
        warmup = run('warmup')
        warmup['groups'].pop()
        self.assertFalse(baseline.summarize([run(), run(), run(), warmup, run('clean')])['local_evidence_complete'])

    def test_group_failure_stops_and_preserves_failed_log(self):
        import json
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp, 'evidence')
            with patch.object(baseline, 'preflight', return_value=([], {})), \
                 patch.object(baseline, 'revision', return_value={}), \
                 patch.object(baseline, 'capture', return_value=''), \
                 patch.object(baseline.subprocess, 'check_output', return_value=b''), \
                 patch.object(baseline, 'execute_group', return_value=7) as execute:
                self.assertEqual(baseline.main(['--output', str(output), '--cache-note', 'test']), 1)
            data = json.loads((output / 'results.json').read_text())
            self.assertEqual(data['status'], 'failed')
            self.assertEqual(data['runs'][0]['groups'][0]['exit_code'], 7)
            self.assertEqual(execute.call_count, 1)
            self.assertIsNone(data['summary']['median_seconds'])
            self.assertTrue((output / data['runs'][0]['groups'][0]['log']).exists())

    def test_success_executes_all_six_groups_for_all_five_runs(self):
        import json
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp, 'evidence')
            with patch.object(baseline, 'ROOT', Path(tmp)), \
                 patch.object(baseline, 'preflight', return_value=([], {})), \
                 patch.object(baseline, 'revision', return_value={}), \
                 patch.object(baseline, 'capture', return_value=''), \
                 patch.object(baseline.subprocess, 'check_output', return_value=b''), \
                 patch.object(baseline, 'execute_group', return_value=0) as execute:
                self.assertEqual(baseline.main(['--output', str(output), '--cache-note', 'test']), 0)
            data = json.loads((output / 'results.json').read_text())
            self.assertEqual(execute.call_count, 30)
            self.assertEqual([r['kind'] for r in data['runs']], ['warmup', 'measurement', 'measurement', 'measurement', 'clean'])
            self.assertTrue(data['summary']['local_evidence_complete'])
            self.assertEqual(data['status'], 'passed')

    def test_phase_records_exit_code_and_inclusive_time(self):
        import json
        import os
        import subprocess
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp, 'phase.jsonl')
            with patch.dict(os.environ, {'TEST_BASELINE_PHASE_LOG': str(path)}), \
                 patch.object(baseline.subprocess, 'run', return_value=subprocess.CompletedProcess(['false'], 3)):
                self.assertEqual(baseline.measured_phase(['setup', 'false']), 3)
            event = json.loads(path.read_text())
            self.assertEqual(event['name'], 'setup')
            self.assertEqual(event['exit_code'], 3)
            self.assertGreaterEqual(event['seconds'], 0)
