"""Owned metadata-only qualification. No application or SDK imports."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess

assert os.environ.get('GITHUB_ACTIONS') == 'true'
assert os.environ.get('GITHUB_REPOSITORY') == 'Robert-Velhorst/014-Cofounder-platforms-reach-out'
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts' / 'cofounder-lock'
OUT.mkdir(parents=True, exist_ok=True)

def save(name, data):
    (OUT / name).write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')

def snapshot():
    names = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
    return {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in names if name}

def prepare():
    save('original-source-hashes.json', snapshot())
    save('input.json', {'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT).decode().strip(),
                        'command': ['pnpm', '--recursive', 'update', 'body-parser', '--depth', 'Infinity', '--lockfile-only', '--ignore-scripts', '--no-save'],
                        'no_manifest_policy_or_override_change_authorized': True})

def resolve():
    command = ['pnpm', '--recursive', 'update', 'body-parser', '--depth', 'Infinity', '--lockfile-only', '--ignore-scripts', '--no-save']
    with (OUT / 'resolve.log').open('wb') as stream:
        result = subprocess.run(command, cwd=ROOT, stdout=stream, stderr=subprocess.STDOUT, check=False)
    save('resolve-result.json', {'command': command, 'returncode': result.returncode})
    raise SystemExit(result.returncode)

def collect():
    original = json.loads((OUT / 'original-source-hashes.json').read_text())
    current = snapshot()
    changed = [name for name, value in original.items() if current.get(name) != value]
    save('source-preservation.json', {'tracked_payloads': len(original), 'changed': changed,
         'only_normal_lock_changed': set(changed) <= {'pnpm-lock.yaml'}, 'full_SDK_or_runtime_acceptance': False})
    assert original.keys() == current.keys()
    assert set(changed) <= {'pnpm-lock.yaml'}
    shutil.copyfile(ROOT / 'pnpm-lock.yaml', OUT / 'pnpm-lock.yaml')

parser = argparse.ArgumentParser()
parser.add_argument('phase', choices=['prepare', 'resolve', 'collect'])
{'prepare': prepare, 'resolve': resolve, 'collect': collect}[parser.parse_args().phase]()
