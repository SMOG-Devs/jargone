import pytest
import uuid
import random
from typing import List
from app.data.vector import QdrantVectorDB, DocumentChunk
from qdrant_client.http import models

# Test data
TEST_TEXT = "This is a test document for Qdrant vector database"
TEST_SOURCE = "test_source"

COLLECTION_NAME = "test_collection"
REMOVE_COLLECTION_AFTER_TEST = True

class TestQdrantVectorDB:
    """Tests for QdrantVectorDB using a real Qdrant instance"""
    
    @pytest.fixture
    def vector_db(self):
        """Create a test collection with a unique name to avoid conflicts"""
        db = QdrantVectorDB(
            collection_name=COLLECTION_NAME,
            host="localhost",
            port=6333
        )
        yield db
        # Clean up after test
        if REMOVE_COLLECTION_AFTER_TEST:
            db.client.delete_collection(collection_name=COLLECTION_NAME)
    
    @pytest.fixture
    def document_chunk(self) -> DocumentChunk:
        """Create a sample document chunk for testing"""
        return DocumentChunk(
            text=TEST_TEXT,
            source_name=TEST_SOURCE,
            chunk_id=1,
            token_count=10,
            named_entities=["test"],
            embedding=[0.1] * 1536,  # OpenAI dimensions
            id=12345  # Use integer ID
        )
    
    def test_initialization(self, vector_db):
        """Test that the database initializes correctly"""
        # Check if collection exists
        collections = vector_db.client.get_collections().collections
        assert any(c.name == vector_db.collection_name for c in collections)
    
    def test_add_document_chunk(self, vector_db, document_chunk):
        """Test adding a document chunk to the database"""
        # Add a document with integer ID
        doc_id = vector_db.add_document_chunk(document_chunk)
        
        # Verify it was stored
        assert doc_id is not None
        assert document_chunk.id == doc_id
        
        # Try with another integer ID and a significantly different embedding
        # to ensure it's retrieved distinctly in the search
        int_doc = DocumentChunk(
            text="Document with integer ID",
            source_name="test_source",
            chunk_id=2,
            token_count=5,
            named_entities=[],
            # Use a very different embedding pattern to ensure it's distinct
            embedding=[0.9] * 1536,
            id=42  # Integer ID
        )
        
        # Add the document
        int_id = vector_db.add_document_chunk(int_doc)
        assert int_id == 42
        
        # Using a more direct test approach:
        # Directly search for documents that contain the text "Document with integer ID"
        filter_condition = models.Filter(
            must=[
                models.FieldCondition(
                    key="text",
                    match=models.MatchText(text="Document with integer ID")
                )
            ]
        )
        
        # Search using the same embedding as int_doc
        results = vector_db.search(int_doc.embedding, limit=10, filter_condition=filter_condition)
        
        # Verify that we found the document
        assert len(results) > 0
        found = False
        for result in results:
            if "Document with integer ID" in result["text"]:
                found = True
                break
        assert found, "Could not find document with text 'Document with integer ID'"
    
    def test_search(self, vector_db, document_chunk):
        """Test searching for documents"""
        # Add the document
        vector_db.add_document_chunk(document_chunk)
        
        # Search with the same embedding
        results = vector_db.search(document_chunk.embedding, limit=5)
        
        # Verify results
        assert len(results) > 0
        assert results[0]["score"] > 0.9  # Should have high similarity to itself
        assert results[0]["text"] == TEST_TEXT
        assert results[0]["source_name"] == TEST_SOURCE
    
    def test_add_multiple_and_search(self, vector_db):
        """Test adding multiple documents and searching between them"""
        # Create multiple document chunks with different embeddings
        doc1 = DocumentChunk(
            text="Python is a programming language",
            source_name="docs",
            chunk_id=1,
            token_count=6,
            named_entities=["Python"],
            metadata={"category": "programming"},
            embedding=[0.1] * 768 + [0.2] * 768,  # Make it different
            id=1001  # Integer ID
        )
        
        doc2 = DocumentChunk(
            text="TensorFlow is a machine learning framework",
            source_name="docs",
            chunk_id=2,
            token_count=8,
            named_entities=["TensorFlow"],
            metadata={"category": "machine_learning"},
            embedding=[0.2] * 768 + [0.1] * 768,  # Different embedding
            id=1002  # Integer ID
        )
        
        # Add documents
        vector_db.add_document_chunk(doc1)
        vector_db.add_document_chunk(doc2)
        
        # Search with embedding similar to doc1
        results = vector_db.search(doc1.embedding, limit=5)
        
        # Check that doc1 is ranked higher than doc2
        assert len(results) >= 2
        doc1_score = next((r["score"] for r in results if "Python" in r["text"]), 0)
        doc2_score = next((r["score"] for r in results if "TensorFlow" in r["text"]), 0)
        assert doc1_score > doc2_score
    
    def test_search_with_filter(self, vector_db):
        """Test searching with metadata filters"""
        # Create documents with different metadata
        doc1 = DocumentChunk(
            text="Python is a programming language",
            source_name="docs",
            chunk_id=1,
            token_count=6,
            named_entities=["Python"],
            metadata={"category": "programming"},
            embedding=[0.1] * 1536,
            id=2001  # Integer ID
        )
        
        doc2 = DocumentChunk(
            text="TensorFlow is a machine learning framework",
            source_name="docs",
            chunk_id=2,
            token_count=8,
            named_entities=["TensorFlow"],
            metadata={"category": "machine_learning"},
            embedding=[0.1] * 1536,  # Same embedding for fair comparison
            id=2002  # Integer ID
        )
        
        # Add documents
        vector_db.add_document_chunk(doc1)
        vector_db.add_document_chunk(doc2)
        
        # Search with filter for programming category
        # Use the correct filter structure for Qdrant
        filter_condition = models.Filter(
            must=[
                models.FieldCondition(
                    key="metadata.category",
                    match=models.MatchValue(value="programming")
                )
            ]
        )
        
        results = vector_db.search(
            doc1.embedding,
            limit=5,
            filter_condition=filter_condition
        )
        
        # Should only get doc1
        assert len(results) == 1
        assert "Python" in results[0]["text"]
        
        # Search with filter for machine learning category
        filter_condition = models.Filter(
            must=[
                models.FieldCondition(
                    key="metadata.category",
                    match=models.MatchValue(value="machine_learning")
                )
            ]
        )
        
        results = vector_db.search(
            doc1.embedding,
            limit=5,
            filter_condition=filter_condition
        )
        
        # Should only get doc2
        assert len(results) == 1
        assert "TensorFlow" in results[0]["text"] 