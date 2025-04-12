from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from contextlib import asynccontextmanager
from data.sql_client import SQLClient
import os
import logging

from rag.rag import Rag

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TextRequest(BaseModel):
    text: str

class Entity(BaseModel):
    entity: str
    definition: str

class ExplanationResponse(BaseModel):
    explanation: str
    definitions: List[Entity]


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


@app.post("/explain", response_model=ExplanationResponse)
async def explain_text(request: TextRequest):
    try:
        rag_results = rag['rag'].process_request(request.text)
        
        return ExplanationResponse(
            explanation=rag_results,
            definitions=[Entity(entity="tmp entity", definition="tmp definition")]
        )
    except Exception as e:
        logger.error(f"Error explaining text: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    