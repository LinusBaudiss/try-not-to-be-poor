#!/usr/bin/env python3
"""Refresh the inventory from an explicitly reviewed semantic scenario manifest.

Validate source cases, fixture hashes and the captured real JUnit/Playwright
plans. Fail on unmapped/changed cases; never infer requirements from keywords.
No tests run here.
"""
import ast
import csv
import hashlib
import json
from pathlib import Path
import re
import runpy

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()[:12]


def masked(source):
    # Keep offsets/newlines for braces and references; remove comments and literals.
    return re.sub(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|//[^\n]*|/\*.*?\*/',
                  lambda m: ''.join('\n' if c == '\n' else ' ' for c in m[0]), source, flags=re.S)


def block(source, start):
    depth = 1
    for i in range(start + 1, len(source)):
        depth += (source[i] == '{') - (source[i] == '}')
        if depth == 0:
            return i + 1
    raise ValueError('unbalanced source')


def close_delimiter(source, start, opening='(', closing=')'):
    mask = masked(source)
    depth = 1
    for i in range(start + 1, len(source)):
        depth += (mask[i] == opening) - (mask[i] == closing)
        if depth == 0:
            return i
    raise ValueError('unbalanced expression')


def split_values(source):
    mask = masked(source)
    depth = 0
    values = []
    start = 0
    for i, char in enumerate(mask):
        depth += char in '([{'
        depth -= char in ')]}'
        if char == ',' and depth == 0:
            values.append(source[start:i].strip())
            start = i + 1
    values.append(source[start:].strip())
    return [value for value in values if value]


def loop_values(expression, preceding):
    # Keep exact symbolic expressions (e.g. MAX_CENTS + 1) rather than
    # evaluating arbitrary Java. Constant collections are fully enumerated.
    collection = re.search(r'(?:List\.of|Arrays\.asList|Stream\.of)\s*\(', expression)
    if collection:
        pos = collection.end()-1
        return split_values(expression[pos+1:close_delimiter(expression,pos)]), 'enumerated input expressions'
    array = re.search(r'new\s+[\w.]+\s*\[\s*\]\s*\{', expression)
    if array:
        pos = array.end()-1
        return split_values(expression[pos+1:close_delimiter(expression,pos,'{','}')]), 'enumerated input expressions'
    variable = re.fullmatch(r'\s*(\w+)\s*', expression)
    if variable:
        assignments = list(re.finditer(r'\b' + variable[1] + r'\s*=\s*', preceding))
        if assignments:
            start = assignments[-1].end()
            rest = preceding[start:]
            if rest.lstrip().startswith('{'):
                pos = rest.index('{')
                return split_values(rest[pos+1:close_delimiter(rest,pos,'{','}')]), 'named array initializer'
            if re.match(r'(List\.of|Arrays\.asList|Stream\.of|new\s+\w+\[)',rest):
                return loop_values(rest, '')
        return [expression.strip()], 'fixture/result collection; iteration is supplementary observation, not a new business scenario'
    return [expression.strip()], 'symbolic fixture/result expression; supplementary observation'


MANIFEST = json.loads((HERE / 'reviewed-scenario-manifest.json').read_text())
# Requirements and semantic assignments are reviewed data, never inferred from
# source words, names, suffixes or assertion count.


