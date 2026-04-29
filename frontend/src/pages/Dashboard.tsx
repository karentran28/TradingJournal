import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { apiGet } from "../api/client";
import type { Stats, DayStats } from "../types/trade";
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Tooltip, Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler);

// ── constants ────────────────────────────────────────────────────────────────
const GREEN  = "#26a69a";
const RED    = "#ef5350";
const BLUE   = "#2962ff";
const DAYS   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1e222d", borderColor: "#2a2d3a", borderWidth: 1, titleColor: "#d1d4dc", bodyColor: "#787b86" } },
    scales: {
        x: { grid: { color: "#2a2d3a" }, ticks: { color: "#787b86", font: { size: 10 } } },
        y: { grid: { color: "#2a2d3a" }, ticks: { color: "#787b86", font: { size: 10 } } },
    },
};

// ── helpers ──────────────────────────────────────────────────────────────────
function getWeekDates(offset: number): Date[] {
    const today = new Date();
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
}

function fmtDate(d: Date) {
    return d.toISOString().slice(0, 10);
}

function fmtPnl(n: number) {
    const sign = n >= 0 ? "+" : "";
    return `${sign}$${Math.abs(n).toFixed(2)}`;
}

function isToday(d: Date) {
    return fmtDate(d) === fmtDate(new Date());
}

// ── sub-components ────────────────────────────────────────────────────────────

