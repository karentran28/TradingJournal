from pydantic import BaseModel
from typing import Optional

class StrategyCreate(BaseModel):
    name: str
    description: Optional[str] = None

class StrategyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
