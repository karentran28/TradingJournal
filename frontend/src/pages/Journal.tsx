import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { apiGet, apiJson } from "../api/client";

type Entry = { id: number; title: string; content: string | null; entry_date: string; created_at: string };

export default function Journal() {
    const [entries,   setEntries]   = useState<Entry[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [expanded,  setExpanded]  = useState<number | null>(null);
    const [editing,   setEditing]   = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editBody,  setEditBody]  = useState("");
    const [showForm,  setShowForm]  = useState(false);
    const [newTitle,  setNewTitle]  = useState("");
    const [newBody,   setNewBody]   = useState("");
    const [newDate,   setNewDate]   = useState(today());
    const [saving,    setSaving]    = useState(false);

    function today() {
        return new Date().toISOString().slice(0, 10);
    }

    async function load() {
        setLoading(true);
        try {
            const data = await apiGet("/journal");
            setEntries(data as Entry[]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!newTitle.trim()) return;
        setSaving(true);
        try {
            await apiJson("/journal", "POST", { title: newTitle.trim(), content: newBody.trim() || null, entry_date: newDate });
            setNewTitle(""); setNewBody(""); setNewDate(today()); setShowForm(false);
            await load();
        } finally {
            setSaving(false);
        }
    }

    async function handleSaveEdit(id: number) {
        await apiJson(`/journal/${id}`, "PATCH", { title: editTitle.trim(), content: editBody.trim() || null });
        setEditing(null);
        await load();
    }

    async function handleDelete(id: number) {
        if (!window.confirm("Delete this journal entry?")) return;
        await apiJson(`/journal/${id}`, "DELETE");
        await load();
    }

    function startEdit(e: Entry) {
        setEditing(e.id);
        setExpanded(e.id);
        setEditTitle(e.title);
        setEditBody(e.content ?? "");
    }

    // group entries by month
    const grouped: Record<string, Entry[]> = {};
    entries.forEach(e => {
        const month = e.entry_date.slice(0, 7); // "2026-04"
        if (!grouped[month]) grouped[month] = [];
        grouped[month].push(e);
    });

    return (
        <div style={{ width: "100%", maxWidth: 720 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                    <h1 style={{ color: "var(--text)", fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>Journal</h1>
                    <p style={{ color: "var(--text-dim)", fontSize: 13, margin: 0 }}>A running log of your trading thoughts and reflections.</p>
                </div>
                <button onClick={() => setShowForm(f => !f)} style={primaryBtn}>
                    <Plus size={13} /> New Entry
                </button>
            </div>

            {/* New entry form */}
            {showForm && (
                <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 20, marginBottom: 24 }}>
                    <form onSubmit={handleAdd}>
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
                            <div>
                                <label style={labelStyle}>Title</label>
                                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="What's on your mind?" required style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Date</label>
                                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={inputStyle} />
                            </div>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label style={labelStyle}>Entry</label>
                            <textarea
                                value={newBody}
                                onChange={e => setNewBody(e.target.value)}
                                rows={6}
                                placeholder="Write about your trades, emotions, lessons learned, market observations..."
                                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
                            />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button type="submit" disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }}>
                                {saving ? "Saving..." : "Save Entry"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} style={outlineBtn}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Loading...</p>
            ) : entries.length === 0 ? (
                <p style={{ color: "var(--text-dim)", fontSize: 13 }}>No entries yet. Start writing about your trading day.</p>
            ) : (
                Object.entries(grouped)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([month, monthEntries]) => (
                        <div key={month} style={{ marginBottom: 32 }}>
                            {/* Month label */}
                            <div style={{ color: "var(--text-dim)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 10 }}>
                                {new Date(month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {monthEntries.map(entry => {
                                    const isOpen = expanded === entry.id;
                                    const isEditMode = editing === entry.id;

                                    return (
                                        <div key={entry.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                                            {/* Entry header */}
                                            <div
                                                onClick={() => { if (!isEditMode) setExpanded(isOpen ? null : entry.id); }}
                                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer" }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
                                                    <div style={{ textAlign: "center", minWidth: 36 }}>
                                                        <div style={{ color: "var(--blue)", fontSize: 18, fontWeight: 700, lineHeight: 1 }}>
                                                            {new Date(entry.entry_date + "T00:00:00").getDate()}
                                                        </div>
                                                        <div style={{ color: "var(--text-dim)", fontSize: 10, textTransform: "uppercase" }}>
                                                            {new Date(entry.entry_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                                                        </div>
                                                    </div>
                                                    <div style={{ width: 1, height: 32, background: "var(--border)" }} />
                                                    <div>
                                                        <div style={{ color: "var(--text)", fontSize: 14, fontWeight: 600 }}>{entry.title}</div>
                                                        {!isOpen && entry.content && (
                                                            <div style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 480 }}>
                                                                {entry.content}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    {isOpen ? <ChevronUp size={14} style={{ color: "var(--text-dim)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-dim)" }} />}
                                                </div>
                                            </div>

                                            {/* Expanded content */}
                                            {isOpen && (
                                                <div style={{ borderTop: "1px solid var(--border)", padding: "16px 18px" }}>
                                                    {isEditMode ? (
                                                        <div>
                                                            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
                                                            <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={8}
                                                                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, marginBottom: 10 }} />
                                                            <div style={{ display: "flex", gap: 8 }}>
                                                                <button onClick={() => handleSaveEdit(entry.id)} style={primaryBtn}>Save</button>
                                                                <button onClick={() => setEditing(null)} style={outlineBtn}>Cancel</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.7, margin: "0 0 16px", whiteSpace: "pre-wrap" }}>
                                                                {entry.content ?? <em style={{ color: "var(--text-dim)" }}>No content.</em>}
                                                            </p>
                                                            <div style={{ display: "flex", gap: 8 }}>
                                                                <button onClick={() => startEdit(entry)} style={outlineBtn}>Edit</button>
                                                                <button onClick={() => handleDelete(entry.id)}
                                                                    style={{ ...outlineBtn, color: "#ef5350", borderColor: "rgba(239,83,80,0.3)" }}
                                                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,83,80,0.08)")}
                                                                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                                                                >
                                                                    <Trash2 size={12} /> Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
            )}
        </div>
    );
}

const labelStyle: React.CSSProperties = { display: "block", color: "var(--text-dim)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "7px 10px", fontSize: 13, color: "var(--text)", outline: "none", boxSizing: "border-box" };
const primaryBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--blue)", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const outlineBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "transparent", color: "var(--text-dim)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, cursor: "pointer" };
