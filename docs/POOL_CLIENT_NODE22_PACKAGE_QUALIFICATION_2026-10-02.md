# Synthetic-client correction: fresh package qualification

October 2, 2026. This checkpoint includes the maintained synthetic HTTP-agent
factory and its real-HTTP regression. It closes their fresh local full-suite
packaging gap, not production readiness or a hosted deployment. No app behavior,
provider configuration, purchase, commit or publication changed in this turn.

## Fresh installed artifacts and results

| Artifact/check                    | Evidence                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Runtime installed image           | `sha256:5af1f84edec89b2033b44ef94c4634f7b1d25cf6db2bce60eea05066387a869b`                                               |
| Integration-test installed image  | `sha256:fa61586d89c4cffc1b78f12815f5a952ac8b6a7dc50a55b03add71024dac3964`                                               |
| MySQL installed image             | `sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`                                               |
| Packaged runtime                  | Node 22.23.3, UID 1000; application sources and development tools absent                                                |
| Build typecheck/unit suite        | Exit 0; 987 tests / 97 files / 110.63s, including both new pool tests                                                   |
| Application build                 | Exit 0; Vite build 3.77s, server/operator bundles produced                                                              |
| Mandatory packaged database suite | Exit 0; 724 tests / 43 files / 284.70s, no skips; helper elapsed 294.099s                                               |
| Root operator suite               | 169 tests, zero failures/skips, 3,397.1589ms                                                                            |
| Compiled/migration parity         | Runtime and test image: 117 files, 6,992,219 bytes, digest below                                                        |
| Compiled server probes            | Private invalid-config refusal, occupied-port refusal/no fallback, actual health and clean TERM exit                    |
| Actual default startup            | Locked-migration TERM/INT cancellation, then migrations, HTTP health/readiness and clean drain; full case 47,473.3135ms |

Builds used the current root Dockerfile and frozen lockfile, without runtime source
replacement. Production dependency deployment was offline from the installed build
cache. Installed image identities were independently checked rather than using
configuration/attestation hashes as image IDs. Test image is not the pruned runtime.
No doctor result is claimed; these commands did not invoke it.

Combined `dist`/`drizzle` digest:
`8ffd506d17f7571763fb65a27cb934c1899a65a9e0805b7d55b73e808b334aaa`.
This matches the preceding Hong Kong/64-source compiled payload, but **does not
transfer every prior test's acceptance to these new image identities**. Parity
checks cover these files, not every dependency/layer or authenticated build
provenance. Fresh browser, recovery and corrected-helper workload checks on these
new images remain separate acceptance work.

Scoped current source/build digest:
`f524e1d2796b09edbdcae4b4f339e7650ceb3fb42b232be6f3e76d78acb0d951`.
The factory/harness correction and original red/green proof are in
[the retained diagnosis and earlier exact-image workload pass](HONG_KONG_64_SOURCE_PACKAGE_QUALIFICATION_2026-10-02.md#subsequent-load-client-transport-diagnosis).
Original r1 race-phase error remains precisely unproven; later observed overload
resets and pool-expiry regression are not retroactive identification of that error.

## Isolation, startup and retained receipts

Database acceptance used fresh synthetic-only MySQL, isolated loopback, no public
ports or source mounts. Database/test each bounded at two CPU/2GiB; database
read-only UID 999 and 1GiB temporary data. Test package used its own disposable
writable layer for Corepack/Vitest, not a writable host checkout. Actual migrations
and all required tests ran; no missing-database skips.

Default startup used the exact runtime's actual `node dist/start-runtime.js`, not
the server-only probe command. Its separate database and app bounds were one
CPU/1GiB each, read-only; database temporary data 768MiB. A read-only test observer
held the migration lock. TERM cancelled in 1,083ms and INT in 1,214ms, each within
the unchanged three-second combined process/database-release budget. No DDL or
server startup occurred during cancellation; observer's lock remained held.
After release, actual migrations ran, `/api/health` and `/api/ready` returned 200,
and shutdown emitted the expected clean acknowledgements. These bounds differ
from the load receipt and are not a capacity measurement.

All ten owned fixtures independently inspected stopped exit 0/no OOM/no public
ports, retained:

- Database-suite DB `878d6da7f252afd92d91ca9a68e94ec9c111ae5f169d8b531b9965de2a03c221`.
- Database-suite test `e201759f4e38a518ed582a1eb35f92c48bf8a0fe4e3dec5dd1e1ebb4771351b1`.
- Runtime parity `db98718b781e35e1ab37889d01b32d3ef6f9266aa4d92d57f50fb24846ca2b6f`.
- Test parity `fe8c1e1ff214c2f51eaa0570c157011e6725876e5efe94c24b3cf0ad56a326fa`.
- Compiled server probe `12c062f65e225d6bef90411a32eb1239849f7de1053a6fbdcff58e0ecd94aec1`.
- Startup DB `a90a44898be709849af0abd9df8a72bcc7ebda8b407a88cd39c008c91b4102b7`.
- Lock holder `772ddc1e5a9212386b8d066d38db1722baf722b33f9a3f49199c88149ed7e71d`.
- TERM runtime `c453979597dc32950f9882f12779a7d3e1ee1cb58f5a3bb3fd2cd2c875fa9b9e`.
- INT runtime `8916330cb8d3ad2a0b97a88ccfde726a9f2f4eb6068f6f2a9ba9b6a474708309`.
- Active runtime `13973dcebfe96ae5ccdb0927d830081c8f2139eb02d7f3a367e31be5ade789d9`.

Runtime parity/server probes had only a read-only external observation-helper
mount. Default startup apps/database had zero mounts; holder one read-only observer.
No application replacement, real customer data or live provider action. Stopping
temporary databases discards their synthetic contents, not user data or earlier
backups; no retained containers/images were deleted. Logs and inventory remain
outside source in `outputs/pool-fix-package-20261002-r1/`.

## Operating preparation and still-open launch gates

Prepared [dated budget candidates](OPERATING_BUDGET_CANDIDATES_2026-10-02.md) with
an EUR 80 allocation and EUR 20 reserve. Primary provider pages were read, but
complete tax-inclusive quotes, actual account caps and hosting/domain choice are
not verified. The untouched example still correctly exits 1 / `incomplete`, total
null and `providerEnforcementVerified:false`. No paid or free account was created.

Deployment guidance kept isolated packaging, actual startup and external
acceptance distinct. Still required: approved committed-source/registry release,
new-image connected acceptance, representative whole-product/open-loop/soak load,
real inbox/provider permissions, HTTPS/proxy/hosted monitoring, off-host key/backup
recovery and post-snapshot reconciliation, operator privacy/support decisions,
worldwide native-platform workflows and customer pilot. All original 116 phases
remain Partial; this is neither a public launch nor overall completion.
