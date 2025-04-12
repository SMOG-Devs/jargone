import os
import pytest
import sys

# Add the project root directory to Python path
try: 
    import app
except ImportError:
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

@pytest.fixture(autouse=True)
def setup_test_environment():
    """Setup environment variables for testing."""
    # Save current environment
    old_environ = dict(os.environ)
    
    # Set test environment variables
    os.environ["OPENAI_API_KEY"] = "test_api_key"
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"
    os.environ["SPACY_MODEL"] = "en_core_web_sm"
    
    yield
    
    # Restore original environment
    os.environ.clear()
    os.environ.update(old_environ)