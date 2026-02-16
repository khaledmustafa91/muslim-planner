import { Pool, type QueryResultRow } from "pg";

interface SQLResult<T> {
  rows: T[];
  rowCount: number;
}

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("POSTGRES_URL is missing. Set it in .env.local or Vercel env vars.");
}

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

function buildQuery(strings: TemplateStringsArray, values: unknown[]) {
  let text = "";
  for (let i = 0; i < strings.length; i += 1) {
    text += strings[i];
    if (i < values.length) {
      text += `$${i + 1}`;
    }
  }
  return { text, values };
}

export async function sql<T extends QueryResultRow = QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<SQLResult<T>> {
  const query = buildQuery(strings, values);
  const result = await pool.query<T>(query.text, query.values);
  return {
    rows: result.rows,
    rowCount: result.rowCount ?? 0
  };
}
