# Jargone Project Description

## Project Overview
A browser plugin that identifies and explains technical jargon from selected text using RAG and LLM technologies.

## System Architecture
1. User selects text in browser
2. Plugin sends request to server 
3. Server forwards to RAG system
4. RAG matches text with relevant information chunks
5. Output from RAG goes to LLM
6. LLM generates human-friendly response
7. Response displayed in tooltip with entity references and definitions

## Output Format
- Human-friendly explanation (chat-like)
- References to entities with definitions

## Core Tasks

### Backend Development
- FastAPI server implementation
- Docker-compose database setup
- Qdrant vector database integration
- OpenAI integration (initial approach)
- LLAMA models implementation (if time permits)

### NLP Processing
- Entity recognition with filtering
- Document chunking and embedding
- Search functionality implementation

### Frontend/Plugin Development
- Plugin architecture and design
- Tooltip implementation for displaying results

### Data Collection
- Mock documentation for testing
- Optional: Web scraping for additional data

## Resources
We need sample documentation to work with as test data.