#!/usr/bin/env python3
"""Prüft und rendert explizit geprüfte Szenarioäquivalenzen; keine Auto-Zuordnung."""
import collections
import csv
import hashlib
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SCOPES = {'backend', 'frontend', 'infrastructure'}
COUNTING = {'business', 'infrastructure'}
TEST_TYPES = {'unit', 'component', 'adapter', 'architecture', 'tool/infrastructure',
              'HTTP/PostgreSQL', 'PostgreSQL', 'process/PostgreSQL', 'browser'}


def isolated_case_id(path, title):
    return 'FE:isolated:' + hashlib.sha256((path + '#' + title).encode()).hexdigest()[:16]


def isolated_execution(manifest):
    isolated = manifest.get('isolated_frontend_sources', {})
    execution = isolated.get('execution')
    if not execution:
        return {}
    report_path = ROOT / execution['report']
    if hashlib.sha256(report_path.read_bytes()).hexdigest() != execution['sha256']:
        raise ValueError('Isolierter Ausführungsbeleg seit Review geändert')
    report = json.loads(report_path.read_text())
    if report.get('success') is not True or report.get('numFailedTests') != 0:
        raise ValueError('Isolierter Ausführungsbeleg ist nicht erfolgreich')
    actual = {}
    for source in report['testResults']:
        path = source['name']
        if path not in isolated['files']:
            raise ValueError('Ungeprüfte Vitest-Ergebnisquelle: ' + path)
        for test in source['assertionResults']:
            case_id = isolated_case_id(path, test['fullName'])
            if test['status'] != 'passed' or case_id in actual:
                raise ValueError('Nicht bestandener oder doppelter isolierter Quellfall')
            actual[case_id] = {'path': path, 'full_name': test['fullName']}
    reviewed = isolated.get('reviewed_cases', {})
    if set(actual) != set(reviewed) or len(actual) != report['numTotalTests']:
        raise ValueError('Vitest-Quellfälle ohne vollständigen Review')
    for case_id, case in reviewed.items():
        if any(case[field] != actual[case_id][field] for field in ('path', 'full_name')):
            raise ValueError('Vitest-Fall seit Review geändert: ' + case_id)
        if case['test_type'] != ('unit' if '/shared/' in case['path'] else 'component'):
            raise ValueError('Unzutreffende isolierte Testart: ' + case_id)
        for cid, role in case['mappings'].items():
            if cid not in manifest['canonical_scenarios'] or role not in ('primary', 'supplementary'):
                raise ValueError('Ungültige isolierte Szenariozuordnung: ' + case_id)
            group = 'SC:' + case_id + ':' + cid
            if group not in manifest['canonical_scenarios'][cid]['members']:
                raise ValueError('Isolierter Szenarionachweis ohne Quellgruppe: ' + cid)
            if manifest['scenarios'][group]['primary_test_type'] != case['test_type']:
                raise ValueError('Isolierte Quellgruppe hat falsche Testart')
            if manifest['scenarios'][group]['primary_source'] != case_id:
                raise ValueError('Isolierter Quellnachweis verweist auf anderen Fall')
    for cid, scenario in manifest['canonical_scenarios'].items():
        primary = manifest['scenarios'][scenario['primary_member']]['primary_source']
        if primary.startswith('FE:isolated:') and reviewed.get(primary, {}).get('mappings', {}).get(cid) != 'primary':
            raise ValueError('Isolierter Primärnachweis ohne bestandene Hauptzuordnung: ' + cid)
    return actual


