from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from app.database.db import Base
from sqlalchemy.orm import relationship

class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=True)

    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)           # buy / sell
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    lot_size = Column(Float, nullable=True)
    quantity = Column(Float, nullable=True)

    session = Column(String, nullable=True)         # london / new_york / asian
    result = Column(String, nullable=True)          # win / loss / breakeven
    rr_ratio = Column(Float, nullable=True)
    notes = Column(String, nullable=True)

    opened_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="trades")