entries = []
classes = {}
for path in sorted((ROOT / 'backend/src/test/java').rglob('*.java')):
    source = path.read_text()
    mask = masked(source)
    classname = path.stem
    relative = str(path.relative_to(ROOT))
    parent = re.search(r'\bclass\s+' + classname + r'\s+extends\s+(\w+)', mask)
    classes[classname] = {'path': relative, 'inherits': parent[1] if parent else None, 'methods': []}
    for match in re.finditer(r'@(Test|ParameterizedTest)\b(.*?)\bvoid\s+(\w+)\s*\(', source, flags=re.S):
        # @TestConfiguration is excluded by the word boundary.
        name = match[3]
        signature_end = re.search(r'\)\s*(?:throws\s+[^\{]+)?\{', mask[match.end():])
        if not signature_end:
            raise ValueError(f'cannot locate body: {relative}#{name}')
        start = match.end() + signature_end.end() - 1
        end = block(mask, start)
        body = source[start:end]
        prefix = match[2]
        variants = ['default']
        provider = None
        values = re.search(r'@(ValueSource|CsvSource)\s*\((.*?)\)\s*$', prefix.strip(), re.S)
        if values:
            values_text = values[2]
            array = re.search(r'\{(.*)\}', values_text, re.S)
            raw = array[1] if array else values_text.split('=', 1)[-1]
            variants = split_values(raw)
            provider = values[1]
        method_source = re.search(r'@MethodSource\("([^"\\]+)"\)', prefix)
        if method_source:
            provider = method_source[1]
            method = re.search(r'\b' + re.escape(provider) + r'\s*\([^)]*\)\s*(?:throws[^\{]+)?\{', mask)
            provider_body = source[method.end()-1:block(mask, method.end()-1)] if method else ''
            variants = re.findall(r'Arguments\.of\("([^"\\]+)"', provider_body) or ['UNRESOLVED:' + provider]
        enum_source = re.search(r'@EnumSource\((\w+)\.class\)', prefix)
        if enum_source:
            provider = enum_source[1]
            enum = re.search(r'enum\s+' + provider + r'\s*\{([^}]+)\}', mask)
            variants = [v.strip() for v in enum[1].split(',')] if enum else ['UNRESOLVED:' + provider]
        loops = []
        # Source expressions retained verbatim; dynamic helper/array resolution is not
        # silently converted into a scenario count.
        for loop in re.finditer(r'\bfor\s*\(', mask[start:end]):
            pos = start + loop.start()
            line = source.count('\n', 0, pos) + 1
            opening = source.index('(', pos)
            closing = close_delimiter(source, opening)
            header = source[opening+1:closing]
            colon = masked(header).find(':')
            if colon >= 0:
                input_expression = header[colon+1:]
                values, status = loop_values(input_expression, source[start:pos])
            else:
                input_expression = header
                counted = re.search(r'(?:int\s+)?(\w+)\s*=\s*(\d+);\s*\1\s*(<|<=)\s*(\d+);',header)
                if counted:
                    stop = int(counted[4]) + (counted[3] == '<=')
                    values = [str(i) for i in range(int(counted[2]),stop)]
                    status = 'enumerated count; repetition alone does not add a scenario'
                else:
                    values = [header]
                    status = 'result-cardinality loop; supplementary observation'
            loops.append({'id': 'loop:' + digest(header), 'line': line,
                          'expression': header.strip(), 'values': values, 'status': status})
        req, risks = [], []
        current = MANIFEST['source_classes'][classname]['primary_test_type']
        remain = ('not applicable: isolated rule; retain representative HTTP/persistence boundary' if current == 'unit' else
                  'source/module boundary check' if current == 'architecture' else
                  'real old/new release processes, DB admission/sessions, schema/role certificates, migration and restart' if current == 'process/PostgreSQL' else
                  'real HTTP security/serialization + PostgreSQL ownership/RLS/commit/rollback/pool/independent locks as applicable')
        target = 'retain architecture' if current == 'architecture' else 'unit (pure rules only); adapter for JSON; retain named integration boundary'
        for variant in variants:
            entry = {'id': f'BE:{classname}#{name}' + (':' + digest(variant) if variant != 'default' else ''),
                     'path': relative, 'line': source.count('\n', 0, match.start()) + 1,
                     'method': name, 'class': classname, 'variant': variant, 'provider': provider,
                     'current_type': current, 'execution_paths': ['maven:verify/surefire' if classname.endswith('Test') else 'maven:verify/failsafe'],
                     'requirement': req, 'observation': name, 'risks': risks, 'target_type': target,
                     'remaining_integration': remain, 'replacement_evidence': 'OPEN; no replacement or removal in 5.1',
                     'source_body_sha256': hashlib.sha256(body.encode()).hexdigest(),
                     'source_body': body, 'loops': loops,
                     'semantic_scenario': [],
                     'discovery_status': 'pending captured JUnit set validation'}
            entries.append(entry)
            classes[classname]['methods'].append(entry['id'])
# Geerbte Ausführung referenziert dasselbe Szenario und bekommt keinen neuen Fall.
for classname, cls in classes.items():
    if cls['inherits']:
        parent = cls['inherits']
        for entry in entries:
            if entry.get('class') == parent:
                entry['execution_paths'].append(f'maven:verify/failsafe:{classname} inherits {parent} (v2 adapter)')


