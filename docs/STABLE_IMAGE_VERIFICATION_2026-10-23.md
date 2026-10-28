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

The first hosted search used a ten-result cap, which Grype treats as an error
when the query has more matches. The corrected query is restricted to OpenSSL
records for Ubuntu 26.10 from the Ubuntu provider, with no truncation. The
preceding base scan correctly detected Ubuntu 26.10 and a valid current database;
its Go findings concern the unmodified public base's Pebble helper. That alone
does not prove OS advisory coverage or application-image acceptance.

At head `e52df801fa5ad9a740ec51d1b5ef388b0aeb1232`, the corrected hosted
coverage probe passed. Its downloaded database search contains seven active
Canonical OpenSSL advisory records explicitly scoped to Ubuntu 26.10. This
establishes release-feed capability; it does not mean that all OS packages or
the application image have passed a security assessment.

The next follow-up collects a complete Syft 1.55.0 SBOM from the saved final
application image, scans that exact SBOM with Grype 0.121.0, and retains the
matching Ubuntu feed rows and archive hash. Both tools are digest-pinned.
The summarizer requires OS inventory, every direct Node dependency and current
database metadata; it retains every finding and always reports
`securityAcceptance: false`. The existing strict Trivy gate remains in place
until these actual reports are independently inspected. No finding is hidden.

The first downloaded application capture at head `65f6c80` contains 593
packages: 204 Debian-format Ubuntu packages, 388 npm entries and one native
binary. Grype reports zero matches. The summary correctly failed on its initial
use of the human-readable Syft `version` rather than machine `versionID`;
the corrected summary verifies both distribution ID and version ID. It also
handles the pinned presenter's omitted empty `ignoredMatches` field.

Inspection revealed default Grype kernel-header ignore rules and omitted
matcher-suppressed classifications. None of the named kernel-header packages
is present in that captured SBOM, but the default policy is still insufficient
for the intended evidence record. An explicit read-only scanner configuration
now enables upstream kernel-header matching and retains internal suppressions,
with no user ignore rules, exclusions, fix-state filtering or VEX additions.
The summary verifies that effective configuration. Vendor-fixed/not-affected
classifications remain evidence to review; they are not all vulnerabilities.
The next capture must qualify this configuration before security acceptance.

Downloaded head `54981c3` now passes evidence completeness under that explicit
policy: 593 packages, 69 direct runtime dependencies, zero reported findings
and zero ignored findings. The independent OS inventories agree on every one
of their 204 package names and complete Debian versions once Trivy's separate
epoch/version/release fields are reconstructed. The raw reports are retained.

Two Syft entries have `UNKNOWN` versions: `chart.js-auto` and
`chart.js-helpers`. These are private subpackage manifests within Chart.js
4.6.1, not independent releases. Their manifests and the versioned parent
manifest were matched by SHA-256 against the integrity-verified
[official npm release archive](https://registry.npmjs.org/chart.js/4.6.1).
The new verifier requires these exact file hashes, private metadata, locations
and the scanned parent version; other unresolved components are rejected.
It does not rewrite the SBOM or remove a scanner finding.

The new OS/Node package policy replaces the incompatible Trivy-only Ubuntu
metadata check. It binds both scanners to the saved runtime image ID, verifies
image manifest/config hashes, requires current Canonical feed coverage, all
direct dependencies, consistent full OS inventories and zero findings or
ignored findings in either scanner. It also requires the actual trusted-browser
report. The old Trivy report remains untouched, and every reported finding
still fails. The new policy passes locally against the downloaded head 54981c3
reports, with the independent Trivy image ID as the comparison reference.
Hosted qualification additionally captures the image ID directly from Docker.

This is OS/Node package vulnerability policy only. It does not establish
browser-binary vulnerability, untrusted-page, provider, deployment or complete
portfolio security acceptance.

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

The follow-up produces a build evidence manifest binding the Caddy binary,
compiled package list, Go module information and build environment by hash.
An automated advisory assessment verifies the current official package scope,
source archive, build profile, full compile graph and matching runtime hash.
It reports `not_affected` only when every advisory package is absent. Changed
scope, incomplete/mixed evidence or an included OpenPGP package fail. The
assessment retains the raw advisory and all other findings; the native scan
still fails and whole-image acceptance remains false. New-image hosted
qualification is required before relying on this assessment.

Downloaded head `999948a` confirms the automated assessment succeeds: the
runtime/build binary hashes agree, the captured graph has 1,031 packages,
none of the seven affected packages is included, and the edge scan has no
other findings. The following policy now consumes that verified assessment.
It collects complete raw scans independently of their finding count, fails on
scanner errors, recomputes the assessment and rejects every other finding.
It also binds both scan reports to Docker-captured image IDs, requires the
actual MySQL version and complete database inventory, and rejects expired OS
metadata, modified findings or missing evidence. The raw OpenPGP finding is
retained and explicitly classified, never removed or generally ignored.

The Go scan inventory must cover every linked module in the binary build
information, plus Go 1.27.3's standard library. The current data verifies all
159 dependency modules. The locally built Caddy main module lacks a version in
Go metadata, so a separate timestamped
[OSV version query](https://google.github.io/osv.dev/api/) checks the verified
upstream source version `github.com/caddyserver/caddy/v2@v2.11.7`. The inspected
query reports no advisories. An unavailable, malformed, stale, paginated or
nonempty response blocks the native policy. This source-version query does not
alter the original binary metadata or replace dependency scanning.

The complete native policy passes locally against the downloaded 999948a
reports and a live OSV response, using the independent scanner image IDs for
that local comparison. New hosted execution additionally captures both IDs
directly from Docker. Native package-policy acceptance is narrower than
whole-image, browser, provider or deployment acceptance; those remain unproved.

## Local verification of the follow-up

The inspected official Caddy image retains Alpine 3.23.7, while Alpine's
[current stable release](https://alpinelinux.org/downloads/) is 3.24.3, released
21 October 2026. The follow-up rebuilds the runtime on digest-pinned Alpine
3.24.3 and explicitly targets the builder's Alpine 3.24 line. It preserves
certificate installation, the curl health probe, XDG persistence paths, the
explicit Caddy command, internal high ports and UID/GID 1000. No file capability
or libcap helper is required. CI must verify the actual OS version, TLS/session,
recovery, workload and all-severity scan results on this new image.

All 214 operator/configuration tests pass with Node 26.12.1. Workflow YAML
parses. This does not replace hosted browser, image or application checks.
The TypeScript vendor compiler's bundled Go/libraries remain separate work.
