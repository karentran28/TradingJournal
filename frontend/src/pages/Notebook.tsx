import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiGet, apiJson } from "../api/client";

type Note = { id: number; title: string; content: string | null; updated_at: string };

export default function Notebook() {
    const [notes,    setNotes]    = useState<Note[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [selected, setSelected] = useState<Note | null>(null);
    const [title,    setTitle]    = useState("");
    const [content,  setContent]  = useState("");
    const [dirty,    setDirty]    = useState(false);
    const [saving,   setSaving]   = useState(false);

    async function load() {
        setLoading(true);
        try {
            const data = await apiGet("/notebook");
            setNotes(data as Note[]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    function openNote(note: Note) {
        setSelected(note);
        setTitle(note.title);
        setContent(note.content ?? "");
        setDirty(false);
    }

    async function createNote() {
        const note = await apiJson("/notebook", "POST", { title: "Untitled", content: null });
        await load();
        openNote(note);
    }

    async function saveNote() {
        if (!selected) return;
        setSaving(true);
        try {
            await apiJson(`/notebook/${selected.id}`, "PATCH", { title: title.trim() || "Untitled", content: content || null });
            setDirty(false);
            await load();
        } finally {
            setSaving(false);
        }
    }

    async function deleteNote(id: number) {
        if (!window.confirm("Delete this note?")) return;
        await apiJson(`/notebook/${id}`, "DELETE");
        if (selected?.id === id) { setSelected(null); setTitle(""); setContent(""); }
        await load();
    }

    function fmtDate(s: string) {
        return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    return (
        <div style={{ display: "flex", height: "calc(100vh - 48px)", gap: 0, width: "100%" }}>

            {/* Left panel — note list */}
            <div style={{ width: 260, minWidth: 260, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "0 12px 12px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ color: "var(--text)", fontSize: 14, fontWeight: 600 }}>Notebook</span>
                        <button onClick={createNote} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", display: "flex", padding: 4 }}
                            title="New note"
                            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-dim)")}
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto" }}>
                    {loading ? (
                        <p style={{ color: "var(--text-dim)", fontSize: 12, padding: 12 }}>Loading...</p>
                    ) : notes.length === 0 ? (
                        <p style={{ color: "var(--text-dim)", fontSize: 12, padding: 12 }}>No notes yet. Click + to create one.</p>
                    ) : (
                        notes.map(note => (
                            <div
                                key={note.id}
                                onClick={() => openNote(note)}
                                style={{
                                    padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)",
                                    background: selected?.id === note.id ? "var(--card)" : "transparent",
                                    transition: "background 0.1s",
                                }}
                                onMouseEnter={e => { if (selected?.id !== note.id) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                                onMouseLeave={e => { if (selected?.id !== note.id) e.currentTarget.style.background = "transparent"; }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ color: "var(--text)", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {note.title}
                                        </div>
                                        <div style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 2 }}>
                                            {fmtDate(note.updated_at)}
                                        </div>
                                        {note.content && (
                                            <div style={{ color: "var(--text-dim)", fontSize: 11, marginTop: 3, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                                                {note.content}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--border)", padding: "2px 0 0 6px", display: "flex", flexShrink: 0 }}
                                        onMouseEnter={e => (e.currentTarget.style.color = "#ef5350")}
                                        onMouseLeave={e => (e.currentTarget.style.color = "var(--border)")}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right panel — editor */}
            {selected ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 32px" }}>
                    {/* Title */}
                    <input
                        value={title}
                        onChange={e => { setTitle(e.target.value); setDirty(true); }}
                        style={{ background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 22, fontWeight: 700, width: "100%", marginBottom: 16, padding: 0 }}
                        placeholder="Untitled"
                    />

                    {/* Body */}
                    <textarea
                        value={content}
                        onChange={e => { setContent(e.target.value); setDirty(true); }}
                        placeholder="Start writing... this is your scratch pad. No rules."
                        style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: 14, lineHeight: 1.8, resize: "none", fontFamily: "inherit", padding: 0 }}
                    />

                    {/* Save bar */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--border)", marginTop: 12 }}>
                        <span style={{ color: "var(--text-dim)", fontSize: 12 }}>
                            {dirty ? "Unsaved changes" : `Saved ${fmtDate(selected.updated_at)}`}
                        </span>
                        <button
                            onClick={saveNote}
                            disabled={!dirty || saving}
                            style={{ padding: "6px 16px", background: dirty ? "var(--blue)" : "var(--card)", color: dirty ? "#fff" : "var(--text-dim)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: dirty ? "pointer" : "default", transition: "all 0.15s" }}
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 12 }}>Select a note or create a new one</div>
                        <button onClick={createNote} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
                            <Plus size={14} /> New Note
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
