#!/usr/bin/env bash
# Evidence collection only. Existing strict application security gates remain.
set -Eeuo pipefail
test "$#" -eq 0
test -n "${GITHUB_WORKSPACE:?Hosted workspace required}"
test -n "${RUNNER_TEMP:?Hosted temporary directory required}"
test -s output/app-image.tar
test "$(df -Pk "$RUNNER_TEMP" | awk 'NR==2 {print $4}')" -ge 2097152
mkdir -p "$RUNNER_TEMP/cofounder-syft-scratch" "$RUNNER_TEMP/cofounder-app-grype-cache"
chmod 0700 "$RUNNER_TEMP/cofounder-syft-scratch" "$RUNNER_TEMP/cofounder-app-grype-cache"
sha256sum output/app-image.tar > output/ubuntu-app-archive-sha256.txt
docker run --rm --read-only --network none --cap-drop ALL --security-opt no-new-privileges \
  --user "$(id -u):$(id -g)" --cpus 1 --memory 2560m --memory-swap 2560m --pids-limit 128 \
  -e HOME=/tmp -e GOMEMLIMIT=512MiB \
  --mount "type=bind,source=$RUNNER_TEMP/cofounder-syft-scratch,target=/tmp" \
  --mount "type=bind,source=$GITHUB_WORKSPACE/output/app-image.tar,target=/scan/image.tar,readonly" \
  anchore/syft:v1.55.0@sha256:4cc92b64ca74ffca4c94d4c8fcc01f217731375300be14d0b6eeb2e82eaa110a \
  docker-archive:/scan/image.tar --scope squashed --output syft-json > output/ubuntu-app-sbom.json
test -s output/ubuntu-app-sbom.json
chmod 0444 output/ubuntu-app-sbom.json
docker run --rm --read-only --cap-drop ALL --security-opt no-new-privileges \
  --user "$(id -u):$(id -g)" --cpus 1 --memory 2560m --memory-swap 2560m --pids-limit 128 \
  --tmpfs /tmp:rw,size=512m,mode=1777 -e HOME=/tmp -e GRYPE_DB_CACHE_DIR=/cache -e GOMEMLIMIT=512MiB \
  --mount "type=bind,source=$RUNNER_TEMP/cofounder-app-grype-cache,target=/cache" \
  --mount "type=bind,source=$GITHUB_WORKSPACE/output/ubuntu-app-sbom.json,target=/scan/sbom.json,readonly" \
  anchore/grype:v0.121.0@sha256:621d56d1d68106b787022c81546f7e0a36202a25d1239f0c20195fab8c16f7ea \
  sbom:/scan/sbom.json --output json > output/ubuntu-app-grype.json
docker run --rm --read-only --cap-drop ALL --security-opt no-new-privileges \
  --user "$(id -u):$(id -g)" --cpus 1 --memory 2560m --memory-swap 2560m --pids-limit 128 \
  --tmpfs /tmp:rw,size=512m,mode=1777 -e HOME=/tmp -e GRYPE_DB_CACHE_DIR=/cache -e GOMEMLIMIT=512MiB \
  --mount "type=bind,source=$RUNNER_TEMP/cofounder-app-grype-cache,target=/cache" \
  anchore/grype:v0.121.0@sha256:621d56d1d68106b787022c81546f7e0a36202a25d1239f0c20195fab8c16f7ea \
  db search --pkg openssl --distro ubuntu:26.10 --provider ubuntu --limit 0 --output json > output/ubuntu-app-feed.json
node scripts/summarize-ubuntu-image-evidence.mjs > output/ubuntu-app-evidence-summary.json
