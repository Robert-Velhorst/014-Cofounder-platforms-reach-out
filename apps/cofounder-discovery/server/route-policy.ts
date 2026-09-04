const SAFE_PREFIXES = ["auth.", "profile.", "criticalPath.", "system."];

export function getTrpcOperationNames(url: string): string[] {
  const path = decodeURIComponent(url.split("?")[0] ?? "").replace(/^\/+/, "");
  return path.split(",").filter(Boolean);
}

export function isSafeOperation(name: string) {
  return SAFE_PREFIXES.some(prefix => name.startsWith(prefix));
}

export function permitsTrpcUrl(url: string, legacyEnabled: boolean) {
  if (legacyEnabled) return true;
  const names = getTrpcOperationNames(url);
  return names.length > 0 && names.every(isSafeOperation);
}
