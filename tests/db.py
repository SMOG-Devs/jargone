"""
Database utility functions for testing.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from server.data.relational import Base

def get_engine(database_url="sqlite:///test_knowledge_base.db"):
    return create_engine(database_url)

def get_session_maker(engine=None):
    if engine is None:
        engine = get_engine()
    return sessionmaker(bind=engine)

def init_db(engine=None):
    """Initialize the database by creating all tables."""
    if engine is None:
        engine = get_engine()
    Base.metadata.create_all(engine) 