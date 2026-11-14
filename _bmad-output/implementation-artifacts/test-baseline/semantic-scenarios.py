#!/usr/bin/env python3
"""Prüft und rendert explizit geprüfte Szenarioäquivalenzen; keine Auto-Zuordnung."""
import collections
import csv
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
SCOPES = {'backend', 'frontend', 'infrastructure'}
COUNTING = {'business', 'infrastructure'}
TEST_TYPES = {'unit', 'component', 'adapter', 'architecture', 'tool/infrastructure',
              'HTTP/PostgreSQL', 'PostgreSQL', 'process/PostgreSQL', 'browser'}


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
