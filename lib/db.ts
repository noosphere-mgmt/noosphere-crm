import { Pool } from "pg";
import type { QueryResult, QueryResultRow } from "pg";
import { requireNoosphereDatabaseUrl } from "@/lib/databaseUrl";

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;
  pool = new Pool({ connectionString: requireNoosphereDatabaseUrl() });
  return pool;
}

export type DbClient = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ) => Promise<QueryResult<T>>;
};

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function withTransaction<T>(
  fn: (client: DbClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
