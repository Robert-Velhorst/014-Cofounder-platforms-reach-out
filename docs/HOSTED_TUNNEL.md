> Historical repair receipt: the tunnel launcher is now retired. These commands are not current operating instructions. Public deployment targets Hetzner under `DEPLOYMENT_TARGET.md`.

# Controlled hosted tunnel: operator procedure and local repair receipt

October 2, 2026. This is preparation and local test evidence, not permission to
deploy, publish, buy a service, migrate a customer database or contact anyone.
The initial operating-budget ceiling remains EUR 100/month: EUR 80 planned
recurring costs and EUR 20 reserve. Provider/account choices are not approved.

## Preconditions and changed workflow

The old launcher could expose the local app before changing its settings and
retained the example database defaults. Do not use that sequence. The new
PowerShell wrapper delegates to a foreground Node coordinator. It supports
agent-assigned and explicitly supplied HTTPS URLs without exposing the app
while learning the URL. The ordinary local Windows launcher remains separate.

Before an authorized hosted rehearsal:

1. Complete the applicable release, privacy, provider and public-exposure gates.
   Review the actual ngrok account/configuration, inspection/retention settings,
   policies, costs and intended endpoint. Local host processes are trusted;
   the unauthenticated loopback Agent API is not a hostile-host security boundary.
2. Install/configure Node 22, Docker Compose and ngrok v3 separately. The helper
   does not install them, configure an account or purchase capacity. Port 4040
   must be unused and the reviewed agent must use its loopback API there.
3. Supply PRODUCTION_APP_IMAGE as an already available registry/name@sha256
   digest qualified from the approved source. Mutable tags are rejected; image
   signature, complete SBOM and publication review remain separate gates.
4. Set DATABASE_URL_SECRET_FILE and JWT_SECRET_FILE to existing protected files,
   following PRODUCTION_CONTAINER_RUNBOOK.md. Review their content, permissions,
   private database/network, grants and migration/backup plan separately. The
   coordinator does not certify secrecy or legal authority from path names.
5. Stop any conflicting local app on port 3014 yourself after checking ownership.
   The coordinator does not stop or reconfigure unrelated local services.
   Review any existing cofounder-hosted Compose project before invocation.

Only after separately authorizing both exposure and hosted startup, run:

```powershell
.\scripts\start-ngrok.ps1 -PublishConfirmed
# Or, for an approved URL the account may use:
.\scripts\start-ngrok.ps1 -PublishConfirmed -Url https://your-domain.ngrok.app
```

The switch is a deliberate operator acknowledgement, not independent verification
of authority. This command creates an endpoint and may start/migrate/recreate the
standalone hosted app; do not run it as a harmless readiness check. This repair
did not run either command. No customer database was touched.

## Actual sequencing and failure boundaries

The coordinator creates a loopback HTTP gate initially returning 503/no-store.
Its hidden ngrok child forwards to that gate, never directly to the app. Endpoint
discovery requires one exact gate-bound HTTPS endpoint, no pooling or nonempty
traffic policy, inspection disabled and any requested URL matched. Other running
agents are not selected. Unknown shapes/settings fail closed.

Only then does it use compose.production.yml with isolated project
cofounder-hosted, no build and no image pull. It never combines local Compose
or starts its MySQL example. PUBLIC_ORIGIN is the discovered origin and
TRUST_PROXY is true for the normalized relay-to-app hop. Before opening, actual
container inspection checks running identity/image, mode/origin/proxy/flags,
registration off, outreach paused, mail/retention/deletion-request gates off,
the separately gated inherited owner-notification path off,
no configured direct DB/session/provider/HAI secret values, loopback-only port,
non-root/read-only/capabilities/security/resource bounds and two read-only secret
mounts. Secret-file contents, actual database grants and Docker host enforcement
still need separate acceptance. Readiness and runtime health must match.

The gate requires the exact public Host and ngrok's last forwarded scheme to be
HTTPS. It rejects plaintext/mismatched ingress, strips Forwarded and all supplied
X-Forwarded chains and sends one normalized HTTPS scheme. It does not trust or
pass client IP chains: all clients share loopback-source admission buckets, a
conservative availability limitation needing real ingress/load acceptance.
WebSocket upgrades and CONNECT are refused. There is no HTTP gate-control API.
The relay caps active upstream requests at 32, connections at 64 and request
duration at 15 seconds; these limits are not measured customer capacity.

Keep the foreground coordinator running. It rechecks the same container and
agent every five seconds with bounded probes. This is periodic detection, not
an atomic guarantee against configuration changes between checks. Verification
failure or cancellation holds the gate, terminates current upstream requests,
closes forwarding and stops only its owned ngrok child. No registration/local
mode fallback runs. The hosted app remains loopback-only for operator inspection;
do not remove its data or restart unrelated services to hide a failure. Abrupt
host/process death can leave an agent process/endpoint needing manual cleanup,
but the vanished loopback gate no longer forwards app traffic. Success output
includes its PID, localPostureVerified and liveProviderAcceptance=false.

## Verification scope

The mandatory root/CI test:tunnel suite uses real loopback HTTP fixture servers
for held/open/reheld behavior and header normalization, plus injected lifecycle
adapters for discover/prepare/verify/cancellation/agent failures. It verifies
opening follows verification and holding precedes owned-agent cleanup. Container
posture mutations and endpoint-policy mismatches are rejected. Missing publication
confirmation and prerequisites fail before network/command work.

The installed CLI's read-only http --help confirmed --inspect and --url options.
The initial socket fixture used fetch, which did not produce the intended Host
header; that test failed and was corrected to an explicit HTTP request, then
passed. No false pass or live provider acceptance is claimed. See the current
verification report for actual test counts.

Final local rerun: 14 tunnel tests and all 133 root/operator tests passed with
zero failures or skips. PowerShell parsing, formatting, diff whitespace and the
retained-source traceability check passed (116 Partial, zero Missing/Implemented,
12 required artifacts, completionProven=false). App unit/database/build suites
were not rerun for this host-side-only repair; their earlier packaged receipts
remain dated evidence. The selected local release inventory is 513 files,
10,305,059 bytes, digest
567d672f2f09df93123fab5664f2bdc290abc754d6bc0cb751bd4332ed19f539.
It changed because the root test manifest changed; it excludes root operator
sources/docs, dependencies, secrets and host/container/provider state. Its build,
test and production acceptance flags all remain false.

Not yet verified: real ngrok/Docker startup coordination, custom agent config,
Windows shutdown and Docker Desktop secret mount behavior, HTTPS-only provider
routing/forwarding headers, cookie/browser acceptance, dashboard capture policy,
public monitoring, migrations/grants, billing and customer load. The current
app images were qualified before this host-side launcher change and do not prove
it. The dated managed threat model needs renewed review of changed sources.

Primary protocol references read for this repair:
[Agent API endpoint shape](https://ngrok.com/docs/gateway/agent/api) and
[upstream forwarding headers](https://ngrok.com/docs/gateway/endpoints/http).
These describe provider contracts, not observation of this account/deployment.
