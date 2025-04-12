from typing import List
from app.data.vector import DocumentChunk
from app.ner.NamedEntityExtraction import EntityRecognition


MAX_CHUNK_SIZE = 8000
MAX_CHUNK_OVERLAP = 100

class Document():
    """A document with its content."""
    def __init__(self, content: str, source_name: str):
        self.content = content
        self.source_name = source_name

    def chunkize(self) -> List[DocumentChunk]:
        """Chunk the document into smaller chunks."""
        ner = EntityRecognition()
        chunks = []
        for i in range(0, len(self.content), MAX_CHUNK_SIZE - MAX_CHUNK_OVERLAP):
            chunk = self.content[i:i+MAX_CHUNK_SIZE]
            chunks.append(
                DocumentChunk(
                    text=chunk, 
                    source_name=self.source_name, 
                    token_count=len(chunk), 
                    named_entities=ner.extract_named_entities(chunk),
                    metadata={}
                )
            )
        return chunks
 