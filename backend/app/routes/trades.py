from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database.session import get_db
from app.utils.auth import get_current_user
from app.models.trade import Trade
from app.models.strategy import Strategy
from app.schemas.trade import TradeCreate, TradeUpdate

router = APIRouter(prefix="/trades", tags=["trades"])


# --- helpers ---

def compute_pnl(trade: Trade) -> Optional[float]:
    if trade.exit_price is None:
        return None
    qty = trade.lot_size or trade.quantity or 1.0
    if trade.side == "buy":
        return (trade.exit_price - trade.entry_price) * qty
    return (trade.entry_price - trade.exit_price) * qty

def compute_result(side: str, entry: float, exit_price: float) -> str:
    pnl = (exit_price - entry) if side == "buy" else (entry - exit_price)
    if pnl > 0:
        return "win"
    elif pnl < 0:
        return "loss"
    return "breakeven"

def compute_rr(entry: float, stop_loss: float, take_profit: float) -> Optional[float]:
    risk = abs(entry - stop_loss)
    if risk == 0:
        return None
    return round(abs(take_profit - entry) / risk, 2)

def apply_filters(query, user_id, date_from=None, date_to=None, pairs=None, sessions=None, direction=None):
    query = query.filter(Trade.user_id == user_id)
    if date_from:
        query = query.filter(Trade.opened_at >= date_from)
    if date_to:
        query = query.filter(Trade.opened_at <= date_to)
    if pairs:
        pair_list = [p.upper() for p in pairs.split(",") if p]
        if pair_list:
            query = query.filter(Trade.symbol.in_(pair_list))
    if sessions:
        session_list = [s.lower() for s in sessions.split(",") if s]
        if session_list:
            query = query.filter(Trade.session.in_(session_list))
    if direction and direction in ("buy", "sell"):
        query = query.filter(Trade.side == direction)
    return query


# --- routes ---

# IMPORTANT: /stats must be declared before /{trade_id} or FastAPI will treat "stats" as an id
@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    pairs: Optional[str] = None,
    sessions: Optional[str] = None,
    direction: Optional[str] = None,
):
    q = apply_filters(db.query(Trade), current_user.id, date_from, date_to, pairs, sessions, direction)
    trades = q.order_by(Trade.opened_at).all()
    closed = [t for t in trades if t.exit_price is not None]

    # core metrics
    wins = losses = breakeven = 0
    total_pnl = sum_wins = sum_losses = 0.0
    rr_values = []

    for t in closed:
        pnl = compute_pnl(t)
        total_pnl += pnl
        if pnl > 0:
            wins += 1
            sum_wins += pnl
        elif pnl < 0:
            losses += 1
            sum_losses += pnl
        else:
            breakeven += 1
        if t.rr_ratio is not None:
            rr_values.append(t.rr_ratio)

    n = len(closed)
    win_rate = wins / n if n > 0 else 0.0
    avg_rr = sum(rr_values) / len(rr_values) if rr_values else 0.0

    # max drawdown
    peak = cumulative = max_drawdown = 0.0
    for t in closed:
        cumulative += compute_pnl(t)
        peak = max(peak, cumulative)
        max_drawdown = max(max_drawdown, peak - cumulative)

    # equity curve (cumulative P&L per closed trade)
    equity_curve = []
    running = 0.0
    for t in closed:
        running += compute_pnl(t)
        equity_curve.append({
            "date": t.opened_at.strftime("%Y-%m-%d") if t.opened_at else None,
            "pnl": round(running, 2),
        })

    # daily breakdown — P&L + trade count per day
    daily: dict = {}
    for t in trades:
        day = t.opened_at.strftime("%Y-%m-%d") if t.opened_at else "unknown"
        if day not in daily:
            daily[day] = {"date": day, "pnl": 0.0, "trade_count": 0}
        daily[day]["trade_count"] += 1
        pnl = compute_pnl(t)
        if pnl is not None:
            daily[day]["pnl"] = round(daily[day]["pnl"] + pnl, 2)
    daily_pnl = sorted(daily.values(), key=lambda x: x["date"])

    # P&L by session
    session_stats: dict = {}
    for t in closed:
        s = t.session or "unknown"
        if s not in session_stats:
            session_stats[s] = {"wins": 0, "losses": 0, "pnl": 0.0}
        pnl = compute_pnl(t)
        session_stats[s]["pnl"] = round(session_stats[s]["pnl"] + pnl, 2)
        if pnl > 0:
            session_stats[s]["wins"] += 1
        elif pnl < 0:
            session_stats[s]["losses"] += 1

    # strategy breakdown — win rate + avg R:R per strategy
    strategy_map: dict = {}
    strategies = {s.id: s.name for s in db.query(Strategy).filter(Strategy.user_id == current_user.id).all()}
    for t in closed:
        label = strategies.get(t.strategy_id, "Untagged") if t.strategy_id else "Untagged"
        if label not in strategy_map:
            strategy_map[label] = {"wins": 0, "losses": 0, "rr_values": []}
        pnl = compute_pnl(t)
        if pnl > 0:
            strategy_map[label]["wins"] += 1
        elif pnl < 0:
            strategy_map[label]["losses"] += 1
        if t.rr_ratio is not None:
            strategy_map[label]["rr_values"].append(t.rr_ratio)

    strategy_stats = []
    for name, data in strategy_map.items():
        total = data["wins"] + data["losses"]
        strategy_stats.append({
            "name": name,
            "wins": data["wins"],
            "losses": data["losses"],
            "win_rate": round(data["wins"] / total, 4) if total > 0 else 0.0,
            "avg_rr": round(sum(data["rr_values"]) / len(data["rr_values"]), 2) if data["rr_values"] else 0.0,
        })

    # weekday trade counts
    weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    weekday_counts = {d: 0 for d in weekdays}
    for t in trades:
        if t.opened_at:
            wd = t.opened_at.strftime("%a")
            if wd in weekday_counts:
                weekday_counts[wd] += 1

    # streak — current and max
    current_streak = 0
    current_streak_type = None
    max_win_streak = max_loss_streak = 0
    tmp_win = tmp_loss = 0

    for t in closed:
        pnl = compute_pnl(t)
        if pnl > 0:
            tmp_win += 1
            tmp_loss = 0
            max_win_streak = max(max_win_streak, tmp_win)
        elif pnl < 0:
            tmp_loss += 1
            tmp_win = 0
            max_loss_streak = max(max_loss_streak, tmp_loss)

    for t in reversed(closed):
        pnl = compute_pnl(t)
        outcome = "win" if pnl > 0 else "loss" if pnl < 0 else None
        if outcome is None:
            break
        if current_streak_type is None:
            current_streak_type = outcome
        if outcome == current_streak_type:
            current_streak += 1
        else:
            break

    return {
        "total_trades": len(trades),
        "closed_trades": n,
        "open_trades": len(trades) - n,
        "wins": wins,
        "losses": losses,
        "breakeven": breakeven,
        "win_rate": round(win_rate, 4),
        "total_pnl": round(total_pnl, 2),
        "avg_rr": round(avg_rr, 2),
        "max_drawdown": round(max_drawdown, 2),
        "profit_factor": round(sum_wins / abs(sum_losses), 2) if sum_losses < 0 else None,
        "equity_curve": equity_curve,
        "daily_pnl": daily_pnl,
        "session_stats": session_stats,
        "strategy_stats": strategy_stats,
        "weekday_counts": weekday_counts,
        "streak": current_streak,
        "streak_type": current_streak_type,
        "max_win_streak": max_win_streak,
        "max_loss_streak": max_loss_streak,
    }


