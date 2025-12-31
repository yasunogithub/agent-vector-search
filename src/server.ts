/**
 * Agent Vector Search Server
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { semanticSearch } from './search/semantic';
import { addObservations, type Observation } from './db/lance';

const app = new Hono();

// Enable CORS for integration with other services
app.use('/*', cors());

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Semantic search endpoint
app.get('/api/search/semantic', async (c) => {
  const query = c.req.query('q');
  const limit = parseInt(c.req.query('limit') || '10');
  const project = c.req.query('project');
  const type = c.req.query('type');

  if (!query) {
    return c.json({ error: 'Query parameter "q" is required' }, 400);
  }

  try {
    const results = await semanticSearch(query, { limit, project, type });
    return c.json({
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'Search failed' }, 500);
  }
});

// Similar observations endpoint
app.get('/api/search/similar/:id', async (c) => {
  const id = c.req.param('id');
  const limit = parseInt(c.req.query('limit') || '10');

  // TODO: Fetch observation by ID, get its vector, search similar
  return c.json({ error: 'Not implemented yet' }, 501);
});

// Index documents endpoint (for agent-history integration)
app.post('/api/index', async (c) => {
  try {
    const body = await c.req.json();
    const documents: Observation[] = body.documents || [];

    if (documents.length === 0) {
      return c.json({ error: 'No documents provided' }, 400);
    }

    // Validate documents have required fields
    const validDocs = documents.filter(
      (doc) => doc.id && doc.text && doc.vector?.length > 0
    );

    if (validDocs.length === 0) {
      return c.json({ error: 'No valid documents (need id, text, vector)' }, 400);
    }

    await addObservations(validDocs);

    return c.json({
      indexed: validDocs.length,
      skipped: documents.length - validDocs.length,
    });
  } catch (error) {
    console.error('Index error:', error);
    return c.json({ error: 'Index failed' }, 500);
  }
});

const port = parseInt(process.env.PORT || '9877');
console.log(`Starting server on port ${port}...`);

export default {
  port,
  fetch: app.fetch,
};
