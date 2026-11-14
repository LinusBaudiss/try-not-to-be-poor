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
        self.assertEqual(result['target_seconds'], 900)
        self.assertTrue(result['target_met'])
        for seconds, expected in [(900, True), (900.001, False)]:
            measured = baseline.summarize([run(seconds=seconds) for _ in range(3)] + [run('warmup'), run('clean')])
            self.assertEqual(measured['target_seconds'], 900)
            self.assertEqual(measured['target_met'], expected)
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
        self.assertIsNone(baseline.summarize([run(), run()])['target_met'])
        self.assertEqual(baseline.summarize([run(), run()])['target_seconds'], 900)

    def test_duplicate_execution_is_not_a_new_case(self):
        with tempfile.TemporaryDirectory() as tmp:
            Path(tmp, 'TEST-a.xml').write_text('<testsuite><testcase classname="A" name="case[1]"/><testcase classname="A" name="case[2]"/></testsuite>')
            Path(tmp, 'TEST-b.xml').write_text('<testsuite><testcase classname="A" name="case[1]"/></testsuite>')
            counts = baseline.report_counts(tmp)
            self.assertEqual([counts[key] for key in ('executions', 'distinct_execution_ids', 'duplicate_executions')], [3, 2, 1])
            self.assertEqual(counts['errors'], [])

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
                 patch.dict(baseline.os.environ, {'TEST_BASELINE_PHASE_LOG': '/outside/previous-phases.jsonl'}), \
                 patch.object(baseline, 'preflight', return_value=([], {})), \
                 patch.object(baseline, 'revision', return_value={}), \
                 patch.object(baseline, 'capture', return_value=''), \
                 patch.object(baseline.subprocess, 'check_output', return_value=b''), \
                 patch.object(baseline, 'validate_backend_reports', return_value=[]), \
                 patch.object(baseline, 'prepare_browser_discovery', return_value=(None, [])), \
                 patch.object(baseline, 'execute_group', return_value=0) as execute:
                self.assertEqual(baseline.main(['--output', str(output), '--cache-note', 'test']), 0)
            data = json.loads((output / 'results.json').read_text())
            self.assertEqual(execute.call_count, 30)
            for index, call in enumerate(execute.call_args_list):
                group = baseline.GROUPS[index % len(baseline.GROUPS)][0]
                self.assertEqual('TEST_BASELINE_PHASE_LOG' in call.args[2], group == 'contract')
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

    def test_resources_capture_limits_affinity_and_only_hashed_host_identity(self):
        import json
        values = {'/proc/cpuinfo': 'model name : Fixture CPU\n',
                  '/proc/meminfo': 'MemTotal: 1024 kB\nMemAvailable: 512 kB\n',
                  '/proc/self/cgroup': '0::/fixture', '/etc/machine-id': 'private-machine-id',
                  '/sys/fs/cgroup/fixture/cpu.max': '200000 100000',
                  '/sys/fs/cgroup/fixture/memory.max': '1073741824'}
        def read(path, *args, **kwargs):
            if str(path) not in values:
                raise OSError('not exposed')
            return values[str(path)]
        with patch.object(Path, 'read_text', read), \
             patch.object(baseline.platform, 'node', return_value='private-hostname'), \
             patch.object(baseline.os, 'sched_getaffinity', return_value={2, 4}):
            first = baseline.resources()
            second = baseline.resources()
        self.assertEqual(first['host_fingerprint_sha256'], second['host_fingerprint_sha256'])
        self.assertEqual(first['cpu_models'], ['Fixture CPU'])
        self.assertEqual(first['affinity'], [2, 4])
        self.assertEqual(first['memory_bytes']['MemAvailable'], 512 * 1024)
        self.assertEqual(first['cgroup_limits']['effective']['cpu.max'], '200000 100000')
        self.assertNotIn('private-machine-id', json.dumps(first))
        self.assertNotIn('private-hostname', json.dumps(first))

    def test_untracked_executable_is_preserved_and_drift_invalidates_run(self):
        import json
        with tempfile.TemporaryDirectory() as tmp, patch.object(baseline, 'ROOT', Path(tmp)):
            source = Path(tmp, 'scripts/new-runtime.py')
            source.parent.mkdir()
            source.write_text('initial runtime')
            source.chmod(0o755)
            old_evidence = Path(tmp, 'historical.json')
            old_evidence.write_text('unaltered raw evidence')
            output = Path(tmp, 'new-evidence')
            def mutate(*args):
                source.write_text('changed runtime')
                return 0
            with patch.object(baseline, 'GROUPS', (('python', ['fixture']),)), \
                 patch.object(baseline, 'preflight', return_value=([], {})), \
                 patch.object(baseline, 'revision', return_value={}), \
                 patch.object(baseline, 'capture', return_value='fixture-head'), \
                 patch.object(baseline.subprocess, 'check_output', return_value=b''), \
                 patch.object(baseline, 'runtime_file_paths', return_value=({'scripts/new-runtime.py'}, {'scripts/new-runtime.py'})), \
                 patch.object(baseline, 'resources', side_effect=[{'boundary': 0}, {'boundary': 1}, {'boundary': 2}]), \
                 patch.object(baseline, 'execute_group', side_effect=mutate):
                self.assertEqual(baseline.main(['--output', str(output), '--cache-note', 'fixture']), 1)
            data = json.loads((output / 'results.json').read_text())
            self.assertFalse(data['runs'][0]['input_identity_valid'])
            self.assertEqual(data['runs'][0]['status'], 'failed')
            self.assertEqual(data['runs'][0]['resources_before'], {'boundary': 1})
            self.assertEqual(data['runs'][0]['resources_after'], {'boundary': 2})
            saved = output / 'untracked-runtime-inputs/scripts/new-runtime.py'
            self.assertEqual(saved.read_text(), 'initial runtime')
            self.assertEqual(saved.stat().st_mode & 0o777, 0o755)
            self.assertEqual(old_evidence.read_text(), 'unaltered raw evidence')
            self.assertIsNone(data['summary']['median_seconds'])

    def test_invalid_report_or_input_guard_cannot_contribute_to_median(self):
        invalid_report = run()
        invalid_report['groups'][0]['validation_errors'] = ['reduced discovery']
        changed_source = run()
        changed_source['input_identity_valid'] = False
        summary = baseline.summarize([invalid_report, changed_source, run(), run('warmup'), run('clean')])
        self.assertEqual(summary['successful_measurements'], 1)
        self.assertFalse(summary['local_evidence_complete'])
        self.assertIsNone(summary['target_met'])

    def backend_fixture(self, root):
        directory = root / 'backend/src/test/java/example'
        directory.mkdir(parents=True)
        (directory / 'RulesTest.java').write_text('package example; class RulesTest { @Test void rule() {} }')
        (directory / 'BaseIT.java').write_text('''package example; class BaseIT {
            @Test void boundary() {}
            @ParameterizedTest @ValueSource(strings={"one", "two"})
            void variants(String value) {}
        }''')
        (directory / 'NextIT.java').write_text('package example; class NextIT extends BaseIT {}')
        expected = baseline.expected_backend_tests()
        import xml.etree.ElementTree as ET
        reports = {}
        for kind, cases in expected.items():
            destination = root / 'backend/target' / (kind + '-reports')
            destination.mkdir(parents=True)
            suite = ET.Element('testsuite')
            for (cls, method), count in cases.items():
                for index in range(count):
                    ET.SubElement(suite, 'testcase', classname=cls, name=f'{method}(String)[{index + 1}]')
            ET.ElementTree(suite).write(destination / 'TEST-fixture.xml')
            reports[kind] = baseline.report_counts(destination)
        return expected, reports

    def test_backend_scope_includes_current_parameters_inheritance_and_new_tests(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(baseline, 'ROOT', Path(tmp)):
            expected, reports = self.backend_fixture(Path(tmp))
            self.assertEqual(expected['failsafe'][('example.NextIT', 'variants')], 2)
            self.assertEqual(baseline.validate_backend_reports(reports), [])
            new = Path(tmp, 'backend/src/test/java/example/NewTest.java')
            new.write_text('package example; class NewTest { @Test void added() {} }')
            self.assertTrue(any('missing=' in error and 'added' in error for error in baseline.validate_backend_reports(reports)))

    def test_empty_reduced_skipped_and_malformed_backend_reports_are_rejected(self):
        import xml.etree.ElementTree as ET
        with tempfile.TemporaryDirectory() as tmp, patch.object(baseline, 'ROOT', Path(tmp)):
            _, reports = self.backend_fixture(Path(tmp))
            path = Path(tmp, 'backend/target/failsafe-reports/TEST-fixture.xml')
            tree = ET.parse(path)
            tree.getroot().remove(tree.getroot().find('testcase'))
            tree.write(path)
            reports['failsafe'] = baseline.report_counts(path.parent)
            self.assertTrue(baseline.validate_backend_reports(reports))
            ET.SubElement(tree.getroot().find('testcase'), 'skipped')
            tree.write(path)
            reports['failsafe'] = baseline.report_counts(path.parent)
            self.assertEqual(reports['failsafe']['skipped'], 1)
            self.assertTrue(baseline.validate_backend_reports(reports))
            path.write_text('<testsuite><testcase')
            reports['failsafe'] = baseline.report_counts(path.parent)
            self.assertTrue(reports['failsafe']['errors'])
            self.assertTrue(baseline.validate_backend_reports(reports))
            path.unlink()
            reports['failsafe'] = baseline.report_counts(path.parent)
            self.assertTrue(any('empty test discovery' in error for error in baseline.validate_backend_reports(reports)))

    def test_malformed_backend_xml_is_preserved_before_failure_is_saved(self):
        import json
        with tempfile.TemporaryDirectory() as tmp, patch.object(baseline, 'ROOT', Path(tmp)):
            output = Path(tmp, 'evidence')
            def broken_backend(*args):
                report = Path(tmp, 'backend/target/failsafe-reports/TEST-broken.xml')
                report.parent.mkdir(parents=True)
                report.write_text('<testsuite><testcase')
                return 143
            with patch.object(baseline, 'GROUPS', (('backend', ['fixture']),)), \
                 patch.object(baseline, 'preflight', return_value=([], {})), \
                 patch.object(baseline, 'revision', return_value={}), \
                 patch.object(baseline, 'capture', return_value=''), \
                 patch.object(baseline.subprocess, 'check_output', return_value=b''), \
                 patch.object(baseline, 'execute_group', side_effect=broken_backend):
                self.assertEqual(baseline.main(['--output', str(output), '--cache-note', 'fixture']), 1)
            data = json.loads((output / 'results.json').read_text())
            self.assertEqual(data['status'], 'failed')
            self.assertTrue(data['runs'][0]['groups'][0]['interrupted'])
            self.assertTrue(data['runs'][0]['groups'][0]['failsafe']['errors'])
            self.assertEqual((output / '00-warmup-failsafe-reports/TEST-broken.xml').read_text(), '<testsuite><testcase')

    def browser_document(self, count=2, status='passed'):
        return {'errors': [], 'suites': [{'specs': [
            {'file': 'fixture.spec.ts', 'title': f'case {index}', 'id': f'id-{index}',
             'tests': [{'projectId': '', 'expectedStatus': 'passed', 'results': [{'status': status}]}]}
            for index in range(count)]}]}

    def test_browser_actual_pass_identities_must_match_nonempty_current_discovery(self):
        import json
        expected, errors = baseline.browser_identities(self.browser_document())
        self.assertEqual(errors, [])
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp, 'results.json')
            path.write_text(json.dumps(self.browser_document()))
            self.assertEqual(baseline.validate_browser_report(path, expected), [])
            for document in (self.browser_document(0), self.browser_document(1),
                             self.browser_document(status='skipped'), self.browser_document(status='failed'), []):
                path.write_text(json.dumps(document))
                self.assertTrue(baseline.validate_browser_report(path, expected))
            path.write_text('{malformed')
            self.assertTrue(baseline.validate_browser_report(path, expected))
            newer = self.browser_document(3)
            new_expected, _ = baseline.browser_identities(newer)
            path.write_text(json.dumps(newer))
            self.assertEqual(baseline.validate_browser_report(path, new_expected), [])

    def test_timeout_kills_stubborn_descendant_after_leader_exits(self):
        import os
        import sys
        import time
        with tempfile.TemporaryDirectory() as tmp:
            child_pid = Path(tmp, 'child.pid')
            ready = Path(tmp, 'ready')
            child_code = ('import os,signal,time,pathlib; signal.signal(signal.SIGTERM,signal.SIG_IGN); '
                          f'pathlib.Path({str(ready)!r}).touch(); time.sleep(30)')
            parent_code = ('import subprocess,sys,pathlib,time; '
                           f'p=subprocess.Popen([sys.executable,"-c",{child_code!r}]); '
                           f'pathlib.Path({str(child_pid)!r}).write_text(str(p.pid)); time.sleep(30)')
            with Path(tmp, 'log').open('w') as log:
                code = baseline.execute_group([sys.executable, '-c', parent_code], log, dict(os.environ), timeout=.5, grace=.1)
            self.assertEqual(code, 124)
            self.assertTrue(ready.exists(), 'descendant must install its TERM handler before timeout')
            pid = int(child_pid.read_text())
            deadline = time.monotonic() + 2
            while time.monotonic() < deadline:
                try:
                    state = Path(f'/proc/{pid}/stat').read_text().split()[2]
                except FileNotFoundError:
                    break
                if state == 'Z':
                    break
                time.sleep(.01)
            else:
                os.kill(pid, 9)
                self.fail('stubborn descendant survived process-group cleanup')

    def test_sigterm_persists_interrupted_group_and_terminates_process(self):
        import json
        import os
        import signal
        import subprocess
        import sys
        import time
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp, 'evidence')
            ready = Path(tmp, 'ready')
            child = f'import pathlib,time; pathlib.Path({str(ready)!r}).touch(); time.sleep(30)'
            code = f'''import importlib.util,pathlib
spec=importlib.util.spec_from_file_location('runner',{str(SPEC.origin)!r})
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
m.ROOT=pathlib.Path({tmp!r}); m.GROUPS=(('python', [{sys.executable!r},'-c',{child!r}]),)
m.preflight=lambda:([],{{}}); m.revision=lambda:{{}}; m.capture=lambda args:''
m.runtime_file_paths=lambda:(set(),set())
m.subprocess.check_output=lambda *args,**kwargs:b''
raise SystemExit(m.main(['--output',{str(output)!r},'--cache-note','fixture']))
'''
            with Path(tmp, 'harness.log').open('w') as log:
                process = subprocess.Popen([sys.executable, '-c', code], stdout=log, stderr=log)
                try:
                    deadline = time.monotonic() + 3
                    while not ready.exists() and time.monotonic() < deadline:
                        time.sleep(.01)
                    self.assertTrue(ready.exists())
                    os.kill(process.pid, signal.SIGTERM)
                    self.assertEqual(process.wait(timeout=4), 1)
                finally:
                    if process.poll() is None:
                        process.kill()
                        process.wait()
            data = json.loads((output / 'results.json').read_text())
            self.assertEqual(data['status'], 'failed')
            self.assertTrue(data['runs'][0]['groups'][0]['interrupted'])
            self.assertEqual(data['runs'][0]['groups'][0]['exit_code'], 143)
            self.assertIsNone(data['summary']['median_seconds'])
