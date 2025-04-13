from openai import OpenAI
import json
from pathlib import Path
import logging
from typing import List
from embedder import Embedder
from data.vector import QdrantVectorDB
logger = logging.getLogger(__name__)

class Rag:
    def __init__(self, api_key: str, model: str = "gpt-4o-mini", max_tokens: int = 800, 
                 system_prompt: str = None, context_path: str = "server/app/rag/context.json",
                 embedder_model: str = "text-embedding-3-small", embedder_dimension: int = 1536):
        """Initialize the OpenAI connector.
        
        Args:
            api_key (str): OpenAI API key
            model (str): Model to use for completions
            max_tokens (int): Maximum tokens for response
            system_prompt (str): System prompt to use for the model
        """
        self.client = OpenAI(api_key=api_key)
        self.api_key = api_key
        self.model = model
        self.max_tokens = max_tokens
        self.context = self._load_context(context_path)
        if not self.context:
            logger.error("Failed to load context")
            return
        if system_prompt:
            self.system_prompt = system_prompt
        else:
            self.system_prompt = "You are a helpful assistant that explains technical terms and concepts. Please explain the following request sentences using only the context provided below. If the context doesn't contain enough information, please say so. If you cannot find an answer, start response with \"Unfortunately\""
        self.qdrant_db = QdrantVectorDB(collection_name="documents", host="vector-server", port=6333, embedding_dim=embedder_dimension)

        
    def _load_context(self, context_path: str) -> str:
        """Load context from the context.json file."""
        try:
            context_path = Path(context_path)
            with context_path.open("r") as f:
                context_data = json.load(f)
                return str(context_data["context"])
        except Exception as e:
            logger.error(f"Failed to load context: {e}")
            return ""
            
    def get_prompt(self, request: str) -> str:
        """Generate a prompt for the OpenAI model.
        
        Args:
            request (str): The user's request

        Returns:
            str: Formatted prompt
        """
        context_string = "\n\n--------\n\n".join([self.context])
        return f"Context:\n{context_string}\nSentence to explain: {request}"
        
        
    def get_completion(self, prompt: str) -> str:
        """Get completion from OpenAI model.
        
        Args:
            prompt (str): The prompt to send to the model
            
        Returns:
            str: Model's response
            
        Raises:
            Exception: If the API call fails
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise
            
    def process_request(self, request: str) -> str:
        """Process a request through the OpenAI model.
        
        Args:
            request (str): The user's request

        Returns:
            str: Model's response
        """
        prompt = self.get_prompt(request)
        return self.get_completion(prompt)
    
    def _embed_request(self, request: str) -> List[float]:
        """Embed a request using the OpenAI model.
        
        Args:
            request (str): The user's request

        Returns:
            list: Embedding of the request
        """
        embedder = Embedder(self.api_key)
        return embedder.embed_text(request)
    
    def _search_context(self, request: str) -> List[str]:
        """Search the context for the most relevant information.
        
        Args:
            request (str): The user's request

        Returns:
            list: List of relevant context
        """
        # Embed the request
        request_embedding = self._embed_request(request)
        # Search the context
        results = self.qdrant_db.search(request_embedding)
        print(f"Vector DB search results: {results}")
        return results
    

# Example usage:
if __name__ == "__main__":
    # Initialize with your API key
    connector = Rag(
        api_key="sk-key-43483"
    )
    
    # Process a request
    response = connector.process_request("What is rag?")
    print(response)