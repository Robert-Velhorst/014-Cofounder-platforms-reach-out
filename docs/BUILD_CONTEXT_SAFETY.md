# Build-context privacy boundary

October 23, 2026 candidate: **source/native checks only; actual BuildKit and full
release acceptance pending**.

## Finding and change

The repository's Docker build and integration stages use `COPY . .`. Existing
rules excluded environment files, `.secrets` and several generated directories,
but omitted the backup/data/debug-bundle directories and key/recovery artifact
extensions already recognized by Git ignores. Root-only log/archive/installer
patterns also did not provide the intended arbitrary-depth exclusion.

The observed local `backups` directory was empty. No currently tracked source
file matched the newly excluded directories/private-artifact extensions. This
finding is not evidence that a secret was leaked, that an existing image contains
private data, or that a credential should be rotated without further evidence.
The runtime stage's explicit copy list is separate: it copies Node, the pruned
package/dependencies, compiled output and migrations, not the entire build stage.
That does not remove the build-context/intermediate-cache privacy boundary.

`.dockerignore` now excludes Git metadata, secrets/environment files, dependencies,
compiled/test/browser outputs, `.docker-deploy`, `backups`, `data`, debug bundles,
private-key/certificate archives, admin grants, encrypted recovery bundles,
partial files, PIDs, logs and generated installers/archives at every depth.
The public `.env.example` exception stays after environment-file exclusions.
`.gitignore` also recognizes `.p12` and `.pfx` private certificate archives.
Source, migrations, deployment scripts and real test-fixture directories are not
blanket-excluded. No local file, database, credential, history or volume is deleted.

[Docker's context documentation](https://docs.docker.com/build/concepts/context/#dockerignore-files)
states that ignore matches are removed before transfer, `**` spans zero or more
directories, later exceptions win, and per-Dockerfile ignore files take precedence.
The existing three Dockerfiles have no per-file override; native checks require
separate review before one is introduced. This is not a scanner for arbitrary
secret filenames or a guarantee for custom builders/contexts. Put runtime secrets
outside the source tree or in the ignored `.secrets` location, never in source,
public examples or the build's tracked `.npmrc`. Existing builder caches and
published images are not retroactively sanitized by new ignore rules.

## Required actual semantics gate

`pnpm test:build-context:integration` creates one new owned synthetic scratch
directory. It copies **only the repository's `.dockerignore`**, then writes a
constant, content-free synthetic string to 14 required-source fixture paths and
62 excluded artifact paths, spanning root and nested locations. It does not copy
real source, configuration, credentials, diagnostics, database contents or backups.

Buildx processes `FROM scratch` and `COPY . /visible/`, with no `RUN`, registry
base image, image load/push, running container, database or published port. The
output is a local filesystem export, not a deployable application image. The
gate requires all source fixtures and refuses every unexpected/private file;
Dockerfile/ignore metadata files may also be present. It tests Docker's actual
matching, not a handwritten glob approximation.

The command has a 60-second observation deadline and 1 MiB output bound; the
test has a 90-second outer deadline. Directory depth, entries and exported-file
counts are bounded, and links/special files refuse. Raw Docker output/file bodies
are not logged. Successful observation permits deletion only of the exact new
scratch root after parent, name, symlink and UUID-owner checks. A client timeout,
signal or observation error retains that synthetic scratch with a recovery
notice, without assuming the builder stopped, pruning anything or retrying.

The gate is mandatory once in `pnpm test:all` and the existing CI verify job,
before application image builds. It does not change the database/browser fixture
population, release deadlines, provider flags, production resource limits or CI
permissions. It adds a small scratch-only context export, not another service.

## Evidence and limits

Native tests check the exact exclusion/exception source contract, required paths,
all 62 forbidden path observations, omissions/duplicates/unknowns, bounded command
source, timeout-retention branch, syntax, and mandatory gate ordering. Removing
any required rule or adding another negation fails the native contract. This
contract is **not** Docker pattern matching or a successful image-build receipt.

The first full native run correctly failed the old exact `test:all` sequence after
the new required gate was inserted. The sequence assertion was updated to require
the new gate while preserving every existing gate. All 40 focused production/
release-contract cases then passed. All 236 native checks subsequently passed,
zero failures/skips (9,780.2783 ms), including both current source-inventory gates.
The actual previous ignore file was also rejected by the new source contract;
this is not a retrospective Docker export or leak reproduction.
The actual scratch BuildKit integration was
not run locally: previously protected local Docker/database fixtures remain
untouched. Full exact-head CI, actual export semantics, production build/runtime,
database, 34-stage browser/cold probes and security results remain required.
