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

  // Create table with sample data to define schema
  // LanceDB infers schema from the data structure
  const sampleData: Observation[] = [{
    id: '__schema_init__',
    text: 'Schema initialization record',
    vector: new Array(384).fill(0), // 384-dim zero vector
    project: '',
    session_id: '',
    timestamp: new Date().toISOString(),
    type: 'schema_init',
  }];

  const table = await connection.createTable(name, sampleData);

  // Delete the initialization record
  await table.delete('id = "__schema_init__"');

  return table;
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
