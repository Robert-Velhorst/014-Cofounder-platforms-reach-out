/**
 * Initialize billing pricing using the metered-billing module
 */

import { initializePricing } from "./server/metered-billing.ts";

async function main() {
  console.log("Initializing billing pricing...");

  try {
    await initializePricing();
    console.log("✓ Billing pricing initialized successfully!");
  } catch (error) {
    console.error("✗ Failed to initialize pricing:", error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
