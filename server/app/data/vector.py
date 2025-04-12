"""
Schema for the vector database.

Qdrant is used as the vector database.
"""
import os
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from qdrant_client import QdrantClient
from qdrant_client.http import models


class DocumentChunk(BaseModel):
    """A chunk of a document with its embedding."""
    text: str
    source_name: str = ""
    chunk_id: Optional[int] = None
    token_count: Optional[int] = None
    named_entities: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    embedding: Optional[List[float]] = None
    id: Optional[int] = None
    
    @property
    def content(self) -> str:
        """Alias for text to maintain API compatibility."""
        return self.text
    
    @property
    def source(self) -> str:
        """Alias for source_name to maintain API compatibility."""
        return self.source_name


class QdrantVectorDB:
    """Vector database for storing document embeddings using Qdrant."""
    
    def __init__(
        self, 
        collection_name: str = "documents",
        host: str = "localhost",
        port: int = 6333,
        embedding_dim: int = int(os.getenv("EMBEDDING_DIMENSION"))
    ):
        """
        Initialize the Qdrant vector database.
        
        Args:
            collection_name: Name of the collection in Qdrant
            host: Qdrant server host
            port: Qdrant server port
            embedding_dim: Dimension of the embedding vectors
        """
        self.collection_name = collection_name
        self.client = QdrantClient(host=host, port=port)
        self.embedding_dim = embedding_dim
        
        # Create collection if it doesn't exist
        self._initialize_collection()
    
    def _initialize_collection(self) -> None:
        """Create the collection if it doesn't exist."""
        collections = self.client.get_collections().collections
        collection_names = [collection.name for collection in collections]
        
        if self.collection_name not in collection_names:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=self.embedding_dim,
                    distance=models.Distance.COSINE
                )
            )
    
    def add_document_chunk(self, chunk: DocumentChunk) -> str:
        """
        Add a single document chunk to the vector database.
        
        Args:
            chunk: Document chunk to add
            
        Returns:
            Document ID
        """
        if chunk.embedding is None:
            raise ValueError("Document chunk must have an embedding")
        
        # Use document ID if provided, otherwise generate one
        doc_id = chunk.id if chunk.id is not None else f"{chunk.source_name}_{chunk.chunk_id}"
        
        # Ensure the ID is correctly formatted
        point_id = str(doc_id) if isinstance(doc_id, str) else doc_id
        
        point = models.PointStruct(
            id=point_id,  # Use the correctly formatted ID
            vector=chunk.embedding,
            payload={
                "text": chunk.text,
                "source_name": chunk.source_name,
                "chunk_id": chunk.chunk_id,
                "token_count": chunk.token_count,
                "named_entities": chunk.named_entities,
                "metadata": chunk.metadata
            }
        )
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=[point]
        )
        
        return doc_id
    
    def add_documents(self, documents: List[DocumentChunk]) -> List[str]:
        """
        Add documents to the vector database.
        
        Args:
            documents: List of document chunks to add
            
        Returns:
            List of document IDs
        """
        points = []
        for i, doc in enumerate(documents):
            # Use document's own embedding
            if doc.embedding is None:
                raise ValueError(f"Document {i} has no embedding")
            
            # Use document ID if provided, otherwise generate one
            doc_id = doc.id if doc.id else f"{doc.source_name}_{doc.chunk_id}"
            
            points.append(
                models.PointStruct(
                    id=doc_id,
                    vector=doc.embedding,
                    payload={
                        "text": doc.text,
                        "source_name": doc.source_name,
                        "chunk_id": doc.chunk_id,
                        "token_count": doc.token_count,
                        "named_entities": doc.named_entities,
                        "metadata": doc.metadata
                    }
                )
            )
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        
        return [point.id for point in points]
    
    def search(
        self, 
        query_embedding: List[float], 
        limit: int = 5,
        filter_condition: Optional[models.Filter] = None
    ) -> List[Dict[str, Any]]:
        """
        Search the vector database for similar documents.
        
        Args:
            query_embedding: Embedding of the query
            limit: Maximum number of results to return
            filter_condition: Filter to apply to the search
            
        Returns:
            List of similar documents with their similarity scores
        """
        # Use the standard search method from Qdrant as shown in documentation
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=limit,
            query_filter=filter_condition
        )
        
        return [
            {
                "id": str(result.id),
                "text": result.payload.get("text", ""),
                "source_name": result.payload.get("source_name", ""),
                "chunk_id": result.payload.get("chunk_id"),
                "token_count": result.payload.get("token_count"),
                "named_entities": result.payload.get("named_entities", []),
                "metadata": result.payload.get("metadata", {}),
                "score": result.score
            }
            for result in results
        ]
