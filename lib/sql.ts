import { neon } from '@neondatabase/serverless';
import { Pool } from "pg";

interface SQLResult<T> {
  rows: T[];
  rowCount: number;
}

let pgPool: Pool | null = null;

/**
 * A custom SQL tagged template literal that handles both Neon (production)
 * and standard pg (local) drivers correctly.
 */
export async function sql<T extends Record<string, any> = any>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<SQLResult<T>> {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL is missing. Check your environment variables.");
  }

  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

  try {
    if (!isLocal) {
      // Use Neon HTTP driver for production (tagged template style)
      const neonSql = neon(connectionString);
      const result = await neonSql(strings, ...values);
      return {
        rows: result as T[],
        rowCount: result.length
      };
    } else {
      // Use standard pg driver for local
      if (!pgPool) {
        pgPool = new Pool({ connectionString });
      }
      
      // Convert tagged template to $1, $2 style for pg
      let text = "";
      for (let i = 0; i < strings.length; i += 1) {
        text += strings[i];
        if (i < values.length) {
          text += `$${i + 1}`;
        }
      }

      const result = await pgPool.query<T>(text, values);
      return {
        rows: result.rows,
        rowCount: result.rowCount ?? 0
      };
    }
  } catch (error) {
    console.error("[SQL_EXECUTION_ERROR]", {
      error
    });
    throw error;
  }
}
