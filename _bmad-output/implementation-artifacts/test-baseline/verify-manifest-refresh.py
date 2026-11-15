#!/usr/bin/env python3
"""Focused regression checks for fail-closed reviewed inventory refresh."""
import copy
import json
from pathlib import Path
import runpy
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
MANIFEST = json.loads((HERE / 'reviewed-scenario-manifest.json').read_text())
ORIGINAL_READ = Path.read_text


class ManifestRefreshTest(unittest.TestCase):
    def rejected(self, changed, message):
        def read(path, *args, **kwargs):
            if path == HERE / 'reviewed-scenario-manifest.json':
                return json.dumps(changed)
            return ORIGINAL_READ(path, *args, **kwargs)
        with patch.object(Path, 'read_text', read):
            with self.assertRaisesRegex(ValueError, message):
                runpy.run_path(str(HERE / 'refresh-source-inventory.py'))

    def test_new_source_case_cannot_receive_a_heuristic_assignment(self):
        changed = copy.deepcopy(MANIFEST)
        changed['cases'].pop(next(iter(changed['cases'])))
        self.rejected(changed, 'Unmapped source cases')

    def test_deleted_source_case_is_not_silently_kept(self):
        changed = copy.deepcopy(MANIFEST)
        changed['cases']['BE:DoesNotExist#removed'] = {}
        self.rejected(changed, 'stale manifest cases')

    def test_changed_source_fixture_requires_another_review(self):
        changed = copy.deepcopy(MANIFEST)
        changed['source_files_sha256'][next(iter(changed['source_files_sha256']))] = 'not-reviewed'
        self.rejected(changed, 'Quelle/Fixture seit semantischem Review')

    def test_unknown_scenario_reference_is_rejected(self):
        changed = copy.deepcopy(MANIFEST)
        changed['cases'][next(iter(changed['cases']))]['scenarios'] = ['SC:unknown']
        self.rejected(changed, 'Unknown reviewed scenario')


class SemanticReviewTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.api = runpy.run_path(str(HERE / 'semantic-scenarios.py'))

    def test_every_source_and_inner_loop_has_a_consistent_reviewed_assignment(self):
        self.api['validate'](MANIFEST)

    def test_unknown_classification_cannot_silently_change_denominator(self):
        for field in ('counting', 'scope', 'primary_test_type'):
            with self.subTest(field=field):
                changed = copy.deepcopy(MANIFEST)
                next(iter(changed['canonical_scenarios'].values()))[field] = 'typo'
                with self.assertRaisesRegex(ValueError, 'Unbekannter Klassifikationswert'):
                    self.api['validate'](changed)

    def test_new_browser_source_cannot_hide_behind_cached_discovery(self):
        validate_sources = self.api['validate_sources']
        original = validate_sources.__globals__['current_test_sources']
        with patch.dict(validate_sources.__globals__, current_test_sources=lambda: original() | {'frontend/e2e/new.spec.ts'}):
            with self.assertRaisesRegex(ValueError, 'Neue/entfallene Testquelle'):
                validate_sources(MANIFEST)

    def test_new_isolated_source_is_not_hidden_by_missing_vitest_discovery(self):
        changed = copy.deepcopy(MANIFEST)
        changed['isolated_frontend_sources']['files'].pop(next(iter(changed['isolated_frontend_sources']['files'])))
        with self.assertRaisesRegex(ValueError, 'isolierte Frontendquelle'):
            self.api['validate_sources'](changed)

    def test_changed_isolated_source_is_rejected(self):
        changed = copy.deepcopy(MANIFEST)
        name = next(iter(changed['isolated_frontend_sources']['files']))
        changed['isolated_frontend_sources']['files'][name] = 'changed'
        with self.assertRaisesRegex(ValueError, 'Frontendquelle seit Review'):
            self.api['validate_sources'](changed)

    def test_product_source_mutation_invalidates_the_successful_execution(self):
        name = next(iter(MANIFEST['isolated_frontend_sources']['product_files']))
        path = HERE.parents[2] / name
        original_bytes = Path.read_bytes
        def read_bytes(current):
            return original_bytes(current) + b'/* controlled product mutation */' if current == path else original_bytes(current)
        with patch.object(Path, 'read_bytes', read_bytes):
            with self.assertRaisesRegex(ValueError, 'Produktive Frontendquelle seit Ausführungsreview'):
                self.api['validate_sources'](MANIFEST)

    def test_successful_vitest_cases_cannot_disappear_from_review(self):
        changed = copy.deepcopy(MANIFEST)
        changed['isolated_frontend_sources']['reviewed_cases'].pop(next(iter(changed['isolated_frontend_sources']['reviewed_cases'])))
        with self.assertRaisesRegex(ValueError, 'Vitest-Quellfälle'):
            self.api['validate'](changed)

    def test_a_changed_execution_report_is_rejected(self):
        changed = copy.deepcopy(MANIFEST)
        changed['isolated_frontend_sources']['execution']['sha256'] = 'unreviewed'
        with self.assertRaisesRegex(ValueError, 'Ausführungsbeleg seit Review'):
            self.api['validate'](changed)

    def test_supplementary_vitest_case_cannot_become_primary_without_review(self):
        changed = copy.deepcopy(MANIFEST)
        primary = next(c for c in changed['canonical_scenarios'].values()
                       if changed['scenarios'][c['primary_member']]['primary_source'].startswith('FE:isolated:'))
        source = changed['scenarios'][primary['primary_member']]['primary_source']
        cid = next(cid for cid, c in changed['canonical_scenarios'].items() if c is primary)
        changed['isolated_frontend_sources']['reviewed_cases'][source]['mappings'][cid] = 'supplementary'
        with self.assertRaisesRegex(ValueError, 'Primärnachweis ohne bestandene Hauptzuordnung'):
            self.api['validate'](changed)

    def test_reduced_browser_variants_require_the_successful_primary_replacement(self):
        changed = copy.deepcopy(MANIFEST)
        proof = json.loads((HERE.parents[2] / changed['browser_reduction_evidence']['path']).read_text())
        variant = proof['removed_variants'][0]
        changed['isolated_frontend_sources']['reviewed_cases'][variant['replacement_case']]['mappings'][variant['canonical_scenario']] = 'supplementary'
        with self.assertRaisesRegex(ValueError, 'isolierten Hauptnachweis'):
            self.api['validate_browser_reductions'](changed)

    def test_reduced_browser_variants_require_unchanged_before_and_after_evidence(self):
        changed = copy.deepcopy(MANIFEST)
        changed['browser_reduction_evidence']['sha256'] = 'changed'
        with self.assertRaisesRegex(ValueError, 'Browser-Ersatzbeleg'):
            self.api['validate_browser_reductions'](changed)

    def test_final_browser_log_cannot_change_after_review(self):
        proof = json.loads((HERE.parents[2] / MANIFEST['browser_reduction_evidence']['path']).read_text())
        log_path = HERE.parents[2] / proof['post_reduction_browser_execution']['path']
        original_bytes = Path.read_bytes
        def read_bytes(path):
            return b'changed' if path == log_path else original_bytes(path)
        with patch.object(Path, 'read_bytes', read_bytes):
            with self.assertRaisesRegex(ValueError, 'Browser-Alt-/Neubeleg.*post_reduction'):
                self.api['validate_browser_reductions'](MANIFEST)

    def test_final_browser_log_requires_every_passed_case_and_successful_exit(self):
        proof = json.loads((HERE.parents[2] / MANIFEST['browser_reduction_evidence']['path']).read_text())
        log_path = HERE.parents[2] / proof['post_reduction_browser_execution']['path']
        log = log_path.read_text()
        for bad_log in (log.replace('✓    1 ', '     1 ', 1),
                        log.replace('e2e: Exitcode 0', 'e2e: Exitcode 1'),
                        log + '\n1 skipped\n'):
            with self.subTest(log_tail=bad_log[-40:]):
                def read(path, *args, **kwargs):
                    return bad_log if path == log_path else ORIGINAL_READ(path, *args, **kwargs)
                with patch.object(Path, 'read_text', read):
                    with self.assertRaisesRegex(ValueError, 'Browser-Endzustandsbeleg'):
                        self.api['validate_browser_reductions'](MANIFEST)

    def test_final_browser_log_is_bound_to_reduced_source(self):
        proof_path = HERE.parents[2] / MANIFEST['browser_reduction_evidence']['path']
        proof = json.loads(proof_path.read_text())
        proof['post_reduction_browser_execution']['source_sha256'] = 'another-source'
        def read(path, *args, **kwargs):
            return json.dumps(proof) if path == proof_path else ORIGINAL_READ(path, *args, **kwargs)
        with patch.object(Path, 'read_text', read):
            with self.assertRaisesRegex(ValueError, 'Browser-Endzustandsbeleg'):
                self.api['validate_browser_reductions'](MANIFEST)

    def test_unassigned_source_group_is_rejected(self):
        changed = copy.deepcopy(MANIFEST)
        changed['semantic_assignments'].pop(next(iter(changed['scenarios'])))
        with self.assertRaisesRegex(ValueError, 'Quellgruppen'):
            self.api['validate'](changed)

    def test_integration_cannot_be_relabelled_as_unit(self):
        changed = copy.deepcopy(MANIFEST)
        scenario = next(c for c in changed['canonical_scenarios'].values() if c['primary_test_type'] == 'HTTP/PostgreSQL')
        scenario['primary_test_type'] = 'unit'
        with self.assertRaisesRegex(ValueError, 'Testart'):
            self.api['validate'](changed)

    def test_merge_cannot_drop_required_real_integration(self):
        changed = copy.deepcopy(MANIFEST)
        scenario = next(c for c in changed['canonical_scenarios'].values() if len(c['required_integration']) > 1)
        scenario['required_integration'].pop()
        with self.assertRaisesRegex(ValueError, 'Integrationsschutz'):
            self.api['validate'](changed)

    def test_repeated_member_cannot_inflate_count(self):
        changed = copy.deepcopy(MANIFEST)
        scenario = next(iter(changed['canonical_scenarios'].values()))
        scenario['members'].append(scenario['members'][0])
        with self.assertRaisesRegex(ValueError, 'Doppelte Quellmitglieder'):
            self.api['validate'](changed)

    def test_same_expense_amount_rule_is_shared_by_unit_create_and_edit(self):
        groups = MANIFEST['scenarios']
        matches = [c for c in MANIFEST['canonical_scenarios'].values()
                   if c['rule'] == 'expense.amount' and c['input_state'] == {'field': 'amount', 'value': '0'}]
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0]['primary_test_type'], 'unit')
        sources = {groups[m]['primary_source'].split(':')[1] for m in matches[0]['members']}
        self.assertIn('ExpenseTest#nameUndPositiveGanzeSichereCentSindErforderlich', sources)
        self.assertIn('ExpenseIT#jsonTypenFeldfehlerUndFremdeEigentuemerOderDatumsfelderErzeugenKeineMutation', sources)
        self.assertIn('ExpenseIT#putLehntStriktesJsonUndUngueltigeFelderOhneRundungAb', sources)

    def test_responsive_duplicates_share_scenario_and_keep_all_sources(self):
        cases = [c for source, c in MANIFEST['cases'].items() if source.startswith('FE:monthly-automation.spec.ts:')
                 and c['expected_variant'].startswith('Auswahl, gemeinsame 350-/0-Anzeige und 200 % Text bei ')]
        self.assertEqual(len(cases), 4)
        common = set.intersection(*(set(c['canonical_scenarios']) for c in cases))
        self.assertTrue(common)
        self.assertTrue(any(len(MANIFEST['canonical_scenarios'][cid]['members']) == 4 for cid in common))

    def test_inner_browser_error_variants_are_not_hidden_by_discovery_title(self):
        loop = next(row for row in MANIFEST['browser_inner_loops'] if row['file'] == 'expense-mutations.spec.ts'
                    and row['expression'].startswith("['network', 'server', 'missing', 'id'"))
        self.assertEqual(len(loop['canonical_scenarios']), len(set(loop['values'])))
        self.assertGreater(len(loop['canonical_scenarios']), 1)


if __name__ == '__main__':
    unittest.main()
