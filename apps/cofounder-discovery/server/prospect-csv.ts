import { z } from "zod";

export const MAX_CSV_BYTES = 512 * 1024;
export const MAX_CSV_ROWS = 1_000;
export const MAX_CSV_EXPORT_ROWS = 10_000;
export const MAX_CSV_EXPORT_BYTES = 8 * 1024 * 1024;

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

function parseRecords(csv: string): string[][] {
  const records: string[][] = [];
  let cells: string[] = [];
  let value = "";
  let quoted = false;
  let closedQuote = false;
  let hasContent = false;
  const finishCell = () => {
    cells.push(value);
    value = "";
    closedQuote = false;
  };
  const finishRecord = () => {
    finishCell();
    if (hasContent) records.push(cells);
    if (records.length > MAX_CSV_ROWS + 1)
      throw new Error(`CSV exceeds ${MAX_CSV_ROWS} data rows`);
    cells = [];
    hasContent = false;
  };
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    if (quoted) {
      if (char === '"' && csv[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
        closedQuote = true;
      } else value += char;
      continue;
    }
    if (char === ",") {
      hasContent = true;
      finishCell();
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && csv[index + 1] === "\n") index += 1;
      finishRecord();
    } else if (closedQuote) {
      if (char !== " " && char !== "\t")
        throw new Error("CSV contains text after a closing quote");
    } else if (char === '"') {
      if (value.trim())
        throw new Error("CSV contains a quote in an unquoted field");
      value = "";
      quoted = true;
      hasContent = true;
    } else {
      value += char;
      if (char.trim()) hasContent = true;
    }
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field");
  finishRecord();
  return records;
}

export function parseProspectCsv(csv: string): ImportedProspect[] {
  if (Buffer.byteLength(csv, "utf8") > MAX_CSV_BYTES) {
    throw new Error(`CSV exceeds ${MAX_CSV_BYTES} bytes`);
  }
  const records = parseRecords(csv.replace(/^\uFEFF/, ""));
  if (records.length < 2)
    throw new Error("CSV requires a header and at least one data row");

  const headers = records[0].map(header => header.trim());
  if (new Set(headers).size !== headers.length)
    throw new Error("CSV contains duplicate column names");
  const required = headers.indexOf("name");
  if (required < 0) throw new Error("CSV requires a name column");
  const allowed = new Set([
    "name",
    "title",
    "location",
    "bio",
    "skills",
    "industries",
    "platform",
    "profileUrl",
    "consentStatus",
  ]);
  const unexpected = headers.filter(header => !allowed.has(header));
  if (unexpected.length)
    throw new Error(`Unsupported CSV columns: ${unexpected.join(", ")}`);

  return records.slice(1).map((cells, rowIndex) => {
    if (cells.length !== headers.length)
      throw new Error(
        `CSV record ${rowIndex + 2}: expected ${headers.length} cells, found ${cells.length}`
      );
    const raw = Object.fromEntries(
      headers.map((header, index) => [
        header,
        cells[index]?.trim() || undefined,
      ])
    );
    const parsed = rowSchema.safeParse({
      ...raw,
      skills:
        raw.skills
          ?.split("|")
          .map(value => value.trim())
          .filter(Boolean) ?? [],
      industries:
        raw.industries
          ?.split("|")
          .map(value => value.trim())
          .filter(Boolean) ?? [],
    });
    if (!parsed.success) {
      throw new Error(
        `CSV row ${rowIndex + 2}: ${parsed.error.issues[0]?.message ?? "invalid data"}`
      );
    }
    return parsed.data;
  });
}

const spreadsheetRisk = new RegExp("^[\\s\\p{Cc}\\p{Cf}'=+\\-@＝＋－＠]", "u");
function quote(value: unknown): string {
  const text = Array.isArray(value) ? value.join("|") : String(value ?? "");
  // A visible literal prefix survives removal of spreadsheet quote/escape
  // markers. This is a human-readable export, not a lossless backup format.
  const display = spreadsheetRisk.test(text) ? `text: ${text}` : text;
  return `"${display.replaceAll('"', '""')}"`;
}

export function prospectsToCsv(rows: ImportedProspect[]): string {
  if (rows.length > MAX_CSV_EXPORT_ROWS)
    throw new RangeError(
      `CSV export exceeds ${MAX_CSV_EXPORT_ROWS} active candidates; no partial file was produced.`
    );
  const headers = [
    "name",
    "title",
    "location",
    "bio",
    "skills",
    "industries",
    "platform",
    "profileUrl",
    "consentStatus",
  ] as const;
  const records = [headers.join(",")];
  let bytes = Buffer.byteLength(records[0], "utf8");
  for (const row of rows) {
    const record = headers.map(header => quote(row[header])).join(",");
    bytes += 2 + Buffer.byteLength(record, "utf8");
    if (bytes > MAX_CSV_EXPORT_BYTES)
      throw new RangeError(
        `CSV export exceeds ${MAX_CSV_EXPORT_BYTES} bytes; no partial file was produced.`
      );
    records.push(record);
  }
  return records.join("\r\n");
}
