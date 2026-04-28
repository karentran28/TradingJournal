from pydantic import BaseModel
from typing import Optional
from datetime import date

class JournalCreate(BaseModel):
    title: str
    content: Optional[str] = None
    entry_date: Optional[date] = None

class JournalUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    entry_date: Optional[date] = None
