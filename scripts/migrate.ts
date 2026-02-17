import { loadEnvConfig } from "@next/env";
import path from "path";

// Load environment variables from .env files
const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { runMigrations } from "../lib/migrate";

async function main() {
  try {
    await runMigrations();
    process.exit(0);
  } catch (err) {
    console.error("Migration script failed:", err);
    process.exit(1);
  }
}

main();
