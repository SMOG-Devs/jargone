#!/usr/bin/env python3
"""
Simple script to read a file and send its content to the save_document_chunk endpoint.
"""

import requests
import json
import sys
import os
from pathlib import Path

def save_document(file_path, source_name="file_upload"):
    """
    Read a file and send its content to the save_document_chunk endpoint.
    
    Args:
        file_path (str): Path to the file to read
        source_name (str): Name of the source for the document
    """
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found")
        return False
    
    # Read file content
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            print(content)
    except Exception as e:
        print(f"Error reading file: {e}")
        return False
    
    # Prepare the request
    url = "http://localhost:8000/save-document"
    payload = {
        "content": content,
        "source": source_name,
    }
    
    # Send the request
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()  # Raise exception for 4XX/5XX responses
        
        result = response.json()
        print(f"Response: {result}")
        return result.get("success", False)
    except requests.exceptions.RequestException as e:
        print(f"Error sending request: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python save_document.py <file_path> [source_name]")
        sys.exit(1)
    
    file_path = sys.argv[1]
    source_name = sys.argv[2] if len(sys.argv) > 2 else "file_upload"
    
    success = save_document(file_path, source_name)
    if success:
        print(f"Document from '{file_path}' saved successfully")
    else:
        print(f"Failed to save document from '{file_path}'")
        sys.exit(1) 
