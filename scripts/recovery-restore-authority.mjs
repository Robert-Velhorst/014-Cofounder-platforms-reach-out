// Conservative MySQL 8.4 SHOW GRANTS boundary. Unknown grammar fails closed;
// account names and privilege text must never be returned in public diagnostics.
const databasePrivileges = new Set([
  "ALL PRIVILEGES",
  "ALTER",
  "ALTER ROUTINE",
  "CREATE",
  "CREATE ROUTINE",
  "CREATE TEMPORARY TABLES",
  "CREATE VIEW",
  "DELETE",
  "DROP",
  "EVENT",
  "EXECUTE",
  "INDEX",
  "INSERT",
  "LOCK TABLES",
  "REFERENCES",
  "SELECT",
  "SHOW VIEW",
  "TRIGGER",
  "UPDATE",
]);
export function confinedRestoreGrants(grants, database, currentRole) {
  if (
    currentRole !== "NONE" ||
    typeof grants !== "string" ||
    grants.length > 65536 ||
    !/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(database)
  )
    return false;
  const rows = grants.trim().split(/\r?\n/);
  if (!grants.trim() || rows.length > 64) return false;
  let databaseGrant = false;
  for (const row of rows) {
    // Roles, proxy grants, global dynamic privileges and delegation are rejected.
    if (/WITH GRANT OPTION|WITH ADMIN OPTION/i.test(row)) return false;
    const match =
      /^GRANT ([A-Z ,]+) ON (\*\.\*|`[a-zA-Z](?:[a-zA-Z0-9]|\\_){0,63}`\.\*) TO .+$/.exec(
        row,
      );
    if (!match) return false;
    if (match[2] === "*.*") {
      if (match[1] !== "USAGE") return false;
    } else {
      // Unescaped underscores are MySQL database-grant wildcards.
      const exactScope = "`" + database.replace(/_/g, "\\_") + "`.*";
      if (match[2] !== exactScope) return false;
      if (
        !match[1]
          .split(", ")
          .every((privilege) => databasePrivileges.has(privilege))
      )
        return false;
      databaseGrant = true;
    }
  }
  return databaseGrant;
}
