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
