from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from contextlib import asynccontextmanager

from rag.mock_rag import MockRAGService

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
    global rag

    # Load the ML model
    rag = MockRAGService()

    yield
    # Clean up the ML models and release the resources
    rag.clear()



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
        rag_results = rag.process_query(request.text)
        
        
        return ExplanationResponse(
            explanation="test explanation",
            definitions=rag_results["entities"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

 