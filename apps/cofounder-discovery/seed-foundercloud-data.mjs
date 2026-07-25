import { drizzle } from "drizzle-orm/mysql2";
import { prospects } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

// FounderCloud Skills
const SKILLS = [
  "Developer",
  "Designer",
  "Marketer",
  "Business Development",
  "Sales",
  "Product",
];

// FounderCloud Industries
const INDUSTRIES = [
  "Finance/ Fintech",
  "Retail",
  "E-Commerce",
  "Construction/ Trade",
  "Agency - digital (eg, marketing, Web design)",
  "Agency - other (eg real estate, recruitment)",
  "Consulting",
  "Manufacturing",
  "Wholesale",
  "Web or Mobile app",
  "Website (eg news, affiliate)",
  "Other",
];

const LOCATIONS = [
  "San Francisco, CA",
  "New York, NY",
  "Austin, TX",
  "Seattle, WA",
  "Boston, MA",
  "Los Angeles, CA",
  "Chicago, IL",
  "Miami, FL",
  "Denver, CO",
  "Portland, OR",
];

const NAMES = [
  {
    name: "Sarah Chen",
    bio: "Serial entrepreneur with 2 successful exits. Looking to build the next big thing in fintech.",
  },
  {
    name: "Marcus Rodriguez",
    bio: "Full-stack developer with 8 years experience. Passionate about AI and machine learning.",
  },
  {
    name: "Emily Watson",
    bio: "Product designer who loves creating beautiful, user-friendly experiences.",
  },
  {
    name: "David Kim",
    bio: "Growth marketer who scaled 3 startups to $10M+ ARR. Data-driven and results-oriented.",
  },
  {
    name: "Jessica Martinez",
    bio: "Business development expert with extensive network in enterprise sales.",
  },
  {
    name: "Alex Thompson",
    bio: "Technical co-founder looking for business partner. Built scalable systems for Fortune 500.",
  },
  {
    name: "Rachel Green",
    bio: "E-commerce specialist with deep expertise in D2C brands and customer acquisition.",
  },
  {
    name: "Michael Chang",
    bio: "Former consultant turned entrepreneur. Strong analytical skills and strategic thinking.",
  },
  {
    name: "Lisa Anderson",
    bio: "UX researcher and designer. Obsessed with understanding user needs and pain points.",
  },
  {
    name: "James Wilson",
    bio: "Sales leader with proven track record. Closed $50M+ in enterprise deals.",
  },
  {
    name: "Sophia Lee",
    bio: "Product manager from top tech company. Ready to build something from scratch.",
  },
  {
    name: "Daniel Brown",
    bio: "Backend engineer specializing in distributed systems and cloud architecture.",
  },
  {
    name: "Olivia Taylor",
    bio: "Digital marketing expert. Grew social media following from 0 to 500K in 18 months.",
  },
  {
    name: "Ryan Martinez",
    bio: "Finance professional looking to transition into startup world. MBA from top school.",
  },
  {
    name: "Emma Davis",
    bio: "Mobile app developer with apps featured by Apple. iOS and Android expert.",
  },
];

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChoices(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function seedProspects() {
  console.log("🌱 Seeding prospects with FounderCloud taxonomy...");

  const prospectsData = NAMES.map((person, index) => {
    const skills = randomChoices(SKILLS, Math.floor(Math.random() * 3) + 1);
    const industries = randomChoices(
      INDUSTRIES,
      Math.floor(Math.random() * 2) + 1
    );

    return {
      name: person.name,
      email: `${person.name.toLowerCase().replace(" ", ".")}@example.com`,
      location: randomChoice(LOCATIONS),
      bio: person.bio,
      skills: JSON.stringify(skills),
      experience: randomChoice(["first-time", "experienced", "serial"]),
      industries: JSON.stringify(industries),
      platform: randomChoice(["CoFoundersLab", "FounderCloud", "Y Combinator"]),
      profileUrl: `https://foundercloud.com/profile/${index + 1}`,
      lastActive: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ), // Random within last 7 days
      isVerified: Math.random() > 0.3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  try {
    await db.delete(prospects); // Clear existing prospects
    await db.insert(prospects).values(prospectsData);
    console.log(
      `✅ Successfully seeded ${prospectsData.length} prospects with FounderCloud taxonomy!`
    );
  } catch (error) {
    console.error("❌ Error seeding prospects:", error);
    throw error;
  }
}

seedProspects()
  .then(() => {
    console.log("🎉 Seed complete!");
    process.exit(0);
  })
  .catch(error => {
    console.error("💥 Seed failed:", error);
    process.exit(1);
  });
