/**
 * Initialize default pricing for metered billing
 */

import { drizzle } from "drizzle-orm/mysql2";

const db = drizzle(process.env.DATABASE_URL);

const defaultPricing = [
  {
    resourceType: "llm_api_call",
    baseCostPerUnit: 10, // $0.10 per 1000 tokens
    markup: 2.5,
    unitName: "1k tokens",
    description: "LLM API calls for matching, conversation generation, etc.",
    isActive: 1,
  },
  {
    resourceType: "enrichment_linkedin",
    baseCostPerUnit: 50, // $0.50 per profile
    markup: 2.5,
    unitName: "profile",
    description: "LinkedIn profile enrichment",
    isActive: 1,
  },
  {
    resourceType: "enrichment_github",
    baseCostPerUnit: 30, // $0.30 per profile
    markup: 2.5,
    unitName: "profile",
    description: "GitHub profile enrichment",
    isActive: 1,
  },
  {
    resourceType: "enrichment_company",
    baseCostPerUnit: 40, // $0.40 per company
    markup: 2.5,
    unitName: "company",
    description: "Company data enrichment",
    isActive: 1,
  },
  {
    resourceType: "platform_scraping",
    baseCostPerUnit: 20, // $0.20 per scrape
    markup: 2.5,
    unitName: "scrape",
    description: "Platform scraping (CoFoundersLab, Y Combinator, etc.)",
    isActive: 1,
  },
  {
    resourceType: "conversation_starter_generation",
    baseCostPerUnit: 15, // $0.15 per generation
    markup: 2.5,
    unitName: "generation",
    description: "AI-generated conversation starters",
    isActive: 1,
  },
  {
    resourceType: "semantic_matching",
    baseCostPerUnit: 5, // $0.05 per match
    markup: 2.5,
    unitName: "match",
    description: "Semantic skill matching and compatibility scoring",
    isActive: 1,
  },
  {
    resourceType: "image_generation",
    baseCostPerUnit: 100, // $1.00 per image
    markup: 2.5,
    unitName: "image",
    description: "AI image generation",
    isActive: 1,
  },
  {
    resourceType: "voice_transcription",
    baseCostPerUnit: 25, // $0.25 per minute
    markup: 2.5,
    unitName: "minute",
    description: "Voice transcription service",
    isActive: 1,
  },
];

async function main() {
  console.log("Initializing billing pricing...");

  for (const pricing of defaultPricing) {
    try {
      await db.execute(
        `
        INSERT INTO usage_pricing (resource_type, base_cost_per_unit, markup, unit_name, description, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          base_cost_per_unit = VALUES(base_cost_per_unit),
          markup = VALUES(markup),
          unit_name = VALUES(unit_name),
          description = VALUES(description),
          is_active = VALUES(is_active)
      `,
        [
          pricing.resourceType,
          pricing.baseCostPerUnit,
          pricing.markup,
          pricing.unitName,
          pricing.description,
          pricing.isActive,
        ]
      );
      console.log(`✓ ${pricing.resourceType}`);
    } catch (error) {
      console.error(`✗ ${pricing.resourceType}:`, error.message);
    }
  }

  console.log("\nBilling pricing initialized successfully!");
  process.exit(0);
}

main().catch(error => {
  console.error("Failed to initialize pricing:", error);
  process.exit(1);
});
