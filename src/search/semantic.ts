/**
 * Semantic search functionality
 */
import { spawn } from 'bun';
import { searchSimilar, type Observation } from '../db/lance';

const EMBED_SCRIPT = 'src/embeddings/embed.py';

/**
 * Generate embedding for a query text using Python script
 */
export async function embedQuery(text: string): Promise<number[]> {
  const input = JSON.stringify({ id: 'query', text }) + '\n';

  const proc = spawn({
    cmd: ['python', EMBED_SCRIPT],
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
  });

  proc.stdin.write(input);
  proc.stdin.end();

  const output = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();

  if (stderr) {
    console.error('[embed]', stderr);
  }

  const result = JSON.parse(output.trim());
  return result.vector;
}

/**
 * Search for similar observations
 */
export async function semanticSearch(
  query: string,
  options: {
    limit?: number;
    project?: string;
    type?: string;
  } = {}
): Promise<Observation[]> {
  const { limit = 10, project, type } = options;

  // Generate query embedding
  const queryVector = await embedQuery(query);

  // Build filter
  const filters: string[] = [];
  if (project) filters.push(`project = '${project}'`);
  if (type) filters.push(`type = '${type}'`);
  const filter = filters.length > 0 ? filters.join(' AND ') : undefined;

  // Search
  return searchSimilar(queryVector, limit, filter);
}
