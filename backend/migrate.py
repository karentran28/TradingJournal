"""
Run this once to add new columns to the existing trades table.
New tables (strategies, journal_entries, notebook_entries) are created automatically.
"""
from app.database.db import engine
from sqlalchemy import text

new_trade_columns = [
    ("strategy_id", "INTEGER"),
    ("stop_loss",   "FLOAT"),
    ("take_profit", "FLOAT"),
    ("lot_size",    "FLOAT"),
    ("session",     "VARCHAR"),
    ("result",      "VARCHAR"),
    ("rr_ratio",    "FLOAT"),
]

with engine.connect() as conn:
    for col, col_type in new_trade_columns:
        try:
            conn.execute(text(f"ALTER TABLE trades ADD COLUMN {col} {col_type}"))
            conn.commit()
            print(f"  + trades.{col}")
        except Exception as e:
            print(f"  ~ trades.{col} already exists, skipping")

print("Done.")