def validate_browser_reductions(manifest):
    evidence = manifest.get('browser_reduction_evidence')
    if not evidence:
        return
    path = ROOT / evidence['path']
    if hashlib.sha256(path.read_bytes()).hexdigest() != evidence['sha256']:
        raise ValueError('Browser-Ersatzbeleg seit Review geändert')
    proof = json.loads(path.read_text())
    for field in ('before_source', 'current_source', 'external_evidence',
                  'post_reduction_browser_execution'):
        artifact = proof[field]
        if hashlib.sha256((ROOT / artifact['path']).read_bytes()).hexdigest() != artifact['sha256']:
            raise ValueError('Browser-Alt-/Neubeleg seit Review geändert: ' + field)
    final = proof['post_reduction_browser_execution']
    log = (ROOT / final['path']).read_text()
    passed = re.findall(r'^\s*✓\s+(\d+)\s+e2e/.*$', log, re.MULTILINE)
    if (proof['status'] != 'replacement-passed-before-removal; post-reduction-browser-run-passed-external'
            or final['source_sha256'] != proof['current_source']['sha256']
            or final['command'] != 'npm --prefix frontend run e2e'
            or final['exit_code'] != 0 or final['passed_tests'] != 224
            or passed != [str(i) for i in range(1, 225)]
            or len(re.findall(r'^\s*224 passed \(4\.1m\)\s*$', log, re.MULTILINE)) != 1
            or len(re.findall(r'^e2e: Exitcode 0\s*$', log, re.MULTILINE)) != 1
            or re.search(r'\b(?:failed|skipped|flaky|timed out|interrupted)\b|^\s*[✘×]', log, re.IGNORECASE | re.MULTILINE)):
        raise ValueError('Browser-Endzustandsbeleg ohne vollständigen erfolgreichen Lauf der reduzierten Quelle')
    execution = manifest['isolated_frontend_sources']['execution']
    if proof['replacement_execution'] != execution:
        raise ValueError('Browserreduktion ohne zugehörigen bestandenen Ersatzlauf')
    reviewed = manifest['isolated_frontend_sources']['reviewed_cases']
    seen = set()
    for variant in proof['removed_variants']:
        cid, source = variant['canonical_scenario'], variant['replacement_case']
        if cid in seen or cid not in manifest['canonical_scenarios']:
            raise ValueError('Doppelte/unbekannte entfernte Browservariante')
        seen.add(cid)
        if reviewed.get(source, {}).get('mappings', {}).get(cid) != 'primary':
            raise ValueError('Entfernte Browservariante ohne bestandenen isolierten Hauptnachweis')
        if manifest['canonical_scenarios'][cid]['input_state'] != {'sample': variant['input']}:
            raise ValueError('Entfernte Browservariante hat andere Eingabe als Ersatz')
    retired = {cid for row in manifest['browser_inner_loops']
               for cid in row.get('retired_canonical_scenarios', [])}
    if seen != retired or not proof['retained_browser_observations']:
        raise ValueError('Browserreduktion ohne vollständige Varianten-/Grenzzuordnung')


def current_test_sources():
    paths = list((ROOT / 'backend/src/test/java').rglob('*.java'))
    paths += [p for p in (ROOT / 'frontend/e2e').rglob('*')
              if p.is_file() and p.suffix in {'.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs', '.json'}]
    paths += list((ROOT / 'frontend').glob('playwright*.config.*'))
    paths += list((ROOT / 'scripts/tests').glob('*.py'))
    return {str(path.relative_to(ROOT)) for path in paths}


def validate_sources(manifest):
    reviewed = {name for name in manifest['source_files_sha256']
                if name.startswith(('backend/src/test/java/', 'frontend/e2e/', 'scripts/tests/'))
                or (name.startswith('frontend/playwright') and '.config.' in name)}
    isolated = manifest.get('isolated_frontend_sources', {})
    isolated_files = isolated.get('files', {})
    actual_isolated = {str(path.relative_to(ROOT)) for path in (ROOT / 'frontend/src').rglob('*.spec.ts')}
    if actual_isolated != set(isolated_files):
        raise ValueError('Neue/entfallene isolierte Frontendquelle ohne Review')
    product_files = isolated.get('product_files', {})
    actual_product = {str(path.relative_to(ROOT)) for path in (ROOT / 'frontend/src').rglob('*')
                      if path.is_file() and path.suffix in {'.ts', '.html', '.css', '.scss'}
                      and not path.name.endswith('.spec.ts') and '/api/' not in str(path)
                      and '/testing/' not in str(path)}
    if actual_product != set(product_files):
        raise ValueError('Neue/entfallene produktive Frontendquelle ohne Review')
    for name, expected in product_files.items():
        if hashlib.sha256((ROOT / name).read_bytes()).hexdigest() != expected:
            raise ValueError('Produktive Frontendquelle seit Ausführungsreview geändert: ' + name)
    support_files = isolated.get('support_files', {})
    for name, expected in {**isolated_files, **support_files}.items():
        if hashlib.sha256((ROOT / name).read_bytes()).hexdigest() != expected:
            raise ValueError('Isolierte Frontendquelle seit Review geändert: ' + name)
    isolated_execution(manifest)
    validate_browser_reductions(manifest)
    current = current_test_sources()
    if current != reviewed:
        raise ValueError(f'Neue/entfallene Testquelle ohne Review: neu={sorted(current-reviewed)}, entfallen={sorted(reviewed-current)}')
    for name, expected in manifest['source_files_sha256'].items():
        if hashlib.sha256((ROOT / name).read_bytes()).hexdigest() != expected:
            raise ValueError('Quelle/Fixture seit semantischem Review geändert: ' + name)


