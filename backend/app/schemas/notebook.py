from pydantic import BaseModel
from typing import Optional

class NotebookCreate(BaseModel):
    title: str
    content: Optional[str] = None

class NotebookUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
