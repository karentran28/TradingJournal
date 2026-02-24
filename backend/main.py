from fastapi import FastAPI, Depends, HTTPException
from app.database.db import engine, Base
from sqlalchemy.orm import Session
from app.models.user import User
from app.database.session import get_db
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt import create_access_token
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm
from app.utils.auth import get_current_user
from app.models.trade import Trade
from typing import Optional
from datetime import datetime
class UserCreate(BaseModel):
    email: str
    password: str

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

Base.metadata.create_all(bind = engine)
app = FastAPI()

@app.get("/")
def root():
    return {"message": "Backend is running"}

@app.post("/users")
def create_user(email: str, hashed_password: str, db: Session = Depends(get_db)):
    new_user = User(email= email, hashed_password = hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "email": new_user.email}

# register new users
@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code = 400, detail = "Email already registered")
    
    new_user = User(email=user.email, hashed_password = hash_password(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "email": new_user.email}

# authenticate users and return JWT token
@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.email})

    return {"access_token": token, "token_type": "bearer"}

@app.get("/me")
def read_me(user = Depends(get_current_user)):
    return {"email": user.email}

@app.post("/trades")
def create_trade(
    trade: TradeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    side = trade.side.lower()
    if side not in ("buy", "sell"):
        raise HTTPException(status_code=400, detail="side must be 'buy' or 'sell'")
    
    new_trade = Trade(
        user_id = current_user.id,
        symbol=trade.symbol.upper(),
        side=side,
        entry_price=trade.entry_price,
        exit_price=trade.exit_price,
        quantity=trade.quantity,
        notes=trade.notes,
        opened_at = trade.opened_at,
        closed_at= trade.closed_at,
    )
    db.add(new_trade)
    db.commit()
    db.refresh(new_trade)

    return {
        "id": new_trade.id,
        "user_id": new_trade.user_id,
        "symbol": new_trade.symbol,
        "side": new_trade.side,
        "entry_price": new_trade.entry_price,
        "exit_price": new_trade.exit_price,
        "quantity": new_trade.quantity,
        "notes": new_trade.notes,
        "opened_at": new_trade.opened_at,
        "closed_at": new_trade.closed_at,
    }
    
@app.get("/trades")
def get_trades(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trades = db.query(Trade).filter(Trade.user_id == current_user.id).all()
    return trades

@app.delete("/trades/{trade_id}")
def delete_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code = 404, detail="Trade not found")
    
    if trade.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(trade)
    db.commit()
    return {"message": "Trade deleted"}

@app.patch("/trades/{trade_id}")
def update_trade(
    trade_id: int,
    updates: TradeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code = 404, detail="Trade not found")
    
    if trade.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    data = updates.model_dump(exclude_unset=True)

    if "side" in data:
        s = data["side"].lower()
        if s not in ("buy", "sell"):
            raise HTTPException(status_code=400, detail="side must be 'buy' or 'sell'")
    data["side"] = s

    if "symbol" in data:
        data["symbol"] = data["symbol"].upper()
    
    for k, v in data.items():
        setattr(trade, k, v)
    
    db.commit()
    db.refresh(trade)
    return trade

