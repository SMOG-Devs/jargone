from sqlalchemy import create_engine, Engine, select
from sqlalchemy.orm import sessionmaker, Session
from .relational import Base, Entity
import pandas as pd
from pathlib import Path
import logging

class SQLClient:
    engine: Engine = create_engine('postgresql+psycopg://postgres:postgres@sql-server:5432/jargone')
    Base.metadata.create_all(engine)
    
    def load_jargon(self):
        stmt = select(Entity)
        with Session(self.engine) as session:
            ents = session.scalars(stmt).all()
            
            logging.info(ents)
            if len(ents) == 0:
                ents_ = []
                root_path = Path(__file__).absolute().parent.parent
                df = pd.read_csv(root_path / 'dictionary.csv')
                for _, record in df.iterrows():
                    ents_.append(
                        Entity(name=record['Entity'],detailed_explanation=record['Decription'])
                    )

            logging.info(f'Created: {len(ents_)} entites')
            session.add_all(ents_)
            session.commit()
            logging.info(f'Upload Done')
            