import os
import pytest
from dotenv import load_dotenv
from pathlib import Path
import json
import tempfile

from app.rag.rag import Rag
from dotenv import load_dotenv


@pytest.mark.parametrize("question,expected_keywords", [
    ("Which tree is full of vitamin C?", ["baobab"]),
    ("How many spieces have amazon forest?", ["16,000"])
])
def test_positive_rag_request(question,expected_keywords):
    """End-to-end test for RAG request."""
    # Load environment variables from .env file
    env_path = Path(__file__).parent.parent.parent.parent / ".env"
    print(f"Loading environment variables from {env_path}")
    load_dotenv(dotenv_path=env_path)
    
    # Get API key from environment
    api_key = os.getenv("OPENAI_API_KEY")
    assert api_key, "OPENAI_API_KEY environment variable is not set"
    print(f"Using API key: {api_key}...")
    
    # Initialize RAG with actual API key and context
    context_path = Path(__file__).parent / "test_context.json"
    rag = Rag(api_key=api_key, context_path=str(context_path))
    
    # Send a simple request
    response = rag.process_request(question)
    
    # Verify we got a response
    for keyword in expected_keywords:
        assert keyword in response.lower()
    
    print(f"\nE2E Test Response:\n{response}\n")

@pytest.mark.parametrize("question,expected_keywords", [
    ("At which age Albert Einstein died?", ["76"]),
    ("What is a biggest mammal?", ["whale"])
])
def test_negative_rag_request(question,expected_keywords):
    """End-to-end test for RAG request."""
    # Load environment variables from .env file
    env_path = Path(__file__).parent.parent.parent.parent / ".env"
    print(f"Loading environment variables from {env_path}")
    load_dotenv(dotenv_path=env_path)
    
    # Get API key from environment
    api_key = os.getenv("OPENAI_API_KEY")
    assert api_key, "OPENAI_API_KEY environment variable is not set"
    print(f"Using API key: {api_key}...")
    
    # Initialize RAG with actual API key and context
    context_path = Path(__file__).parent / "test_context.json"
    rag = Rag(api_key=api_key, context_path=str(context_path))
    
    # Send a simple request
    response = rag.process_request(question)
    
    # Verify we got a response
    for keyword in expected_keywords:
        assert keyword not in response
    assert "Unfortunately" in response
    
    print(f"\nE2E Test Response:\n{response}\n")