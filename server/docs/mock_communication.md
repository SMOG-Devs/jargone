


### 1. Extension -> Server
User zaznacza trudny do zrozumienia text
```json
{
    "text": "Highlighted text"
}
```

### ```Communication within the server```
### 2. Text -> RAG
Serwer wysyła tekst do RAGa
```json
{
    "query": "Highlighted text"
}
```

RAG response:
```json
{
    "matches": [
        {
            "content": "Document content that matches the query",
            "source": "source_document.pdf"
        }
    ],
    "entities": [
        {
            "entity": "Technical term",
            "definition": "Definition from knowledge base"
        }
    ]
}
```

### 3. Text + output z RAGa -> LLM
Generowanie odpowiedzi z wytłumaczeniem tekstu

Input:
```json
{
    "query": "Highlighted text",
    "rag_results": {
        "matches": [
            {
                "content": "Document content that matches the query",
                "source": "source_document.pdf"
            }
        ],
        "entities": [
            {
                "entity": "Technical term",
                "definition": "Definition from knowledge base"
            }
        ]
    }
}
```
Output:
```json
{
    "explanation": "Simple explanation of the highlighted text",
    "entities_found": [
        {
            "entity": "Technical term",
            "definition": "Simplified definition"
        }
    ]
}
```

### 4. Server -> Extension 
Output do extension (zaraz przed wyświetlaniem wyjaśnienia na stronie)
```json
{
    "explanation": "Simple explanation of the highlighted text",
    "definitions": [
        {
            "entity": "Technical term", 
            "definition": "Simplified definition"
        }
    ]
}
```
