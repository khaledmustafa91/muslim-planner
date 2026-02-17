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

/**
 * Execute a parameterized SQL query with a plain string and values array.
 * Use this when the query shape is dynamic (e.g. multi-row inserts).
 */
export async function sqlParams<T extends Record<string, any> = any>(
  query: string,
  params: unknown[]
): Promise<SQLResult<T>> {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL is missing. Check your environment variables.");
  }

  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

  try {
    if (!isLocal) {
      const neonSql = neon(connectionString);
      const result = await (neonSql as any).query(query, params);
      const rows: T[] = result.rows ?? result;
      return { rows, rowCount: rows.length };
    } else {
      if (!pgPool) pgPool = new Pool({ connectionString });
      const result = await pgPool.query<T>(query, params);
      return { rows: result.rows, rowCount: result.rowCount ?? 0 };
    }
  } catch (error) {
    console.error("[SQL_PARAMS_ERROR]", { error });
    throw error;
  }
}

/**
 * Execute a raw SQL string without parameter binding.
 * Dangerous: only use for trusted content like migration files.
 */
export async function executeRaw(content: string): Promise<void> {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("POSTGRES_URL is missing.");
  
  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

  // Split content by semicolons, but ignore empty results from trailing semicolons
  const commands = content
    .split(";")
    .map(c => c.trim())
    .filter(c => c.length > 0);

  if (!isLocal) {
    const neonSql = neon(connectionString);
    for (const cmd of commands) {
      await (neonSql as any).query(cmd);
    }
  } else {
    if (!pgPool) pgPool = new Pool({ connectionString });
    for (const cmd of commands) {
      await pgPool.query(cmd);
    }
  }
}