def visit(suites, group):
    for suite in suites:
        for spec in suite.get('specs', []):
            path = 'frontend/e2e/' + spec['file']
            title = spec['title']
            req, risks = [], []
            entries.append({'id': f'FE:{spec["file"]}:' + digest(title), 'path': path, 'line': spec['line'],
                            'variant': title, 'observation': title, 'current_type': 'browser',
                            'execution_paths': [f'npm:{group}'], 'requirement': req, 'risks': risks,
                            'target_type': 'unit/isolated component for inputs/state/response order; retain real browser UX/HTTP boundaries',
                            'remaining_integration': 'actual cookie/CSRF/Origin/interceptor plus complete journeys, keyboard/focus/reflow/viewport/contrast where covered',
                            'replacement_evidence': 'OPEN; no replacement or removal in 5.1',
                            'semantic_scenario': [],
                            'discovery_status': 'Playwright --list; expanded title/loop/project invocation'})
        visit(suite.get('suites', []), group)


for group in ('browser', 'transition', 'automation'):
    document = json.loads((HERE / 'discovery' / (group + '.json')).read_text())
    if document.get('errors'):
        raise ValueError(document['errors'])
    visit(document['suites'], group)

for path in sorted((ROOT / 'scripts/tests').glob('test_*.py')):
    source = path.read_text()
    tree = ast.parse(source)
    for cls in [n for n in tree.body if isinstance(n, ast.ClassDef)]:
        for method in [n for n in cls.body if isinstance(n, ast.FunctionDef) and n.name.startswith('test_')]:
            loops = [ast.unparse(n.iter) for n in ast.walk(method) if isinstance(n, (ast.For, ast.comprehension))]
            entries.append({'id': f'PY:{path.stem}:{cls.name}#{method.name}', 'path': str(path.relative_to(ROOT)),
                            'line': method.lineno, 'variant': 'default', 'observation': method.name,
                            'current_type': 'tool/infrastructure', 'execution_paths': ['python:unittest discover'],
                            'requirement': 'TR-7/10; tool-specific regression / Story 3.7 or 5.1', 'risks': ['infrastructure'],
                            'target_type': 'retain Python tooling checks', 'remaining_integration': 'real release/DB checks complement command stubs',
                            'replacement_evidence': 'OPEN; no replacement or removal', 'loops': loops,
                            'semantic_scenario': 'infrastructure; excluded from backend/frontend business denominator',
                            'discovery_status': 'Python AST + successful unittest discovery'})

ids = [entry['id'] for entry in entries]
assert len(set(ids)) == len(ids), 'unstable/duplicate identifiers'
# Fail closed on new/deleted variants or changed fixtures: no auto-mapping.
actual_ids = set(ids)
reviewed_ids = set(MANIFEST['cases'])
if actual_ids != reviewed_ids:
    raise ValueError(f"Unmapped source cases: {sorted(actual_ids-reviewed_ids)}; stale manifest cases: {sorted(reviewed_ids-actual_ids)}")
for name, expected in MANIFEST['source_files_sha256'].items():
    if hashlib.sha256((ROOT / name).read_bytes()).hexdigest() != expected:
        raise ValueError(f'Source changed since semantic review: {name}; review manifest before refresh')
# Validate the real JUnit method/template plan, including inherited executions.
with (HERE / 'discovery/backend.tsv').open() as discovery:
    junit = list(csv.DictReader(discovery, delimiter='\t'))
actual_methods = {(row['execution_class'].split('.')[-1], row['method']) for row in junit}
expected_methods = {(e['class'], e['method']) for e in entries if e['id'].startswith('BE:')}
for name, cls in classes.items():
    if cls['inherits']:
        expected_methods.update((name, e['method']) for e in entries if e.get('class') == cls['inherits'])
if actual_methods != expected_methods:
    raise ValueError(f'JUnit discovery mismatch: missing {expected_methods-actual_methods}; unexpected {actual_methods-expected_methods}')
for entry in entries:
    reviewed = MANIFEST['cases'][entry['id']]
    if entry['variant'] != reviewed['expected_variant']:
        raise ValueError(f"Variant changed: {entry['id']}")
    if 'expected_body_sha256' in reviewed and reviewed['expected_body_sha256'] != entry['source_body_sha256']:
        raise ValueError(f"Test body changed: {entry['id']}")
    for scenario in reviewed['scenarios']:
        if scenario not in MANIFEST['scenarios']:
            raise ValueError(f'Unknown reviewed scenario: {scenario}')
    for key in ('requirements', 'observation', 'risks', 'current_type', 'target_type', 'remaining_integration', 'discovery_status', 'domain'):
        entry['requirement' if key == 'requirements' else key] = reviewed[key]
    entry['semantic_scenario'] = reviewed['scenarios']
    entry['canonical_scenarios'] = reviewed['canonical_scenarios']
