"""Owned hosted DB image metadata checks. Archive identity function is copied unchanged
from Robert-Velhorst/022-Simbi-Reach-out@6d4eb2d, scripts/archive_image_identity.py.
No application or vendor SDK imports; no database startup or operator data access.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import tarfile

def archive_identity(archive: Path, inspections: list, tag: str) -> dict:
    if len(inspections) != 1:
        raise ValueError("Exactly one inspected image is required")
    inspection = inspections[0]
    if tag not in inspection.get("RepoTags", []):
        raise ValueError("The inspected image does not have the expected tag")
    with tarfile.open(archive, "r:*") as bundle:
        def read(name: str) -> bytes:
            member = bundle.getmember(name)
            if not member.isfile() or member.size > 8 * 1024 * 1024:
                raise ValueError("Unexpected image metadata member")
            return bundle.extractfile(member).read()

        entries = [entry for entry in json.loads(read("manifest.json"))
                   if tag in entry.get("RepoTags", [])]
        if len(entries) != 1:
            raise ValueError("The saved archive must identify exactly one tagged image")
        config_name = entries[0]["Config"]
        config_bytes = read(config_name)
        config_id = "sha256:" + hashlib.sha256(config_bytes).hexdigest()
        if config_name not in {"blobs/sha256/" + config_id[7:], config_id[7:] + ".json"}:
            raise ValueError("The saved configuration filename does not match its bytes")
        config = json.loads(config_bytes)
        if (inspection.get("Architecture") != config.get("architecture")
                or inspection.get("Os") != config.get("os")
                or inspection.get("RootFS", {}).get("Layers") != config.get("rootfs", {}).get("diff_ids")):
            raise ValueError("Inspected platform or filesystem differs from the saved image")
        root_id = inspection["Id"]
        if not re.fullmatch(r"sha256:[a-f0-9]{64}", root_id):
            raise ValueError("Invalid inspected image identifier")

        def reachable_configs(digest: str, depth: int = 0) -> set[str]:
            if depth > 4 or not re.fullmatch(r"sha256:[a-f0-9]{64}", digest):
                raise ValueError("Unexpected image descriptor graph")
            payload = read("blobs/sha256/" + digest[7:])
            if "sha256:" + hashlib.sha256(payload).hexdigest() != digest:
                raise ValueError("Image descriptor checksum mismatch")
            descriptor = json.loads(payload)
            if "config" in descriptor:
                return {descriptor["config"]["digest"]}
            children = descriptor.get("manifests", [])
            if not children or len(children) > 100:
                raise ValueError("Missing or oversized image descriptor graph")
            found = set()
            for child in children:
                found.update(reachable_configs(child["digest"], depth + 1))
            return found

        # Classic Docker IDs are configuration hashes. Containerd can expose a
        # manifest/index hash instead: verify its actual archive descriptor chain.
        if root_id != config_id and config_id not in reachable_configs(root_id):
            raise ValueError("The inspected descriptor does not select this configuration")
    with archive.open("rb") as stream:
        archive_digest = hashlib.file_digest(stream, "sha256").hexdigest()
    return {"tag": tag, "docker_image_id": root_id, "config_id": config_id,
            "archive_sha256": archive_digest, "architecture": config["architecture"],
            "os": config["os"], "diff_ids": config["rootfs"]["diff_ids"],
            "verified_descriptor_chain": True}

assert os.environ.get('GITHUB_ACTIONS')=='true'
assert os.environ.get('GITHUB_REPOSITORY')=='Robert-Velhorst/014-Cofounder-platforms-reach-out'
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'.qualification/database-os'
phase=sys.argv[1]
assert phase in {'identity','verify'} and len(sys.argv)==2
def save(name,value):
    (OUT/name).write_text(json.dumps(value,indent=2)+'\n',encoding='utf-8')
if phase=='identity':
    identity=archive_identity(OUT/'image.tar',json.loads((OUT/'inspect.json').read_text()),'cofounder-database-os:qualification')
    save('identity.json',identity)
else:
    scan=json.loads((OUT/'scan.json').read_text())
    identity=json.loads((OUT/'identity.json').read_text())
    version=(OUT/'mysqld-version.txt').read_text().strip()
    findings=[v for result in scan.get('Results',[]) for v in result.get('Vulnerabilities',[])]
    save('summary.json',{'image_id':scan.get('Metadata',{}).get('ImageID'),'identity':identity,
        'actual_mysqld':version,'os':scan.get('Metadata',{}).get('OS'),'findings':findings,
        'full_application_DB_SDK_or_live_data_acceptance':False})
    assert scan['SchemaVersion']==2 and scan['ArtifactType']=='container_image'
    assert scan['Metadata']['ImageID']==identity['config_id']
    assert scan['Metadata']['OS']['Family']=='oracle' and scan['Metadata']['OS']['Name']=='9.8'
    assert scan['Metadata']['OS'].get('EOSL',False) is False
    assert re.search(r'\bVer 26[.]10[.]0\b',version), 'Engine changed; review actual stable version before adoption'
    assert scan['Results']
    os_packages=0
    for result in scan['Results']:
        assert result.get('Class') in {'os-pkgs','lang-pkgs'} and result.get('Target')
        assert result.get('Packages') and isinstance(result['Packages'],list)
        if result['Class']=='os-pkgs':
            assert result.get('Type')=='oracle'
            os_packages+=len(result['Packages'])
        assert all(isinstance(pkg.get('Name'),str) and pkg['Name'] and isinstance(pkg.get('Version'),str) and pkg['Version'] for pkg in result['Packages'])
        for name in ['Vulnerabilities','ExperimentalModifiedFindings']:
            assert name not in result or isinstance(result[name],list) and not result[name], 'Unresolved findings: '+name
    assert os_packages>0, 'Missing actual Oracle OS inventory'
    save('verified.json',{'passed':True,'scope':'exact recorded database OS package image only',
        'actual_mysqld':version,'image_id':identity['config_id'],'findings':0,
        'whole_application_DB_SDK_or_live_data_acceptance':False})
