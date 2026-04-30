import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { apiGet, apiJson } from "../api/client";

type Strategy = { id: number; name: string; description: string | null };

export default function Strategies() {
    const [strategies, setStrategies]   = useState<Strategy[]>([]);
    const [loading,    setLoading]      = useState(true);
    const [name,       setName]         = useState("");
    const [desc,       setDesc]         = useState("");
    const [saving,     setSaving]       = useState(false);
    const [error,      setError]        = useState("");
    const [editId,     setEditId]       = useState<number | null>(null);
    const [editName,   setEditName]     = useState("");
    const [editDesc,   setEditDesc]     = useState("");

    async function load() {
        setLoading(true);
        try {
            const data = await apiGet("/strategies");
            setStrategies(data as Strategy[]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        setSaving(true);
        setError("");
        try {
            await apiJson("/strategies", "POST", { name: name.trim(), description: desc.trim() || null });
            setName("");
            setDesc("");
            await load();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number) {
        if (!window.confirm("Delete this strategy?")) return;
        await apiJson(`/strategies/${id}`, "DELETE");
        await load();
    }

    async function handleSaveEdit(id: number) {
        await apiJson(`/strategies/${id}`, "PATCH", { name: editName.trim(), description: editDesc.trim() || null });
        setEditId(null);
        await load();
    }

    function startEdit(s: Strategy) {
        setEditId(s.id);
        setEditName(s.name);
        setEditDesc(s.description ?? "");
    }

    return (
        <div style={{ width: "100%", maxWidth: 680 }}>
            <h1 style={{ color: "var(--text)", fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>Strategies</h1>
            <p style={{ color: "var(--text-dim)", fontSize: 13, margin: "0 0 24px" }}>
                Define your trading setups here. They'll appear in the trade form so you can tag each trade.
            </p>

            {/* Add form */}
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 20, marginBottom: 24 }}>
                <p style={{ color: "var(--text)", fontSize: 13, fontWeight: 600, margin: "0 0 14px" }}>Add Strategy</p>
                <form onSubmit={handleAdd}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 10 }}>
                        <div>
                            <label style={labelStyle}>Name</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Break & Retest"
                                required
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Description</label>
                            <input
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                placeholder="What makes this setup valid?"
                                style={inputStyle}
                            />
                        </div>
                    </div>
                    {error && <p style={{ color: "#ef5350", fontSize: 12, margin: "0 0 10px" }}>{error}</p>}
                    <button type="submit" disabled={saving} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", background: "var(--blue)", color: "#fff",
                        border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600,
                        cursor: "pointer", opacity: saving ? 0.6 : 1,
                    }}>
                        <Plus size={13} />
                        {saving ? "Saving..." : "Add Strategy"}
                    </button>
                </form>
            </div>

            {/* Strategy list */}
            {loading ? (
                <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Loading...</p>
            ) : strategies.length === 0 ? (
                <p style={{ color: "var(--text-dim)", fontSize: 13 }}>No strategies yet. Add one above.</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {strategies.map(s => (
                        <div key={s.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 18px" }}>
                            {editId === s.id ? (
                                /* Edit mode */
                                <div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 10 }}>
                                        <div>
                                            <label style={labelStyle}>Name</label>
                                            <input value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Description</label>
                                            <input value={editDesc} onChange={e => setEditDesc(e.target.value)} style={inputStyle} />
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button onClick={() => handleSaveEdit(s.id)} style={{ padding: "5px 14px", background: "var(--blue)", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                            Save
                                        </button>
                                        <button onClick={() => setEditId(null)} style={{ padding: "5px 14px", background: "transparent", color: "var(--text-dim)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* View mode */
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ flex: 1, cursor: "pointer" }} onClick={() => startEdit(s)}>
                                        <div style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{s.name}</div>
                                        <div style={{ color: "var(--text-dim)", fontSize: 12 }}>{s.description ?? <em>No description</em>}</div>
                                    </div>
                                    <button onClick={() => handleDelete(s.id)}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", padding: 6, display: "flex", marginLeft: 12 }}
                                        onMouseEnter={e => (e.currentTarget.style.color = "#ef5350")}
                                        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-dim)")}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const labelStyle: React.CSSProperties = {
    display: "block", color: "var(--text-dim)", fontSize: 11,
    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
    width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: 6, padding: "7px 10px", fontSize: 13, color: "var(--text)",
    outline: "none", boxSizing: "border-box",
};