@router.get("")
def get_trades(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    pairs: Optional[str] = None,
    sessions: Optional[str] = None,
    direction: Optional[str] = None,
):
    q = apply_filters(db.query(Trade), current_user.id, date_from, date_to, pairs, sessions, direction)
    return q.order_by(Trade.opened_at.desc()).all()


@router.post("")
def create_trade(trade: TradeCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    side = trade.side.lower()
    if side not in ("buy", "sell"):
        raise HTTPException(status_code=400, detail="side must be 'buy' or 'sell'")

    rr = trade.rr_ratio
    if rr is None and trade.stop_loss and trade.take_profit:
        rr = compute_rr(trade.entry_price, trade.stop_loss, trade.take_profit)

    result = trade.result
    if result is None and trade.exit_price is not None:
        result = compute_result(side, trade.entry_price, trade.exit_price)

    new_trade = Trade(
        user_id=current_user.id,
        symbol=trade.symbol.upper(),
        side=side,
        entry_price=trade.entry_price,
        exit_price=trade.exit_price,
        stop_loss=trade.stop_loss,
        take_profit=trade.take_profit,
        lot_size=trade.lot_size,
        quantity=trade.quantity,
        strategy_id=trade.strategy_id,
        session=trade.session,
        result=result,
        rr_ratio=rr,
        notes=trade.notes,
        opened_at=trade.opened_at or datetime.utcnow(),
        closed_at=trade.closed_at,
    )
    db.add(new_trade)
    db.commit()
    db.refresh(new_trade)
    return new_trade


@router.get("/{trade_id}")
def get_trade(trade_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == current_user.id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    return trade


@router.patch("/{trade_id}")
def update_trade(trade_id: int, updates: TradeUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == current_user.id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

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

    if trade.exit_price and any(k in data for k in ("exit_price", "side", "entry_price")):
        trade.result = compute_result(trade.side, trade.entry_price, trade.exit_price)
    if trade.stop_loss and trade.take_profit and any(k in data for k in ("stop_loss", "take_profit", "entry_price")):
        trade.rr_ratio = compute_rr(trade.entry_price, trade.stop_loss, trade.take_profit)

    db.commit()
    db.refresh(trade)
    return trade


@router.delete("/{trade_id}")
def delete_trade(trade_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == current_user.id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    db.delete(trade)
    db.commit()
    return {"message": "Deleted"}