def validate(manifest):
    if manifest.get('semantic_review_complete') is not True:
        raise ValueError('Semantischer Review ist nicht abgeschlossen')
    validate_sources(manifest)
    groups = manifest['scenarios']
    assignments = manifest['semantic_assignments']
    canonical = manifest['canonical_scenarios']
    for cid, scenario in canonical.items():
        for field, allowed in [('counting', COUNTING), ('scope', SCOPES), ('primary_test_type', TEST_TYPES)]:
            if scenario.get(field) not in allowed:
                raise ValueError('Unbekannter Klassifikationswert: ' + cid + '/' + field)
    for gid, group in groups.items():
        if group.get('primary_test_type') not in TEST_TYPES:
            raise ValueError('Unbekannte Quelltestart: ' + gid)
    if set(assignments) != set(groups):
        raise ValueError('Quellgruppen ohne vollständige semantische Zuordnung')
    referenced = set()
    for member, assignment in assignments.items():
        if not assignment.get('reason') or not assignment.get('canonical_scenarios'):
            raise ValueError('Leere semantische Entscheidung: ' + member)
        for cid in assignment['canonical_scenarios']:
            if cid not in canonical or member not in canonical[cid]['members']:
                raise ValueError('Inkonsistente kanonische Zuordnung: ' + member)
            referenced.add(cid)
    if referenced != set(canonical):
        raise ValueError('Verwaiste kanonische Szenarien')
    for cid, scenario in canonical.items():
        members = scenario['members']
        if len(members) != len(set(members)):
            raise ValueError('Doppelte Quellmitglieder: ' + cid)
        if scenario['primary_member'] not in members:
            raise ValueError('Primärnachweis ist kein Mitglied: ' + cid)
        primary = groups[scenario['primary_member']]
        if primary['primary_test_type'] != scenario['primary_test_type']:
            raise ValueError('Testart entspricht nicht echtem Primärnachweis: ' + cid)
        scopes = {'frontend' if groups[m]['primary_source'].startswith('FE:') else
                  'backend' if groups[m]['primary_source'].startswith('BE:') else
                  'infrastructure' for m in members}
        if scopes != {scenario['scope']}:
            raise ValueError('Backend-/Frontend-Nenner vermischt: ' + cid)
        for field in ('requirements', 'expected_property', 'required_integration', 'decision_reasons'):
            if not scenario.get(field):
                raise ValueError('Fehlende Szenarioeigenschaft: ' + cid + '/' + field)
        for member in members:
            if cid not in assignments[member]['canonical_scenarios']:
                raise ValueError('Fehlender Rückverweis: ' + cid)
            if groups[member]['remaining_integration'] not in scenario['required_integration']:
                raise ValueError('Integrationsschutz verloren: ' + cid)
    for case in manifest['cases'].values():
        expected = {cid for member in case['scenarios'] for cid in assignments[member]['canonical_scenarios']}
        if set(case['canonical_scenarios']) != expected:
            raise ValueError('Quellfall nicht vollständig im kanonischen Inventar')
    seen = set()
    for row in manifest['browser_inner_loops']:
        if row['id'] in seen:
            raise ValueError('Doppelte Browser-Schleifenreferenz')
        seen.add(row['id'])
        if not row['semantic_decision'] or not row['canonical_scenarios']:
            raise ValueError('Browser-Schleife ohne Entscheidung')
        if not set(row['canonical_scenarios']) <= set(canonical):
            raise ValueError('Unbekanntes Szenario einer Browser-Schleife')
        path = ROOT / 'frontend/e2e' / row['file']
        if hashlib.sha256(path.read_bytes()).hexdigest() != row['source_sha256']:
            raise ValueError('Browserquelle seit Schleifenreview geändert: ' + row['file'])
    return canonical


def summary(manifest):
    canonical = validate(manifest)
    result = {'source_cases': len(manifest['cases']), 'source_groups': len(manifest['scenarios']),
              'canonical_scenarios': len(canonical), 'inner_browser_loops': len(manifest['browser_inner_loops']),
              'semantic_review_complete': True, 'by_scope': {}}
    for scope in ('backend', 'frontend', 'infrastructure'):
        selected = [c for c in canonical.values() if c['scope'] == scope]
        business = [c for c in selected if c['counting'] == 'business']
        units = sum(c['primary_test_type'] in ('unit', 'component') for c in business)
        result['by_scope'][scope] = {'business_scenarios': len(business), 'unit_component_scenarios': units,
                                    'unit_component_percent': round(units / len(business) * 100, 2) if business else None,
                                    'types_including_infrastructure': dict(sorted(collections.Counter(c['primary_test_type'] for c in selected).items()))}
    result['cross_source_groups'] = sum(len({manifest['scenarios'][m]['primary_source'] for m in c['members']}) > 1 for c in canonical.values())
    return result


def main():
    manifest = json.loads((HERE / 'reviewed-scenario-manifest.json').read_text())
    canonical = validate(manifest)
    result = summary(manifest)
    fields = ['id', 'scope', 'rule', 'label', 'input_state', 'expected_property', 'primary_test_type',
              'primary_member', 'supplementary_members', 'requirements', 'risks', 'required_integration', 'decision_reasons']
    with (HERE / 'canonical-scenarios.csv').open('w') as output:
        writer = csv.DictWriter(output, fieldnames=fields, extrasaction='ignore', lineterminator='\n')
        writer.writeheader()
        for cid, row in sorted(canonical.items()):
            writer.writerow({'id': cid, **{k: json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else v for k, v in row.items()}})
    (HERE / 'semantic-summary.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
