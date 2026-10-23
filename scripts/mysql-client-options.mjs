// SHOW GRANTS contains literal backslashes for schema wildcard escaping.
// mysql batch mode escapes them again unless --raw is explicitly requested.
export const MYSQL_RAW_BATCH_OPTIONS = Object.freeze([
  "--batch",
  "--skip-column-names",
  "--raw",
]);
