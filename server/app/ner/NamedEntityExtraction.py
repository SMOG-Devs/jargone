from pydantic import BaseModel
from spacy_download import load_spacy
from spacy import Language
from typing import List
import logging

class NamedEntity(BaseModel):
    text: str
    type: str
    start: int
    stop: int

class EntityRecognition():
    model: Language
    
    def __init__(self):
        self.model = load_spacy('en_core_web_md')
        
        
    def extract_named_entities(self, text: str) -> List[NamedEntity]:
        elements = []
        result = self.model(text)
        for result_ in result.ents:
            logging.info(f"Entity: {result_.lemma_}-{result_.label_}")
            if result_.label_ in ['PRODUCT','ORG','PERSON','FAC','WORK_OF_ART','EVENT']:
                elements.append(
                  NamedEntity(text=result_.lemma_.lower(),
                            start=result_.start,
                            stop=result_.end,
                            type=result_.label_.lower())   
                )
        return elements
    
            
        