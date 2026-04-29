export type Trade = {
    id: number;
    user_id: number;
    symbol: string;
    side: "buy" | "sell";
    entry_price: number;
    exit_price: number | null;
    stop_loss: number | null;
    take_profit: number | null;
    lot_size: number | null;
    quantity: number | null;
    strategy_id: number | null;
    session: "london" | "new_york" | "asian" | null;
    result: "win" | "loss" | "breakeven" | null;
    rr_ratio: number | null;
    notes: string | null;
    opened_at: string | null;
    closed_at: string | null;
};

export type DayStats = {
    date: string;
    pnl: number;
    trade_count: number;
};

export type SessionStat = {
    wins: number;
    losses: number;
    pnl: number;
};

export type StrategyStat = {
    name: string;
    wins: number;
    losses: number;
    win_rate: number;
    avg_rr: number;
};

export type Stats = {
    total_trades: number;
    closed_trades: number;
    open_trades: number;
    wins: number;
    losses: number;
    breakeven: number;
    win_rate: number;
    total_pnl: number;
    avg_rr: number;
    max_drawdown: number;
    profit_factor: number | null;
    equity_curve: { date: string; pnl: number }[];
    daily_pnl: DayStats[];
    session_stats: Record<string, SessionStat>;
    strategy_stats: StrategyStat[];
    weekday_counts: Record<string, number>;
    streak: number;
    streak_type: "win" | "loss" | null;
    max_win_streak: number;
    max_loss_streak: number;
};
