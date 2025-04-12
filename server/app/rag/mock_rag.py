from typing import Dict, List, Any

class MockRAGService:
    def process_query(self, query: str) -> Dict[str, Any]:
        """
        Mock RAG service that returns predefined responses based on the query.
        In a real implementation, this would query a vector database and return relevant documents.
        """
        # Mock response following the structure from the documentation
        return {
            "matches": [
                {
                    "content": "This is a mock document content that matches the query",
                    "source": "mock_document.pdf"
                }
            ],
            "entities": [
                {
                    "entity": "Mock Technical Term",
                    "definition": "This is a mock definition from the knowledge base"
                }
            ]
        } 