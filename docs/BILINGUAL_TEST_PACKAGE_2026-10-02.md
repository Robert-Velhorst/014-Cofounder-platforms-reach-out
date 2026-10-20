# Current bilingual source: locked test-package qualification

Later this day the [bilingual production runtime](BILINGUAL_RUNTIME_ACCEPTANCE_2026-10-02.md)
was rebuilt and separately qualified in browser/recovery checks. The limits below
describe this earlier test-package checkpoint, not an ongoing runtime-build gap.

October 2, 2026. The deployment-patterns skill guided isolated package/database
qualification. This is local test evidence, not deployment, provider approval,
worldwide completeness or whole-product acceptance. No commit, publication,
purchase, live account operation or message delivery occurred.

## Toolchain observation corrected

An initial concern compared Windows Vite7 with figures labelled Vite6. Inspection
showed those earlier figures were build durations, not major versions. The current
manifest declares ^7.1.7; the lock resolves7.3.6; Windows installation and the
previous test image89a20fe5... both report7.3.6. The new test image below directly
reports Node22.23.3/Vite7.3.6. No dependency declaration or lock change was needed.
The pruned production image has no installed Vite; its transformed package metadata
is not evidence of an installed build tool. No version-drift diagnosis is claimed.

## New package and source identity

Root Dockerfile integration-test target build session **72480 ended with exit0**.
Frozen dependency-install layers were cached; current source was copied and built.
Normal build-network policy was used, not clean-cache/offline reproducibility.
Local tag cofounder-local-bilingual-tests-20261002-r1 resolves to exact inspected
ID **sha256:1d08ad50638924f2ef64c5c26b2e374b53c6f06248bd8128812d1accc870f8cd**,
reported size280,614,779bytes. Qualification uses the ID, not merely the tag.

Read-only/no-network/non-root inspection compared four source hashes to the host:

| File within the application                    | SHA256                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| client/src/components/ConversationControls.tsx | 3924928f0aae36f9c5b0da680a1a56fd366d93d6f6a089ea16c1aae0840007d7 |
| client/src/components/FollowUpQueue.tsx        | 92e87d48e8db18365f97ebb2b6224a39eb616c3360e2b93a59c314c01e08a77d |
| server/conversation-screen.test.ts             | 4c4259f51d03ef5866ea325d5cd8afc398e47f86f5f92fe3e16fafa64adda430 |
| server/reminder-language.test.ts               | 3f240819c02a2b56babeb7cc82a5e829c74d3fc36c28e4462d1423b3f62fd103 |

All four match. This comparison is deliberately scoped, not a full image/source
closure or signed build-provenance claim. Selected source/build inventory remains
534files/10,519,674bytes/1257bf49fd614fe1f1416b48238aa2b76a37c7641d0d33ad3e0bfeab1c7b3e97,
excluding root/operator/docs/dependencies/image layers. CheckoutHEAD remains
89557fbc359cfb8e487c5aad1a8e3834c4aa2ceb; the dirty checkout is not main.

## Full real-database suite

External outputs/bilingual-packaging-20261002-r1/database.mjs preserves the
validated helper, hashf81d7fa7e07b1d9ee6a14e9eaec9f16b1a80da3b9202a89c647b321429bd82e9.
Force-failure mode explicitly false. New exact test image plus retained exact
MySQL8.4.11 image b3b90af2...; synthetic data, no source/dependency mounts or public
ports. Database runs UID999/read-only/tmpfs/networknone; test image uses its default
root test environment with2CPU/2GiB/512PIDs, dropped capabilities/no-new-privileges,
bounded temporary storage and shared isolated database network. These test-image
privileges are not production-runtime acceptance.

No concurrent build/unit workload was started while this suite ran. Migration and
the complete declared integration command executed from the image. **43585 ended
with exit0:724tests/43files/no skips**,312.68seconds; helper measured321.389seconds.
The unchanged two-real-process DDL migration serialization case passed2339ms.
An earlier image's contention-era failure remains in its historical receipt;
this pass does not prove its cause or representative-load reliability.

Independent inspection confirmed both fixtures stopped/exit0/noOOM:

- Test e8494d588bae6c8008117b30c530e7e8a4729a594a3f703363b58acf19389bee.
- Database1f938223bd29af1f0a7c202ea3425372da3ee36a6f1b9c616844165ef9d48f0e.

## Full unit suite and remaining boundaries

Only after database completion, exact-image/no-network/no-source-mount unit run
**48079 ended with exit0**:typecheck then **837tests/83files/no skips**,144.49seconds.
It used2CPU/2GiB/512PIDs, dropped capabilities/no-new-privileges and bounded /tmp;
the writable default-root disposable test container was auto-removed on completion.
No separate post-removal container OOM/state inspection is claimed for this run.

Both new bilingual suites ran inside this locked package. Inherited unit fixtures
and provider-fallback checks are not proof of live integrations. The production
runtime has not yet been rebuilt with these translations, and this new test
package has not itself completed browser or backup/recovery qualification. Earlier
[connected frontend evidence](CONVERSATION_LANGUAGE_2026-10-02.md) used a compiled
frontend mount on the previous production runtime; keep those scopes separate.

README now leads with a plain-language product description, limitations and four
verified heading links before dated release evidence. Historical136/133/797/etc.
counts are checkpoints, not aggregated newest-source acceptance. Complete
translation, privacy/retention/erasure, real inbox/provider, hosted operation,
remote recovery and the116-phase outcome remain open.
