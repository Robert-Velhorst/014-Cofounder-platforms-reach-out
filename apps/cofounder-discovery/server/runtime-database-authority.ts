/** Conservative MySQL SHOW GRANTS grammar; unknown authority fails closed. */
export function confinedRuntimeDml(
  grants: unknown,
  database: unknown,
  currentRole: unknown,
  mandatoryRoles: unknown
): boolean {
  if (
    currentRole !== "NONE" ||
    mandatoryRoles !== "" ||
    typeof database !== "string" ||
    !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(database) ||
    !Array.isArray(grants) ||
    grants.length === 0 ||
    grants.length > 32 ||
    grants.some(row => typeof row !== "string" || row.length > 4096) ||
    new Set(grants).size !== grants.length
  )
    return false;
  const expectedScope = "`" + database.replaceAll("_", "\\_") + "`.*";
  const allowed = new Set(["SELECT", "INSERT", "UPDATE", "DELETE"]);
  const received = new Set<string>();
  let principal: string | undefined;
  for (const row of grants as string[]) {
    const match =
      /^GRANT ([A-Z]+(?:, [A-Z]+)*) ON (\*\.\*|`[A-Za-z](?:[A-Za-z0-9]|\\_){0,63}`\.\*) TO ((?:`[A-Za-z0-9_.-]{1,32}`|'[A-Za-z0-9_.-]{1,32}')@(?:`[A-Za-z0-9_.:%-]{1,255}`|'[A-Za-z0-9_.:%-]{1,255}'))$/.exec(
        row
      );
    if (!match || (principal !== undefined && principal !== match[3]))
      return false;
    principal = match[3];
    if (match[2] === "*.*") {
      if (match[1] !== "USAGE") return false;
      continue;
    }
    if (match[2] !== expectedScope) return false;
    const privileges = match[1].split(", ");
    if (new Set(privileges).size !== privileges.length) return false;
    for (const privilege of privileges) {
      if (!allowed.has(privilege)) return false;
      received.add(privilege);
    }
  }
  return received.size === allowed.size;
}

export function requireRuntimeDmlCheck(
  value: string | undefined,
  verifyOnly: boolean
): boolean {
  if (value === undefined) return false;
  if (value === "runtime-dml" && verifyOnly) return true;
  throw new Error("migration_authority_mode_invalid");
}
