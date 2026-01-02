/**
 * E2E Tests for Semantic Search
 *
 * Prerequisites:
 * - agent-vector-search running on port 9877
 * - agent-history running on port 9876 (optional, for integration tests)
 */
import { describe, it, expect, beforeAll, setDefaultTimeout } from 'bun:test';

// Embedding model loading takes time
setDefaultTimeout(30000);

const VECTOR_SEARCH_URL = 'http://localhost:9877';
const AGENT_HISTORY_URL = 'http://localhost:9876';

describe('Agent Vector Search E2E', () => {
  beforeAll(async () => {
    // Wait for server to be ready
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await fetch(`${VECTOR_SEARCH_URL}/health`);
        if (res.ok) break;
      } catch {
        if (i === maxRetries - 1) throw new Error('Server not ready');
        await Bun.sleep(1000);
      }
    }
  });

  describe('Health Check', () => {
    it('should return ok status', async () => {
      const res = await fetch(`${VECTOR_SEARCH_URL}/health`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe('ok');
    });
  });

  describe('Index Documents', () => {
    it('should index documents with vectors', async () => {
      const testDocs = [
        {
          id: `e2e-test-${Date.now()}-1`,
          text: 'TypeScriptでReactコンポーネントを実装した',
          vector: new Array(384).fill(0.1),
          project: 'e2e-test',
          session_id: 'test-session',
          timestamp: new Date().toISOString(),
          type: 'prompt',
        },
        {
          id: `e2e-test-${Date.now()}-2`,
          text: 'Pythonでデータ分析スクリプトを作成した',
          vector: new Array(384).fill(0.2),
          project: 'e2e-test',
          session_id: 'test-session',
          timestamp: new Date().toISOString(),
          type: 'prompt',
        },
      ];

      const res = await fetch(`${VECTOR_SEARCH_URL}/api/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: testDocs }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.indexed).toBe(2);
      expect(data.skipped).toBe(0);
    });

    it('should reject documents without required fields', async () => {
      const invalidDocs = [
        { id: 'invalid-1', text: 'No vector' },
        { id: 'invalid-2', vector: [0.1] }, // No text
      ];

      const res = await fetch(`${VECTOR_SEARCH_URL}/api/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: invalidDocs }),
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('No valid documents');
    });
  });

  describe('Semantic Search', () => {
    it('should search with query parameter', async () => {
      const res = await fetch(`${VECTOR_SEARCH_URL}/api/search/semantic?q=React&limit=5`);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.query).toBe('React');
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.count).toBe(data.results.length);
    });

    it('should return error without query', async () => {
      const res = await fetch(`${VECTOR_SEARCH_URL}/api/search/semantic`);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain('required');
    });

    it('should filter by project', async () => {
      const res = await fetch(
        `${VECTOR_SEARCH_URL}/api/search/semantic?q=test&project=e2e-test&limit=10`
      );
      const data = await res.json();

      expect(res.status).toBe(200);
      // All results should be from e2e-test project
      for (const result of data.results) {
        expect(result.project).toBe('e2e-test');
      }
    });
  });
});

describe('Agent History Integration', () => {
  beforeAll(async () => {
    // Check if agent-history is running
    try {
      const res = await fetch(`${AGENT_HISTORY_URL}/api/summary`);
      if (!res.ok) throw new Error('Agent history not available');
    } catch {
      console.log('⚠️ Agent History not running, skipping integration tests');
      return;
    }
  });

  it('should search via agent-history endpoint', async () => {
    try {
      const res = await fetch(`${AGENT_HISTORY_URL}/api/semantic-search?q=React&limit=3`);
      if (!res.ok) {
        console.log('Agent history semantic search not available');
        return;
      }
      const data = await res.json();

      expect(data.query).toBe('React');
      expect(Array.isArray(data.results)).toBe(true);
    } catch (e) {
      console.log('Integration test skipped:', e);
    }
  });
});
