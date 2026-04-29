from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database.db import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key = True, index = True)
    email = Column(String, unique = True, index = True, nullable = False)
    hashed_password = Column(String, nullable = False)
    created_at = Column(DateTime, default = datetime.utcnow)

    trades = relationship("Trade", back_populates="user")

"""
 CREATE TABLE users (
   id SERIAL PRIMARY KEY,
   email TEXT UNIQUE,
   hashed_password TEXT,
   created_at TIMESTAMP
);
"""