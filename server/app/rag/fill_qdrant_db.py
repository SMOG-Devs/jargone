from rag.embedder import Embedder
from data.vector import QdrantVectorDB, DocumentChunk
import json
from ingestion.doc import Document

# Load the context
with open("app/rag/context.json", "r") as f:
    context = json.load(f)


# Embed the context
embedder = Embedder(api_key="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")


# CreateDocument 
chunks = []
for doc_json in context["context"]:
    doc = Document(doc_json["content"], doc_json["metadata"]["source"])
    chunks.extend(doc.chunkize())   


documents = []
for i, chunk in enumerate(chunks):
    embedding = embedder.embed_text(chunk.text)
    doc = DocumentChunk(text=chunk.text, embedding=embedding, id=i+100)
    print(doc)
    documents.append(doc)



# Add the embeddings to the Qdrant database
qdrant_db = QdrantVectorDB(collection_name="documents", host="vector-server", port=6333, embedding_dim=1536)
qdrant_db.add_documents(documents)

