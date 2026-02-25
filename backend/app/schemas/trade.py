from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TradeCreate(BaseModel):
    symbol: str
    side: str
    entry_price: float
    exit_price: Optional[float] = None
    quantity: Optional[float] = None
    notes: Optional[str] = None
    opened_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

class TradeUpdate(BaseModel):
    symbol: Optional[str] = None
    side: Optional[str] = None
    entry_price: Optional[float] = None
    exit_price: Optional[float] = None
    quantity: Optional[float] = None
    notes: Optional[str] = None
    opened_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None