#!/usr/bin/env python3
"""
Embedding generation script using SentenceTransformer.
Reads observations from stdin (JSON lines) and outputs embeddings.
"""

import sys
import json
from sentence_transformers import SentenceTransformer

# Multilingual embedding model (supports Japanese, 384 dimensions)
MODEL_NAME = "intfloat/multilingual-e5-small"

def main():
    # Load model (cached after first run)
    print(f"Loading model: {MODEL_NAME}", file=sys.stderr)
    model = SentenceTransformer(MODEL_NAME)
    print(f"Model loaded. Dimension: {model.get_sentence_embedding_dimension()}", file=sys.stderr)

    # Read JSON lines from stdin
    texts = []
    ids = []

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
            texts.append(obj.get("text", ""))
            ids.append(obj.get("id", ""))
        except json.JSONDecodeError:
            continue

    if not texts:
        print("No texts to embed", file=sys.stderr)
        sys.exit(1)

    # Generate embeddings
    print(f"Embedding {len(texts)} texts...", file=sys.stderr)
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=True)

    # Output as JSON lines
    for id_, embedding in zip(ids, embeddings):
        output = {
            "id": id_,
            "vector": embedding.tolist()
        }
        print(json.dumps(output))

    print(f"Done. Generated {len(embeddings)} embeddings.", file=sys.stderr)

if __name__ == "__main__":
    main()
