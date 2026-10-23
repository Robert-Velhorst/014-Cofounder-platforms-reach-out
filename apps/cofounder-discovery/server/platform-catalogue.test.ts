import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { criticalPathRouter } from "./critical-path-router";
import type { TrpcContext } from "./_core/context";

async function catalogue() {
  const path = "./platform-catalogue";
  const module = await import(path).catch(() => null);
  expect(module?.publicPlatformCatalogue).toBeTypeOf("function");
  return module!;
}

describe("published platform catalogue", () => {
  it("lists WASL Network as restricted MENA discovery without granting account or contact access", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    const row = records.find((item: any) => item.id === "wasl-network-mena");
    for (const query of [
      "WASL Network",
      "wasl-network.com",
      "MENA Cairo",
      "Riyadh Saudi Arabia",
    ])
      expect(
        filterPlatforms(records, query, "dedicated").map((item: any) => item.id)
      ).toContain("wasl-network-mena");
    expect(row).toMatchObject({
      category: "dedicated",
      workflowReview: "discovery-only",
      pricingStatus: "free-entry",
      reviewedAt: "2026-10-23",
      integration: {
        implemented: false,
        permissionVerified: false,
        liveVerified: false,
      },
    });
    expect(row.access).toMatch(/administrator review/);
    expect(row.access).toMatch(/age eligibility.*untested/);
    expect(row.pricing).toMatch(/Free registration.*entitlement.*not verified/);
    expect(row.restrictions).toMatch(/prohibit automated.*harvesting/);
    expect(row.restrictions).toMatch(
      /mutual acceptance.*not external-contact consent/
    );
    expect(row.aliases).not.toContain("Wasl");
    expect(row.aliases).not.toContain("Founders Majlis");
    expect(row.evidence).toContain("https://wasl-network.com/terms-of-service");
    expect(row.evidence).toContain("https://wasl-network.com/privacy-policy");
    expect(
      records.filter(
        (item: any) => new URL(item.url).hostname === "wasl-network.com"
      )
    ).toHaveLength(1);
    expect(filterPlatforms(records, "WASL Network", "community")).toEqual([]);
  });
  it("keeps the Indonesian directory distinct from matching and profile-collection permission", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    expect(records).toHaveLength(70);
    for (const query of [
      "Indonesia",
      "Jakarta",
      "founderbro",
      "founderbro.id",
    ]) {
      const matches = filterPlatforms(records, query, "community");
      expect(matches.map((row: any) => row.id)).toEqual([
        "founderbro-indonesia",
      ]);
    }
    const row = records.find((item: any) => item.id === "founderbro-indonesia");
    expect(row).toMatchObject({
      category: "community",
      workflowReview: "discovery-only",
      pricingStatus: "free-entry",
      reviewedAt: "2026-10-02",
      integration: {
        implemented: false,
        permissionVerified: false,
        liveVerified: false,
      },
    });
    expect(row.audience).toMatch(/not dedicated.*seek a partner/);
    expect(row.access).toMatch(/registered\/operating.*manual review/);
    expect(row.restrictions).toMatch(/forbid scraping.*bulk export/);
    expect(row.restrictions).toMatch(/do not grant external-contact consent/);
    expect(filterPlatforms(records, "founderbro", "dedicated")).toEqual([]);
    expect(
      records.filter(
        (item: any) => new URL(item.url).hostname === "founderbro.id"
      )
    ).toHaveLength(1);
  });
  it("separates three French matching brands and preserves paid, beta and school gates", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    for (const [query, id] of [
      ["Cofondateur.fr", "cofondateur-france"],
      ["cofoundr.fr", "cofoundr-france"],
      ["CoFoundry étudiants", "cofoundry-france"],
    ]) {
      expect(
        filterPlatforms(records, query, "dedicated").map((r: any) => r.id)
      ).toEqual([id]);
      const row = records.find((r: any) => r.id === id);
      expect(row).toMatchObject({
        category: "dedicated",
        pricingStatus: "free-entry",
        workflowReview: "discovery-only",
        reviewedAt: "2026-10-02",
        integration: {
          implemented: false,
          permissionVerified: false,
          liveVerified: false,
        },
      });
      expect(row.aliases).not.toContain("CoFounder");
    }
    expect(
      filterPlatforms(records, "France français", "dedicated")
        .map((r: any) => r.id)
        .sort()
    ).toEqual(
      ["cofondateur-france", "cofoundr-france", "cofoundry-france"].sort()
    );
    const established = records.find((r: any) => r.id === "cofondateur-france");
    expect(established.pricing).toMatch(/29.90.*59.90.*VAT/);
    expect(established.pricing).toMatch(/three-month.*automatic extensions/);
    expect(established.restrictions).toMatch(/contact details.*third parties/);
    const beta = records.find((r: any) => r.id === "cofoundr-france");
    expect(beta.access).toMatch(/placeholders.*unverified/);
    expect(beta.pricing).toMatch(/0\/month.*beta.*5\/month/);
    const students = records.find((r: any) => r.id === "cofoundry-france");
    expect(students.access).toMatch(/School-gated.*not open/);
    expect(students.access).toMatch(/first institution.*unverified/);
    expect(students.pricing).toMatch(/quoted annual subscription/);
    expect(students.restrictions).toMatch(
      /collecting data without authorization/
    );
    expect(
      records.filter((r: any) => r.workflowReview === "manual-reviewed")
    ).toHaveLength(23);
    expect(
      records.filter((r: any) => r.workflowReview === "discovery-only")
    ).toHaveLength(47);
  });
  it("retains Hong Kong ecosystem restrictions and Chinese discovery without promising co-founder matching", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    for (const query of [
      "Hong Kong",
      "香港",
      "數碼港",
      "CSAA",
      "Cyberport Startup Alumni Association",
    ]) {
      expect(
        filterPlatforms(records, query, "program").map((r: any) => r.id)
      ).toContain("cyberport-hong-kong");
    }
    const row = records.find((r: any) => r.id === "cyberport-hong-kong");
    expect(row).toMatchObject({
      category: "program",
      pricingStatus: "unknown",
      workflowReview: "discovery-only",
      reviewedAt: "2026-10-02",
      integration: {
        implemented: false,
        permissionVerified: false,
        liveVerified: false,
      },
    });
    expect(row.access).toMatch(/restricted.*not open individual matching/);
    expect(row.access).toMatch(/enhancements.*rechecked/);
    expect(row.pricing).toMatch(/not assumed free/);
    expect(row.pricing).toMatch(/400,000.*updated/);
    expect(row.restrictions).toMatch(/not co-founder introductions/);
    expect(filterPlatforms(records, "Cyberport", "dedicated")).toEqual([]);
    expect(records.filter((r: any) => r.id.includes("cyberport"))).toHaveLength(
      1
    );
  });
  it("retains Ontario eligibility and sold-out free entry without admitting Communitech", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    for (const query of [
      "Communitech",
      "Communitech Founder Connect",
      "Waterloo",
      "Ontario Canada",
    ]) {
      expect(
        filterPlatforms(records, query, "community").map((r: any) => r.id)
      ).toContain("communitech-ontario");
    }
    const row = records.find((r: any) => r.id === "communitech-ontario");
    expect(row).toMatchObject({
      category: "community",
      pricingStatus: "free-entry",
      workflowReview: "discovery-only",
      reviewedAt: "2026-10-02",
      integration: {
        implemented: false,
        permissionVerified: false,
        liveVerified: false,
      },
    });
    expect(row.access).toMatch(/Ontario.*excluded/);
    expect(row.access).toMatch(/12 months.*membership untested.*Sold out/);
    expect(row.pricing).toMatch(/CAD 0.*availability not established/);
    expect(row.restrictions).toMatch(/unauthorized solicitation/);
    expect(row.restrictions).toMatch(/Private Slack access is not consent/);
    expect(filterPlatforms(records, "Communitech", "dedicated")).toEqual([]);
    expect(records.some((r: any) => r.id === "startup-canada")).toBe(false);
  });
  it("deduplicates CcHUB/iHUB and retains Nairobi community pricing and permission boundaries", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    const hub = filterPlatforms(records, "iHUB Nairobi", "community")[0];
    const impact = filterPlatforms(records, "IHN", "community")[0];
    expect(hub.id).toBe("cchub-ihub-africa");
    expect(hub.pricing).toMatch(/13,000.*excluding VAT/);
    expect(hub.access).toMatch(/six-month minimum/);
    expect(hub.access).toMatch(/events lack a year/);
    expect(
      filterPlatforms(records, "CcHUB Nigeria", "community").map(
        (r: any) => r.id
      )
    ).toEqual([hub.id]);
    expect(records.some((r: any) => r.id === "ihub-nairobi")).toBe(false);
    expect(impact.id).toBe("impact-hub-nairobi");
    expect(impact.pricingStatus).toBe("free-entry");
    expect(impact.pricing).toMatch(/15,000.*16% VAT/);
    expect(impact.access).toMatch(/age18\+/);
    expect(impact.restrictions).toMatch(/harvesting.*bulk outreach/);
    for (const row of [hub, impact]) {
      expect(row.reviewedAt).toBe("2026-10-02");
      expect(row.workflowReview).toBe("discovery-only");
      expect(row.integration).toEqual({
        implemented: false,
        permissionVerified: false,
        liveVerified: false,
      });
    }
  });
  it("adds Nordic community/program discovery without promising matching or membership access", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    const denmark = filterPlatforms(records, "DSG Denmark", "community")[0];
    const sweden = filterPlatforms(
      records,
      "Norrsken Stockholm",
      "community"
    )[0];
    const norway = filterPlatforms(records, "Startuplab Bergen", "program")[0];
    expect(denmark.id).toBe("danish-startup-group");
    expect(denmark.pricingStatus).toBe("unknown");
    expect(denmark.access).toMatch(/Membership page timed out/);
    expect(denmark.access).toMatch(/conflicting.*dates/);
    expect(sweden.id).toBe("norrsken-stockholm");
    expect(sweden.pricingStatus).toBe("paid-membership");
    expect(sweden.pricing).toMatch(/SEK 2,600.*excluding VAT/);
    expect(norway.id).toBe("startuplab-norway");
    expect(norway.access).toMatch(/registered in Norway/);
    expect(norway.pricing).toMatch(/cost question but no answer/);
    for (const row of [denmark, sweden, norway]) {
      expect(row.workflowReview).toBe("discovery-only");
      expect(row.reviewedAt).toBe("2026-10-02");
      expect(row.audience).toMatch(/not dedicated co-founder matching/);
      expect(row.restrictions).toMatch(/import\/outreach not reviewed/);
      expect(row.integration).toEqual({
        implemented: false,
        permissionVerified: false,
        liveVerified: false,
      });
    }
    expect(
      filterPlatforms(records, "København", "community").some(
        (r: any) => r.id === denmark.id
      )
    ).toBe(true);
    expect(
      filterPlatforms(records, "Sverige", "community").some(
        (r: any) => r.id === sweden.id
      )
    ).toBe(true);
    expect(
      filterPlatforms(records, "Norge", "program").some(
        (r: any) => r.id === norway.id
      )
    ).toBe(true);
    expect(
      records.some(
        (r: any) => r.id === "startupmatcher" || r.id === "sting-sweden"
      )
    ).toBe(false);
    expect(
      records.filter((r: any) => r.workflowReview === "manual-reviewed")
    ).toHaveLength(23);
    expect(
      records.filter((r: any) => r.workflowReview === "discovery-only")
    ).toHaveLength(47);
  });
  it("finds Caribbean ecosystem routes without promising solo-founder matching or included travel", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    const beach = filterPlatforms(records, "Tech Beach Retreat", "program")[0];
    const parallel = filterPlatforms(records, "Puerto Rico", "program").find(
      (r: any) => r.id === "parallel18-puerto-rico"
    );
    expect(beach.id).toBe("techbeach-caribbean");
    expect(beach.access).toMatch(/December 2.*5, 2026/);
    expect(beach.pricing).toMatch(/tax.*unverified/);
    expect(parallel.access).toMatch(/two full-time founders/);
    expect(parallel.access).toMatch(/2027/);
    expect(parallel.pricing).toMatch(/SAFE.*not a grant/);
    expect(filterPlatforms(records, "Caribbean", "dedicated")).toEqual([]);
    for (const row of [beach, parallel]) {
      expect(row).toMatchObject({
        category: "program",
        reviewedAt: "2026-10-02",
        workflowReview: "discovery-only",
        integration: {
          implemented: false,
          permissionVerified: false,
          liveVerified: false,
        },
      });
      expect(row.restrictions).toMatch(/import\/outreach not reviewed/);
      expect(row.evidence.length).toBeGreaterThan(1);
    }
    expect(records.some((r: any) => r.id === "kingston-beta")).toBe(false);
  });
  it("finds Central Asian ecosystem routes without asserting matching or foreign entitlement", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    const rows = filterPlatforms(records, "Central Asia", "program");
    expect(rows.map((row: any) => row.id).sort()).toEqual([
      "astana-hub-kazakhstan",
    ]);
    const astana = filterPlatforms(records, "Қазақстан", "program")[0];
    const uzbek = filterPlatforms(records, "O‘zbekiston", "program")[0];
    expect(astana.id).toBe("astana-hub-kazakhstan");
    expect(uzbek.id).toBe("startup-base-uzbekistan");
    expect(filterPlatforms(records, "Астана Хаб", "all")[0].id).toBe(astana.id);
    expect(filterPlatforms(records, "StartupBase", "all")[0].id).toBe(uzbek.id);
    expect(astana.pricingStatus).toBe("unknown");
    expect(astana.access).toMatch(/distinct.*formal technopark/);
    expect(astana.pricing).toMatch(/quarterly 1%.*unverified/);
    expect(astana.restrictions).toMatch(/without.*consent/);
    expect(uzbek.pricingStatus).toBe("free-core");
    expect(uzbek.access).toMatch(/Foreign eligibility conflict unresolved/);
    expect(uzbek.restrictions).toMatch(/prohibits spam/);
    for (const row of [astana, uzbek]) {
      expect(row).toMatchObject({
        category: "program",
        reviewedAt: "2026-10-02",
        workflowReview: "discovery-only",
        integration: {
          implemented: false,
          permissionVerified: false,
          liveVerified: false,
        },
      });
      expect(row.audience).toMatch(/not dedicated/);
      expect(row.restrictions).toMatch(/import\/outreach not reviewed/);
    }
    expect(filterPlatforms(records, "Kazakhstan", "dedicated")).toEqual([]);
    expect(filterPlatforms(records, "Uzbekistan", "dedicated")).toEqual([]);
  });
  it("finds ANZ and Fiji discovery without granting membership, intake or contact rights", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    expect(
      filterPlatforms(records, "NZ startup noticeboard", "community")[0].id
    ).toBe("startups-nz");
    const nz = records.find((r: any) => r.id === "startups-nz");
    expect(nz.pricingStatus).toBe("free-core");
    expect(nz.restrictions).toMatch(/prohibit scraping/);
    const fish = filterPlatforms(
      records,
      "Fishburners Founder Passport",
      "community"
    )[0];
    expect(fish.pricingStatus).toBe("paid-membership");
    expect(fish.pricing).toMatch(/Currency.*unverified/);
    const fiji = filterPlatforms(
      records,
      "Fiji Innovation Activator",
      "program"
    )[0];
    expect(fiji.access).toMatch(/deadline.*past/);
    expect(fiji.pricingStatus).toBe("unknown");
    for (const r of [nz, fish, fiji])
      expect(r).toMatchObject({
        workflowReview: "discovery-only",
        reviewedAt: "2026-10-02",
        integration: {
          implemented: false,
          liveVerified: false,
          permissionVerified: false,
        },
      });
    expect(
      records.some(
        (r: any) => r.id === "lineup-nz" || r.id === "something-new-nz"
      )
    ).toBe(false);
  });
  it("finds Philippines ecosystems without claiming matching or current event availability", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    const rows = filterPlatforms(records, "Philippines", "program");
    expect(rows.map((row: any) => row.id).sort()).toEqual([
      "launchgarage-philippines",
      "qbo-philippines",
    ]);
    expect(filterPlatforms(records, "QMMUNITY", "all")[0].id).toBe(
      "qbo-philippines"
    );
    expect(filterPlatforms(records, "Launch Garage", "all")[0].id).toBe(
      "launchgarage-philippines"
    );
    expect(rows.find((row: any) => row.id === "qbo-philippines")).toMatchObject(
      { pricingStatus: "free-entry" }
    );
    expect(
      rows.find((row: any) => row.id === "launchgarage-philippines")?.access
    ).toMatch(/2025.*past/);
    expect(filterPlatforms(records, "Philippines", "dedicated")).toEqual([]);
    for (const row of rows) {
      expect(row).toMatchObject({
        workflowReview: "discovery-only",
        reviewedAt: "2026-10-02",
        integration: {
          permissionVerified: false,
          implemented: false,
          liveVerified: false,
        },
      });
      expect(row.restrictions).toMatch(/import\/outreach not reviewed/);
    }
  });
  it("finds Sri Lanka matching and Nepal community without admitting outreach", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    const sriLanka = filterPlatforms(records, "Sri Lanka", "dedicated");
    expect(sriLanka.map((row: any) => row.id)).toEqual(["instalanka"]);
    expect(sriLanka[0].access).toMatch(/redirects to login/i);
    expect(sriLanka[0].pricingStatus).toBe("unknown");
    const nepal = filterPlatforms(records, "Nepal", "community");
    expect(nepal.map((row: any) => row.id)).toEqual(["founders-nepal"]);
    expect(nepal[0].restrictions).toMatch(/prohibit automated access/i);
    for (const row of [...sriLanka, ...nepal])
      expect(row).toMatchObject({
        workflowReview: "discovery-only",
        reviewedAt: "2026-10-02",
        integration: {
          implemented: false,
          permissionVerified: false,
          liveVerified: false,
        },
      });
    expect(
      records.some(
        (row: any) => row.id === "buildgara" || row.id === "startup-sl"
      )
    ).toBe(false);
  });
  it("distinguishes Pakistan early access and Bangladesh seeking-partner discovery from usable contact rights", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    const pakistan = filterPlatforms(records, "Pakistan", "community");
    expect(pakistan.map((row: any) => row.id)).toEqual(["bani-pakistan"]);
    expect(pakistan[0].access).toMatch(/early.access.*coming soon/i);
    expect(pakistan[0].pricingStatus).toBe("unknown");
    expect(pakistan[0].evidence).toContain("https://bani.pk/terms");
    const bangladesh = filterPlatforms(records, "Bangladesh", "community");
    expect(bangladesh.map((row: any) => row.id)).toEqual(["bd-saas-zone"]);
    expect(bangladesh[0].pricing).toMatch(/promotion.*not.*contact/i);
    expect(bangladesh[0].restrictions).toMatch(/rights.*unresolved/i);
    expect(bangladesh[0].access).toMatch(/Loading/i);
    for (const row of [...pakistan, ...bangladesh]) {
      expect(row).toMatchObject({
        reviewedAt: "2026-10-02",
        workflowReview: "discovery-only",
        integration: {
          implemented: false,
          permissionVerified: false,
          liveVerified: false,
        },
      });
    }
  });
  it("distinguishes Japanese matching and Taiwan partner discovery from permission or proven free access", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    const japan = filterPlatforms(records, "日本語", "dedicated");
    expect(japan.map((row: any) => row.id)).toEqual(["copath"]);
    expect(japan[0]).toMatchObject({
      pricingStatus: "unknown",
      workflowReview: "discovery-only",
      reviewedAt: "2026-10-02",
      integration: {
        implemented: false,
        permissionVerified: false,
        liveVerified: false,
      },
    });
    expect(japan[0].pricing).toMatch(/conflict/i);
    expect(japan[0].access).toMatch(/homepage.*timed out/i);
    expect(japan[0].access).toMatch(/parental consent/i);
    expect(japan[0].restrictions).toMatch(/scraping/i);
    const taiwan = filterPlatforms(records, "簡單創", "community");
    expect(taiwan.map((row: any) => row.id)).toEqual(["ezstartup-taiwan"]);
    expect(taiwan[0]).toMatchObject({
      pricingStatus: "unknown",
      workflowReview: "discovery-only",
      reviewedAt: "2026-10-02",
      integration: {
        implemented: false,
        permissionVerified: false,
        liveVerified: false,
      },
    });
    expect(taiwan[0].audience).toMatch(/Taiwan.*Traditional Chinese/i);
    expect(taiwan[0].audience).toMatch(/not a dedicated matcher/i);
    expect(taiwan[0].restrictions).toMatch(/indefinite comment retention/i);
    expect(records.some((row: any) => row.id === "hkfoundr")).toBe(false);
  });
  it("keeps CoFounder Dekho examples and paid access separate from verified membership", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const rows = filterPlatforms(
      publicPlatformCatalogue(),
      "cofounderdekho.in",
      "dedicated"
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "cofounder-dekho-india",
      pricingStatus: "paid-membership",
      workflowReview: "discovery-only",
      reviewedAt: "2026-10-02",
      integration: {
        implemented: false,
        permissionVerified: false,
        liveVerified: false,
      },
    });
    expect(rows[0].access).toMatch(/18.*untested/i);
    expect(rows[0].pricing).toMatch(/499.*year/i);
    expect(rows[0].restrictions).toMatch(/illustrative/i);
    expect(rows[0].restrictions).toMatch(/not independently verified/i);
    expect(rows[0].restrictions).toMatch(/CoFounderMatch/i);
    expect(rows[0].aliases).not.toContain("CoFounder");
  });
  it("finds Malaysian discovery without implying profile export rights or verified access", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    const row = filterPlatforms(records, "Malaysia", "dedicated").find(
      (r: any) => r.id === "cofounders-malaysia"
    );
    expect(row).toMatchObject({
      pricingStatus: "unknown",
      workflowReview: "discovery-only",
      reviewedAt: "2026-10-02",
      integration: {
        implemented: false,
        permissionVerified: false,
        liveVerified: false,
      },
    });
    expect(
      filterPlatforms(records, "cofounders.my", "dedicated").map(
        (r: any) => r.id
      )
    ).toEqual(["cofounders-malaysia"]);
    expect(row.access).toMatch(/18.*international/i);
    expect(row.access).toMatch(/untested/i);
    expect(row.restrictions).toMatch(/written consent/i);
    expect(row.restrictions).toMatch(/placeholder/i);
    expect(row.pricing).toMatch(/not.*free/i);
    expect(row.aliases).not.toContain("Cofounders");
    expect(
      records.filter((r: any) => new URL(r.url).hostname === "cofounders.my")
    ).toHaveLength(1);
  });
  it("distinguishes West Asian residency, ecosystem and unpublished prototype", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    expect(records).toHaveLength(70);
    expect(
      filterPlatforms(records, "Middle East", "program")
        .map((r: any) => r.id)
        .sort()
    ).toEqual(["antler", "dubai-founders-hq"]);
    expect(
      filterPlatforms(records, "Saudi Arabia", "program").map((r: any) => r.id)
    ).toEqual(["antler"]);
    const antler = records.find((r: any) => r.id === "antler");
    expect(antler).toMatchObject({
      reviewedAt: "2026-10-02",
      pricingStatus: "investment-terms",
    });
    expect(antler.access).toMatch(/full-time.*in-person.*10-week/i);
    expect(antler.pricing).toMatch(/not guaranteed/i);
    expect(records.filter((r: any) => r.id.startsWith("antler"))).toHaveLength(
      1
    );
    const hq = filterPlatforms(records, "DFHQ", "program")[0];
    expect(hq).toMatchObject({
      id: "dubai-founders-hq",
      workflowReview: "discovery-only",
      pricingStatus: "unknown",
      reviewedAt: "2026-10-02",
      integration: {
        implemented: false,
        permissionVerified: false,
        liveVerified: false,
      },
    });
    expect(hq.access).toMatch(/same Antler program/i);
    expect(hq.access).toMatch(/timed out/i);
    expect(hq.pricing).toMatch(/not.*free/i);
    expect(records.some((r: any) => r.id === "coalesce-uae")).toBe(false);
  });
  it("labels India paid access and Korean indirect networking without admitting workflows", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    expect(records).toHaveLength(70);
    expect(
      records.filter((row: any) => row.category === "dedicated")
    ).toHaveLength(23);
    expect(
      records.filter((row: any) => row.category === "community")
    ).toHaveLength(24);
    expect(
      records.filter((row: any) => row.category === "program")
    ).toHaveLength(23);
    const india = filterPlatforms(records, "FoundrForge", "dedicated");
    expect(india.map((row: any) => row.id)).toEqual(["foundrforge-india"]);
    expect(india[0]).toMatchObject({
      pricingStatus: "paid-membership",
      reviewedAt: "2026-10-02",
      workflowReview: "discovery-only",
    });
    expect(india[0].access).toMatch(/checkout.*untested/i);
    expect(india[0].pricing).toMatch(/not included/i);
    expect(india[0].audience).toMatch(/eligibility needs clarification/i);
    expect(
      filterPlatforms(records, "디캠프", "program").map((row: any) => row.id)
    ).toEqual(["dcamp-korea"]);
    const korea = filterPlatforms(records, "South Korea", "program")[0];
    expect(korea).toMatchObject({
      pricingStatus: "investment-terms",
      reviewedAt: "2026-10-02",
      workflowReview: "discovery-only",
    });
    expect(korea.audience).toMatch(/indirect.*not a dedicated/i);
    expect(korea.access).toMatch(/not solo idea-stage/i);
    expect(records.some((row: any) => row.id === "copath")).toBe(true);
  });
  it("adds independently identified discovery listings without implying live access or permissions", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    expect(records).toHaveLength(70);
    expect(
      filterPlatforms(records, "FoundersList", "dedicated").map(
        (row: any) => row.id
      )
    ).toEqual(["founderslist"]);
    expect(
      filterPlatforms(records, "cofound.biz", "dedicated").map(
        (row: any) => row.id
      )
    ).toEqual(["cofound-biz"]);
    expect(
      filterPlatforms(records, "Panama", "dedicated").map((row: any) => row.id)
    ).toEqual(["cofy-latam"]);
    const cofound = records.find((row: any) => row.id === "cofound-biz");
    expect(cofound.access).toMatch(/waitlist/i);
    expect(cofound.pricing).toMatch(/conflict/i);
    expect(
      records.find((row: any) => row.id === "founderslist").restrictions
    ).toMatch(/harvesting/i);
    expect(records.find((row: any) => row.id === "cofy-latam").access).toMatch(
      /mutual/i
    );
    for (const id of ["founderslist", "cofound-biz", "cofy-latam"]) {
      expect(records.find((row: any) => row.id === id)).toMatchObject({
        workflowReview: "discovery-only",
        reviewedAt: "2026-10-01",
      });
    }
    expect(
      records.some((row: any) => ["venn", "cofound-lat"].includes(row.id))
    ).toBe(false);
  });
  it("adds African discovery with waiting-list, early-access and policy uncertainty visible", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    expect(records).toHaveLength(70);
    expect(
      filterPlatforms(records, "Morocco", "dedicated").map((row: any) => row.id)
    ).toEqual(["sharakalab"]);
    expect(
      filterPlatforms(records, "Ghana", "community").map((row: any) => row.id)
    ).toContain("cousins-africa");
    const revise = records.find((row: any) => row.id === "revise-africa");
    expect(revise.access).toMatch(/waiting list.*50/i);
    expect(revise.restrictions).toMatch(/privacy.*inconsistent/i);
    expect(
      records.find((row: any) => row.id === "cousins-africa").access
    ).toMatch(/early access/i);
    for (const id of ["revise-africa", "sharakalab", "cousins-africa"]) {
      const row = records.find((row: any) => row.id === id);
      expect(row).toMatchObject({
        workflowReview: "discovery-only",
        reviewedAt: "2026-10-01",
        integration: {
          implemented: false,
          permissionVerified: false,
          liveVerified: false,
        },
      });
    }
    expect(records.some((row: any) => row.id === "crib-match")).toBe(false);
  });
  it("finds reviewed regional routes without treating geographic programs as globally open", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    expect(
      filterPlatforms(records, "Kenya", "program")
        .map((row: any) => row.id)
        .sort()
    ).toEqual(["jasiri-talent-investor", "mest-ai-startup"]);
    expect(
      filterPlatforms(records, "Brazil", "dedicated").map((row: any) => row.id)
    ).toEqual(["tech-talents-match"]);
    expect(
      filterPlatforms(records, "Australia", "program").map((row: any) => row.id)
    ).toEqual(["startmate-anz"]);
    expect(
      filterPlatforms(records, "India", "program").map((row: any) => row.id)
    ).toContain("entrepreneurs-first");
    expect(
      records.find((row: any) => row.id === "maya-matching")?.access
    ).toMatch(/closed/i);
    expect(
      records.find((row: any) => row.id === "mest-ai-startup")?.access
    ).toMatch(/conflict/i);
    expect(
      records.find((row: any) => row.id === "jasiri-talent-investor")?.access
    ).toMatch(/food systems/i);
  });

  it("retains individual review dates instead of refreshing untouched records", async () => {
    const { publicPlatformCatalogue } = await catalogue();
    const records = publicPlatformCatalogue();
    expect(
      records.find((row: any) => row.id === "tech-talents-match")?.reviewedAt
    ).toBe("2026-10-01");
    expect(
      records.find((row: any) => row.id === "entrepreneurs-first")?.reviewedAt
    ).toBe("2026-10-01");
    expect(
      records.find((row: any) => row.id === "yc-cofounder")?.reviewedAt
    ).toBe("2026-09-05");
  });

  it("serves discovery metadata only to verified accounts and excludes held sources", async () => {
    const caller = (user: TrpcContext["user"]) =>
      criticalPathRouter.createCaller({
        user,
        requestId: "catalogue-test",
        req: {},
        res: {},
      } as TrpcContext);
    const verified = caller({
      id: 42,
      emailVerified: 1,
    } as TrpcContext["user"]);
    const result = await verified.platforms();
    expect(result.find(row => row.id === "yc-cofounder")?.name).toBe(
      "YC Co-Founder Matching"
    );
    expect(result.some(row => row.id === "f6s")).toBe(false);
    await expect(caller(null).platforms()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      caller({ id: 43, emailVerified: 0 } as TrpcContext["user"]).platforms()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("withholds research-only sources and does not turn a listing into a verified integration", async () => {
    const { publicPlatformCatalogue } = await catalogue();
    const records = publicPlatformCatalogue();
    expect(records.some((row: any) => row.id === "yc-cofounder")).toBe(true);
    expect(records.some((row: any) => row.id === "f6s")).toBe(false);
    expect(JSON.stringify(records)).not.toContain("f6s.com");
    for (const record of records) {
      expect(record.integration).toEqual({
        permissionVerified: false,
        implemented: false,
        liveVerified: false,
      });
      expect(record.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(record.evidence.length).toBeGreaterThan(0);
      for (const url of [record.url, ...record.evidence])
        expect(new URL(url).protocol).toBe("https:");
    }
  });

  it("resolves the reviewed StartHawk alias without counting a second source", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    expect(
      filterPlatforms(records, "  STARThawk  ", "all").map((row: any) => row.id)
    ).toEqual(["foundercloud"]);
    expect(
      filterPlatforms(records, "starthawk.io", "dedicated").map(
        (row: any) => row.id
      )
    ).toEqual(["foundercloud"]);
    expect(filterPlatforms(records, "starthawk", "program")).toEqual([]);
  });

  it("finds regional discovery and separates channel templates from matching services", async () => {
    const { publicPlatformCatalogue, filterPlatforms } = await catalogue();
    const records = publicPlatformCatalogue();
    expect(
      filterPlatforms(records, "Amsterdam", "program").map((row: any) => row.id)
    ).toEqual(["startup-amsterdam"]);
    expect(filterPlatforms(records, "Discord", "community")[0]).toMatchObject({
      kind: "channel-template",
      assistance: "permission-required",
    });
    expect(filterPlatforms(records, "Discord", "dedicated")).toEqual([]);
    expect(filterPlatforms(records, "no-such-source-9387", "all")).toEqual([]);
  });

  it("retains human-only content and unresolved pricing instead of implying permission or free access", async () => {
    const { publicPlatformCatalogue } = await catalogue();
    const records = publicPlatformCatalogue();
    expect(records.find((row: any) => row.id === "hacker-news")).toMatchObject({
      assistance: "human-original",
      aiPostDrafts: "prohibited",
    });
    expect(
      records.find((row: any) => row.id === "founders-nation")
    ).toMatchObject({ pricingStatus: "unknown", aiPostDrafts: "unverified" });
    expect(records.find((row: any) => row.id === "kiuas")).toMatchObject({
      category: "program",
    });
  });

  it("renders restrictions and source evidence without connect, generate or send controls", async () => {
    const { publicPlatformCatalogue } = await catalogue();
    const path = "../client/src/components/PlatformCatalogue";
    const module = await import(path).catch(() => null);
    expect(module?.PlatformCatalogue).toBeTypeOf("function");
    const html = renderToStaticMarkup(
      createElement(module!.PlatformCatalogue, {
        records: publicPlatformCatalogue(),
      })
    );
    expect(html).toContain('id="platform-search"');
    expect(html).toContain('id="platform-category"');
    expect(html.match(/<h3\b/g)).toHaveLength(publicPlatformCatalogue().length);
    expect(html).toContain("<h3>Astana Hub (Kazakhstan)</h3>");
    expect(html).toContain("<h3>Communitech (Ontario, Canada)</h3>");
    expect(html).toContain("<h3>Cyberport / CSAA (Hong Kong)</h3>");
    expect(html).toContain("<h3>Cofondateur.fr (France)</h3>");
    expect(html).toContain("<h3>Cofoundr (France beta)</h3>");
    expect(html).toContain("<h3>CoFoundry (France students)</h3>");
    expect(html).toContain("<h3>WASL Network (MENA)</h3>");
    expect(html).toContain("<h3>CoFounder Match (Spain)</h3>");
    expect(html).toContain('href="https://cofounder-match.com/terms"');
    expect(html).toContain("not external reuse");
    expect(html).toContain("account admission, verification inbox");
    expect(html).toContain(
      "Free registration advertised; complete matching entitlement"
    );
    expect(html).toContain("not external-contact consent");
    expect(html).toContain('href="https://wasl-network.com/terms-of-service"');
    expect(html).toContain(
      "company-registration, address and publication-director placeholders"
    );
    expect(html).toContain("School-gated, not open general signup");
    expect(html).toContain('href="https://cofoundr.fr/legal"');
    expect(html).toContain("CSAA corporate membership is restricted");
    expect(html).toContain("HKD 400,000");
    expect(html).toContain(
      "Public privacy policy is not third-party reuse permission"
    );
    expect(html).toContain('href="https://www.cyberport.hk/en/disclaimer/"');
    expect(html).toContain("free availability not established");
    expect(html).toContain("Private Slack access is not consent");
    expect(html).toContain("Human-original participation");
    expect(html).toContain("FoundrForge (India)");
    expect(html).toContain("Fishburners (Australia)");
    expect(html).toContain("startups.org.nz (Aotearoa New Zealand)");
    expect(html).toContain("Fiji Innovation Hub");
    expect(html).toContain("Astana Hub (Kazakhstan)");
    expect(html).toContain("Startup Base (Uzbekistan)");
    expect(html).toContain("Foreign eligibility conflict unresolved");
    expect(html).toContain('href="https://astanahub.com/en/term_of_use/"');
    expect(html).toContain(
      'href="https://www.startupbase.uz/en/public-offer-agreement"'
    );
    expect(html).toContain('href="https://startups.org.nz/terms"');
    expect(html).toContain("QBO Innovation (Philippines)");
    expect(html).toContain("Launchgarage (Philippines)");
    expect(html).toContain("Investor matching is not co-founder matching");
    expect(html).toContain('href="https://www.qboinnovation.com/for-startups"');
    expect(html).toContain('href="https://www.launchgarage.com/about"');
    expect(html).toContain("CoPath (Japan)");
    expect(html).toContain("EZStartup / 簡單創 (Taiwan)");
    expect(html).toContain("Unresolved conflict");
    expect(html).toContain('href="https://copath.jp/legal/terms"');
    expect(html).toContain('href="https://ezstartup.cc/privacy-policies.html"');
    expect(html).toContain("CoFounder Dekho (India)");
    expect(html).toContain("INR 499/year");
    expect(html).toContain("Homepage profiles and journeys are illustrative");
    expect(html).toContain('href="https://cofounderdekho.in/disclosures"');
    expect(html).toContain("dcamp (South Korea)");
    expect(html).toContain("Cofounders Malaysia (cofounders.my)");
    expect(html).toContain("Policy contact fields contain placeholders");
    expect(html).toContain('href="https://cofounders.my/terms-of-service"');
    expect(html).toContain("INR 999/year");
    expect(html).toContain("Not included in this free beta");
    expect(html).toContain("Channel template");
    expect(html).toContain("2026-09-05");
    expect(html).toContain(
      'href="https://news.ycombinator.com/newsguidelines.html"'
    );
    expect(html).not.toContain("f6s.com");
    expect(html).not.toMatch(/>\s*(Connect|Generate|Send)\s*</);
  });
});
