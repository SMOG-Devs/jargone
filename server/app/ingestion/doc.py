from typing import List
from app.data.vector import DocumentChunk
from app.ner.NamedEntityExtraction import EntityRecognition
import os
from dotenv import load_dotenv

load_dotenv()

DOC_MAX_CHUNK_SIZE: int = int(os.getenv("DOC_MAX_CHUNK_SIZE"))  # e.g. 8000
DOC_CHUNK_OVERLAP: int = int(os.getenv("DOC_CHUNK_OVERLAP"))  # e.g. 100


class Document:
    """A document with its content."""

    def __init__(self, content: str, source_name: str):
        self.content = content
        self.source_name = source_name

    def chunkize(self) -> List[DocumentChunk]:
        """
        Chunk the document into overlapping chunks.

        :return: list of DocumentChunk instances
        """
        ner = EntityRecognition()
        chunks: List[DocumentChunk] = []
        start: int = 0
        while start < len(self.content):
            end: int = min(start + DOC_MAX_CHUNK_SIZE, len(self.content))
            chunk_text: str = self.content[start:end]
            named_entities: List[str] = [entity.text for entity in ner.extract_named_entities(chunk_text)]
            chunks.append(
                DocumentChunk(
                    text=chunk_text,
                    source_name=self.source_name,
                    token_count=len(chunk_text),
                    named_entities=named_entities,
                    metadata={}
                )
            )
            # move start forward by chunk_size - overlap
            start += DOC_MAX_CHUNK_SIZE - DOC_CHUNK_OVERLAP
        return chunks
