from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from .services.mock_rag import MockRAGService
from .services.mock_llm import MockLLMService

class TextRequest(BaseModel):
    text: str

class Entity(BaseModel):
    entity: str
    definition: str

class ExplanationResponse(BaseModel):
    explanation: str
    definitions: List[Entity]

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(title="Jargone API", description="API for explaining technical terms")

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # In production, replace with specific origins
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Initialize mock services
    rag_service = MockRAGService()
    llm_service = MockLLMService()

    @app.post("/explain", response_model=ExplanationResponse)
    async def explain_text(request: TextRequest):
        try:
            # Step 2: Send text to RAG
            rag_results = rag_service.process_query(request.text)
            
            # Step 3: Process with LLM
            llm_response = llm_service.generate_explanation(request.text, rag_results)
            
            # Step 4: Return response to extension
            return ExplanationResponse(
                explanation=llm_response["explanation"],
                definitions=llm_response["entities_found"]
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    return app 