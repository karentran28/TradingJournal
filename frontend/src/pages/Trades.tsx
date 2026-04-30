import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronUp, ChevronDown, Trash2, Download } from "lucide-react";
import { apiGet, apiJson } from "../api/client";
import type { Trade } from "../types/trade";
import AddTradeModal from "../components/AddTradeModal";

const PAGE_SIZE = 20;
const PAIRS    = ["","EURUSD","GBPUSD","USDJPY","USDCHF","AUDUSD","USDCAD","NZDUSD","EURGBP","EURJPY","GBPJPY","XAUUSD"];
const SESSIONS = [{ value: "", label: "All Sessions" }, { value: "london", label: "London" }, { value: "new_york", label: "New York" }, { value: "asian", label: "Asian" }];

type SortKey = "opened_at" | "symbol" | "side" | "entry_price" | "exit_price" | "lot_size" | "rr_ratio" | "result" | "session";
type SortDir = "asc" | "desc";

function pnl(t: Trade): number | null {
    if (t.exit_price === null) return null;
    const qty = t.lot_size ?? t.quantity ?? 1;
    return t.side === "buy" ? (t.exit_price - t.entry_price) * qty : (t.entry_price - t.exit_price) * qty;
}

function badge(text: string, color: string, bg: string) {
    return (
        <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, color, background: bg, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {text}
        </span>
    );
}

