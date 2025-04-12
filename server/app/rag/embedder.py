import sys
from openai import OpenAI

class Embedder:
    """Class for generating embeddings using OpenAI's API."""
    
    def __init__(self, api_key):
        """Initialize the Embedder with an OpenAI API key.
        
        Args:
            api_key (str): OpenAI API key.
        """
        self.client = OpenAI(api_key=api_key)
        self.model = "text-embedding-3-small"
    
    def embed_text(self, text):
        """Generate embedding for a single text string.
        
        Args:
            text (str): The text to embed.
            
        Returns:
            list: The embedding vector.
        """
        response = self.client.embeddings.create(
            input=text,
            model=self.model
        )
        return response.data[0].embedding
    
    def embed_batch(self, texts):
        """Generate embeddings for a batch of texts.
        
        Args:
            texts (list): List of text strings to embed.
            
        Returns:
            list: List of embedding vectors.
        """
        response = self.client.embeddings.create(
            input=texts,
            model=self.model
        )
        return [item.embedding for item in response.data]


if __name__ == "__main__":
    # Example usage from command line
    if len(sys.argv) < 2:
        print("Usage: python embedder.py 'text to embed'")
        sys.exit(1)
        
    text = sys.argv[1]
    embedder = Embedder()
    embedding = embedder.embed_text(text)
    print(embedding)