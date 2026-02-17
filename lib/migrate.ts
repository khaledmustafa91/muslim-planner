import { sql } from "./sql";
import fs from "fs";
import path from "path";

export async function runMigrations() {
  console.log("🚀 Starting database migrations...");

  // 1. Create migrations table if it doesn't exist
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // 2. Read migration files
  const migrationsDir = path.join(process.cwd(), "db", "migrations");
  const files = fs.readdirSync(migrationsDir).sort();

  // 3. Get applied migrations
  const { rows: appliedRows } = await sql<{ name: string }>`SELECT name FROM _migrations`;
  const applied = new Set(appliedRows.map(r => r.name));

  // 4. Run missing migrations
  for (const file of files) {
    if (!file.endsWith(".sql")) continue;
    
    if (!applied.has(file)) {
      console.log(`  📄 Applying: ${file}...`);
      const content = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      
      try {
        // 1. Run the raw SQL content
        await import("./sql").then(m => m.executeRaw(content));
        
        // 2. Record the migration as applied
        await sql`INSERT INTO _migrations (name) VALUES (${file})`;
        
        console.log(`  ✅ Successfully applied ${file}`);
      } catch (err) {
        console.error(`  ❌ Failed to apply ${file}:`, err);
        throw err; // Stop the process on error
      }
    }
  }

  console.log("✨ All migrations completed.");
}
