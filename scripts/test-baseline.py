#!/usr/bin/env python3
"""Uninstrumented complete local baseline; failures never contribute to the median."""
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import signal
import socket
import statistics
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
GROUPS = (
    ('python', ['python3', '-m', 'unittest', 'discover', '-s', 'scripts/tests', '-v']),
    ('contract', ['./scripts/check-contract.sh']),
    ('backend', ['./backend/mvnw', '-B', '-f', 'backend/pom.xml', 'verify']),
    ('browser', ['npm', '--prefix', 'frontend', 'run', 'e2e']),
    ('transition', ['npm', '--prefix', 'frontend', 'run', 'e2e:transition']),
    ('automation', ['npm', '--prefix', 'frontend', 'run', 'e2e:automation']),
)
# Only disposable build/test outputs, never caches, source, secrets or database state.
CLEAN_PATHS = ('backend/target', 'frontend/dist', 'frontend/out-tsc',
               'frontend/test-results', 'frontend/playwright-report', 'frontend/.angular')


def capture(args):
    result = subprocess.run(args, cwd=ROOT, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(f'{args[0]} exited {result.returncode}: {result.stderr.strip()}')
    return result.stdout.strip() or result.stderr.strip()


def revision():
    status = capture(['git', 'status', '--porcelain=v1', '--untracked-files=all'])
    diff = subprocess.check_output(['git', 'diff', '--binary', 'HEAD'], cwd=ROOT)
    return {'commit': capture(['git', 'rev-parse', 'HEAD']), 'status': status,
            'tracked_diff_sha256': hashlib.sha256(diff).hexdigest()}


def preflight():
    errors = []
    for name in ('java', 'javac', 'node', 'npm', 'python3', 'unzip', 'curl', 'git', 'tar', 'sha256sum'):
        if not shutil.which(name):
            errors.append(f'missing tool: {name}')
    if platform.system() != 'Linux' or platform.machine() != 'x86_64':
        errors.append('Linux x86_64 required by PostgreSQL test binaries and contract tooling')
    if hasattr(os, 'geteuid') and os.geteuid() == 0:
        errors.append('PostgreSQL tests require an unprivileged user')
    versions = {}
    for name, command in (('java', ['java', '-version']), ('javac', ['javac', '-version']),
                          ('node', ['node', '--version']), ('npm', ['npm', '--version'])):
        if shutil.which(name):
            try:
                versions[name] = capture(command)
            except RuntimeError as exc:
                errors.append(str(exc))
    if 'node' in versions and versions['node'] != 'v24.22.0':
        errors.append('Node 24.22.0 required')
    for name in ('java', 'javac'):
        if name in versions and not any(token.startswith('25') for token in versions[name].replace('"', '').split()):
            errors.append(f'{name} 25 required')
    for port in (8080, 4200):
        for host in ('127.0.0.1', '::1'):
            family = socket.AF_INET6 if ':' in host else socket.AF_INET
            try:
                with socket.socket(family, socket.SOCK_STREAM) as sock:
                    sock.bind((host, port))
            except OSError as exc:
                errors.append(f'port {host}:{port} unavailable: {exc}')
    return errors, versions


def execute_group(command, log, env):
    process = subprocess.Popen(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT,
                               env=env, start_new_session=True)
    try:
        return process.wait(timeout=7200)
    except (KeyboardInterrupt, subprocess.TimeoutExpired) as exc:
        os.killpg(process.pid, signal.SIGTERM)
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            process.wait()
        log.write('\nInterrupted/timeout: complete process group terminated.\n')
        return 130 if isinstance(exc, KeyboardInterrupt) else 124


def report_counts(directory):
    """Execution count, distinct method count and duplicate executions, not scenarios."""
    cases = []
    for path in sorted(Path(directory).glob('TEST-*.xml')):
        root = ET.parse(path).getroot()
        for case in root.iter('testcase'):
            cases.append((case.get('classname'), case.get('name')))
    return {'executions': len(cases), 'distinct_execution_ids': len(set(cases)),
            'duplicate_executions': len(cases) - len(set(cases))}


def summarize(runs):
    def complete_run(run):
        return (run['status'] == 'passed'
                and [g['name'] for g in run['groups']] == [name for name, _ in GROUPS]
                and all(g['exit_code'] == 0 for g in run['groups']))
    complete = [r for r in runs if r['kind'] == 'measurement' and complete_run(r)]
    median = statistics.median(r['seconds'] for r in complete) if len(complete) >= 3 else None
    ready = (len(complete) >= 3
             and any(r['kind'] == 'warmup' and complete_run(r) for r in runs)
             and any(r['kind'] == 'clean' and complete_run(r) for r in runs))
    return {'successful_measurements': len(complete), 'local_evidence_complete': ready,
            'median_seconds': median, 'target_seconds_70_percent': median * .7 if median is not None else None,
            'group_median_seconds': {name: statistics.median(next(g['seconds'] for g in r['groups'] if g['name'] == name)
                                    for r in complete) for name, _ in GROUPS} if complete else {}}


def save(path, value):
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n')
    temporary.replace(path)


def validate_output(path):
    for relative in CLEAN_PATHS:
        if path.is_relative_to((ROOT / relative).resolve()):
            raise ValueError(f'Output lies within disposable build outputs: {relative}')


def clear_backend_reports():
    # Reports from a previous invocation must never look like current discovery.
    for relative in ('surefire-reports', 'failsafe-reports'):
        directory = ROOT / 'backend/target' / relative
        if directory.exists():
            shutil.rmtree(directory)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True, help='new evidence directory; existing paths are rejected')
    parser.add_argument('--measurements', type=int, default=3)
    parser.add_argument('--cache-note', required=True, help='cache preparation, prior downloads and host load conditions')
    parser.add_argument('--preflight-only', action='store_true')
    args = parser.parse_args(argv)
    if args.measurements < 3:
        parser.error('at least three measurements required')
    args.output = args.output.resolve()
    validate_output(args.output)
    args.output.mkdir(parents=True, exist_ok=False)
    errors, versions = preflight()
    evidence = {'schema_version': 1, 'started_utc': dt.datetime.now(dt.timezone.utc).isoformat(),
                'revision': revision(), 'environment': {'platform': platform.platform(), 'machine': platform.machine(),
                'cpu_count': os.cpu_count(), 'python': sys.version, 'tools': versions,
                'load_average': os.getloadavg(), 'cache_note': args.cache_note,
                'browser_executable': os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'),
                'contract_base_ref': os.environ.get('CONTRACT_BASE_REF', 'HEAD')},
                'commands': [{'name': n, 'argv': c} for n, c in GROUPS],
                'cache_policy': 'Dependency/tool/browser caches retained; contract npm ci and all nested builds included. Clean run removes only CLEAN_PATHS.',
                'clean_paths': CLEAN_PATHS, 'preflight_errors': errors, 'runs': [], 'status': 'blocked' if errors else 'ready',
                'summary': summarize([])}
    # Preserve exact dirty tracked inputs, including the runner itself when untracked.
    (args.output / 'tracked-input.patch').write_bytes(subprocess.check_output(['git', 'diff', '--binary', 'HEAD'], cwd=ROOT))
    inputs = {}
    for entry in capture(['git', 'ls-files', '--cached', '--others', '--exclude-standard']).splitlines():
        path = ROOT / entry
        if path.is_file() and not path.resolve().is_relative_to(args.output):
            inputs[entry] = hashlib.sha256(path.read_bytes()).hexdigest()
    save(args.output / 'input-sha256.json', inputs)
    save(args.output / 'results.json', evidence)
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 2
    if args.preflight_only:
        return 0
    for index, kind in enumerate(['warmup'] + ['measurement'] * args.measurements + ['clean']):
        run = {'index': index, 'kind': kind, 'groups': [], 'status': 'running',
               'started_utc': dt.datetime.now(dt.timezone.utc).isoformat()}
        evidence['runs'].append(run)
        start = time.perf_counter()
        if kind == 'clean':
            clean_start = time.perf_counter()
            for relative in CLEAN_PATHS:
                path = ROOT / relative
                if path.exists():
                    shutil.rmtree(path)
            run['cleanup_seconds'] = time.perf_counter() - clean_start
        for name, command in GROUPS:
            logfile = args.output / f'{index:02d}-{kind}-{name}.log'
            group_start = time.perf_counter()
            if name == 'backend':
                clear_backend_reports()
            print(f'{kind} {index}: {name}', flush=True)
            with logfile.open('w') as log:
                try:
                    phase_log = args.output / f'{index:02d}-{kind}-{name}-phases.jsonl'
                    env = dict(os.environ, TEST_BASELINE_PHASE_LOG=str(phase_log))
                    exit_code = execute_group(command, log, env)
                except OSError as exc:
                    log.write(str(exc) + '\n')
                    exit_code = 127
            group = {'name': name, 'seconds': time.perf_counter() - group_start,
                     'exit_code': exit_code, 'log': logfile.name}
            if name == 'backend':
                group['surefire'] = report_counts(ROOT / 'backend/target/surefire-reports')
                group['failsafe'] = report_counts(ROOT / 'backend/target/failsafe-reports')
                for report_dir in ('surefire-reports', 'failsafe-reports'):
                    destination = args.output / f'{index:02d}-{kind}-{report_dir}'
                    destination.mkdir()
                    for xml in (ROOT / 'backend/target' / report_dir).glob('TEST-*.xml'):
                        shutil.copyfile(xml, destination / xml.name)
            run['groups'].append(group)
            save(args.output / 'results.json', evidence)
            if exit_code:
                run['status'] = 'failed'
                break
        run['seconds'] = time.perf_counter() - start
        if run['status'] == 'running':
            run['status'] = 'passed'
        evidence['summary'] = summarize(evidence['runs'])
        evidence['status'] = 'failed' if run['status'] == 'failed' else 'running'
        save(args.output / 'results.json', evidence)
        # Failed complete build is evidence, not a successful sample. Avoid repeatedly
        # exercising a known broken prerequisite; rerun in a fresh evidence directory.
        if run['status'] == 'failed':
            return 1
    evidence['status'] = 'passed'
    save(args.output / 'results.json', evidence)
    return 0


def measured_phase(argv):
    name, *command = argv
    started = time.perf_counter()
    result = subprocess.run(command, cwd=ROOT)
    path = os.environ.get('TEST_BASELINE_PHASE_LOG')
    if path:
        with open(path, 'a') as output:
            output.write(json.dumps({'name': name, 'argv': command,
                                     'seconds': time.perf_counter() - started,
                                     'exit_code': result.returncode}) + '\n')
    return result.returncode


if __name__ == '__main__':
    sys.exit(measured_phase(sys.argv[2:]) if len(sys.argv) > 1 and sys.argv[1] == '--phase' else main())
