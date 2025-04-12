"""
Schema for the relational database.
"""

from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.orm import DeclarativeBase
import datetime

class Base(DeclarativeBase):
    pass

class Entity(Base):
    """Named entity with its explanation."""
    __tablename__ = 'entities'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True, unique=True)
    detailed_explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC))
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC), onupdate=lambda: datetime.datetime.now(datetime.UTC))