runpy.run_path(str(HERE / 'semantic-scenarios.py'))['validate'](MANIFEST)
(HERE / 'source-inventory.json').write_text(json.dumps({
    'reference_commit': MANIFEST['reference_commit'],
    'semantic_manifest': 'reviewed-scenario-manifest.json',
    'semantic_review_complete': MANIFEST['semantic_review_complete'],
    'discovery_validation': {'junit_method_paths': len(actual_methods), 'missing': [], 'unexpected': []},
    'classes': classes, 'entries': entries}, indent=2, ensure_ascii=False) + '\n')
fields = ('id', 'path', 'line', 'variant', 'current_type', 'execution_paths', 'requirement', 'observation',
          'risks', 'target_type', 'remaining_integration', 'replacement_evidence', 'semantic_scenario', 'canonical_scenarios', 'discovery_status')
with (HERE / 'source-matrix.csv').open('w') as output:
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction='ignore')
    writer.writeheader()
    for entry in entries:
        writer.writerow({key: json.dumps(value, ensure_ascii=False) if isinstance(value, list) else value for key, value in entry.items()})
print(json.dumps({'entries': len(entries), 'by_type': {kind: sum(e['current_type'] == kind for e in entries) for kind in sorted({e['current_type'] for e in entries})},
                  'inherited_classes': {name: cls['inherits'] for name, cls in classes.items() if cls['inherits']}}, indent=2))

# Exact observation ledger: each assertion retains its full expected chain and
# each enclosing constant loop binding. This is finer than method discovery,
# while repeated assertions and inherited invocations remain supplementary.
from itertools import product
observations = []
for entry in entries:
    if not entry['id'].startswith('BE:'):
        continue
    body = entry['source_body']
    mask = masked(body)
    scopes = []
    for loop in re.finditer(r'\bfor\s*\(', mask):
        opening = body.index('(', loop.start())
        closing = close_delimiter(body, opening)
        header = body[opening+1:closing]
        colon = masked(header).find(':')
        if colon >= 0:
            variable = header[:colon].split()[-1]
            values, meaning = loop_values(header[colon+1:], body[:loop.start()])
        else:
            variable = header.split('=')[0].split()[-1] if '=' in header else 'iteration'
            values, meaning = [header], 'repetition/result-cardinality; no denominator increase'
        after = closing + 1
        while after < len(body) and mask[after].isspace():
            after += 1
        if after < len(body) and mask[after] == '{':
            until = block(mask, after)
        else:
            depth = 0
            until = len(body)
            for i in range(after, len(mask)):
                depth += mask[i] in '([{'
                depth -= mask[i] in ')]}'
                if mask[i] == ';' and depth == 0:
                    until = i + 1
                    break
        scopes.append((after, until, variable, values, meaning))
    for assertion in re.finditer(r'\b(?:assertThatThrownBy|assertThatCode|assertThat|assertThrows|assertEquals|assertTrue|assertFalse)\s*\(', mask):
        depth = 0
        until = len(mask)
        for i in range(assertion.start(), len(mask)):
            depth += mask[i] in '([{'
            depth -= mask[i] in ')]}'
            if mask[i] == ';' and depth == 0:
                until = i
                break
        expression = body[assertion.start():until].strip()
        active = [scope for scope in scopes if scope[0] <= assertion.start() < scope[1]]
        combinations = product(*(scope[3] for scope in active)) if active else [()]
        for values in combinations:
            bindings = {scope[2]: value for scope, value in zip(active, values)}
            identity = entry['id'] + ':' + digest(json.dumps(bindings, sort_keys=True) + expression)
            observations.append({'id': 'OBS:' + identity, 'source_case': entry['id'],
                'primary_scenario_ref': next((sid for sid in entry['semantic_scenario'] if MANIFEST['scenarios'][sid]['input_state'].get('loop_bindings') == bindings), entry['semantic_scenario'][0]),
                'input_state': {'parameter_variant': entry['variant'], 'loop_bindings': bindings,
                                'fixture': entry['path'] + '#' + entry['method']},
                'observation': expression, 'requirement': entry['requirement'],
                'risk': entry['risks'], 'primary_current_type': entry['current_type'],
                'target_type': entry['target_type'], 'remaining_integration': entry['remaining_integration'],
                'replacement_evidence': entry['replacement_evidence']})
# Same repeated source assertion with the same inputs is one observation.
unique = {observation['id']: observation for observation in observations}
(HERE / 'observation-ledger.json').write_text(json.dumps({
    'semantic_manifest': 'reviewed-scenario-manifest.json',
    'observations': list(unique.values())}, indent=2, ensure_ascii=False) + '\n')
print(f'{len(unique)} distinct assertion/binding observations; never use this count as business scenario denominator')
