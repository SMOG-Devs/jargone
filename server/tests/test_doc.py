import pytest
from app.ingestion.doc import Document, DOC_MAX_CHUNK_SIZE, DOC_CHUNK_OVERLAP
from app.data.vector import DocumentChunk

class TestDocumentChunking:
    """Tests for Document chunking functionality"""
    
    def test_empty_document(self):
        """Test that an empty document produces no chunks"""
        doc = Document(content="", source_name="test")
        chunks = doc.chunkize()
        assert len(chunks) == 0
        
    def test_small_document(self):
        """Test that a document smaller than the max chunk size produces one chunk"""
        small_content = "This is a small document" * 10  # Still much smaller than MAX_CHUNK_SIZE
        doc = Document(content=small_content, source_name="test_small")
        chunks = doc.chunkize()
        
        # Should produce exactly one chunk
        assert len(chunks) == 1
        assert chunks[0].text == small_content
        assert chunks[0].source_name == "test_small"
        assert chunks[0].token_count == len(small_content)
        assert isinstance(chunks[0].named_entities, list)
        
    def test_large_document_chunking(self):
        """Test that a large document is properly chunked with correct overlap"""
        # Create a document that will result in multiple chunks
        # Use a pattern that makes it easy to verify the chunks
        chunk_marker = "CHUNK_MARKER_"
        # Create content that's more than 2.5 chunks long to ensure we get at least 3 chunks
        content_size = int(2.5 * DOC_MAX_CHUNK_SIZE)
        large_content = "X" * content_size
        
        # Insert markers at specific positions to verify overlap
        # Place markers at the start, middle, and near chunk boundaries
        marked_content = large_content
        marker_positions = []
        
        # Insert some markers near chunk boundaries to test overlap
        for i in range(0, content_size, DOC_MAX_CHUNK_SIZE - DOC_CHUNK_OVERLAP - 100):
            if i < content_size:
                position = i
                marker = f"{chunk_marker}{i}"
                marked_content = marked_content[:position] + marker + marked_content[position + len(marker):]
                marker_positions.append((position, marker))
        
        doc = Document(content=marked_content, source_name="test_large")
        chunks = doc.chunkize()
        
        # Basic validation
        assert len(chunks) > 1
        assert isinstance(chunks[0], DocumentChunk)
        
        # Verify that all chunks except the last one have the maximum size
        for i in range(len(chunks) - 1):
            assert len(chunks[i].text) == DOC_MAX_CHUNK_SIZE
        
        # Verify chunk overlap - each marker should appear in the correct chunks
        for position, marker in marker_positions:
            # Calculate which chunks should contain this marker
            chunk_indices = []
            for i in range(len(chunks)):
                chunk_start = i * (DOC_MAX_CHUNK_SIZE - DOC_CHUNK_OVERLAP)
                chunk_end = chunk_start + DOC_MAX_CHUNK_SIZE
                if chunk_start <= position < chunk_end:
                    chunk_indices.append(i)
            
            # Verify marker appears in the expected chunks
            for i in chunk_indices:
                if i < len(chunks):
                    assert marker in chunks[i].text
    
    def test_document_chunk_properties(self):
        """Test that each chunk has the correct properties"""
        doc = Document(content="Test content", source_name="test_properties")
        chunks = doc.chunkize()
        
        assert len(chunks) == 1
        chunk = chunks[0]
        
        # Verify all required properties exist
        assert chunk.text == "Test content"
        assert chunk.source_name == "test_properties"
        assert chunk.token_count == len("Test content")
        assert hasattr(chunk, 'named_entities')
        assert hasattr(chunk, 'metadata')
        
        # Check the metadata is an empty dict
        assert chunk.metadata == {} 