function WeeklyCalendar({ weekOffset, onPrev, onNext }: { weekOffset: number; onPrev: () => void; onNext: () => void; }) {
    const [dayMap, setDayMap] = useState<Record<string, DayStats>>({});
    const dates = getWeekDates(weekOffset);
    const start = dates[0];
    const end   = dates[6];

    const weekLabel = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    useEffect(() => {
        const s = new Date(start); s.setHours(0, 0, 0, 0);
        const e = new Date(end);   e.setHours(23, 59, 59, 999);
        apiGet("/trades/stats", { date_from: s.toISOString(), date_to: e.toISOString() })
            .then((data: Stats) => {
                const map: Record<string, DayStats> = {};
                data.daily_pnl.forEach(d => { map[d.date] = d; });
                setDayMap(map);
            })
            .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weekOffset]);

    return (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 20px", marginBottom: 20 }}>
            {/* header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ color: "var(--text-dim)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Week of {weekLabel}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                    <NavBtn onClick={onPrev}><ChevronLeft size={14} /></NavBtn>
                    <NavBtn onClick={onNext}><ChevronRight size={14} /></NavBtn>
                </div>
            </div>

            {/* day boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
                {dates.map((date, i) => {
                    const key  = fmtDate(date);
                    const day  = dayMap[key];
                    const pnl  = day?.pnl ?? null;
                    const cnt  = day?.trade_count ?? 0;
                    const today = isToday(date);

                    const bgColor  = today ? "rgba(41,98,255,0.1)" : pnl === null || cnt === 0 ? "var(--bg)" : pnl >= 0 ? "rgba(38,166,154,0.08)" : "rgba(239,83,80,0.08)";
                    const border   = today ? `1px solid ${BLUE}` : "1px solid var(--border)";
                    const pnlColor = pnl === null || cnt === 0 ? "var(--text-dim)" : pnl >= 0 ? GREEN : RED;

                    return (
                        <div key={key} style={{ background: bgColor, border, borderRadius: 6, padding: "10px 8px", textAlign: "center" }}>
                            <div style={{ color: "var(--text-dim)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                                {DAYS[i]}
                            </div>
                            <div style={{ color: today ? BLUE : "var(--text)", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                                {date.getDate()}
                            </div>
                            <div style={{ color: pnlColor, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                                {cnt === 0 ? "—" : fmtPnl(pnl!)}
                            </div>
                            <div style={{ color: "var(--text-dim)", fontSize: 10 }}>
                                {cnt === 0 ? "no trades" : `${cnt} trade${cnt !== 1 ? "s" : ""}`}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ChartCard({ title, metric, metricColor, height = 180, expanded, onExpand, children }: {
    title: string;
    metric?: string;
    metricColor?: string;
    height?: number;
    expanded?: boolean;
    onExpand?: () => void;
    children: React.ReactNode;
}) {
    return (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                    <div style={{ color: "var(--text-dim)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                        {title}
                    </div>
                    {metric && (
                        <div style={{ color: metricColor ?? "var(--text)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>
                            {metric}
                        </div>
                    )}
                </div>
                {onExpand && (
                    <button onClick={onExpand} style={{ color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer", padding: 4 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-dim)")}
                    >
                        <Maximize2 size={13} />
                    </button>
                )}
            </div>
            <div style={{ height }}>
                {children}
            </div>
        </div>
    );
}

function ExpandModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, background: "rgba(0,0,0,0.7)" }}
            onClick={onClose}
        >
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 28, width: "85vw", height: "75vh" }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 15 }}>{title}</span>
                    <button onClick={onClose} style={{ color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
                </div>
                <div style={{ height: "calc(100% - 48px)" }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
    return (
        <button onClick={onClick}
            style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 6px", color: "var(--text-dim)", cursor: "pointer", display: "flex", alignItems: "center" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-dim)")}
        >
            {children}
        </button>
    );
}

// ── chart builders ────────────────────────────────────────────────────────────

function EquityChart({ data }: { data: Stats["equity_curve"] }) {
    if (!data.length) return <Empty />;
    return (
        <Line
            data={{
                labels: data.map(d => d.date),
                datasets: [{
                    data: data.map(d => d.pnl),
                    borderColor: BLUE,
                    backgroundColor: "rgba(41,98,255,0.08)",
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    borderWidth: 2,
                }],
            }}
            options={{ ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, ticks: { ...chartDefaults.scales.y.ticks, callback: (v: any) => `$${v}` } } } } as any}
        />
    );
}

function DailyBar({ data }: { data: Stats["daily_pnl"] }) {
    if (!data.length) return <Empty />;
    return (
        <Bar
            data={{
                labels: data.map(d => d.date.slice(5)),
                datasets: [{
                    data: data.map(d => d.pnl),
                    backgroundColor: data.map(d => d.pnl >= 0 ? GREEN : RED),
                    borderRadius: 3,
                }],
            }}
            options={chartDefaults as any}
        />
    );
}

function SessionBar({ data }: { data: Stats["session_stats"] }) {
    const labels   = ["London", "New York", "Asian"];
    const keys     = ["london", "new_york", "asian"];
    const pnlData  = keys.map(k => data[k]?.pnl ?? 0);
    if (pnlData.every(v => v === 0)) return <Empty />;
    return (
        <Bar
            data={{
                labels,
                datasets: [{
                    data: pnlData,
                    backgroundColor: pnlData.map(v => v >= 0 ? GREEN : RED),
                    borderRadius: 3,
                }],
            }}
            options={chartDefaults as any}
        />
    );
}

function StrategyWinRate({ data }: { data: Stats["strategy_stats"] }) {
    if (!data.length) return <Empty />;
    return (
        <Bar
            data={{
                labels: data.map(d => d.name),
                datasets: [{
                    data: data.map(d => +(d.win_rate * 100).toFixed(1)),
                    backgroundColor: BLUE,
                    borderRadius: 3,
                }],
            }}
            options={{ ...chartDefaults, indexAxis: "y" as const, scales: { ...chartDefaults.scales, x: { ...chartDefaults.scales.x, ticks: { ...chartDefaults.scales.x.ticks, callback: (v: any) => `${v}%` } } } } as any}
        />
    );
}

function StrategyRR({ data }: { data: Stats["strategy_stats"] }) {
    if (!data.length) return <Empty />;
    return (
        <Bar
            data={{
                labels: data.map(d => d.name),
                datasets: [{
                    data: data.map(d => d.avg_rr),
                    backgroundColor: GREEN,
                    borderRadius: 3,
                }],
            }}
            options={{ ...chartDefaults, indexAxis: "y" as const } as any}
        />
    );
}

function StreakTracker({ stats }: { stats: Stats }) {
    const { streak, streak_type, max_win_streak, max_loss_streak } = stats;
    const streakColor = streak_type === "win" ? GREEN : streak_type === "loss" ? RED : "var(--text-dim)";
    const streakLabel = streak_type === "win" ? "Win streak" : streak_type === "loss" ? "Loss streak" : "No streak";

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 32, height: "100%" }}>
            <div>
                <div style={{ color: "var(--text-dim)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Current</div>
                <div style={{ color: streakColor, fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{streak}</div>
                <div style={{ color: streakColor, fontSize: 12, marginTop: 4 }}>{streakLabel}</div>
            </div>
            <div style={{ width: 1, background: "var(--border)", height: 60 }} />
            <div style={{ display: "flex", gap: 24 }}>
                <div>
                    <div style={{ color: "var(--text-dim)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Max Win Streak</div>
                    <div style={{ color: GREEN, fontSize: 28, fontWeight: 700 }}>{max_win_streak}</div>
                </div>
                <div>
                    <div style={{ color: "var(--text-dim)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Max Loss Streak</div>
                    <div style={{ color: RED, fontSize: 28, fontWeight: 700 }}>{max_loss_streak}</div>
                </div>
            </div>
        </div>
    );
}

function Empty() {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-dim)", fontSize: 13 }}>No data yet</div>;
}

// ── main page ─────────────────────────────────────────────────────────────────

type Expanded = "equity" | "daily" | "session" | "winrate" | "rr" | null;

export default function Dashboard() {
    const [stats, setStats]           = useState<Stats | null>(null);
    const [weekOffset, setWeekOffset] = useState(0);
    const [expanded, setExpanded]     = useState<Expanded>(null);
    const [loading, setLoading]       = useState(true);

    const loadStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiGet("/trades/stats");
            setStats(data as Stats);
        } catch (_) {}
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadStats(); }, [loadStats]);

    if (loading) return <div style={{ color: "var(--text-dim)", fontSize: 13 }}>Loading...</div>;
    if (!stats)  return <div style={{ color: RED, fontSize: 13 }}>Failed to load stats.</div>;

    const pnlColor = stats.total_pnl >= 0 ? GREEN : RED;

    return (
        <div style={{ maxWidth: 1100 }}>
            {/* Page header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h1 style={{ color: "var(--text)", fontSize: 18, fontWeight: 700, margin: 0 }}>Overview</h1>
            </div>

            {/* Weekly calendar */}
            <WeeklyCalendar
                weekOffset={weekOffset}
                onPrev={() => setWeekOffset(o => o - 1)}
                onNext={() => setWeekOffset(o => o + 1)}
            />

            {/* Equity curve — full width */}
            <div className="mb-4">
                <ChartCard
                    title="Cumulative P&L"
                    metric={`$${stats.total_pnl.toFixed(2)}`}
                    metricColor={pnlColor}
                    height={200}
                    onExpand={() => setExpanded("equity")}
                >
                    <EquityChart data={stats.equity_curve} />
                </ChartCard>
            </div>

            {/* Row: Daily P&L | Session P&L */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <ChartCard title="Daily P&L" height={160} onExpand={() => setExpanded("daily")}>
                    <DailyBar data={stats.daily_pnl} />
                </ChartCard>
                <ChartCard title="P&L by Session" height={160} onExpand={() => setExpanded("session")}>
                    <SessionBar data={stats.session_stats} />
                </ChartCard>
            </div>

            {/* Row: Win Rate by Strategy | Avg R:R by Strategy */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <ChartCard
                    title="Win Rate by Strategy"
                    metric={`${(stats.win_rate * 100).toFixed(1)}%`}
                    height={160}
                    onExpand={() => setExpanded("winrate")}
                >
                    <StrategyWinRate data={stats.strategy_stats} />
                </ChartCard>
                <ChartCard
                    title="Avg R:R by Strategy"
                    metric={stats.avg_rr.toFixed(2)}
                    height={160}
                    onExpand={() => setExpanded("rr")}
                >
                    <StrategyRR data={stats.strategy_stats} />
                </ChartCard>
            </div>

            {/* Streak tracker — full width */}
            <ChartCard title="Streak Tracker" height={100}>
                <StreakTracker stats={stats} />
            </ChartCard>

            {/* Expand modals */}
            {expanded === "equity"  && <ExpandModal title="Cumulative P&L"         onClose={() => setExpanded(null)}><EquityChart data={stats.equity_curve} /></ExpandModal>}
            {expanded === "daily"   && <ExpandModal title="Daily P&L"              onClose={() => setExpanded(null)}><DailyBar data={stats.daily_pnl} /></ExpandModal>}
            {expanded === "session" && <ExpandModal title="P&L by Session"         onClose={() => setExpanded(null)}><SessionBar data={stats.session_stats} /></ExpandModal>}
            {expanded === "winrate" && <ExpandModal title="Win Rate by Strategy"   onClose={() => setExpanded(null)}><StrategyWinRate data={stats.strategy_stats} /></ExpandModal>}
            {expanded === "rr"      && <ExpandModal title="Avg R:R by Strategy"    onClose={() => setExpanded(null)}><StrategyRR data={stats.strategy_stats} /></ExpandModal>}
        </div>
    );
}
