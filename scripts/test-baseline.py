#!/usr/bin/env python3
"""Uninstrumented complete local baseline; failures never contribute to the median."""
import argparse
from collections import Counter
import re
import stat
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
TARGET_SECONDS = 15 * 60
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


class Terminated(Exception):
    pass


def termination_handler(signum, frame):
    raise Terminated(f'signal {signum}')


def stop_process_group(process, grace):
    # A leader may exit before a child that ignores TERM. Always escalate the
    # surviving group after the grace interval, independently of leader.wait().
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        return
    deadline = time.monotonic() + grace
    while time.monotonic() < deadline:
        process.poll()
        try:
            os.killpg(process.pid, 0)
        except ProcessLookupError:
            break
        time.sleep(min(.02, max(0, deadline - time.monotonic())))
    try:
        os.killpg(process.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    process.wait()


def execute_group(command, log, env, timeout=7200, grace=10):
    process = subprocess.Popen(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT,
                               env=env, start_new_session=True)
    previous = signal.signal(signal.SIGTERM, termination_handler)
    try:
        return process.wait(timeout=timeout)
    except (KeyboardInterrupt, Terminated, subprocess.TimeoutExpired) as exc:
        # Do not let a second TERM interrupt persistent cleanup/status handling.
        signal.signal(signal.SIGTERM, signal.SIG_IGN)
        stop_process_group(process, grace)
        log.write('\nInterrupted/timeout: process group terminated.\n')
        return 124 if isinstance(exc, subprocess.TimeoutExpired) else 143 if isinstance(exc, Terminated) else 130
    finally:
        signal.signal(signal.SIGTERM, previous)


def resources():
    def read(path):
        try:
            return Path(path).read_text().strip()
        except OSError:
            return None
    cpu = read('/proc/cpuinfo') or ''
    models = sorted(set(re.findall(r'^(?:model name|Hardware)\s*:\s*(.+)$', cpu, re.M)))
    memory = dict(re.findall(r'^(MemTotal|MemAvailable):\s*(\d+) kB', read('/proc/meminfo') or '', re.M))
    relative = next((line.split(':', 2)[2] for line in (read('/proc/self/cgroup') or '').splitlines()
                     if line.startswith('0::')), '/')
    cgroup = Path('/sys/fs/cgroup') / relative.lstrip('/')
    limits = {}
    # Include root and effective group when exposed; missing values are explicit.
    for label, directory in (('root', Path('/sys/fs/cgroup')), ('effective', cgroup)):
        limits[label] = {name: read(directory / name) for name in
                         ('cpu.max', 'memory.max', 'memory.current', 'cpuset.cpus.effective',
                          'cpu/cpu.cfs_quota_us', 'cpu/cpu.cfs_period_us', 'memory/memory.limit_in_bytes')}
    fingerprint = hashlib.sha256(('tnbp-baseline-host-v1\0' + (read('/etc/machine-id') or '')
                                 + '\0' + platform.node()).encode()).hexdigest()
    try:
        affinity = sorted(os.sched_getaffinity(0))
    except (AttributeError, OSError):
        affinity = None
    return {'captured_utc': dt.datetime.now(dt.timezone.utc).isoformat(),
            'host_fingerprint_sha256': fingerprint, 'cpu_models': models,
            'cpu_count': os.cpu_count(), 'affinity': affinity,
            'memory_bytes': {key: int(value) * 1024 for key, value in memory.items()},
            'cgroup_limits': limits, 'load_average': os.getloadavg()}


def runtime_file_paths():
    def paths(*options):
        raw = subprocess.check_output(['git', 'ls-files', '-z', *options], cwd=ROOT)
        return {value.decode() for value in raw.split(b'\0') if value}
    return paths('--cached', '--others', '--exclude-standard'), paths('--others', '--exclude-standard')


def input_identity(output, preserve=False):
    paths, untracked = runtime_file_paths()
    files = {}
    for name in sorted(paths):
        path = ROOT / name
        # Planning/evidence output cannot change the executable scope. Preserve
        # code/config inputs, never ignored environment files or dependency caches.
        relevant = (name.split('/')[0] in ('backend', 'frontend', 'scripts', 'api-contract', 'deploy', '.github')
                    or ('/' not in name and path.suffix in ('.sh', '.json', '.xml')))
        if not relevant or path.resolve().is_relative_to(output) or not path.is_file():
            continue
        if path.name.startswith('.env') or path.suffix in ('.pem', '.key', '.secrets'):
            continue
        if path.is_symlink():
            raise ValueError(f'Runtime source symlink requires explicit preservation: {name}')
        files[name] = {'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                       'mode': stat.S_IMODE(path.stat().st_mode)}
        if preserve and name in untracked:
            destination = output / 'untracked-runtime-inputs' / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, destination)
    return {'commit': capture(['git', 'rev-parse', 'HEAD']), 'files': files}


def report_counts(directory):
    """Retain malformed reports and return diagnostics rather than losing status."""
    cases, errors = [], []
    skipped = failures = 0
    for path in sorted(Path(directory).glob('TEST-*.xml')):
        try:
            root = ET.parse(path).getroot()
            if root.tag not in ('testsuite', 'testsuites'):
                errors.append(f'{path.name}: unexpected XML root {root.tag}')
            for case in root.iter('testcase'):
                if not case.get('classname') or not case.get('name'):
                    errors.append(f'{path.name}: testcase missing identity')
                    continue
                cases.append((case.get('classname'), case.get('name')))
                skipped += case.find('skipped') is not None
                failures += case.find('failure') is not None or case.find('error') is not None
            for suite in root.iter('testsuite'):
                if int(suite.get('skipped', '0')) or int(suite.get('failures', '0')) or int(suite.get('errors', '0')):
                    errors.append(f'{path.name}: suite reports skipped/failed/error tests')
        except (ET.ParseError, OSError, ValueError) as exc:
            errors.append(f'{path.name}: {exc}')
    return {'executions': len(cases), 'distinct_execution_ids': len(set(cases)),
            'duplicate_executions': len(cases) - len(set(cases)),
            'identities': cases, 'skipped': skipped, 'failures': failures, 'errors': errors}


def split_java_values(value):
    # Split top-level annotation/initializer entries without splitting CSV strings.
    quoted = False
    escaped = False
    depth = 0
    start = 0
    result = []
    for index, char in enumerate(value):
        if escaped:
            escaped = False
        elif char == '\\' and quoted:
            escaped = True
        elif char == '"':
            quoted = not quoted
        elif not quoted:
            depth += char in '({['
            depth -= char in ')}]'
            if char == ',' and depth == 0:
                result.append(value[start:index].strip())
                start = index + 1
    result.append(value[start:].strip())
    return [v for v in result if v]


def expected_backend_tests():
    """Derive method/invocation scope from current sources, including inherited cases.

    Fail closed on unknown parameter providers rather than accepting fewer tests.
    """
    classes = {}
    for path in (ROOT / 'backend/src/test/java').rglob('*.java'):
        text = path.read_text()
        if not re.search(r'@(Test|ParameterizedTest)\b', text):
            continue
        package = re.search(r'package\s+([\w.]+)', text)
        methods = Counter()
        for match in re.finditer(r'@(Test|ParameterizedTest)\b(.*?)\bvoid\s+(\w+)\s*\(', text, re.S):
            count = 1
            annotations = match[2]
            if match[1] == 'ParameterizedTest':
                array = re.search(r'@(ValueSource|CsvSource)\s*\(.*?\{(.*?)\}\s*\)', annotations, re.S)
                method = re.search(r'@MethodSource\("([^"\\]+)"\)', annotations)
                enum = re.search(r'@EnumSource\((\w+)\.class\)', annotations)
                if array:
                    count = len(split_java_values(array[2]))
                elif method:
                    provider = re.search(r'\b' + re.escape(method[1]) + r'\s*\([^)]*\)\s*(?:throws[^\{]+)?\{(.*?)\n    \}', text, re.S)
                    count = len(re.findall(r'Arguments\.of\(', provider[1])) if provider else 0
                elif enum:
                    definition = re.search(r'enum\s+' + enum[1] + r'\s*\{([^}]+)\}', text)
                    count = len(split_java_values(definition[1])) if definition else 0
                else:
                    raise ValueError(f'Unsupported parameter provider: {path.name}#{match[3]}')
                if not count:
                    raise ValueError(f'Empty/unresolved parameter provider: {path.name}#{match[3]}')
            methods[match[3]] += count
        parent = re.search(r'class\s+' + path.stem + r'\s+extends\s+(\w+)', text)
        classes[path.stem] = (package[1], methods, parent[1] if parent else None)
    # Inherited-only concrete classes do not contain test annotations.
    for path in (ROOT / 'backend/src/test/java').rglob('*.java'):
        if path.stem in classes:
            continue
        text = path.read_text()
        parent = re.search(r'class\s+' + path.stem + r'\s+extends\s+(\w+)', text)
        if parent and parent[1] in classes:
            classes[path.stem] = (re.search(r'package\s+([\w.]+)', text)[1], Counter(), parent[1])
    def methods_of(name):
        package, own, parent = classes[name]
        inherited = methods_of(parent) if parent else Counter()
        inherited.update({key: value - inherited[key] for key, value in own.items()})
        return inherited
    expected = {'surefire': Counter(), 'failsafe': Counter()}
    for name, (package, own, parent) in classes.items():
        group = 'surefire' if name.endswith('Test') else 'failsafe' if name.endswith('IT') else None
        if group is None:
            raise ValueError(f'Test source outside intended Maven discovery: {name}')
        for method, count in methods_of(name).items():
            expected[group][(package + '.' + name, method)] = count
    return expected


def validate_backend_reports(group):
    errors = []
    expected = expected_backend_tests()
    for kind in ('surefire', 'failsafe'):
        report = group[kind]
        errors.extend(f'{kind}: {error}' for error in report['errors'])
        actual = Counter((cls, re.split(r'[\[(]', name, 1)[0]) for cls, name in report['identities'])
        for identity, count in expected[kind].items():
            if count > 1:
                names = [name for cls, name in report['identities']
                         if (cls, re.split(r'[\[(]', name, 1)[0]) == identity]
                indices = [int(match[1]) for name in names
                           if (match := re.search(r'\[(\d+)\]$', name))]
                if sorted(indices) != list(range(1, count + 1)):
                    errors.append(f'{kind}: parameter invocation identities differ: {identity}')
        if not actual:
            errors.append(f'{kind}: empty test discovery')
        if report['skipped'] or report['failures'] or report['duplicate_executions']:
            errors.append(f'{kind}: skipped, failed or duplicate test executions')
        if actual != expected[kind]:
            errors.append(f'{kind}: discovery differs from current source; missing={dict(expected[kind]-actual)}, unexpected={dict(actual-expected[kind])}')
    return errors


def browser_identities(document, require_pass=False):
    if not isinstance(document, dict):
        raise ValueError('browser report must be a JSON object')
    identities = Counter()
    errors = list(document.get('errors', []))
    def visit(suites):
        for suite in suites:
            for spec in suite.get('specs', []):
                for test in spec.get('tests', []):
                    identity = (spec.get('file'), spec.get('title'), spec.get('id'),
                                test.get('projectId', test.get('projectName', '')), test.get('repeatEachIndex', 0))
                    if not all(identity[:3]):
                        errors.append('browser testcase missing file/title/id')
                    identities[identity] += 1
                    if require_pass and (test.get('expectedStatus', 'passed') != 'passed'
                                         or len(test.get('results', [])) != 1
                                         or test['results'][0].get('status') != 'passed'):
                        errors.append(f'Browser test not passed exactly once: {identity}')
            visit(suite.get('suites', []))
    visit(document.get('suites', []))
    if not identities:
        errors.append('empty browser discovery')
    if any(count != 1 for count in identities.values()):
        errors.append('duplicate browser identities')
    return identities, errors


def prepare_browser_discovery(command, log, env, output):
    discovery = output.with_suffix('.discovery.json')
    code = execute_group(command + ['--', '--list', '--forbid-only', '--reporter=json'], log,
                         dict(env, PLAYWRIGHT_JSON_OUTPUT_FILE=str(discovery)))
    if code:
        return None, [f'browser discovery exited {code}']
    try:
        document = json.loads(discovery.read_text())
        identities, errors = browser_identities(document)
        return identities, errors
    except (OSError, ValueError, TypeError, AttributeError) as exc:
        return None, [f'invalid browser discovery report: {exc}']


def validate_browser_report(path, expected):
    try:
        document = json.loads(path.read_text())
        actual, errors = browser_identities(document, require_pass=True)
        if actual != expected:
            errors.append('browser pass identities differ from current intended discovery')
        return errors
    except (OSError, ValueError, TypeError, AttributeError) as exc:
        return [f'invalid browser result report: {exc}']


def summarize(runs):
    def complete_run(run):
        return (run['status'] == 'passed'
                and [g['name'] for g in run['groups']] == [name for name, _ in GROUPS]
                and all(g['exit_code'] == 0 and not g.get('validation_errors') for g in run['groups'])
                and run.get('input_identity_valid', True))
    complete = [r for r in runs if r['kind'] == 'measurement' and complete_run(r)]
    median = statistics.median(r['seconds'] for r in complete) if len(complete) >= 3 else None
    ready = (len(complete) >= 3
             and any(r['kind'] == 'warmup' and complete_run(r) for r in runs)
             and any(r['kind'] == 'clean' and complete_run(r) for r in runs))
    return {'successful_measurements': len(complete), 'local_evidence_complete': ready,
            'median_seconds': median, 'target_seconds': TARGET_SECONDS,
            'target_met': median <= TARGET_SECONDS if ready else None,
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


def _main(argv=None):
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
    git_available = 'missing tool: git' not in errors
    evidence = {'schema_version': 3, 'started_utc': dt.datetime.now(dt.timezone.utc).isoformat(),
                'revision': revision() if git_available else {'unavailable': 'missing tool: git'}, 'environment': {'platform': platform.platform(), 'machine': platform.machine(),
                'cpu_count': os.cpu_count(), 'python': sys.version, 'tools': versions,
                'load_average': os.getloadavg(), 'resources': resources(), 'cache_note': args.cache_note,
                'browser_executable': os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'),
                'contract_base_ref': os.environ.get('CONTRACT_BASE_REF', 'HEAD')},
                'commands': [{'name': n, 'argv': c} for n, c in GROUPS],
                'cache_policy': 'Dependency/tool/browser caches retained; contract npm ci and all nested builds included. Clean run removes only CLEAN_PATHS.',
                'clean_paths': CLEAN_PATHS, 'preflight_errors': errors, 'runs': [], 'status': 'blocked' if errors else 'ready',
                'summary': summarize([])}
    # Preserve exact dirty tracked inputs, including the runner itself when untracked.
    if git_available:
        (args.output / 'tracked-input.patch').write_bytes(subprocess.check_output(['git', 'diff', '--binary', 'HEAD'], cwd=ROOT))
        initial_inputs = input_identity(args.output, preserve=True)
        save(args.output / 'input-sha256.json', initial_inputs)
    save(args.output / 'results.json', evidence)
    def persist_termination(signum, frame):
        signal.signal(signal.SIGTERM, signal.SIG_IGN)
        evidence['status'] = 'interrupted'
        if evidence['runs']:
            interrupted = evidence['runs'][-1]
            interrupted['status'] = 'interrupted'
            interrupted['resources_after'] = resources()
            interrupted['termination_signal'] = signum
        evidence['summary'] = summarize(evidence['runs'])
        save(args.output / 'results.json', evidence)
        raise Terminated(f'signal {signum}')
    signal.signal(signal.SIGTERM, persist_termination)
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 2
    if args.preflight_only:
        return 0
    for index, kind in enumerate(['warmup'] + ['measurement'] * args.measurements + ['clean']):
        run = {'index': index, 'kind': kind, 'groups': [], 'status': 'running',
               'started_utc': dt.datetime.now(dt.timezone.utc).isoformat(), 'resources_before': resources()}
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
                    env = dict(os.environ)
                    # Only the real contract group owns these phase measurements.
                    # Python contract fixtures run in isolated miniature repos and
                    # must not inherit instrumentation of this outer invocation.
                    env.pop('TEST_BASELINE_PHASE_LOG', None)
                    if name == 'contract':
                        env['TEST_BASELINE_PHASE_LOG'] = str(phase_log)
                    expected_browser = None
                    validation_errors = []
                    browser_report = args.output / f'{index:02d}-{kind}-{name}-results.json'
                    if name in ('browser', 'transition', 'automation'):
                        expected_browser, validation_errors = prepare_browser_discovery(command, log, env, browser_report)
                        env['PLAYWRIGHT_JSON_OUTPUT_FILE'] = str(browser_report)
                        command = command + ['--', '--forbid-only', '--reporter=list,json']
                    exit_code = execute_group(command, log, env) if not validation_errors else 1
                except OSError as exc:
                    log.write(str(exc) + '\n')
                    exit_code = 127
                    validation_errors = [str(exc)]
            group = {'name': name, 'seconds': time.perf_counter() - group_start,
                     'exit_code': exit_code, 'log': logfile.name, 'argv': command, 'validation_errors': validation_errors,
                     'interrupted': exit_code in (124, 130, 143)}
            if name == 'backend':
                group['surefire'] = report_counts(ROOT / 'backend/target/surefire-reports')
                group['failsafe'] = report_counts(ROOT / 'backend/target/failsafe-reports')
                for report_dir in ('surefire-reports', 'failsafe-reports'):
                    destination = args.output / f'{index:02d}-{kind}-{report_dir}'
                    destination.mkdir()
                    for xml in (ROOT / 'backend/target' / report_dir).glob('TEST-*.xml'):
                        shutil.copyfile(xml, destination / xml.name)
                try:
                    group['validation_errors'].extend(validate_backend_reports(group))
                except (OSError, ValueError) as exc:
                    group['validation_errors'].append(f'backend validation: {exc}')
            if name in ('browser', 'transition', 'automation') and expected_browser is not None:
                group['validation_errors'].extend(validate_browser_report(browser_report, expected_browser))
            if group['validation_errors'] and not group['exit_code']:
                group['exit_code'] = 1
            run['groups'].append(group)
            save(args.output / 'results.json', evidence)
            if group['exit_code']:
                run['status'] = 'failed'
                break
        run['seconds'] = time.perf_counter() - start
        run['resources_after'] = resources()
        try:
            current_inputs = input_identity(args.output)
            run['input_identity_valid'] = current_inputs == initial_inputs
            if not run['input_identity_valid']:
                save(args.output / f'{index:02d}-{kind}-changed-inputs.json', current_inputs)
                run['status'] = 'failed'
                run['input_error'] = 'Runtime input identity changed during this run; performance sample invalid'
        except (OSError, ValueError, RuntimeError) as exc:
            run['input_identity_valid'] = False
            run['input_error'] = str(exc)
            run['status'] = 'failed'
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


def main(argv=None):
    previous = signal.getsignal(signal.SIGTERM)
    try:
        return _main(argv)
    except Terminated:
        return 1
    finally:
        signal.signal(signal.SIGTERM, previous)


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
