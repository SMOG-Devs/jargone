from openai import OpenAI
import json
from pathlib import Path
import logging
from typing import List, Tuple, Dict, Any, Optional, Literal
from .embedder import Embedder
from data.vector import QdrantVectorDB, DocumentChunk
from uuid import uuid4
from ingestion.doc import Document


logger = logging.getLogger(__name__)

class Rag:
    def __init__(self, api_key: str, model: str = "gpt-4o", max_tokens: int = 800, 
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
        if system_prompt:
            self.system_prompt = system_prompt
        else:
            self.system_prompt = '\n'.join(["Your task is to rewrite provided sentences to be easily understandeable for avarege person not having domain knowleadge. You will be also provided with data containing informations about certain topic.",
                                            'The data will contain documentation sources (information about internal data and projects) and dictionary of words used in the field.',
                                            'Additionally, you will get details level. If details level is low, you try to simplyfy it as muh as possible. If you get details level high, you are trying to rewrite sentence more in depth, but still with really understandeable language',
                                            'Moreover, you will be provided with end user role. Take into consideration, how to best structure your rewrited sentence, to be understandeable for a person with specified role.'
                                            'You will get 1M$ in cash if the end user rates you five stars.'
                                            'You will be provided with the data in json format: {"sources": [string],"dictionary": [{"name": string, "definition": string},...]}'
                                            'sources field contains data from documentation, while dictionary field contains definitions of terms with their definitions.'
                                            'Focus on rewriting provided sentences according to requirements above. If the data doesn\'t provide information to simplify the sentences, return these sentence exactly the same.'])
        self.qdrant_db = QdrantVectorDB(collection_name="documents", host="vector-server", port=6333, embedding_dim=embedder_dimension)
        self.embedder = Embedder(api_key=api_key, model=embedder_model, dimension=embedder_dimension)

        
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
            
    def get_prompt(self, sentence: str, contexts: List[str], ners: List[Tuple[str,str]], details: Literal['high','low'], role: str) -> str:
        """Generate a prompt for the OpenAI model.
        
        Args:
            request (str): The user's request

        Returns:
            str: Formatted prompt
        """
        data = {'sources': contexts, "dictionary": [{'name': ner[0], 'definition': ner[1]} for ner in ners]}
        return f"Sources:\n{json.dumps(data,ensure_ascii=False,indent=4)}\nSentence to explain: {sentence}\nDetails level: {details}\n Role: {role}"
        
        
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
                temperature=0.3
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise
            
    def process_request(self, request: str, explanationLevel: Literal['high','low'], userRole: str, additionalContext: str, ners: List[Tuple[str,str]]) -> str:
        """Process a request through the OpenAI model.
        
        Args:
            request (str): The user's request

        Returns:
            str: Model's response
        """
        contexts = self._search_context(request)
        prompt = self.get_prompt(request, contexts,ners,explanationLevel,userRole)
        logging.info(f"Prompt: {prompt}")
        return self.get_completion(prompt)
    
    def _embed_request(self, request: str) -> List[float]:
        """Embed a request using the OpenAI model.
        
        Args:
            request (str): The user's request

        Returns:
            list: Embedding of the request
        """
        return self.embedder.embed_text(request)
    
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
        return [record['text'] for record in results]
    
    def save_document_chunk(self, content: str, source: str, metadata: Dict[str, Any] = None) -> bool:
        """Save a document chunk to the Qdrant database.
        
        Args:
            content (str): Text content of the chunk
            metadata (Dict[str, Any], optional): Additional metadata for the chunk
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            doc = Document(content, source)

            chunks = doc.chunkize()
            documents = []
            for chunk in chunks:
                # Generate embedding for the content
                embedding = self.embedder.embed_text(chunk.text)
                documents.append(DocumentChunk(
                    text=chunk.text,
                    id=str(uuid4()),
                    embedding=embedding
                ))

            # # Create a DocumentChunk object
            # chunk = DocumentChunk(
            #     text=content,
            #     id=int(uuid4()),
            #     embedding=embedding
            # )

            # Add to Qdrant database
            self.qdrant_db.add_documents(documents)
            
            logger.info(f"Successfully saved document chunks")
            return True
        except Exception as e:
            logger.error(f"Failed to save document chunk: {e}")
            return False

# Example usage:
if __name__ == "__main__":
    # Initialize with your API key
    connector = Rag(
        api_key="sk-key-43483"
    )
    
    # Process a request
    response = connector.process_request("What is rag?")
    print(response)