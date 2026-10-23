import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { importProspectsCsv } from "./db";
import { previewCandidateIntake } from "./candidate-intake";
import {
  declareOutreachSource,
  resolveOutreachSource,
} from "./outreach-source-policy";

beforeAll(() => vi.stubEnv("DATABASE_URL", ""));
afterAll(() => vi.unstubAllEnvs());
const declaration = {
  collectionMethod: "direct_from_person" as const,
  rightsConfirmed: true as const,
  evidenceReference: "synthetic-regional-review",
};

describe("new regional listings remain discovery-only", () => {
  it.each([
    ["wasl-network-mena", "https://wasl-network.com/"],
    ["WASL Network (MENA)", "https://wasl-network.com/matchmaking"],
    ["WASL Network", "https://www.wasl-network.com/signup"],
    ["wasl-network.com", "https://wasl-network.com/terms-of-service"],
    [
      "Wasl Network MENA",
      "https://wasl-network.com/privacy-policy?review=synthetic",
    ],
    ["  wAsL nEtWoRk  ", "https://WASL-NETWORK.COM/matchmaking#synthetic"],
    ["founderbro-indonesia", "https://founderbro.id/"],
    ["founderbro", "https://www.founderbro.id/"],
    ["founderbro.id", "https://founderbro.id/#terms"],
    ["Indonesia founder network", "https://founderbro.id/#privacy"],
    ["cofondateur-france", "https://www.cofondateur.fr/"],
    ["Cofondateur.fr (France)", "https://cofondateur.fr/subscription/pricing"],
    [
      "Cofondateur France",
      "https://www.cofondateur.fr/conditions-generales-d-utilisation-et-de-vente",
    ],
    ["cofoundr-france", "https://cofoundr.fr/"],
    ["Cofoundr (France beta)", "https://www.cofoundr.fr/terms"],
    ["Cofoundr France", "https://cofoundr.fr/legal"],
    ["cofoundry-france", "https://www.cofoundry.fr/etudiants"],
    ["CoFoundry (France students)", "https://cofoundry.fr/legal/cgu"],
    ["CoFoundry étudiants", "https://www.cofoundry.fr/legal/confidentialite"],
    [
      "cyberport-hong-kong",
      "https://www.cyberport.hk/entrepreneurship/cyberport_network/",
    ],
    [
      "Cyberport",
      "https://cyberport.hk/en/entrepreneurship/cyberport_incubation_programme/",
    ],
    [
      "數碼港",
      "https://www.cyberport.hk/zh-hk/entrepreneurship/cyberport_network/",
    ],
    [
      "CSAA",
      "https://www.cyberport.hk/en/entrepreneurship/cyberport_startup_alumni_association/",
    ],
    ["Cyberport Startup Alumni Association", "https://www.csaa.com.hk/"],
    [
      "Startup Canada",
      "https://www.startupcan.ca/explore/startup-communities/",
    ],
    ["startup-canada", "https://startupcan.ca/"],
    ["communitech-ontario", "https://www.communitech.ca/founders/apply/"],
    ["Communitech", "https://communitech.ca/"],
    [
      "Communitech Founder Connect",
      "https://marketplace.communitech.ca/products/free-membership",
    ],
    [
      "Communitech Waterloo",
      "https://www.communitech.ca/about/policies/terms-of-use.html",
    ],
    ["communitech.ca", "https://communitech.ca/founders/apply/"],
    ["cchub-ihub-africa", "https://cchub.africa/"],
    ["Co-creation Hub", "https://www.cchub.africa/contact/"],
    ["iHUB Nairobi", "https://ihub.co.ke/coworking/"],
    ["iHUB Kenya", "https://www.ihub.co.ke/events-community/"],
    ["impact-hub-nairobi", "https://nairobi.impacthub.net/memberships/"],
    ["IHN", "https://www.impacthubnairobi.com/terms"],
    ["ImpactHub Nairobi", "https://impacthubnairobi.com/"],
    ["impacthubnairobi.com", "https://nairobi.impacthub.net/"],
    ["danish-startup-group", "https://www.danishstartupgroup.com/"],
    [
      "Danish Startup Group (Denmark)",
      "https://danishstartupgroup.com/events1/",
    ],
    ["DSG Denmark", "https://www.danishstartupgroup.com/about-dsg/"],
    [
      "danishstartupgroup.com",
      "https://danishstartupgroup.com/member-benefits/",
    ],
    ["norrsken-stockholm", "https://www.norrsken.org/houses/stockholm"],
    [
      "Norrsken House Stockholm (Sweden)",
      "https://norrsken.org/houses/stockholm",
    ],
    ["Norrsken Stockholm", "https://www.norrsken.org/privacy-policy"],
    ["Norrsken House Sweden", "https://norrsken.org/houses/stockholm"],
    ["startuplab-norway", "https://www.startuplab.no/incubator"],
    ["Startup Lab Norway", "https://startuplab.no/"],
    ["Startuplab Bergen", "https://www.startuplab.no/legal/terms"],
    ["startuplab.no", "https://startuplab.no/incubator"],
    ["techbeach-caribbean", "https://www.techbeach.net/"],
    ["TechBeach Retreat (Caribbean)", "https://techbeach.net/"],
    ["TBR Lab", "https://info.techbeach.net/pages/tbr-lab"],
    ["Tech Beach Retreat", "https://www.techbeach.net/impact"],
    ["parallel18-puerto-rico", "https://parallel18.com/"],
    ["Parallel18 (Puerto Rico)", "https://www.parallel18.com/p18/"],
    ["Xpand", "https://parallel18.com/xpand/"],
    ["parallel18", "https://parallel18.com/p18/"],
    ["astana-hub-kazakhstan", "https://astanahub.com/en/startup/"],
    ["Астана Хаб", "https://www.astanahub.com/en/registration/"],
    ["Astana Hub (Kazakhstan)", "https://astanahub.com/en/term_of_use/"],
    ["startup-base-uzbekistan", "https://startupbase.uz/en"],
    ["StartupBase", "https://www.startupbase.uz/uz"],
    [
      "Startup Base (Uzbekistan)",
      "https://startupbase.uz/en/public-offer-agreement",
    ],
    ["startups-nz", "https://startups.org.nz/"],
    [
      "startups.org.nz (Aotearoa New Zealand)",
      "https://www.startups.org.nz/about",
    ],
    ["NZ startup noticeboard", "https://startups.org.nz/terms"],
    ["fishburners-australia", "https://fishburners.org/"],
    ["Fishburners Founder Passport", "https://www.fishburners.org/passport"],
    ["Fishburners (Australia)", "https://fishburners.org/how-it-works"],
    ["fiji-innovation-hub", "https://fijiinnovationhub.com/"],
    ["Fiji Innovation Activator", "https://www.fijiinnovationhub.com/about/"],
    [
      "Fiji Innovation Hub",
      "https://fijiinnovationhub.com/fiji-innovation-activator-2026/",
    ],
    ["qbo-philippines", "https://www.qboinnovation.com/"],
    ["QBO Innovation (Philippines)", "https://qboinnovation.com/for-startups"],
    ["QMMUNITY", "https://www.qboinnovation.com/for-startups"],
    ["QLITAN", "https://qboinnovation.com/"],
    ["launchgarage-philippines", "https://www.launchgarage.com/"],
    ["Launchgarage (Philippines)", "https://launchgarage.com/about"],
    ["Launch Garage", "https://www.launchgarage.com/about"],
    ["launchgarage.com", "https://launchgarage.com/"],
    ["instalanka", "https://www.instalanka.com/matching"],
    ["InstaLanka (Sri Lanka)", "https://instalanka.com/register"],
    ["instalanka.com", "https://www.instalanka.com/login"],
    ["founders-nepal", "https://foundersnepal.com/"],
    ["Founders Nepal", "https://foundersnepal.com/communities"],
    ["FoundersNepal", "https://www.foundersnepal.com/terms"],
    ["bani-pakistan", "https://bani.pk/"],
    ["Bani (Pakistan)", "https://bani.pk/terms"],
    ["Bani", "https://www.bani.pk/privacy"],
    ["bd-saas-zone", "https://www.bdsaaszone.site/co-founders"],
    ["BD SaaS Zone", "https://bdsaaszone.site/login"],
    ["BD SaaS Zone (Bangladesh)", "https://www.bdsaaszone.site/startups"],
    ["copath", "https://copath.jp/"],
    ["CoPath (Japan)", "https://copath.jp/auth/signup"],
    ["CoPath 共同創業者マッチング", "https://www.copath.jp/board?region=all"],
    ["copath.jp", "https://copath.jp/legal/terms"],
    ["ezstartup-taiwan", "https://ezstartup.cc/"],
    [
      "EZStartup / 簡單創 (Taiwan)",
      "https://ezstartup.cc/privacy-policies.html",
    ],
    ["簡單創", "https://www.ezstartup.cc/partner-city/.html"],
    ["EZ Startup", "https://ezstartup.cc/about-us.html"],
    ["cofounder-dekho-india", "https://cofounderdekho.in/"],
    ["CoFounder Dekho", "https://cofounderdekho.in/terms"],
    ["CoFounderDekho", "https://www.cofounderdekho.in/profiles?role=tech"],
    ["cofounderdekho.in", "https://cofounderdekho.in/privacy-policy"],
    ["cofounders-malaysia", "https://cofounders.my/"],
    ["Cofounders Malaysia", "https://cofounders.my/directory"],
    ["cofounders.my", "https://www.cofounders.my/directory?state=all"],
    [
      "Cofounders Malaysia (cofounders.my)",
      "https://cofounders.my/terms-of-service",
    ],
    ["dubai-founders-hq", "https://www.dubaifoundershq.com/"],
    ["DFHQ", "https://www.dubaifoundershq.com/en/network"],
    [
      "Dubai Founders HQ",
      "https://www.dubaifoundershq.com/en/contact/join-dfhq",
    ],
    ["foundrforge-india", "https://foundrforge.in/"],
    ["dcamp-korea", "https://dcamp.kr/en"],
    ["founderslist", "https://founderslist.com/cofounders"],
    ["cofound-biz", "https://www.cofound.biz/platform"],
    ["cofy-latam", "https://www.cofyapp.com/"],
    ["tech-talents-match", "https://www.techtalents.com.br/match"],
    ["jasiri-talent-investor", "https://jasiri.org/jasiri-talent-investor/"],
    ["mest-ai-startup", "https://meltwater.org/mest-ai-startup-program/"],
    ["startmate-anz", "https://www.startmate.com/faq"],
    ["maya-matching", "https://www.maya.capital/programs?language=en"],
    ["sharakalab", "https://www.sharakalab.com/"],
    ["revise-africa", "https://www.revise.africa/cofounder-matching/"],
    ["cousins-africa", "https://cousins.africa/"],
  ])(
    "blocks candidate intake, CSV and outreach preparation for %s before storage",
    async (platform, profileUrl) => {
      for (const prospect of [
        { platform },
        { profileUrl },
        { platform, profileUrl },
        { platform: "manual", profileUrl },
      ]) {
        expect(resolveOutreachSource(prospect)).toMatchObject({
          allowed: false,
          destinationUrl: null,
        });
      }
      await expect(
        importProspectsCsv({
          userId: 42,
          accountId: 42,
          requestId: "regional-test",
          idempotencyKey: "regional-test-key",
          csv: `name,platform\nSynthetic regional candidate,${platform}`,
          declaration,
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        previewCandidateIntake(
          {
            accountId: 42,
            candidate: {
              name: "Synthetic regional candidate",
              platform,
              consentStatus: "unknown",
            },
            declaration,
          },
          42
        )
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(() =>
        declareOutreachSource(
          {
            actorId: 42,
            prospect: { platform, profileUrl },
            body: "An original human message",
            generationMode: "user_authored",
          },
          { humanOriginal: true, rulesReviewed: true },
          new Date("2026-10-01T12:00:00Z")
        )
      ).toThrow();
    }
  );
});
