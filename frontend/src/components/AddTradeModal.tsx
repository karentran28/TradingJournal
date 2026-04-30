import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiGet, apiJson } from "../api/client";
import type { Trade } from "../types/trade";

const PAIRS = [
    // "EURUSD","GBPUSD","USDJPY","USDCHF","AUDUSD","USDCAD","NZDUSD",
    // "EURGBP","EURJPY","GBPJPY","AUDJPY","CADJPY","EURCHF","EURAUD",
    // "EURCAD","GBPAUD","GBPCAD","GBPCHF","AUDCAD","AUDNZD",
    "XAUUSD","XAGUSD"
];

const SESSIONS = [
    { value: "london",   label: "London" },
    { value: "new_york", label: "New York" },
    { value: "asian",    label: "Asian" },
];

type Strategy = { id: number; name: string };
type Props = { onClose: () => void; onSaved: () => void };

export default function AddTradeModal({ onClose, onSaved }: Props) {
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [symbol,      setSymbol]      = useState("EURUSD");
    const [side,        setSide]        = useState<"buy" | "sell">("buy");
    const [entryPrice,  setEntryPrice]  = useState("");
    const [exitPrice,   setExitPrice]   = useState("");
    const [stopLoss,    setStopLoss]    = useState("");
    const [takeProfit,  setTakeProfit]  = useState("");
    const [lotSize,     setLotSize]     = useState("");
    const [strategyId,  setStrategyId]  = useState("");
    const [session,     setSession]     = useState("london");
    const [openedAt,    setOpenedAt]    = useState(new Date().toISOString().slice(0, 16));
    const [notes,       setNotes]       = useState("");
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState("");

    useEffect(() => {
        apiGet("/strategies").then(setStrategies).catch(() => {});
    }, []);

    // live R:R preview
    const rrPreview = (() => {
        const entry = parseFloat(entryPrice);
        const sl    = parseFloat(stopLoss);
        const tp    = parseFloat(takeProfit);
        if (!entry || !sl || !tp || sl === entry) return null;
        const risk   = Math.abs(entry - sl);
        const reward = Math.abs(tp - entry);
        return (reward / risk).toFixed(2);
    })();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await apiJson("/trades", "POST", {
                symbol,
                side,
                entry_price:  parseFloat(entryPrice),
                exit_price:   exitPrice   ? parseFloat(exitPrice)   : null,
                stop_loss:    stopLoss    ? parseFloat(stopLoss)    : null,
                take_profit:  takeProfit  ? parseFloat(takeProfit)  : null,
                lot_size:     lotSize     ? parseFloat(lotSize)     : null,
                strategy_id:  strategyId  ? parseInt(strategyId)   : null,
                session,
                notes:        notes || null,
                opened_at:    openedAt ? new Date(openedAt).toISOString() : null,
            });
            onSaved();
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
            onClick={onClose}
        >
            <div
                style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 28, width: 520, maxHeight: "90vh", overflowY: "auto" }}
                onClick={e => e.stopPropagation()}
            >
                {/* header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <span style={{ color: "var(--text)", fontSize: 15, fontWeight: 600 }}>New Trade</span>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", padding: 4, display: "flex" }}>
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Pair + Direction */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <Field label="Pair">
                            <select value={symbol} onChange={e => setSymbol(e.target.value)} style={sel}>
                                {PAIRS.map(p => <option key={p}>{p}</option>)}
                            </select>
                        </Field>
                        <Field label="Direction">
                            <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)" }}>
                                {(["buy","sell"] as const).map(s => (
                                    <button key={s} type="button" onClick={() => setSide(s)}
                                        style={{
                                            flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                                            background: side === s ? (s === "buy" ? "rgba(38,166,154,0.2)" : "rgba(239,83,80,0.2)") : "var(--bg)",
                                            color: side === s ? (s === "buy" ? "#26a69a" : "#ef5350") : "var(--text-dim)",
                                            textTransform: "capitalize",
                                        }}
                                    >{s}</button>
                                ))}
                            </div>
                        </Field>
                    </div>

                    {/* Entry + Exit */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <Field label="Entry Price"><input required type="number" step="any" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} style={inp} /></Field>
                        <Field label="Exit Price (optional)"><input type="number" step="any" value={exitPrice} onChange={e => setExitPrice(e.target.value)} style={inp} /></Field>
                    </div>

                    {/* SL + TP */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <Field label="Stop Loss"><input type="number" step="any" value={stopLoss} onChange={e => setStopLoss(e.target.value)} style={inp} /></Field>
                        <Field label="Take Profit"><input type="number" step="any" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} style={inp} /></Field>
                    </div>

                    {/* R:R live preview */}
                    {rrPreview && (
                        <div style={{ marginBottom: 12, padding: "8px 12px", background: "rgba(41,98,255,0.08)", border: "1px solid rgba(41,98,255,0.2)", borderRadius: 6, fontSize: 13, color: "#2962ff" }}>
                            R:R Ratio → <strong>{rrPreview}</strong>
                        </div>
                    )}

                    {/* Lot size + Strategy */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <Field label="Lot Size"><input type="number" step="any" value={lotSize} onChange={e => setLotSize(e.target.value)} style={inp} /></Field>
                        <Field label="Strategy">
                            <select value={strategyId} onChange={e => setStrategyId(e.target.value)} style={sel}>
                                <option value="">— none —</option>
                                {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </Field>
                    </div>

                    {/* Session + Date */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <Field label="Session">
                            <select value={session} onChange={e => setSession(e.target.value)} style={sel}>
                                {SESSIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </Field>
                        <Field label="Date & Time">
                            <input type="datetime-local" value={openedAt} onChange={e => setOpenedAt(e.target.value)} style={inp} />
                        </Field>
                    </div>

                    {/* Notes */}
                    <Field label="Notes">
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                            placeholder="Setup rationale, emotions, observations..."
                            style={{ ...inp, resize: "vertical", fontFamily: "inherit" }}
                        />
                    </Field>

                    {error && <p style={{ color: "#ef5350", fontSize: 13, margin: "12px 0 0" }}>{error}</p>}

                    <button type="submit" disabled={saving}
                        style={{ marginTop: 20, width: "100%", padding: "10px 0", background: "var(--blue)", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
                    >
                        {saving ? "Saving..." : "Add Trade"}
                    </button>
                </form>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label style={{ display: "block", color: "var(--text-dim)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</label>
            {children}
        </div>
    );
}

const base = {
    width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: 6, padding: "8px 10px", fontSize: 13, color: "var(--text)",
    outline: "none", boxSizing: "border-box" as const,
};
const inp = base;
const sel = { ...base, cursor: "pointer" };
