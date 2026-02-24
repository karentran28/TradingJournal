from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql+psycopg:///tradingjournal"

# connects python to posgresql
engine = create_engine(DATABASE_URL)

# lets routes talk to DB
SessionLocal = sessionmaker(bind = engine)

# parent class for all tables
Base = declarative_base()