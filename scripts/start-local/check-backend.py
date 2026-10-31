#!/usr/bin/env python3
"""Derselbe registrierte Linux-/v2-Nachweis wie im administrativen API-Guard."""
import importlib.util
from pathlib import Path
import sys
from types import SimpleNamespace

root = Path(__file__).resolve().parents[2]
specification = importlib.util.spec_from_file_location('api_release', root / 'scripts/api-release.py')
module = importlib.util.module_from_spec(specification)
specification.loader.exec_module(module)
try:
    release = root / 'backend/target/tnbp-0.1.0-SNAPSHOT.jar'
    guard = module.Guard(SimpleNamespace(state_dir=str(root / '.local/api-release'), release=str(release), tool_release=None))
    record = guard.read()
    valid = not record.get('stopped') and not record.get('pending') and guard.ready(record, sys.argv[1])
except (OSError, RuntimeError, ValueError, KeyError):
    valid = False
sys.exit(0 if valid else 1)
