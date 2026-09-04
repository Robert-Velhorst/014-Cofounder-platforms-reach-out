import { z } from "zod";

export const MAX_CSV_BYTES = 512 * 1024;
export const MAX_CSV_ROWS = 1_000;

const rowSchema = z.object({
  name: z.string().trim().min(1).max(255),
  title: z.string().trim().max(255).optional(),
  location: z.string().trim().max(255).optional(),
  bio: z.string().trim().max(5_000).optional(),
  skills: z.array(z.string().trim().min(1).max(100)).max(30).default([]),
  industries: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  platform: z.string().trim().max(50).optional(),
  profileUrl: z.string().url().max(500).optional(),
  consentStatus: z
    .enum(["unknown", "legitimate_interest", "opted_in", "opted_out"])
    .default("unknown"),
});

export type ImportedProspect = z.infer<typeof rowSchema>;

function parseLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field");
  values.push(value);
  return values;
}

export function parseProspectCsv(csv: string): ImportedProspect[] {
  if (Buffer.byteLength(csv, "utf8") > MAX_CSV_BYTES) {
    throw new Error(`CSV exceeds ${MAX_CSV_BYTES} bytes`);
  }
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];
  if (lines.length - 1 > MAX_CSV_ROWS) throw new Error(`CSV exceeds ${MAX_CSV_ROWS} data rows`);

  const headers = parseLine(lines[0]).map(header => header.trim());
  const required = headers.indexOf("name");
  if (required < 0) throw new Error("CSV requires a name column");
  const allowed = new Set([
    "name", "title", "location", "bio", "skills", "industries", "platform", "profileUrl", "consentStatus",
  ]);
  const unexpected = headers.filter(header => !allowed.has(header));
  if (unexpected.length) throw new Error(`Unsupported CSV columns: ${unexpected.join(", ")}`);

  return lines.slice(1).map((line, rowIndex) => {
    const cells = parseLine(line);
    const raw = Object.fromEntries(headers.map((header, index) => [header, cells[index]?.trim() || undefined]));
    const parsed = rowSchema.safeParse({
      ...raw,
      skills: raw.skills?.split("|").map(value => value.trim()).filter(Boolean) ?? [],
      industries: raw.industries?.split("|").map(value => value.trim()).filter(Boolean) ?? [],
    });
    if (!parsed.success) {
      throw new Error(`CSV row ${rowIndex + 2}: ${parsed.error.issues[0]?.message ?? "invalid data"}`);
    }
    return parsed.data;
  });
}

function quote(value: unknown): string {
  const text = Array.isArray(value) ? value.join("|") : String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function prospectsToCsv(rows: ImportedProspect[]): string {
  const headers = ["name", "title", "location", "bio", "skills", "industries", "platform", "profileUrl", "consentStatus"] as const;
  return [headers.join(","), ...rows.map(row => headers.map(header => quote(row[header])).join(","))].join("\r\n");
}
