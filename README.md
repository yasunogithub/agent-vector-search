# Agent Vector Search

Semantic vector search for AI agent history using LanceDB.

## Architecture

```
┌─────────────────────────────────────────┐
│           agent-vector-search           │
├─────────────────────────────────────────┤
│  Embedding (Python)                     │
│    └─ SentenceTransformer               │
│    └─ hotchpotch/static-embedding-ja    │
├─────────────────────────────────────────┤
│  LanceDB                                │
│    └─ observations table                │
│    └─ HNSW index                        │
├─────────────────────────────────────────┤
│  Search API (Bun/TS)                    │
│    └─ /api/search/semantic              │
│    └─ /api/search/similar               │
└─────────────────────────────────────────┘
```

## Setup

### 1. Install dependencies

```bash
# TypeScript/Bun
bun install

# Python (use uv for speed)
uv venv
uv pip install -r requirements.txt
```

### 2. Generate embeddings

```bash
bun run embed
```

### 3. Start server

```bash
bun run dev
```

## Usage

### Semantic search

```bash
curl "http://localhost:9877/api/search/semantic?q=JWT認証エラー"
```

### Similar observations

```bash
curl "http://localhost:9877/api/search/similar?id=obs_123"
```

## Integration with agent-history

This service can be used alongside agent-history to provide semantic search capabilities.

## License

MIT
