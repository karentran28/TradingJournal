from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.user import User
from app.database.session import get_db
from app.utils.auth import get_current_user
from app.models.trade import Trade
from app.schemas.trade import TradeCreate, TradeUpdate
router = APIRouter(prefix="/trades", tags=["trades"])

@router.post("")
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
    
@router.get("")
def get_trades(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trades = db.query(Trade).filter(Trade.user_id == current_user.id).all()
    return trades

@router.delete("/{trade_id}")
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

@router.patch("/{trade_id}")
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

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trades = db.query(Trade).filter(Trade.user_id == current_user.id, Trade.exit_price.isnot(None)).all()
    
    wins = 0
    losses = 0
    breakeven = 0
    total_pnl = 0
    sum_wins = 0
    sum_losses = 0

    for trade in trades:
        qty = 1 if trade.quantity is None else trade.quantity

        if trade.side.lower() == "buy":
            pnl = (trade.exit_price - trade.entry_price) * qty
        else:
            pnl = (trade.entry_price - trade.exit_price) * qty

        total_pnl += pnl
        if pnl > 0:
            wins += 1
            sum_wins += pnl
        elif pnl < 0:
            losses += 1
            sum_losses += pnl
        else:
            breakeven += 1
        
    closed_trades = len(trades)
    total_trades = db.query(Trade).filter(Trade.user_id == current_user.id).count()
    open_trades = total_trades - closed_trades

    win_rate = (wins / closed_trades) if closed_trades > 0 else 0.0
    avg_pnl = (total_pnl / closed_trades) if closed_trades > 0 else 0.0
    avg_win = (sum_wins / wins) if wins > 0 else 0.0
    avg_loss = (sum_losses / losses) if losses > 0 else 0.0
    profit_factor = (sum_wins / abs(sum_losses)) if sum_losses < 0 else None

    return {
        "total_trades": total_trades,
        "open_trades": open_trades,
        "closed_trades": closed_trades,
        "wins": wins,
        "losses": losses,
        "breakeven": breakeven,
        "win_rate": win_rate,
        "total_pnl": total_pnl,
        "avg_pnl": avg_pnl,
        "avg_win": avg_win,
        "avg_loss": avg_loss,
        "profit_factor": profit_factor
    }

@router.get("/{trade_id}")
def get_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == current_user.id).first()
    if not trade:
        raise HTTPException(status_code= 404, detail="Trade not found")
    if trade.user_id != current_user.id:
        raise HTTPException(status_code = 403, detail="Not authorized")
    
    return trade