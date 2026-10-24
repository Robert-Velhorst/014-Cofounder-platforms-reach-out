import type { PlatformRecord } from "../shared/platform-catalogue";
export { filterPlatforms } from "../shared/platform-catalogue";

// Source provenance and unresolved research: docs/PLATFORM_SOURCE_REVIEW.md.
// F6S remains in that internal review, NOT in the customer response or bundle.
// These records describe discovery routes. They never grant action permission.
type ReviewedSource = Pick<
  PlatformRecord,
  | "id"
  | "name"
  | "url"
  | "category"
  | "audience"
  | "access"
  | "pricing"
  | "restrictions"
> &
  Partial<
    Pick<
      PlatformRecord,
      | "aliases"
      | "kind"
      | "pricingStatus"
      | "assistance"
      | "aiPostDrafts"
      | "evidence"
      | "reviewedAt"
    >
  >;

const sources: ReviewedSource[] = [
  {
    id: "cofounder-match-spain",
    name: "CoFounder Match (Spain)",
    url: "https://cofounder-match.com/",
    aliases: [
      "CoFounder Match España",
      "CoFounder Match Espana",
      "cofounder-match.com",
    ],
    category: "dedicated",
    audience:
      "Spain / España; Spanish-language / español co-founder discovery for founders, aspiring entrepreneurs and early teams. Eligibility outside Spain is unverified.",
    access:
      "18+ under the terms. Public registration form reviewed; account admission, verification inbox and Spanish member workflows untested. No account created or individual profile opened.",
    pricingStatus: "free-core",
    pricing:
      "Provider advertises free profiles, browsing and messaging; actual entitlements, limits and future prices untested. Advertised availability is not account acceptance.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Terms prohibit collecting other users' information without consent and unsolicited spam. User-content license is for the provider's platform, not external reuse. Discreet-mode, privacy and compatibility claims unverified; legal operator identity and external contact/API rights not established. No relationship to cofound.biz, cofound.lat, cofound.space or WeFoundy established.",
    evidence: [
      "https://cofounder-match.com/",
      "https://cofounder-match.com/how-it-works",
      "https://cofounder-match.com/terms",
      "https://cofounder-match.com/privacy",
      "https://cofounder-match.com/register",
    ],
    reviewedAt: "2026-10-23",
  },
  {
    id: "wasl-network-mena",
    name: "WASL Network (MENA)",
    url: "https://wasl-network.com/",
    aliases: ["WASL Network", "wasl-network.com", "Wasl Network MENA"],
    category: "dedicated",
    audience:
      "Middle East and North Africa / MENA founders seeking complementary co-founders; provider lists Cairo, Egypt and Riyadh, Saudi Arabia hubs. Regional branding does not establish country eligibility or an Arabic interface.",
    access:
      "Public English pages and signup form reviewed. Founder profiles require administrator review before the matching pool. Member access, accepted countries, age eligibility and actual introductions untested; no account created.",
    pricingStatus: "free-entry",
    pricing:
      "Free registration advertised; complete matching entitlement, later fees and paid features not verified. Investor-directory access is a separate offering, not proof of co-founder access.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Terms prohibit automated founder/investor data harvesting and fake accounts. Provider describes contact disclosure only after mutual acceptance; this is not external-contact consent. Privacy/verification claims and pending legal-review notices are not independently accepted; no profiles collected or API/message permission established.",
    evidence: [
      "https://wasl-network.com/",
      "https://wasl-network.com/about",
      "https://wasl-network.com/terms-of-service",
      "https://wasl-network.com/privacy-policy",
    ],
    reviewedAt: "2026-10-23",
  },
  {
    id: "founderbro-indonesia",
    name: "founderbro (Indonesia)",
    url: "https://founderbro.id/",
    aliases: ["founderbro", "founderbro.id", "Indonesia founder network"],
    category: "community",
    audience:
      "Indonesia / Jakarta startup-founder directory; indirect discovery, not dedicated co-founder matching or evidence that listed founders seek a partner.",
    access:
      "Public browsing; submissions require a registered/operating Indonesia-based scalable or tech startup and manual review. Account and Bahasa Indonesia workflows untested.",
    pricingStatus: "free-entry",
    pricing:
      "Terms describe a free directory; no paid-feature or future-price guarantee.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Terms forbid scraping, resale, bulk export, spam and harassment. Public profiles do not grant external-contact consent. No profiles collected or messaging/API permission established.",
    evidence: ["https://founderbro.id/"],
    reviewedAt: "2026-10-02",
  },
  {
    id: "cofondateur-france",
    name: "Cofondateur.fr (France)",
    url: "https://www.cofondateur.fr/",
    aliases: ["Cofondateur.fr", "cofondateur.fr", "Cofondateur France"],
    category: "dedicated",
    audience:
      "France / French-language / français entrepreneurs and complementary startup partners. Dedicated matching advertised; results and verification claims not independently proven.",
    access:
      "Adult individuals or legal entities able to associate legally; terms mention companies in France or abroad, not a verified supported-country list. Registration can be refused. Account, payment and French member workflows untested.",
    pricingStatus: "free-entry",
    pricing:
      "Free browsing and a limited free talent plan advertised. Talent Standard EUR 29.90/month and Premium EUR 59.90/month exclude VAT. Founder programmes have three-month commitments and automatic extensions; not free matching throughout. Checkout untested; external costs not included in this beta.",
    restrictions:
      "Discovery only; no profile import or outreach review. Terms prohibit freelance/agency sales solicitation and sharing project owners' contact details with third parties; site-content reuse requires written agreement. No harvesting, automated messaging or contact-consent grant. Paid provider AI-message features do not authorize this app to post drafts.",
    evidence: [
      "https://www.cofondateur.fr/",
      "https://www.cofondateur.fr/subscription/pricing",
      "https://www.cofondateur.fr/conditions-generales-d-utilisation-et-de-vente",
      "https://www.cofondateur.fr/politique-de-confidentialite-et-raitements-des-donnees-personnelles",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "cofoundr-france",
    name: "Cofoundr (France beta)",
    url: "https://cofoundr.fr/",
    aliases: ["Cofoundr France", "cofoundr.fr"],
    category: "dedicated",
    audience:
      "France / French-language / français tech and business founders; matching and matched-user messaging advertised, not independently verified outcomes.",
    access:
      "Beta; adults with legal capacity and valid email. Legal notice still contains company-registration, address and publication-director placeholders. Operator identity, available member accounts and French-language workflows unverified; not an endorsed provider.",
    pricingStatus: "free-entry",
    pricing:
      "EUR 0/month during beta advertised, plus EUR 5/month supporter extras. Permanent free access, exact feature limits, tax and checkout unverified. No purchase or cost included in this beta.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Terms restrict unauthorized commercial use and require checking other users' information; a match is not external-contact consent. Content reproduction requires written agreement. Provider privacy/security and success claims are unverified; no harvesting, automation or API permission established.",
    evidence: [
      "https://cofoundr.fr/",
      "https://cofoundr.fr/terms",
      "https://cofoundr.fr/privacy",
      "https://cofoundr.fr/legal",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "cofoundry-france",
    name: "CoFoundry (France students)",
    url: "https://www.cofoundry.fr/etudiants",
    aliases: ["CoFoundry France", "cofoundry.fr", "CoFoundry étudiants"],
    category: "dedicated",
    audience:
      "France / French-language / français student entrepreneurs seeking complementary co-founders through partner higher-education institutions. Matching advertised, not independently verified.",
    access:
      "School-gated, not open general signup. Public partner section invites a first institution rather than confirming available schools; actual admission unverified despite an advertised September 2026 launch. Terms allow adults or parental authorization; privacy text specifies minors over 15. Native member workflows untested.",
    pricingStatus: "free-entry",
    pricing:
      "Basic student access at partner schools advertised free; possible premium features. Schools need a quoted annual subscription; selected investor access is paid. A free student claim does not establish school availability or a free complete service. No institutional commitment included in this beta.",
    restrictions:
      "Discovery only; no profile import/outreach review. Terms prohibit extracting or collecting data without authorization. School access and member visibility do not grant external-contact consent. Privacy, security, matching and contract-generation claims are not independent legal or operational assurance; no automation/API grant established.",
    evidence: [
      "https://www.cofoundry.fr/etudiants",
      "https://www.cofoundry.fr/notre-histoire",
      "https://www.cofoundry.fr/legal/cgu",
      "https://www.cofoundry.fr/legal/confidentialite",
      "https://www.cofoundry.fr/legal/mentions-legales",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "cyberport-hong-kong",
    name: "Cyberport / CSAA (Hong Kong)",
    url: "https://www.cyberport.hk/entrepreneurship/cyberport_network/",
    aliases: [
      "Cyberport",
      "數碼港",
      "Cyberport Startup Alumni Association",
      "CSAA",
      "cyberport.hk",
    ],
    category: "program",
    audience:
      "Hong Kong / 香港 digital-technology startup ecosystem, partner connections and alumni networking. Indirect discovery, not dedicated co-founder matching.",
    access:
      "Network/program-specific access. CSAA corporate membership is restricted to eligible existing/graduate Cyberport incubatees or grantees, not open individual matching. CIP requires Hong Kong incorporation/local presence; its page announces programme enhancements, so current intake must be rechecked. English and Traditional Chinese public pages read; account and native-language workflows untested.",
    pricingStatus: "unknown",
    pricing:
      "Network/alumni fees unverified, not assumed free. Existing CIP page describes audited eligible expenses of at least HKD 400,000 upon graduation; the programme is being updated, so obligations require fresh review. No participation cost included in this beta.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Investor/business matching is not co-founder introductions. No member harvesting, automation or contact-consent grant established. Public privacy policy is not third-party reuse permission; review exact membership/event terms before participation.",
    evidence: [
      "https://www.cyberport.hk/entrepreneurship/cyberport_network/",
      "https://www.cyberport.hk/zh-hk/entrepreneurship/cyberport_network/",
      "https://www.csaa.com.hk/",
      "https://www.cyberport.hk/en/entrepreneurship/cyberport_incubation_programme/",
      "https://www.cyberport.hk/en/privacy_policy_statement/",
      "https://www.cyberport.hk/en/disclaimer/",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "communitech-ontario",
    name: "Communitech (Ontario, Canada)",
    url: "https://www.communitech.ca/founders/apply/",
    aliases: [
      "Communitech",
      "Communitech Founder Connect",
      "Communitech Waterloo",
      "communitech.ca",
    ],
    category: "community",
    audience:
      "Canada / Ontario / Waterloo Region technology-founder community, peer sessions and networking. Indirect discovery, not dedicated co-founder matching.",
    access:
      "Own technology product/platform companies with Ontario headquarters, planned headquarters or senior leadership; agencies/consultancies/services excluded. Incorporation expected within 12 months. Connect advertises founder events and Slack; membership untested and marketplace says Sold out. French-language access untested.",
    pricingStatus: "free-entry",
    pricing:
      "Founder Connect listed at CAD 0, marked Sold out; free availability not established. Paid Ignite listing shows CAD 50 with monthly/annual variants; selected term, taxes, events and checkout unverified. No membership costs included in this beta.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Founder terms prohibit spam/unauthorized solicitation and require rights for personal data supplied. Website content reuse requires written permission; no member harvesting, contact or API permission established. Private Slack access is not consent.",
    evidence: [
      "https://www.communitech.ca/founders/apply/",
      "https://marketplace.communitech.ca/products/free-membership",
      "https://marketplace.communitech.ca/products/startup-membership",
      "https://communitech.ca/about/policies/terms-of-service.html",
      "https://www.communitech.ca/about/policies/terms-of-use.html",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "cchub-ihub-africa",
    name: "CcHUB / iHUB (Nigeria and Kenya)",
    url: "https://cchub.africa/",
    aliases: [
      "Co-creation Hub",
      "Co-Creation HUB Africa",
      "CcHUB Nigeria",
      "iHUB Nairobi",
      "iHUB Kenya",
      "ihub.co.ke",
      "cchub.africa",
    ],
    category: "community",
    audience:
      "Nigeria / Lagos and Kenya / Nairobi founder and innovation communities. iHUB is part of CcHUB; one network listing, not dedicated co-founder matching.",
    access:
      "Community, coworking and program-specific entry; membership/booking untested. iHUB virtual membership is Nairobi-only with a six-month minimum. Published events lack a year; confirm current schedules separately.",
    pricingStatus: "paid-membership",
    pricing:
      "iHUB official coworking page lists KES 4,500/month virtual membership, KES 13,000/month coworking and KES 2,000/day passes, excluding VAT. Nigeria rates unverified; dev-site prices differ. Not included in this beta.",
    restrictions:
      "Discovery only; import/outreach not reviewed. No member harvesting, contact consent or automation permission established; review the exact community and membership rules before use.",
    evidence: [
      "https://cchub.africa/",
      "https://cchub.africa/contact/",
      "https://ihub.co.ke/",
      "https://ihub.co.ke/coworking/",
      "https://ihub.co.ke/events-community/",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "impact-hub-nairobi",
    name: "Impact Hub Nairobi (Kenya)",
    url: "https://nairobi.impacthub.net/memberships/",
    aliases: [
      "IHN",
      "ImpactHub Nairobi",
      "impacthubnairobi.com",
      "nairobi.impacthub.net",
    ],
    category: "community",
    audience:
      "Kenya / Nairobi / Westlands founders and impact-oriented collaborators; indirect community discovery, not dedicated co-founder matching.",
    access:
      "Free Connect account advertised; registration and member directory untested. Terms require age18+ and legal capacity. Events, workspace and programs have separate availability and approval rules.",
    pricingStatus: "free-entry",
    pricing:
      "Connect membership advertised free. Linked community platform lists Star Connect Community Monthly at KES 15,000/person/month plus16% VAT; coworking, rooms and some events cost extra. No membership purchased.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Terms prohibit contact harvesting, recruiting spam and bulk outreach; bots/scrapers/automated signups require written consent. Membership does not grant rights at other Impact Hubs.",
    evidence: [
      "https://nairobi.impacthub.net/memberships/",
      "https://www.impacthubnairobi.com/",
      "https://www.impacthubnairobi.com/terms",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "danish-startup-group",
    name: "Danish Startup Group (Denmark)",
    url: "https://www.danishstartupgroup.com/",
    aliases: ["Danish Startup Group", "DSG Denmark", "danishstartupgroup.com"],
    category: "community",
    audience:
      "Denmark / Danmark / Copenhagen / København founder events and community connections. Indirect discovery, not dedicated co-founder matching.",
    access:
      "Homepage advertises open membership; signup untested. Membership page timed out. Event pages contain past listings and conflicting October competition dates; confirm each event separately. Danish-language access untested.",
    pricingStatus: "unknown",
    pricing:
      "Membership fees unverified. Event listings distinguish free and paid attendance; partner benefits do not establish free membership. No fees included in this beta.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Membership, exact group rules, collection/contact and API permissions unverified. Public team/contact details are not reuse consent; do not harvest or message members.",
    evidence: [
      "https://www.danishstartupgroup.com/",
      "https://www.danishstartupgroup.com/about-dsg/",
      "https://www.danishstartupgroup.com/events1/",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "norrsken-stockholm",
    name: "Norrsken House Stockholm (Sweden)",
    url: "https://www.norrsken.org/houses/stockholm",
    aliases: [
      "Norrsken Stockholm",
      "Norrsken House Sweden",
      "Norrsken House Stockholm",
    ],
    category: "community",
    audience:
      "Sweden / Sverige / Stockholm impact-founder community and events. Indirect discovery, not dedicated co-founder matching; other Houses have separate access and terms.",
    access:
      "Solo/team membership applications reviewed weekly. Public and members-only events are separate. Actual availability, admission and Swedish-language access untested.",
    pricingStatus: "paid-membership",
    pricing:
      "Lite: SEK 2,600/month subsidised or 3,950 standard; Flex: SEK 4,400 or 6,300, excluding VAT. Subsidy eligibility, contracts and checkout unverified. Not included in this beta.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Privacy policy describes membership/event data and sponsor sharing; it does not establish collection, messaging or API permission for this tool. Member lists are not contact consent.",
    evidence: [
      "https://www.norrsken.org/houses/stockholm",
      "https://www.norrsken.org/privacy-policy",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "startuplab-norway",
    name: "Startuplab (Norway)",
    url: "https://www.startuplab.no/incubator",
    aliases: [
      "Startup Lab Norway",
      "Startuplab Oslo",
      "Startuplab Bergen",
      "startuplab.no",
    ],
    category: "program",
    audience:
      "Norway / Norge / Oslo / Bergen startup incubator, founder community and networking. Indirect discovery, not dedicated co-founder matching.",
    access:
      "Incubator targets pre-seed/early-stage scalable technology startups registered in Norway; continuous selective applications advertised. Solo/no-team eligibility and Norwegian-language access unverified; signup untested.",
    pricingStatus: "unknown",
    pricing:
      "Incubator costs unverified: retrieved FAQ exposes the cost question but no answer. Accelerator/investment terms are separate, not assumed free or included in this beta.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Website terms restrict content use without permission and require event-specific terms. No member-data collection, messaging or API permission established.",
    evidence: [
      "https://www.startuplab.no/",
      "https://www.startuplab.no/incubator",
      "https://www.startuplab.no/legal/terms",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "techbeach-caribbean",
    name: "TechBeach Retreat (Caribbean)",
    url: "https://www.techbeach.net/",
    aliases: ["Tech Beach Retreat", "TBR Lab", "techbeach.net"],
    category: "program",
    audience:
      "Caribbean founder, investor and builder events, with Jamaica as the currently advertised summit location. Indirect ecosystem discovery, not dedicated co-founder matching.",
    access:
      "Jamaica summit advertised for December 2–5, 2026; paid booking, not a free public member directory. TBR Lab has separate regional-company/MVP/traction requirements; current accelerator intake unverified.",
    pricingStatus: "unknown",
    pricing:
      "Summit advertises a $1,685 per-person three-night package; currency, tax, travel, availability and full booking terms unverified. Lab costs unverified. No participation costs included in this free beta.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Terms link retrieval failed; no collection, contact or API permission established. Booking, travel and program applications require separate review; no matching or admission guaranteed.",
    evidence: [
      "https://www.techbeach.net/",
      "https://info.techbeach.net/pages/tbr-lab",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "parallel18-puerto-rico",
    name: "Parallel18 (Puerto Rico)",
    url: "https://parallel18.com/",
    aliases: ["parallel18", "P18 Puerto Rico", "Xpand"],
    category: "program",
    audience:
      "Puerto Rico / Caribbean startup ecosystem and program-specific founder connections. Indirect discovery, not dedicated co-founder matching or a solo-founder team-formation service.",
    access:
      "P18 requires at least two full-time founders, eligible incorporation and in-person Puerto Rico participation; its FAQ says applications reopen in 2027. Xpand targets growth-stage Puerto Rican-based companies with 3+ years, $250,000+ annual sales, two dedicated people and accelerator experience. Account/application paths untested.",
    pricingStatus: "investment-terms",
    pricing:
      "P18 advertises investment via SAFE, not a grant or guaranteed admission; no application fee. Xpand advertises free selected-participant access. Contracts, relocation, incorporation and other obligations unreviewed; no costs included in this beta.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Alumni/company-directory visibility is not personal-data collection or contact permission. No forms submitted, membership tested or API permission established. Review each program separately.",
    evidence: [
      "https://parallel18.com/",
      "https://parallel18.com/p18/",
      "https://parallel18.com/xpand/",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "astana-hub-kazakhstan",
    name: "Astana Hub (Kazakhstan)",
    url: "https://astanahub.com/en/startup/",
    aliases: ["Astana Hub", "astanahub.com", "Астана Хаб"],
    category: "program",
    audience:
      "Kazakhstan / Қазақстан / Казахстан and Central Asia startup ecosystem, networking and regional hubs. Indirect discovery, not dedicated co-founder matching; Kazakh, Russian and English language options displayed, workflows untested.",
    access:
      "Portal signup is distinct from formal technopark participation, which has Kazakhstan legal-entity and activity requirements. Current event, programme and overseas access unverified; no account or application tested.",
    pricingStatus: "unknown",
    pricing:
      "Portal and programme costs not established. Formal participation lists quarterly 1% membership fees; calculation base and contract obligations unverified. No fees included in this free beta.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Agreement restricts use of platform materials without administration/Fund consent. Privacy text states no time limit on processing consent; account blocking/archiving terminates processing. No collection, messaging or API permission established.",
    evidence: [
      "https://astanahub.com/en/startup/",
      "https://astanahub.com/en/registration/",
      "https://astanahub.com/en/term_of_use/",
      "https://astanahub.com/en/privacy_policy/",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "startup-base-uzbekistan",
    name: "Startup Base (Uzbekistan)",
    url: "https://startupbase.uz/en",
    aliases: ["Startup Base Uzbekistan", "StartupBase", "startupbase.uz"],
    category: "program",
    audience:
      "Uzbekistan / O‘zbekiston / Узбекистан startup, investor and accelerator ecosystem. Events and partner discovery are indirect co-founder routes, not dedicated matching. Uzbek/English pages and Russian agreement read; account-language access untested.",
    access:
      "Agreement describes local OneID and foreign email-form registration, but its user definition also requires personal/tax identifiers. Foreign eligibility conflict unresolved; no signup, private directory or support-program entitlement tested.",
    pricingStatus: "free-core",
    pricing:
      "Agreement states platform functionality is free. Separate events, funding eligibility and partner-program obligations are not verified or included in this beta.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Agreement prohibits spam and rights infringement; public ecosystem data is not contact or reuse consent. Collection/API rights unverified; funding and member counts are operator claims, not acceptance evidence.",
    evidence: [
      "https://startupbase.uz/en",
      "https://startupbase.uz/uz",
      "https://www.startupbase.uz/en/public-offer-agreement",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "startups-nz",
    name: "startups.org.nz (Aotearoa New Zealand)",
    url: "https://startups.org.nz/",
    aliases: ["startups.org.nz", "NZ startup noticeboard"],
    category: "community",
    audience:
      "Aotearoa New Zealand founders and builders seeking co-founders or early team members through a noticeboard, not curated matching. English pages; Maori-language and overseas eligibility unverified.",
    access:
      "Public information describes Microsoft/Google/email-code sign-in, posts and member connection requests. No account, private profile or connection tested; age and geographic eligibility unknown.",
    pricingStatus: "free-core",
    pricing:
      "Operator advertises free use without fees or ads. Actual member entitlements untested.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Terms prohibit scraping, overload, spam and misuse. Public profile visibility is optional and is not collection or contact consent. Operator does not vet connections; safety and outcomes unverified.",
    evidence: [
      "https://startups.org.nz/",
      "https://startups.org.nz/about",
      "https://startups.org.nz/terms",
      "https://startups.org.nz/privacy",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "fishburners-australia",
    name: "Fishburners (Australia)",
    url: "https://fishburners.org/",
    aliases: ["Fishburners", "fishburners.org", "Fishburners Founder Passport"],
    category: "community",
    audience:
      "Australian startup community, with Sydney in-person founder connections, events and workspaces. An indirect co-founder discovery route, not dedicated matching.",
    access:
      "Founder Passport membership and separate residency/workspace offerings. Signup links lead to foundershub.org, but no account, checkout, attendance or overseas entitlement tested.",
    pricingStatus: "paid-membership",
    pricing:
      "Passport page displays $89/month or $54.92/month billed annually. Currency, tax, billing terms and additional workspace costs unverified. Not included in this free beta or its EUR100 operating budget.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Community access is not permission to collect member data or send messages. Full policies, current events, availability and residency admission unresolved. Membership and size claims are not independently verified.",
    evidence: [
      "https://fishburners.org/how-it-works",
      "https://fishburners.org/passport",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "fiji-innovation-hub",
    name: "Fiji Innovation Hub",
    url: "https://fijiinnovationhub.com/",
    aliases: [
      "Fiji Innovation Hub",
      "Fiji Innovation Activator",
      "fijiinnovationhub.com",
    ],
    category: "program",
    audience:
      "Fiji/Pacific innovation ecosystem with founder cohorts, mentoring and peer connections. Indirect networking, not a dedicated co-founder matcher; wider Pacific-country eligibility unverified.",
    access:
      "The reviewed Activator 2026 cohort required Fiji-based digital/technology ventures and in-person Suva sessions. Published deadline April 1 and programme April 28-June 26, 2026 are past; no current open intake established.",
    pricingStatus: "unknown",
    pricing:
      "The specific past Activator 2026 cohort was advertised free and equity-free. General hub services and future cohorts have unknown costs; do not infer ongoing free admission.",
    restrictions:
      "Discovery only; import/outreach not reviewed. No member directory or contact consent established. Policy-labelled links shared an events reference in the reader; meaningful terms/privacy text not established. No application or message submitted.",
    evidence: [
      "https://fijiinnovationhub.com/about/",
      "https://fijiinnovationhub.com/fiji-innovation-activator-2026/",
      "https://www.rbf.gov.fj/media-brief-no-01-applications-open-for-fiji-innovation-activator-2026/",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "qbo-philippines",
    name: "QBO Innovation (Philippines)",
    url: "https://www.qboinnovation.com/",
    aliases: ["QBO", "QMMUNITY", "QLITAN", "qboinnovation.com"],
    category: "program",
    audience:
      "Philippines startup ecosystem and networking; an indirect co-founder route, not dedicated matching. English public pages; Filipino-language access unverified.",
    access:
      "Regular members can attend BASIQS/QLITAN. Startup membership requires a team/MVP/plan and application interview. No signup or attendance tested; overseas and age eligibility unknown.",
    pricingStatus: "free-entry",
    pricing:
      "Official pages advertise free membership/programs/services; actual entitlements and current schedules untested.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Policies and member-data rights unresolved. About-page retrieval failed, not proof of closure. Investor matching is not co-founder matching.",
    evidence: [
      "https://www.qboinnovation.com/",
      "https://www.qboinnovation.com/for-startups",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "launchgarage-philippines",
    name: "Launchgarage (Philippines)",
    url: "https://www.launchgarage.com/",
    aliases: ["Launchgarage", "Launch Garage", "launchgarage.com"],
    category: "program",
    audience:
      "Manila/Quezon City, Philippines innovation hub and founder ecosystem; indirect networking, not dedicated matching. English public pages; Filipino-language access unverified.",
    access:
      "Public ecosystem/contact pages readable; membership, attendance, age and overseas eligibility untested. Homepage's upcoming event is dated August 30, 2025, already past at review.",
    pricingStatus: "unknown",
    pricing:
      "Current participation costs unknown. Historical investment amounts do not establish free access or current funding.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Current schedules, policies and member-data rights unresolved. A contact form is not contact consent; no form submitted.",
    evidence: [
      "https://www.launchgarage.com/",
      "https://www.launchgarage.com/about",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "instalanka",
    name: "InstaLanka (Sri Lanka)",
    url: "https://www.instalanka.com/",
    aliases: ["InstaLanka", "instalanka.com"],
    category: "dedicated",
    audience:
      "Sri Lanka-focused startup ecosystem advertising co-founder matching by skills, interests and commitment. English public pages; Sinhala/Tamil and overseas eligibility unverified.",
    access:
      "Matching page redirects to login; public registration form exists. No account created, matching performed or member access verified.",
    pricingStatus: "unknown",
    pricing:
      "Matching and membership prices not established from the reviewed pages; a registration form is not evidence of free access.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Policy URLs were inaccessible through the research tool, not proven absent. Member-data rights, operator identity, age limits and automation permission remain unresolved. Displayed counts and startup examples are not verified operating evidence.",
    evidence: [
      "https://www.instalanka.com/",
      "https://www.instalanka.com/about",
      "https://www.instalanka.com/matching",
      "https://www.instalanka.com/register",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "founders-nepal",
    name: "Founders Nepal",
    url: "https://foundersnepal.com/",
    aliases: ["FoundersNepal", "foundersnepal.com"],
    category: "community",
    audience:
      "Nepal-focused founder/product community; public pages describe collaboration and finding co-founders, not a verified dedicated matching engine. English pages; international access is a publisher claim.",
    access:
      "Public community and product pages readable. Terms require adult eligibility and accurate accounts; actual signup, messaging and overseas access untested.",
    pricingStatus: "free-core",
    pricing:
      "FAQ states free joining, discussions, messaging and product launches; optional Premium features. Actual entitlements and Premium prices unverified.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Terms prohibit automated access and copying without express written permission. Community visibility is not contact consent or export rights. Membership and security claims are not independently verified.",
    evidence: [
      "https://foundersnepal.com/",
      "https://foundersnepal.com/faq",
      "https://foundersnepal.com/communities",
      "https://foundersnepal.com/terms",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "bani-pakistan",
    name: "Bani (Pakistan)",
    url: "https://bani.pk/",
    aliases: ["Bani", "bani.pk"],
    category: "community",
    audience:
      "Pakistan-focused founder community and prospective co-founder networking. English public pages; overseas eligibility unverified.",
    access:
      "Early-access waitlist, not proven live matching. Startup directory is marked coming soon. Account, network and contact workflows untested; no form submitted.",
    pricingStatus: "unknown",
    pricing:
      "Founder membership/contact pricing not stated in the reviewed pages. Do not infer free access from the waitlist.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Terms require accurate submissions and no form misuse. Privacy describes submitted details plus IP/user-agent storage and a removal request via contact. Member-data processing, age eligibility and automation permission unresolved.",
    evidence: [
      "https://bani.pk/",
      "https://bani.pk/privacy",
      "https://bani.pk/terms",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "bd-saas-zone",
    name: "BD SaaS Zone (Bangladesh)",
    url: "https://www.bdsaaszone.site/co-founders",
    aliases: ["BD SaaS Zone", "bdsaaszone.site"],
    category: "community",
    audience:
      "Bangladesh SaaS/startup directory with a seeking-cofounders board. English and Bangla listing content; not a proven dedicated matching engine.",
    access:
      "Public seeking-partner page readable; founders are invited to mark their startup as seeking a co-founder. Login read returned only Loading; submission, accounts, age/overseas eligibility and contact paths untested.",
    pricingStatus: "unknown",
    pricing:
      "Homepage advertises paid promotion, not verified founder contact or listing entitlement. Actual membership/contact costs unknown; external promotion is not included in this beta.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Member listings are not verified identities or contact consent. Data rights, terms, privacy/retention and automation permission remain unresolved; do not copy profiles into this tool.",
    evidence: [
      "https://www.bdsaaszone.site/co-founders",
      "https://www.bdsaaszone.site/",
      "https://www.bdsaaszone.site/login",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "copath",
    name: "CoPath (Japan)",
    url: "https://copath.jp/",
    aliases: ["CoPath", "copath.jp", "CoPath 共同創業者マッチング"],
    category: "dedicated",
    audience:
      "Japan-oriented / Japanese-first / 日本語 cofounder matching for ideas and complementary skills. Overseas eligibility unverified.",
    access:
      "Signup, blog and policies readable; homepage timed out. Google/email registration advertised; actual member access untested. Terms target 18+ with parental consent for minors. In-platform participation is not an equity or employment contract.",
    pricing:
      "Unresolved conflict: pricing page/blog say all features currently free; terms/trade disclosure describe a limited free tier, JPY 1,980/month Pro and a conditional Founder offer. Confirm current entitlement before relying on free posting or messaging; no paid access included in this beta.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Terms prohibit unauthorized profile reuse/scraping, spam and mass sales DMs. External-chat redirection is restricted; stay within current provider rules. Anonymous display is not identity assurance or permission to collect profiles.",
    evidence: [
      "https://copath.jp/blog/cofounder-recruitment-guide",
      "https://copath.jp/auth/signup",
      "https://copath.jp/legal/terms",
      "https://copath.jp/legal/privacy",
      "https://copath.jp/pricing",
      "https://copath.jp/legal/tokushoho",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "ezstartup-taiwan",
    name: "EZStartup / 簡單創 (Taiwan)",
    url: "https://ezstartup.cc/",
    aliases: ["EZStartup", "EZ Startup", "簡單創", "ezstartup.cc"],
    category: "community",
    audience:
      "Taiwan / Taipei / Traditional Chinese entrepreneurship portal with founder-partner discovery alongside business services; not a dedicated matcher.",
    access:
      "Official homepage presents a founder-partner section and entrepreneur login. Membership, contact path, age and overseas eligibility untested; public snippets are not verified members or consent to collect them.",
    pricing:
      "Founder access/contact costs not established. Paid business-service quotations and merchant credits do not establish founder membership pricing or free messaging. No membership or service purchase included in this beta.",
    restrictions:
      "Discovery only; import/outreach not reviewed. No API, scraping, export or contact permission established. Privacy pages describe indefinite comment retention, marketing/partner processing and rights requests; the founder-specific processing path still needs clarification. Public visibility is not contact consent.",
    evidence: [
      "https://ezstartup.cc/",
      "https://ezstartup.cc/about-us.html",
      "https://ezstartup.cc/privacy-policies.html",
      "https://ezstartup.cc/personal-information-privac.html",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "cofounder-dekho-india",
    name: "CoFounder Dekho (India)",
    url: "https://cofounderdekho.in/",
    aliases: ["CoFounder Dekho", "CoFounderDekho", "cofounderdekho.in"],
    category: "dedicated",
    audience:
      "India-focused founder discovery across technical, design, business and domain roles.",
    access:
      "18+ under terms. Profile discovery and messaging advertised; actual registered-member access untested. Examples are not evidence of real members or successful matches.",
    pricingStatus: "paid-membership",
    pricing:
      "Homepage advertises Pro at INR 499/year. Checkout, taxes and any free-core entitlement unverified; membership is not included in this beta.",
    restrictions:
      "Discovery only; import/outreach not reviewed. Homepage profiles and journeys are illustrative; identities and credentials are not independently verified under disclosures. Privacy/disclosure pages use CoFounderMatch naming: clarify operator consistency before relying on rights handling. Terms prohibit spam; no API, scraping or automation permission established.",
    evidence: [
      "https://cofounderdekho.in/",
      "https://cofounderdekho.in/terms",
      "https://cofounderdekho.in/privacy-policy",
      "https://cofounderdekho.in/disclosures",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "cofounders-malaysia",
    name: "Cofounders Malaysia (cofounders.my)",
    url: "https://cofounders.my/",
    aliases: ["Cofounders Malaysia", "cofounders.my"],
    category: "dedicated",
    audience:
      "Malaysia / Kuala Lumpur / Southeast Asia founders seeking a venture partner; not the same brand as CoFound or CoFoundersLab.",
    access:
      "18+; Malaysia-oriented but terms permit international users. Application review and profile approval; actual account access untested. Curated directory, not guaranteed matching or identity assurance.",
    pricing:
      "No current membership or event price established. Do not infer free access.",
    restrictions:
      "Discovery only. Terms require written consent for profile/contact harvesting and bots/scripts; prohibit spam/bulk messaging. Import/outreach not reviewed. Policy contact fields contain placeholders; resolve before trusting support or data-rights handling.",
    evidence: [
      "https://cofounders.my/",
      "https://cofounders.my/terms-of-service",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "dubai-founders-hq",
    name: "Dubai Founders HQ (UAE)",
    url: "https://www.dubaifoundershq.com/",
    aliases: ["Dubai Founders HQ", "DFHQ", "dubaifoundershq.com"],
    category: "program",
    audience:
      "Dubai / United Arab Emirates / UAE / Middle East startup ecosystem. Indirect founder discovery, not an independent matching service; some offerings specifically target Emirati entrepreneurs.",
    access:
      "Membership, campus and offering-specific routes. Official February 2026 announcement describes a partner Antler residency with cofounder formation; it is the same Antler program, not another matching pool. Current network page timed out; membership entry and eligibility untested.",
    pricing:
      "Membership, campus and event costs not established by the pages read. Do not infer free access; partner investment conditions are separate.",
    restrictions:
      "Discovery only; import/outreach workflow not reviewed. No member collection, application, signup, payment or contact approval. Government ecosystem sponsorship is not permission to harvest profiles or assurance of admission, matching or funding.",
    evidence: [
      "https://www.dubaifoundershq.com/",
      "https://www.dubaifoundershq.com/en/contact/join-dfhq",
      "https://www.dubaifoundershq.com/en/the-campus",
      "https://prod.mediaoffice.ae/en/news/2026/february/10-02/dubai-founders-hq-partners-with-antler-to-launch-flagship-programmes",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "foundrforge-india",
    name: "FoundrForge (India)",
    url: "https://foundrforge.in/",
    aliases: ["FoundrForge", "foundrforge.in"],
    category: "dedicated",
    audience:
      "India-focused individual startup founders, age 18+. Privacy policy says India-only; terms also mention submission to Indian jurisdiction. Overseas eligibility needs clarification.",
    access:
      "Google sign-in and paid membership described. Early-cohort reservation and future-checkout wording coexist with sign-in; actual account access untested. Mutual acceptance and per-match consent required for chat; optional LinkedIn badge is not identity assurance.",
    pricingStatus: "paid-membership",
    pricing:
      "Provider advertises INR 999/year standard or INR 499/year for the first 100 founding members, GST-inclusive, manual renewal and non-refundable fees. Availability and checkout untested. Not included in this free beta or its operating budget.",
    restrictions:
      "Discovery/recheck only. Terms prohibit spam and unrelated solicitation and grant only a personal, non-transferable platform licence. No profile extraction, import or outreach approval. Privacy and erasure claims are provider statements, not an independent audit; review data-processing and confidentiality terms before signup.",
    evidence: [
      "https://foundrforge.in/",
      "https://foundrforge.in/terms",
      "https://foundrforge.in/privacy",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "dcamp-korea",
    name: "dcamp (South Korea)",
    url: "https://dcamp.kr/en",
    aliases: ["dcamp.kr", "D.CAMP", "디캠프"],
    category: "program",
    audience:
      "South Korea / Seoul startup ecosystem, founder networking and mentoring. An indirect discovery route, not a dedicated cofounder-matching service.",
    access:
      "Program-specific application and selection. Batch 9 targets post-launch IT/service scale-ups, not solo idea-stage founders; page lists October 14, 2026 deadline. Individual event availability, foreign-founder eligibility and language requirements need confirmation.",
    pricingStatus: "investment-terms",
    pricing:
      "Selected batch participation includes equity investment and residency support; exact terms and event costs unreviewed. Not a guaranteed free service or funding entitlement.",
    restrictions:
      "Discovery/recheck only. Korean-language program pages and linked terms/privacy require review for the chosen offering. Founder-networking descriptions do not establish cofounder introductions, collection rights or permission to contact residents. No profile harvesting, import or outreach approval; no application or investment commitment.",
    evidence: [
      "https://dcamp.kr/en",
      "https://dcamp.kr/program/batch",
      "https://dcamp.kr/program/officehour",
      "https://dcamp.kr/terms",
      "https://dcamp.kr/privacy-policy",
    ],
    reviewedAt: "2026-10-02",
  },
  {
    id: "founderslist",
    name: "FoundersList",
    url: "https://founderslist.com/cofounders",
    aliases: ["founderslist.com"],
    category: "dedicated",
    audience:
      "Startup and side-project cofounders; public city links include New Delhi, Berlin, London, Sydney and North America.",
    access:
      "Account/profile required for posting; listings and filters advertised. Signup, messaging and current listing activity untested.",
    pricingStatus: "free-core",
    pricing:
      "Free listings and messaging advertised; not live-tested and not a guarantee of future availability.",
    restrictions:
      "Discovery only. Terms restrict harvesting and commercial extraction without written permission. No repeat or promotional cofounder listings; complete a profile first. Terms contain unrelated property-market wording; clarify before relying on them. No import/outreach approval.",
    evidence: [
      "https://founderslist.com/cofounders",
      "https://founderslist.com/terms",
      "https://founderslist.com/guidelines/cofounders",
    ],
    reviewedAt: "2026-10-01",
  },
  {
    id: "cofound-biz",
    name: "CoFound (cofound.biz)",
    url: "https://www.cofound.biz/platform",
    aliases: ["cofound.biz"],
    category: "dedicated",
    audience:
      "Founders and early-stage startup teams; geographic eligibility unverified.",
    access:
      "Waitlist calls to action coexist with signup/pricing links; immediate matching access unverified. Terms require age 18+.",
    pricingStatus: "free-entry",
    pricing:
      "Explorer advertised free; unlimited matching descriptions conflict between the plan table and FAQ. Paid workspace plans are separate; verify limits before signup.",
    restrictions:
      "Discovery/recheck only. No relationship established with similarly named LATAM or Android services. Terms require written permission for content reproduction. Profile and business confidentiality need review; no matching-quality or legal-template assurance. No import/outreach approval.",
    evidence: [
      "https://www.cofound.biz/platform",
      "https://www.cofound.biz/pricing",
      "https://www.cofound.biz/legal/terms-and-conditions",
      "https://www.cofound.biz/legal/privacy-policy",
    ],
    reviewedAt: "2026-10-01",
  },
  {
    id: "cofy-latam",
    name: "Cofy (LatAm)",
    url: "https://www.cofyapp.com/",
    aliases: ["Cofy", "cofyapp.com"],
    category: "dedicated",
    audience:
      "Latin America / LATAM; Argentina, Chile, Colombia, Peru, Uruguay and Panama advertised. Technical cofounders, commercial partners and talent.",
    access:
      "Signup offered; contact details released only after a mutual match or accepted highlighted interest. Actual accounts and connections untested.",
    pricingStatus: "free-core",
    pricing:
      "Free core and paid Plus/Priority plans advertised; checkout taxes/currency and renewal conditions require separate review. No subscription included in this beta.",
    restrictions:
      "Discovery only. Terms prohibit unauthorized scraping and spam. LinkedIn reference is not identity verification. Privacy/cookie policy content not established from footer labels; review before signup. No profile export, import or outreach approval.",
    evidence: ["https://www.cofyapp.com/", "https://www.cofyapp.com/terminos"],
    reviewedAt: "2026-10-01",
  },
  {
    id: "sharakalab",
    name: "SharakaLab",
    url: "https://www.sharakalab.com/",
    category: "dedicated",
    audience: "Morocco and Africa cofounders; French and English public pages.",
    access:
      "Profile signup and skill/project-based matching advertised; account workflow and actual availability untested.",
    pricingStatus: "free-core",
    pricing:
      "Provider advertises free unlimited matching. Funding products have separate terms; costs are not included in this beta.",
    restrictions:
      "Discovery only; import/outreach permissions unreviewed. Public examples, activity counts and funding/success claims are marketing, not verified outcomes. Privacy/terms were not established from linked footer text; review before signup.",
    reviewedAt: "2026-10-01",
  },
  {
    id: "revise-africa",
    name: "Revise Africa Co-Founder Matching",
    url: "https://www.revise.africa/cofounder-matching/",
    category: "dedicated",
    audience: "Founders across Africa; Nairobi, Kenya contact address.",
    access:
      "Waiting list: provider says search opens at 50 founders. Account required; accelerator application not required. No immediate matching access verified.",
    pricingStatus: "free-entry",
    pricing:
      "Getting started advertised as free; later limits and charges unverified.",
    restrictions:
      "Discovery/recheck only. Terms require written agreement for scraping/crawling/harvesting. Privacy page contains inconsistent charity/contact wording; clarify before submitting data. No account, profile import or outreach reviewed.",
    evidence: [
      "https://www.revise.africa/cofounder-matching/",
      "https://www.revise.africa/terms-conditions/",
      "https://www.revise.africa/privacy-policy/",
    ],
    reviewedAt: "2026-10-01",
  },
  {
    id: "cousins-africa",
    name: "COUSINS Africa",
    url: "https://cousins.africa/",
    category: "community",
    audience:
      "Ghana-first African tech network for founders, builders, operators, mentors and investors, including cofounder discovery.",
    access:
      "Early access advertised; profile matching and direct messages described. Actual account access, network reach and interaction untested.",
    pricingStatus: "free-entry",
    pricing:
      "Provider advertises free joining and matches; future terms or limits unverified.",
    restrictions:
      "Discovery only; import/outreach workflow unreviewed. Ghana-first expansion is not proof of coverage in every African country. AI quality and active membership are not independently verified; review current privacy/terms before signup.",
    reviewedAt: "2026-10-01",
  },
  {
    id: "yc-cofounder",
    name: "YC Co-Founder Matching",
    url: "https://www.ycombinator.com/cofounder-matching",
    aliases: ["Y Combinator Co-Founder Matching"],
    category: "dedicated",
    audience:
      "International founders starting or exploring a company, with or without an idea.",
    access:
      "Startup School profile and approval for matching; connection invitations require acceptance.",
    pricingStatus: "free-core",
    pricing: "Matching is free; no equity.",
    restrictions:
      "Private matching profiles must not become a public directory. Account workflow and discovery/outreach API use are unverified.",
  },
  {
    id: "cofounderslab",
    name: "CoFoundersLab",
    url: "https://cofounderslab.com/",
    category: "dedicated",
    audience: "Global entrepreneurs seeking cofounders, advice and funding.",
    access:
      "Joining and interest, skill and location matching advertised; account and messaging limits untested.",
    pricingStatus: "free-entry",
    pricing: "Free joining advertised; Premium prices and limits unknown.",
    restrictions:
      "Paid features are not included in this beta. API use case and authenticated workflow unverified.",
  },
  {
    id: "foundercloud",
    name: "FounderCloud",
    url: "https://www.foundercloud.com/",
    aliases: ["StartHawk", "starthawk.io"],
    category: "dedicated",
    audience:
      "Startup ideas and cofounder discovery for entrepreneurs worldwide.",
    access:
      "Public feed; signup for connecting, posting, saving and commenting. Account workflow untested.",
    pricingStatus: "free-entry",
    pricing: "Free signup advertised; Pro pricing and limits unknown.",
    restrictions:
      "StartHawk redirected here at review; it is not a second source. API use unverified.",
    evidence: ["https://www.foundercloud.com/", "https://www.starthawk.io/"],
  },
  {
    id: "foundersbase",
    name: "Foundersbase",
    url: "https://foundersbase.com/",
    category: "dedicated",
    audience: "International cofounders, startup teams, talent and investors.",
    access:
      "Public previews and signup; skill, location, industry and commitment matching advertised. Authenticated interaction untested.",
    pricingStatus: "free-entry",
    pricing:
      "Free start without credit card advertised; complete pricing unknown.",
    restrictions:
      "No bulk ingestion of public member previews. API use unverified.",
  },
  {
    id: "founders-nation",
    name: "Founders Nation",
    url: "https://www.founders-nation.com/",
    category: "dedicated",
    audience:
      "Founders seeking partners and startup joiners in international cities and remote locations.",
    access:
      "Public search previews; registered membership required to send messages.",
    pricing: "Unknown.",
    restrictions:
      "Review current registration and messaging rules before use. API use unverified.",
  },
  {
    id: "founderio",
    name: "Founderio",
    url: "https://www.founderio.com/",
    category: "dedicated",
    audience:
      "Europe-focused multilingual cofounders, startup employees and supporters.",
    access: "Public listings; matching and joining require sign-in/signup.",
    pricing: "Unknown.",
    restrictions:
      "Distinguish cofounder opportunities from jobs and paid support. API use unverified.",
  },
  {
    id: "coffeespace",
    name: "CoffeeSpace",
    url: "https://www.coffeespace.com/",
    category: "dedicated",
    audience:
      "Global founder matching; the separate hiring/talent experience is US-focused.",
    access:
      "Founder app download; talent signup/waitlist and hiring enquiry paths. App onboarding untested.",
    pricingStatus: "free-core",
    pricing:
      "FAQ describes founder profiles, matching and chat as free; recruiter pricing unverified.",
    restrictions:
      "Do not equate US hiring availability with founder-matching coverage. API use unverified.",
  },
  {
    id: "indie-hackers",
    name: "Indie Hackers",
    url: "https://www.indiehackers.com/",
    aliases: ["IH"],
    category: "community",
    audience: "Independent online-business builders; international community.",
    access:
      "Public posts and product board; join and post links. Dedicated cofounder group and posting eligibility unverified.",
    pricing: "Unknown; IH+ is a separate subscription.",
    restrictions:
      "Review current posting rules first. No verified cofounder-specific API endpoint or integration.",
  },
  {
    id: "wellfound",
    name: "Wellfound",
    url: "https://wellfound.com/",
    category: "community",
    audience:
      "Global startup job seekers and hiring teams; indirect cofounder discovery.",
    access:
      "Candidate profiles and job applications; check each listing for genuine cofounder status.",
    pricingStatus: "free-core",
    pricing:
      "Candidate profiles and applications free; recruiter pricing not reviewed.",
    restrictions:
      "Founding-employee titles and equity pay do not establish cofounder ownership. Historical AngelList Talent alias and API use unverified.",
    evidence: ["https://wellfound.com/candidates/overview"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    url: "https://www.linkedin.com/",
    category: "community",
    audience:
      "International professional networking, jobs and groups; country and feature limits apply.",
    access:
      "Real-name personal account, contact limits and exact group membership rules.",
    pricing: "Unknown.",
    restrictions:
      "Only use content you have rights to copy. Scraping and unauthorized automation are restricted; cofounder API approval unverified.",
    evidence: ["https://www.linkedin.com/legal/user-agreement"],
  },
  {
    id: "reddit-cofounder",
    name: "Reddit r/cofounder",
    url: "https://www.reddit.com/r/cofounder/",
    aliases: ["r/cofounder"],
    category: "community",
    audience:
      "Founder-seeking community with country- and skill-specific posts.",
    access:
      "Account age/karma, title format and subject restrictions. Full moderator wiki was not reviewed.",
    pricing: "Unknown.",
    restrictions:
      "Read full current rules before participation. No account-age workarounds, automated reposting or member harvesting. API approval unverified.",
    evidence: [
      "https://www.reddit.com/r/cofounder/",
      "https://www.reddit.com/r/cofounder/wiki/index",
    ],
  },
  {
    id: "github-collaboration",
    name: "GitHub collaboration",
    url: "https://github.com/",
    category: "community",
    audience:
      "Global developers and open-source collaborators; indirect discovery, not proof of founder-search intent.",
    access:
      "Public projects; genuine contributions require account/project permissions and maintainer rules.",
    pricing: "Unknown; no required paid tier established.",
    restrictions:
      "No spam, unsolicited-email use of collected information or personal-information misuse. This SaaS API use case is unverified.",
    evidence: [
      "https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies",
    ],
  },
  {
    id: "hacker-news",
    name: "Hacker News",
    url: "https://news.ycombinator.com/",
    aliases: ["HN"],
    category: "community",
    audience:
      "International hacker and startup discussion; indirect discovery.",
    access:
      "Public reading; submission/comment rules apply. No matching marketplace or private-message workflow established.",
    pricing: "Unknown.",
    assistance: "human-original",
    aiPostDrafts: "prohibited",
    restrictions:
      "No generated or AI-edited posting text. Humans must originate contributions. Public-data read API does not establish posting/outreach permission or a live integration.",
    evidence: [
      "https://news.ycombinator.com/newsguidelines.html",
      "https://github.com/HackerNews/API",
    ],
  },
  {
    id: "product-hunt",
    name: "Product Hunt",
    url: "https://www.producthunt.com/",
    aliases: ["PH"],
    category: "community",
    audience:
      "International product makers, launchers and tech community; indirect discovery.",
    access:
      "Public launches/forums and sign-in; posting eligibility and account workflow untested.",
    pricing: "Unknown.",
    restrictions:
      "API tokens required; default read-only access. Commercial API use requires provider permission; business integration remains on hold.",
    evidence: [
      "https://www.producthunt.com/",
      "https://api.producthunt.com/v2/docs",
    ],
  },
  {
    id: "x-community",
    name: "X",
    url: "https://x.com/",
    aliases: ["Twitter"],
    category: "community",
    audience:
      "Public professional and builder discussions; community and region vary.",
    access:
      "Account and recipient settings plus action-specific consent. No founder-community membership reviewed.",
    pricing: "Unknown; no API tier or price verified.",
    restrictions:
      "OAuth alone is insufficient. No unsolicited automated DMs; AI reply bots require prior written approval. No approval established.",
    evidence: ["https://help.x.com/en/rules-and-policies/x-automation"],
  },
  {
    id: "discord-founder-groups",
    name: "Discord founder channels",
    url: "https://discord.com/",
    category: "community",
    kind: "channel-template",
    assistance: "permission-required",
    audience:
      "Group-specific founder channels; not a verified individual server.",
    access:
      "Exact server, invitation, membership, channel access and administrator rules required. No private server accessed.",
    pricing: "Group-specific pricing unknown.",
    restrictions:
      "No self/user-bots or unsolicited bulk messages. Server-specific app and data-use permission unverified.",
    evidence: ["https://discord.com/guidelines"],
  },
  {
    id: "slack-founder-groups",
    name: "Slack founder workspaces",
    url: "https://slack.com/",
    category: "community",
    kind: "channel-template",
    assistance: "permission-required",
    audience:
      "Workspace-specific founder communities; not a verified individual workspace.",
    access:
      "Invitation, separate workspace account, admission and channel rules required.",
    pricing: "Workspace/community-specific pricing unknown.",
    restrictions:
      "Membership is not permission to export messages or member lists. App/API authorization unverified.",
    evidence: [
      "https://slack.com/help/articles/212675257-Join-a-Slack-workspace",
    ],
  },
  {
    id: "facebook-founder-groups",
    name: "Facebook groups",
    url: "https://www.facebook.com/",
    category: "community",
    kind: "channel-template",
    assistance: "permission-required",
    audience:
      "Group-specific founder communities; not a verified individual group.",
    access:
      "Help retrieval reached login/temporary block. No exact group, membership or full rules verified.",
    pricing: "Unknown.",
    restrictions:
      "Participation on hold until an accessible exact group and its rules are supplied. Account availability does not establish group access; automation unverified.",
    evidence: ["https://www.facebook.com/help/220336891328465"],
  },
  {
    id: "kiuas",
    name: "Kiuas",
    url: "https://kiuas.com/about",
    category: "program",
    audience:
      "Finland-oriented idea/early teams and solo builders; Otaniemi workspace and hybrid participation.",
    access:
      "Founder collective, validation sprint and residency; fit conversation. Cofounder not required; not an accelerator.",
    pricingStatus: "free-core",
    pricing: "FAQ says no fees and no equity.",
    restrictions:
      "Application preparation only where permitted. Historical Kiuas Co-Founder relationship unverified; not a verified standalone matcher. API use unverified.",
  },
  {
    id: "entrepreneurs-first",
    name: "Entrepreneurs First",
    url: "https://www.joinef.com/",
    aliases: ["EF"],
    category: "program",
    audience:
      "High-growth individual founders; Europe, North America and India, including Bangalore and a San Francisco pathway.",
    access:
      "Individual selection and cofounder matching. Bangalore requires relocation; funded teams may continue in San Francisco. No automatic visa provision.",
    pricingStatus: "investment-terms",
    pricing:
      "Grant/investment offer, not a subscription; equity and participant obligations unreviewed.",
    restrictions:
      "No automatic enrolment or investment acceptance. Review terms individually. API use unverified.",
    evidence: [
      "https://www.joinef.com/faqs/",
      "https://www.joinef.com/faqs/bangalore/",
    ],
    reviewedAt: "2026-10-01",
  },
  {
    id: "antler",
    name: "Antler",
    url: "https://www.antler.co/",
    category: "program",
    aliases: ["Antler MENAP", "MENAP", "Antler Dubai", "Antler Riyadh"],
    audience:
      "Early-stage founders across continents. Australia: Sydney, Melbourne and Brisbane co-founder formation within a selected investment residency, not a standalone matching marketplace. MENAP route: Dubai / UAE / United Arab Emirates and Riyadh / Saudi Arabia / Middle East; regional venture focus required.",
    access:
      "Location-specific selection. Australia advertises an eight-week full-time residency; solo entrants may form teams, but investment is for teams. As reviewed 2026-10-23, the cohort page lists 8 February 2027 for Brisbane/Sydney/Melbourne: a start date, not an application deadline or admission guarantee. Australian foreign-applicant/visa eligibility and account access untested. MENAP describes a full-time, in-person 10-week residency for individuals or teams; visa arrangements are the founder's responsibility, without sponsorship. Other cohort dates and account access untested.",
    pricingStatus: "investment-terms",
    pricing:
      "Australia's 7 April 2026 article advertises AU$260,000 for 12% equity for selected backed teams, not guaranteed funding or free matching. Australian fees, travel/living costs and current signed terms unverified. MENAP advertises no residency fee, but investment is selective and equity-bearing, not guaranteed. Travel/living costs and signed terms need review. Other locations may differ.",
    restrictions:
      "Regional discovery evidence does not expand existing manual workflow review or grant collection/contact rights. MENAP no-fee/visa statements do not apply automatically to Australia. The global privacy page names Antler Innovation Pte Ltd and associates, but the Australian contracting entity and participation terms remain unresolved; its displayed update date is 11 December 2020. No visa, funding or application commitment; API and live access unverified.",
    evidence: [
      "https://www.antler.co/",
      "https://www.antler.co/location/menap",
      "https://www.antler.co/location/australia",
      "https://www.antler.co/cohort-start-dates",
      "https://www.antler.co/blog/behind-the-scenes-a-look-inside-antlers-residency-in-australia",
      "https://www.antler.co/legal/privacy-policy",
    ],
    reviewedAt: "2026-10-23",
  },
  {
    id: "startup-weekend",
    name: "Techstars Startup Weekend",
    url: "https://www.techstars.com/communities/startup-weekend",
    aliases: ["Startup Weekend"],
    category: "program",
    audience:
      "Aspiring founders building teams at local three-day events worldwide.",
    access:
      "Check exact event date, registration, capacity and organizer conditions.",
    pricing: "Event ticket prices unknown.",
    restrictions:
      "Event shortlisting/preparation, not admission to a Techstars accelerator. API use unverified.",
  },
  {
    id: "meetup",
    name: "Meetup",
    url: "https://www.meetup.com/",
    category: "program",
    audience:
      "Local networking and interest groups; founder relevance varies by group and location.",
    access:
      "Exact group, admission, RSVP and organizer rules required; private groups need permission.",
    pricing: "Organizer, membership and event fees unknown.",
    restrictions:
      "No attendee harvesting. API eligibility and automation unverified.",
  },
  {
    id: "unternehmertum",
    name: "UnternehmerTUM",
    url: "https://www.unternehmertum.de/en",
    category: "program",
    audience:
      "University-linked entrepreneurship and deep tech in Munich/Garching, Germany; TUM and TUM Venture Labs ecosystem.",
    access:
      "Services, contacts, networking and events; eligibility is service-specific, not universally student-only.",
    pricing: "Individual program/event terms unknown.",
    restrictions:
      "One university-linked example, not all universities. API use unverified.",
  },
  {
    id: "startup-amsterdam",
    name: "StartupAmsterdam",
    url: "https://www.iamsterdam.com/en/business/startupamsterdam",
    aliases: ["Startup Amsterdam"],
    category: "program",
    audience:
      "Amsterdam regional founders, investors, mentors and startup networks.",
    access:
      "City ecosystem map, event routes and newsletter; downstream membership varies.",
    pricing: "Event and program costs unknown.",
    restrictions:
      "Public ecosystem information does not permit bulk collection of personal founder details. API use unverified.",
  },
  {
    id: "devpost",
    name: "Devpost hackathons",
    url: "https://devpost.com/hackathons",
    category: "program",
    audience:
      "Online and in-person hackathon builders; event-specific geography and eligibility.",
    access:
      "Public discovery and signup; check event registration, team formation, prizes and IP rules. Private-company product is separate.",
    pricing: "Participant and organizer pricing unknown.",
    restrictions:
      "Collaboration may lead to founding relationships; this is not a promised matching feature. API use unverified.",
  },
  {
    id: "tech-talents-match",
    name: "Tech Talents Match",
    url: "https://www.techtalents.com.br/match",
    category: "dedicated",
    audience:
      "Brazil / Brasil, Portuguese-language LATAM tech founders and operators; cofounder, networking and job tracks.",
    access:
      "Curated signup through WhatsApp; suggestions through WhatsApp, email and the platform. Cofounder/networking profiles are visible to other members, unlike the separate job track.",
    pricingStatus: "free-core",
    pricing:
      "Provider advertises no fees or equity; account workflow untested.",
    restrictions:
      "Discovery only; import/outreach workflow not reviewed. No WhatsApp messaging, profile collection or API integration enabled.",
    reviewedAt: "2026-10-01",
  },
  {
    id: "jasiri-talent-investor",
    name: "Jasiri Talent Investor",
    url: "https://jasiri.org/jasiri-talent-investor/",
    category: "program",
    audience:
      "East Africa: Kenya, Rwanda and Ethiopia, including eligible citizens in the diaspora; pre-team founders.",
    access:
      "Cohort 9 focuses on food systems, with individual selection, full-time commitment and a mandatory Kigali residential period for team formation. Cohort-specific eligibility overrides broader homepage coverage.",
    pricing:
      "Provider describes funded residential support and milestone-gated grants, not guaranteed funding for every participant; offer obligations require review.",
    restrictions:
      "Discovery only; import/outreach workflow not reviewed. Not a public member directory. Application, travel and funding commitments require separate review.",
    reviewedAt: "2026-10-01",
  },
  {
    id: "mest-ai-startup",
    name: "MEST AI Startup Program",
    url: "https://meltwater.org/mest-ai-startup-program/",
    aliases: ["Meltwater Entrepreneurial School of Technology"],
    category: "program",
    audience:
      "West and East African software builders; Ghana, Nigeria, Senegal and Kenya interview locations; team formation in Accra, Ghana.",
    access:
      "Selective full-time residential training for AI startup teams. Application status conflicts: the introduction says open, but the published 2026 deadline has passed. Confirm the intake before applying.",
    pricing:
      "Training advertised as fully sponsored; interview travel exceptions and later investment obligations need separate review.",
    restrictions:
      "Discovery only; import/outreach workflow not reviewed. Program admission and subsequent incubation or investment are not guaranteed.",
    reviewedAt: "2026-10-01",
  },
  {
    id: "startmate-anz",
    name: "Startmate (Australia and New Zealand)",
    url: "https://www.startmate.com/faq",
    category: "program",
    audience:
      "Australia and New Zealand / ANZ founders, operators and investors; regional programs, memberships and events.",
    access:
      "Program, membership or event-specific entry. Launch Club describes an ANZ connection requirement; review the relevant offering and current eligibility.",
    pricing:
      "Program/membership/event costs not verified; accelerator investment is separate and carries its own terms.",
    restrictions:
      "Discovery only; import/outreach workflow not reviewed. Networking is an indirect cofounder route, not a verified matching service. No relationship with startmate.app was established.",
    reviewedAt: "2026-10-01",
  },
  {
    id: "maya-matching",
    name: "MAYA Matching Program",
    url: "https://www.maya.capital/programs?language=en",
    category: "program",
    audience:
      "Latin America / LATAM entrepreneurs seeking a cofounder through curated introductions.",
    access:
      "Applications closed at review. Keep as a discovery/recheck route, not an open enrolment opportunity.",
    pricing: "Participation pricing and full terms not verified.",
    restrictions:
      "Discovery only; import/outreach workflow not reviewed. Do not submit applications or promise introductions while admission is closed.",
    reviewedAt: "2026-10-01",
  },
];

// Separate, explicit admission review from publishing a discovery listing.
// This preserves the previously reviewed manual paths, not provider/API grants.
// New catalogue entries fail closed until this separate review is completed.
const manuallyReviewedSources = new Set([
  "yc-cofounder",
  "cofounderslab",
  "foundercloud",
  "foundersbase",
  "founders-nation",
  "founderio",
  "coffeespace",
  "indie-hackers",
  "wellfound",
  "linkedin",
  "reddit-cofounder",
  "github-collaboration",
  "hacker-news",
  "product-hunt",
  "x-community",
  "kiuas",
  "entrepreneurs-first",
  "antler",
  "startup-weekend",
  "meetup",
  "unternehmertum",
  "startup-amsterdam",
  "devpost",
]);

export function publicPlatformCatalogue(): PlatformRecord[] {
  return sources.map(source => ({
    aliases: [],
    kind: "source",
    pricingStatus: "unknown",
    assistance: "manual-discovery",
    aiPostDrafts: "unverified",
    evidence: [source.url],
    ...source,
    reviewedAt: source.reviewedAt ?? "2026-09-05",
    workflowReview: manuallyReviewedSources.has(source.id)
      ? "manual-reviewed"
      : "discovery-only",
    reviewer: "Repository source review (Codex)",
    integration: {
      permissionVerified: false,
      implemented: false,
      liveVerified: false,
    },
  }));
}
