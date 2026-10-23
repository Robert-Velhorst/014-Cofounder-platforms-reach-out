# Stable image verification, 23 October 2026

This draft targets Hetzner and current public stable dependencies. It does not
authorize deployment, provider browsing or an operator database migration.

## Corrected browser evidence

At commit `0eddd380c33bb32552f5c234c3668b0f20b60b25`, CI run `40004256220`
reported a successful installed-browser step, but its JSON artifact was empty.
Docker had not forwarded stdin to Node. That step is **not browser evidence**.

The follow-up uses `--interactive`, requires a nonempty report and validates its
runtime, identity, browser version, adapter hash and both DOM interactions.
Regression checks reject missing stdin, empty reports and incomplete results.
Hosted execution remains required. The probe uses trusted inline content only,
with no network or persistent mounts; the existing adapter disables Chromium
sandboxing. This does not qualify untrusted pages or live provider sessions.

## Production image and scanner coverage

The downloaded app scan identifies the official Ubuntu 26.10 image as Debian
forky/sid. Its zero OS findings do not establish Ubuntu security coverage.
Trivy 0.76.1's Ubuntu analyzer relies on `etc/lsb-release`, and the inspected
Ubuntu detector/database mappings stop at 26.04. Changing release metadata
alone would not supply vulnerability data for 26.10. The strict app inventory
validator continues to reject a different distribution or release.

The same report finds 14 vulnerabilities in the Go runtime embedded in
`/usr/bin/pebble`. The image directly executes Node and uses Docker init;
repository source and image entrypoint inspection found no Pebble caller.
The follow-up removes this unused executable from the actual runtime image.
The next scan must confirm the result.

A separate CI job probes pinned Grype 0.121.0 against the public Ubuntu base
and searches its database for actual active Canonical Ubuntu 26.10 records.
Both the detected distribution and matching feed records are required. This is
scanner capability evidence only: it does not assert vulnerability acceptance
or replace the existing strict application-image scan. Grype's matches alone
are not a complete installed-package inventory. No scanner result is waived.

The local bounded Grype probe exited 137; Docker events confirmed an OOM.
A larger attempt did not launch because the host memory guard failed. Hosted
CI provides the next capability probe; local OOM is not a coverage result.

## Edge and database evidence at the preceding commit

The downloaded database scan covers 116 packages with no reported findings.
The Caddy scan retains `GO-2026-5932`; its raw scan gate still fails.
Actual build/runtime binary hashes match, and the captured 1,031 compiled
dependency paths contain none of the advisory's seven OpenPGP package paths.
This is applicability evidence to evaluate, not a suppressed or closed finding.

The exact Go advisory is available at
<https://vuln.go.dev/ID/GO-2026-5932.json>. Scanner investigation used the
versioned upstream Trivy analyzer/detector source and Grype's database-search
schema. Runtime, build and scanner reports must stay tied to their commit.

## Local verification of the follow-up

All 209 operator/configuration tests pass with Node 26.12.1. Workflow YAML
parses. This does not replace hosted browser, image or application checks.
The TypeScript vendor compiler's bundled Go/libraries remain separate work.
