import { drizzle } from "drizzle-orm/mysql2";
import { prospects } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const demoProspects = [
  {
    name: "Sarah Chen",
    title: "Product Designer & UX Lead",
    location: "San Francisco, CA",
    bio: "Former design lead at Airbnb. Passionate about creating delightful user experiences for SaaS products. Looking for a technical co-founder to build the next generation of productivity tools.",
    skills: [
      "Product Design",
      "UX Research",
      "Figma",
      "User Testing",
      "Design Systems",
    ],
    experience: "experienced",
    industries: ["SaaS", "Consumer", "Enterprise"],
    lookingFor: ["Technical Co-Founder", "CTO"],
    startupStage: "idea",
    platform: "CoFoundersLab",
    profileUrl: "https://cofounderslab.com/profile/sarah-chen",
  },
  {
    name: "Marcus Rodriguez",
    title: "Full-Stack Engineer & AI Enthusiast",
    location: "Austin, TX",
    bio: "Built and scaled backend systems at Stripe. Expert in Node.js, Python, and machine learning. Seeking a business-minded co-founder to launch an AI-powered fintech startup.",
    skills: ["Node.js", "Python", "React", "AI/ML", "PostgreSQL", "AWS"],
    experience: "experienced",
    industries: ["FinTech", "AI/ML", "SaaS"],
    lookingFor: ["Business Co-Founder", "CEO"],
    startupStage: "mvp",
    platform: "Y Combinator",
    profileUrl: "https://ycombinator.com/cofounder-matching",
  },
  {
    name: "Emily Watson",
    title: "Marketing Strategist & Growth Hacker",
    location: "New York, NY",
    bio: "Grew two startups from 0 to 1M users. Expert in viral marketing, SEO, and community building. Looking for a technical co-founder to build a social commerce platform.",
    skills: [
      "Marketing",
      "Growth Hacking",
      "SEO",
      "Content Strategy",
      "Analytics",
    ],
    experience: "serial",
    industries: ["E-commerce", "Social", "Consumer"],
    lookingFor: ["Technical Co-Founder", "Product Co-Founder"],
    startupStage: "idea",
    platform: "FounderCloud",
    profileUrl: "https://foundercloud.com/emily-watson",
  },
  {
    name: "David Kim",
    title: "Healthcare Tech Innovator",
    location: "Boston, MA",
    bio: "MD turned entrepreneur. Built telemedicine platform used by 500K+ patients. Seeking technical co-founder to revolutionize mental health care delivery.",
    skills: [
      "Healthcare",
      "Product Management",
      "Regulatory Compliance",
      "Operations",
    ],
    experience: "experienced",
    industries: ["HealthTech", "SaaS", "Enterprise"],
    lookingFor: ["Technical Co-Founder", "CTO"],
    startupStage: "early",
    platform: "CoFoundersLab",
    profileUrl: "https://cofounderslab.com/profile/david-kim",
  },
  {
    name: "Priya Patel",
    title: "Blockchain Developer & Web3 Advocate",
    location: "Remote",
    bio: "Smart contract developer with 5+ years in DeFi. Built protocols handling $100M+ TVL. Looking for business co-founder to launch next-gen NFT marketplace.",
    skills: ["Solidity", "Web3", "Smart Contracts", "React", "TypeScript"],
    experience: "experienced",
    industries: ["Blockchain", "FinTech", "Consumer"],
    lookingFor: ["Business Co-Founder", "Marketing Co-Founder"],
    startupStage: "mvp",
    platform: "Y Combinator",
    profileUrl: "https://ycombinator.com/cofounder-matching",
  },
  {
    name: "Alex Thompson",
    title: "EdTech Entrepreneur & Former Teacher",
    location: "Seattle, WA",
    bio: "Taught for 10 years before founding an online learning platform. Raised $2M in seed funding. Seeking technical co-founder to scale our AI tutoring solution.",
    skills: ["Education", "Product Management", "Fundraising", "Sales"],
    experience: "serial",
    industries: ["EdTech", "AI/ML", "SaaS"],
    lookingFor: ["Technical Co-Founder", "CTO"],
    startupStage: "early",
    platform: "FounderCloud",
    profileUrl: "https://foundercloud.com/alex-thompson",
  },
  {
    name: "Jennifer Lee",
    title: "Data Scientist & ML Engineer",
    location: "San Francisco, CA",
    bio: "PhD in Computer Science. Built recommendation systems at Netflix. Expert in Python, TensorFlow, and big data. Looking for product-focused co-founder.",
    skills: ["Python", "Machine Learning", "Data Science", "TensorFlow", "SQL"],
    experience: "experienced",
    industries: ["AI/ML", "SaaS", "Enterprise"],
    lookingFor: ["Product Co-Founder", "CEO"],
    startupStage: "idea",
    platform: "CoFoundersLab",
    profileUrl: "https://cofounderslab.com/profile/jennifer-lee",
  },
  {
    name: "Michael Chang",
    title: "Sales Leader & Revenue Growth Expert",
    location: "Chicago, IL",
    bio: "Built sales teams at Salesforce and HubSpot. Generated $50M+ in ARR. Seeking technical co-founder to build next-gen sales automation platform.",
    skills: ["Sales", "Business Development", "Team Building", "SaaS Sales"],
    experience: "experienced",
    industries: ["SaaS", "Enterprise", "Sales Tech"],
    lookingFor: ["Technical Co-Founder", "CTO"],
    startupStage: "idea",
    platform: "Y Combinator",
    profileUrl: "https://ycombinator.com/cofounder-matching",
  },
  {
    name: "Sophia Martinez",
    title: "Mobile Developer & iOS Expert",
    location: "Los Angeles, CA",
    bio: "Senior iOS engineer at Instagram. Built features used by 1B+ users. Passionate about consumer apps. Looking for design-focused co-founder.",
    skills: ["iOS", "Swift", "React Native", "Mobile Development", "UI/UX"],
    experience: "experienced",
    industries: ["Consumer", "Social", "Mobile"],
    lookingFor: ["Product Co-Founder", "Design Co-Founder"],
    startupStage: "idea",
    platform: "FounderCloud",
    profileUrl: "https://foundercloud.com/sophia-martinez",
  },
  {
    name: "Ryan O'Connor",
    title: "Operations & Supply Chain Specialist",
    location: "Denver, CO",
    bio: "Optimized logistics for Amazon and Walmart. Expert in supply chain automation and inventory management. Seeking technical co-founder for logistics tech startup.",
    skills: ["Operations", "Supply Chain", "Logistics", "Process Optimization"],
    experience: "experienced",
    industries: ["E-commerce", "Enterprise", "Logistics"],
    lookingFor: ["Technical Co-Founder", "CTO"],
    startupStage: "mvp",
    platform: "CoFoundersLab",
    profileUrl: "https://cofounderslab.com/profile/ryan-oconnor",
  },
];

async function seed() {
  console.log("🌱 Seeding database with demo prospects...");

  for (const prospect of demoProspects) {
    await db.insert(prospects).values(prospect);
    console.log(`✅ Added: ${prospect.name}`);
  }

  console.log("🎉 Seeding complete! Added", demoProspects.length, "prospects");
  process.exit(0);
}

seed().catch(error => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
