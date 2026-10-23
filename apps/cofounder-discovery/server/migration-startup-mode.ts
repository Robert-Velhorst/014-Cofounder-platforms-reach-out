/** Explicit choices only: verification is not permission to skip the DB guard. */
export function startupMigrationArguments(value: string | undefined): string[] {
  if (value === undefined || value === "apply") return [];
  if (value === "verify") return ["--verify-only"];
  throw new Error("runtime_migration_mode_invalid");
}

export function migrationVerificationOnly(
  arguments_: readonly string[]
): boolean {
  const args = arguments_[0] === "--" ? arguments_.slice(1) : arguments_;
  if (args.length === 0) return false;
  if (args.length === 1 && args[0] === "--verify-only") return true;
  throw new Error("migration_arguments_invalid");
}
