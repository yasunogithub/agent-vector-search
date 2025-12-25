/**
 * LanceDB connection and table management
 */
import * as lancedb from '@lancedb/lancedb';
import type { Table } from '@lancedb/lancedb';

const DB_PATH = process.env.LANCE_DB_PATH || '~/.agent-vector-search/lance';

let db: lancedb.Connection | null = null;

export async function getDb(): Promise<lancedb.Connection> {
  if (!db) {
    db = await lancedb.connect(DB_PATH);
  }
  return db;
}

export interface Observation {
  id: string;
  text: string;
  vector: number[];
  project?: string;
  session_id?: string;
  timestamp?: string;
  type?: string;
}

export async function getOrCreateTable(name: string = 'observations'): Promise<Table> {
  const connection = await getDb();
  const tables = await connection.tableNames();

  if (tables.includes(name)) {
    return connection.openTable(name);
  }

  // Create with initial schema (empty data)
  // Will be populated during ingest
  return connection.createEmptyTable(name, {
    id: 'string',
    text: 'string',
    vector: 'vector(1024)', // hotchpotch model dimension
    project: 'string',
    session_id: 'string',
    timestamp: 'string',
    type: 'string',
  });
}

export async function addObservations(observations: Observation[]): Promise<void> {
  const table = await getOrCreateTable();
  await table.add(observations);
}

export async function searchSimilar(
  queryVector: number[],
  limit: number = 10,
  filter?: string
): Promise<Observation[]> {
  const table = await getOrCreateTable();

  let query = table.search(queryVector).limit(limit);

  if (filter) {
    query = query.where(filter);
  }

  const results = await query.toArray();
  return results as unknown as Observation[];
}
