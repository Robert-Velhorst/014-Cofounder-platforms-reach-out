import { isIP } from "node:net";

function ipv4Range(cidr) {
  if (typeof cidr !== "string" || cidr.length > 18 || cidr !== cidr.trim())
    throw new Error("synthetic_network_invalid");
  const [host, prefix, extra] = cidr.split("/");
  if (
    isIP(host) !== 4 ||
    extra !== undefined ||
    !/^(?:[0-9]|[12][0-9]|3[0-2])$/.test(prefix ?? "")
  )
    throw new Error("synthetic_network_invalid");
  const address = host
    .split(".")
    .reduce((value, octet) => value * 256n + BigInt(octet), 0n);
  const shift = 32n - BigInt(prefix);
  const start = (address >> shift) << shift;
  return {
    address,
    start,
    end: start + (1n << shift) - 1n,
    prefix: Number(prefix),
  };
}

// Explicit test-only /28, never a production allocation or automatic pool edit.
// The operator must separately review host/VPN routes; Docker overlap is checked.
export function syntheticSubnetArguments(value, occupied = []) {
  if (value === undefined) return [];
  const target = ipv4Range(value);
  if (
    target.prefix !== 28 ||
    target.address !== target.start ||
    !["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"].some((cidr) => {
      const range = ipv4Range(cidr);
      return target.start >= range.start && target.end <= range.end;
    })
  )
    throw new Error("synthetic_network_private_aligned_subnet_required");
  if (!Array.isArray(occupied)) throw new Error("synthetic_network_invalid");
  for (const cidr of occupied) {
    if (typeof cidr === "string" && isIP(cidr.split("/")[0]) === 6) continue;
    const range = ipv4Range(cidr);
    if (target.start <= range.end && range.start <= target.end)
      throw new Error("synthetic_network_overlap_refused");
  }
  return ["--subnet", value];
}
