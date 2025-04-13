from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager
from data.sql_client import SQLClient
import os
import logging
from traceback import print_exc
from ner.NamedEntityExtraction import EntityRecognition

from rag.rag import Rag

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TextRequest(BaseModel):
    text: str

class Entity(BaseModel):
    entity: str
    definition: str
    start: int
    stop: int

class ExplanationResponse(BaseModel):
    explanation: str
    definitions: List[Entity]

class DocumentChunk(BaseModel):
    content: str
    source: str
    metadata: Optional[Dict[str, Any]] = None

class SaveResponse(BaseModel):
    success: bool
    message: str

rag = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    from dotenv import load_dotenv
    global rag

    load_dotenv()
    # Get API key from environment variable
    api_key = os.getenv("OPENAI_API_KEY")
    embedder_model = os.getenv("EMBEDDING_MODEL")
    embedder_dimension = os.getenv("EMBEDDING_DIMENSION")
    if not api_key:
        logger.error("OPENAI_API_KEY environment variable is not set")
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    
    # Load the ML model
    rag['sql_client'] = SQLClient()
    rag['sql_client'].load_jargon()
    rag['ner'] = EntityRecognition()
    rag['rag'] = Rag(api_key=api_key, context_path="app/rag/context.json")
    logger.info("RAG service initialized successfully")

    yield
    logger.info("Shutting down RAG service")


"""Create and configure the FastAPI application."""
app = FastAPI(title="Jargone API", description="API for explaining technical terms", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def main():
    return "Hello world"

@app.post("/explain", response_model=ExplanationResponse)
async def explain_text(request: TextRequest):
    entities: SQLClient = rag['sql_client']
    ner_recognition: EntityRecognition = rag['ner']
    rag_: Rag = rag['rag']
    
    try: 
        ents = ner_recognition.extract_named_entities(request.text)
        ents_: List[Entity] = []
        for ent in ents:
            found_entity = entities.search_word(ent.text)
            if found_entity is not None:
                ents_.append(
                    Entity(
                        entity=found_entity[0],
                        definition=found_entity[1],
                        start=ent.start,
                        stop=ent.stop
                    )
                )
    except Exception as e:
        logger.error(f"Error explaining text: {e}")
        print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    logging.info(ents)
    
    try:
        rag_results = rag_.process_request(request.text, [(ent.entity,ent.definition) for ent in ents_])
    except Exception as e:
        logger.error(f"Error explaining text: {e}")
        print_exc()
        raise HTTPException(status_code=500, detail=str(e))

        
    return ExplanationResponse(
            explanation=rag_results,
            definitions=ents_
        )

@app.post("/save-document", response_model=SaveResponse)
async def save_document(document: DocumentChunk):
    """Save a document chunk to the Qdrant database.
    
    Args:
        document: DocumentChunk object containing content and optional metadata
        
    Returns:
        SaveResponse with success status and message
        
    Raises:
        HTTPException: With appropriate status code for different error scenarios
    """
    rag_: Rag = rag['rag']
    
    try:
        # Use the RAG instance to save the document chunk
        success = rag_.save_document_chunk(
            content=document.content,
            source=document.source,
            metadata=document.metadata,
        )
        
        if success:
            return SaveResponse(
                success=True,
                message=f"Document chunk saved successfully"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to save document chunk to database"
            )
    except ValueError as e:
        # Handle validation errors
        raise HTTPException(
            status_code=400,
            detail=f"Invalid document data: {str(e)}"
        )
    except ConnectionError as e:
        # Handle connection errors to the vector database
        raise HTTPException(
            status_code=503,
            detail=f"Vector database connection error: {str(e)}"
        )
    except Exception as e:
        # Handle other unexpected errors
        logger.error(f"Error saving document chunk: {e}")
        print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


    