export default function Trades() {
    const [searchParams] = useSearchParams();
    const [trades,      setTrades]      = useState<Trade[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [showModal,   setShowModal]   = useState(false);
    const [expanded,    setExpanded]    = useState<number | null>(null);
    const [editNotes,   setEditNotes]   = useState<Record<number, string>>({});
    const [sortKey,     setSortKey]     = useState<SortKey>("opened_at");
    const [sortDir,     setSortDir]     = useState<SortDir>("desc");
    const [page,        setPage]        = useState(1);
    const [pair,        setPair]        = useState("");
    const [session,     setSession]     = useState("");
    const [direction,   setDirection]   = useState("");
    const [dateFrom,    setDateFrom]    = useState("");
    const [dateTo,      setDateTo]      = useState("");

    // open modal if sidebar "New Trade" was clicked
    useEffect(() => {
        if (searchParams.get("new") === "1") setShowModal(true);
    }, [searchParams]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (pair)      params.pairs     = pair;
            if (session)   params.sessions  = session;
            if (direction) params.direction = direction;
            if (dateFrom)  params.date_from = new Date(dateFrom).toISOString();
            if (dateTo)    params.date_to   = new Date(dateTo).toISOString();
            const data = await apiGet("/trades", params);
            setTrades(data as Trade[]);
            setPage(1);
        } finally {
            setLoading(false);
        }
    }, [pair, session, direction, dateFrom, dateTo]);

    useEffect(() => { load(); }, [load]);

    function toggleSort(key: SortKey) {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("asc"); }
    }

    const sorted = [...trades].sort((a, b) => {
        const av = a[sortKey] ?? "";
        const bv = b[sortKey] ?? "";
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const paged      = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    async function saveNotes(id: number) {
        await apiJson(`/trades/${id}`, "PATCH", { notes: editNotes[id] });
        await load();
    }

    async function deleteTrade(id: number) {
        if (!window.confirm("Delete this trade?")) return;
        await apiJson(`/trades/${id}`, "DELETE");
        await load();
    }

    function exportCsv() {
        const headers = ["ID","Pair","Side","Entry","Exit","SL","TP","Lot Size","R:R","Session","Result","P&L","Opened","Notes"];
        const rows = sorted.map(t => {
            const p = pnl(t);
            return [t.id, t.symbol, t.side, t.entry_price, t.exit_price ?? "", t.stop_loss ?? "", t.take_profit ?? "",
                    t.lot_size ?? "", t.rr_ratio ?? "", t.session ?? "", t.result ?? "",
                    p !== null ? p.toFixed(2) : "", t.opened_at ?? "", (t.notes ?? "").replace(/,/g, ";")].join(",");
        });
        const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "trades.csv";
        a.click();
    }

    function SortIcon({ col }: { col: SortKey }) {
        if (sortKey !== col) return <span style={{ color: "var(--border)", marginLeft: 4 }}>↕</span>;
        return sortDir === "asc"
            ? <ChevronUp size={12} style={{ marginLeft: 4, color: "var(--blue)" }} />
            : <ChevronDown size={12} style={{ marginLeft: 4, color: "var(--blue)" }} />;
    }

    const hasFilters = pair || session || direction || dateFrom || dateTo;

    return (
        <div style={{ width: "100%" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h1 style={{ color: "var(--text)", fontSize: 18, fontWeight: 700, margin: 0 }}>Trades</h1>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={exportCsv} style={outlineBtn}>
                        <Download size={13} /> Export CSV
                    </button>
                    <button onClick={() => setShowModal(true)} style={primaryBtn}>
                        + New Trade
                    </button>
                </div>
            </div>

            {/* Filter bar */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <select value={pair} onChange={e => setPair(e.target.value)} style={filterSel}>
                    <option value="">All Pairs</option>
                    {PAIRS.filter(Boolean).map(p => <option key={p}>{p}</option>)}
                </select>
                <select value={session} onChange={e => setSession(e.target.value)} style={filterSel}>
                    {SESSIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select value={direction} onChange={e => setDirection(e.target.value)} style={filterSel}>
                    <option value="">Buy & Sell</option>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                </select>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={filterSel} />
                <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   style={filterSel} />
                {hasFilters && (
                    <button onClick={() => { setPair(""); setSession(""); setDirection(""); setDateFrom(""); setDateTo(""); }} style={outlineBtn}>
                        Clear
                    </button>
                )}
            </div>

            {loading ? (
                <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Loading...</p>
            ) : trades.length === 0 ? (
                <p style={{ color: "var(--text-dim)", fontSize: 13 }}>No trades yet. Add your first trade to get started.</p>
            ) : (
                <>
                    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                    {([
                                        ["#",       null],
                                        ["Pair",    "symbol"],
                                        ["Dir",     "side"],
                                        ["Entry",   "entry_price"],
                                        ["Exit",    "exit_price"],
                                        ["SL",      null],
                                        ["TP",      null],
                                        ["Lot",     "lot_size"],
                                        ["P&L",     null],
                                        ["R:R",     "rr_ratio"],
                                        ["Session", "session"],
                                        ["Result",  "result"],
                                        ["Date",    "opened_at"],
                                        ["",        null],
                                    ] as [string, SortKey | null][]).map(([label, key]) => (
                                        <th key={label}
                                            onClick={key ? () => toggleSort(key) : undefined}
                                            style={{ padding: "10px 14px", textAlign: "left", color: "var(--text-dim)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", cursor: key ? "pointer" : "default", whiteSpace: "nowrap", userSelect: "none" }}
                                        >
                                            {label}{key && <SortIcon col={key} />}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map(trade => {
                                    const p = pnl(trade);
                                    const isOpen = expanded === trade.id;
                                    const pnlColor = p === null ? "var(--text-dim)" : p >= 0 ? "#26a69a" : "#ef5350";

                                    return (
                                        <>
                                            <tr key={trade.id}
                                                onClick={() => {
                                                    setExpanded(isOpen ? null : trade.id);
                                                    if (!editNotes[trade.id]) setEditNotes(n => ({ ...n, [trade.id]: trade.notes ?? "" }));
                                                }}
                                                style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.1s" }}
                                                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                                                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "transparent"; }}
                                            >
                                                <td style={td}><span style={{ color: "var(--text-dim)" }}>{trade.id}</span></td>
                                                <td style={td}><strong style={{ color: "var(--text)" }}>{trade.symbol}</strong></td>
                                                <td style={td}>
                                                    {trade.side === "buy"
                                                        ? badge("Buy",  "#26a69a", "rgba(38,166,154,0.15)")
                                                        : badge("Sell", "#ef5350", "rgba(239,83,80,0.15)")}
                                                </td>
                                                <td style={td}>{trade.entry_price}</td>
                                                <td style={td}>{trade.exit_price ?? <span style={{ color: "var(--text-dim)" }}>—</span>}</td>
                                                <td style={td}>{trade.stop_loss   ?? <span style={{ color: "var(--text-dim)" }}>—</span>}</td>
                                                <td style={td}>{trade.take_profit ?? <span style={{ color: "var(--text-dim)" }}>—</span>}</td>
                                                <td style={td}>{trade.lot_size    ?? <span style={{ color: "var(--text-dim)" }}>—</span>}</td>
                                                <td style={{ ...td, fontWeight: 600, color: pnlColor }}>
                                                    {p !== null ? `${p >= 0 ? "+" : ""}$${p.toFixed(2)}` : <span style={{ color: "var(--text-dim)" }}>Open</span>}
                                                </td>
                                                <td style={td}>{trade.rr_ratio ?? <span style={{ color: "var(--text-dim)" }}>—</span>}</td>
                                                <td style={td}><span style={{ color: "var(--text-dim)", textTransform: "capitalize" }}>{trade.session?.replace("_", " ") ?? "—"}</span></td>
                                                <td style={td}>
                                                    {trade.result === "win"  && badge("Win",  "#26a69a", "rgba(38,166,154,0.15)")}
                                                    {trade.result === "loss" && badge("Loss", "#ef5350", "rgba(239,83,80,0.15)")}
                                                    {(!trade.result || trade.result === "breakeven") && <span style={{ color: "var(--text-dim)" }}>—</span>}
                                                </td>
                                                <td style={td}><span style={{ color: "var(--text-dim)" }}>{trade.opened_at ? new Date(trade.opened_at).toLocaleDateString() : "—"}</span></td>
                                                <td style={td} onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => deleteTrade(trade.id)}
                                                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: 4, display: "flex" }}
                                                        onMouseEnter={e => (e.currentTarget.style.color = "#ef5350")}
                                                        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-dim)")}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            </tr>

                                            {isOpen && (
                                                <tr key={`${trade.id}-detail`}>
                                                    <td colSpan={14} style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border)", padding: "16px 20px" }}>
                                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
                                                            <Detail label="Stop Loss"   value={trade.stop_loss} />
                                                            <Detail label="Take Profit" value={trade.take_profit} />
                                                            <Detail label="Quantity"    value={trade.quantity} />
                                                            <Detail label="Closed"      value={trade.closed_at ? new Date(trade.closed_at).toLocaleDateString() : null} />
                                                        </div>
                                                        <label style={{ display: "block", color: "var(--text-dim)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Notes</label>
                                                        <textarea
                                                            value={editNotes[trade.id] ?? ""}
                                                            onChange={e => setEditNotes(n => ({ ...n, [trade.id]: e.target.value }))}
                                                            rows={3}
                                                            onClick={e => e.stopPropagation()}
                                                            placeholder="Add trade notes..."
                                                            style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 10px", fontSize: 13, color: "var(--text)", resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                                                        />
                                                        <button
                                                            onClick={e => { e.stopPropagation(); saveNotes(trade.id); }}
                                                            style={{ marginTop: 8, padding: "6px 16px", background: "var(--blue)", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                                                        >
                                                            Save Notes
                                                        </button>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, color: "var(--text-dim)", fontSize: 13 }}>
                        <span>{sorted.length} trade{sorted.length !== 1 ? "s" : ""}</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={pageBtn}>←</button>
                            <span style={{ color: "var(--text)" }}>{page} / {totalPages}</span>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={pageBtn}>→</button>
                        </div>
                    </div>
                </>
            )}

            {showModal && <AddTradeModal onClose={() => setShowModal(false)} onSaved={load} />}
        </div>
    );
}

function Detail({ label, value }: { label: string; value: any }) {
    return (
        <div>
            <div style={{ color: "var(--text-dim)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
            <div style={{ color: "var(--text)", fontSize: 13 }}>{value ?? "—"}</div>
        </div>
    );
}

const td: React.CSSProperties = { padding: "10px 14px", color: "var(--text)", whiteSpace: "nowrap" };

const filterSel: React.CSSProperties = {
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6,
    padding: "6px 10px", fontSize: 12, color: "var(--text)", cursor: "pointer", outline: "none",
};

const primaryBtn: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6,
    padding: "7px 14px", background: "var(--blue)", color: "#fff",
    border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
};

const outlineBtn: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6,
    padding: "7px 14px", background: "transparent", color: "var(--text-dim)",
    border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, cursor: "pointer",
};

const pageBtn: React.CSSProperties = {
    padding: "4px 10px", background: "var(--card)", border: "1px solid var(--border)",
    borderRadius: 6, color: "var(--text)", cursor: "pointer", fontSize: 13,
};
