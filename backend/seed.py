"""
Inserts 100 fake XAUUSD trades for testing.
Run from the backend folder with the venv active:
  python3 seed.py
"""
import random
from datetime import datetime, timedelta
from app.database.db import SessionLocal
from app.models.trade import Trade
from app.models.user import User

db = SessionLocal()

user = db.query(User).first()
if not user:
    print("No user found. Create an account first.")
    db.close()
    exit()

print(f"Seeding trades for: {user.email}")

sessions  = ["london", "new_york", "asian"]
# London: 8-16, NY: 13-21, Asian: 0-8 (UTC hours)
session_hours = { "london": (8, 16), "new_york": (13, 21), "asian": (0, 8) }

def random_date(days_back=180):
    base = datetime.utcnow() - timedelta(days=days_back)
    return base + timedelta(days=random.randint(0, days_back), hours=random.randint(0, 23), minutes=random.randint(0, 59))

trades_added = 0
for _ in range(100):
    side    = random.choice(["buy", "sell"])
    session = random.choice(sessions)
    h_min, h_max = session_hours[session]
    opened_at = random_date()
    opened_at = opened_at.replace(hour=random.randint(h_min, h_max - 1))

    # Realistic XAUUSD price range over last ~6 months
    entry = round(random.uniform(2280, 3200), 2)
    sl_dist = round(random.uniform(8, 35), 2)    # stop loss distance in $
    tp_dist = round(random.uniform(15, 80), 2)   # take profit distance in $

    stop_loss   = round(entry - sl_dist if side == "buy" else entry + sl_dist, 2)
    take_profit = round(entry + tp_dist if side == "buy" else entry - tp_dist, 2)
    rr          = round(tp_dist / sl_dist, 2)
    lot_size    = round(random.choice([0.01, 0.02, 0.05, 0.1, 0.2]), 2)

    # ~55% win rate
    won = random.random() < 0.55
    if won:
        # exit somewhere between entry and TP
        exit_price = round(entry + random.uniform(sl_dist * 0.5, tp_dist) * (1 if side == "buy" else -1), 2)
        result = "win"
    else:
        # exit somewhere between entry and SL
        exit_price = round(entry - random.uniform(sl_dist * 0.3, sl_dist) * (1 if side == "buy" else -1), 2)
        result = "loss"

    if side == "buy":
        pnl = (exit_price - entry) * lot_size * 100  # approximate for gold
    else:
        pnl = (entry - exit_price) * lot_size * 100

    trade = Trade(
        user_id     = user.id,
        symbol      = "XAUUSD",
        side        = side,
        entry_price = entry,
        exit_price  = exit_price,
        stop_loss   = stop_loss,
        take_profit = take_profit,
        lot_size    = lot_size,
        session     = session,
        result      = result,
        rr_ratio    = rr,
        notes       = None,
        opened_at   = opened_at,
        closed_at   = opened_at + timedelta(hours=random.randint(1, 8)),
    )
    db.add(trade)
    trades_added += 1

db.commit()
db.close()
print(f"Done. {trades_added} trades inserted.")
