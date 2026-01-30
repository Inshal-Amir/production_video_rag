from sentence_transformers import CrossEncoder

# Load a small but powerful reranker model
# This runs on CPU efficiently enough for 20 items
model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

def rerank_results(query, initial_results, top_k=3):
    """
    query: User text
    initial_results: List of dicts (payloads from Qdrant)
    """
    if not initial_results:
        return []

    # Prepare pairs: [ (Query, Doc1), (Query, Doc2) ... ]
    pairs = [[query, res['description']] for res in initial_results]
    
    # Get scores
    scores = model.predict(pairs)
    
    # Attach scores to results
    for i, res in enumerate(initial_results):
        res['score'] = scores[i]
        
    # Sort by score descending
    sorted_results = sorted(initial_results, key=lambda x: x['score'], reverse=True)
    
    return sorted_results[:top_k]