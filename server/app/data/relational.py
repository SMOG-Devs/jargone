"""
Schema for the relational database.
"""

from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class Entity(Base):
    """Named entity with its explanation."""
    __tablename__ = 'entities'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, index=True, unique=True)
    short_explanation = Column(String(500), nullable=False)
    detailed_explanation = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC))
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC), onupdate=lambda: datetime.datetime.now(datetime.UTC))
    
    def __repr__(self):
        return f"<Entity(name='{self.name}', category='{self.category}')>"
