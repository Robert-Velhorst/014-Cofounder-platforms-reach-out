import { describe, expect, it } from "vitest";
import { parseProspectCsv, prospectsToCsv } from "./prospect-csv";

describe("prospect CSV boundaries", () => {
  it("refuses an oversized export rather than returning a truncated file", () => {
    const row = {
      name: "Ada",
      skills: [],
      industries: [],
      consentStatus: "unknown" as const,
    };
    expect(() =>
      prospectsToCsv(Array.from({ length: 10001 }, () => row))
    ).toThrow(/10000/);
    expect(() =>
      prospectsToCsv([{ ...row, bio: "é".repeat(4 * 1024 * 1024) }])
    ).toThrow(/8388608/);
  });
  it.each([
    "=1+2",
    "+1+2",
    "-1+2",
    "@SUM(1)",
    "＝1+2",
    "＋1",
    "－1",
    "＠SUM(1)",
    "\t=1+2",
    "\r=1+2",
    "\n=1+2",
    "  =1+2",
    "\uFEFF=1",
    "\u0000=1",
    "'=1+2",
  ])("exports formula-like text as visible inert text: %j", value => {
    const csv = prospectsToCsv([
      { name: value, skills: [], industries: [], consentStatus: "unknown" },
    ]);
    expect(parseProspectCsv(csv)[0].name).toBe(`text: ${value}`);
  });
  it("escapes quotes and separators in every exported text column without changing stored inputs", () => {
    const input = {
      name: 'Ada;=1,"quoted"',
      title: "=2",
      location: "+3",
      bio: "@4",
      skills: ["-5", "Design"],
      industries: ["＝6"],
      platform: "\tmanual",
      profileUrl: "https://example.invalid/p?a=1",
      consentStatus: "opted_out" as const,
    };
    const csv = prospectsToCsv([input]);
    expect(csv).toContain('"Ada;=1,""quoted"""');
    const parsed = parseProspectCsv(csv)[0];
    expect(parsed).toMatchObject({
      name: input.name,
      title: "text: =2",
      location: "text: +3",
      bio: "text: @4",
      skills: ["text: -5", "Design"],
      industries: ["text: ＝6"],
      platform: "text: \tmanual",
      consentStatus: "opted_out",
    });
    expect(input.title).toBe("=2");
  });
  it("applies the byte ceiling to multibyte input before parsing", () => {
    expect(() => parseProspectCsv("name\n" + "é".repeat(262145))).toThrow(
      /bytes/
    );
  });
  it("imports quoted multiline biographies without splitting a person into multiple rows", () => {
    expect(
      parseProspectCsv(
        'name,bio\r\n"Ada, Founder","First line\nSecond ""quoted"" line"'
      )
    ).toEqual([
      {
        name: "Ada, Founder",
        bio: 'First line\nSecond "quoted" line',
        skills: [],
        industries: [],
        consentStatus: "unknown",
      },
    ]);
  });
  it.each([
    ["duplicate header", "name,name\nAda,Bob"],
    ["extra cell", "name\nAda,Bob"],
    ["missing cell", "name,title\nAda"],
    ["quote in unquoted field", 'name\nAd"a"'],
    ["text after closing quote", 'name\n"Ada"oops'],
    ["unclosed quote", 'name\n"Ada'],
    ["no data", "name\n"],
    ["empty input", ""],
  ])("rejects %s instead of silently changing the data", (_, csv) => {
    expect(() => parseProspectCsv(csv)).toThrow();
  });
  it("round-trips a real multiline export", () => {
    const original = [
      {
        name: "Ada",
        bio: "First\r\nSecond",
        skills: ["TypeScript"],
        industries: [],
        consentStatus: "unknown" as const,
      },
    ];
    expect(parseProspectCsv(prospectsToCsv(original))).toEqual(original);
  });
  it("bounds parsed records, not the number of newlines inside a biography", () => {
    expect(
      parseProspectCsv('name,bio\nAda,"' + "line\n".repeat(1000) + '"')
    ).toHaveLength(1);
    expect(() => parseProspectCsv("name\n" + "Ada\n".repeat(1001))).toThrow(
      /rows/
    );
  });
});
