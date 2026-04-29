import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, CalendarDays, BarChart2,
    ListOrdered, BookOpen, NotebookPen, Plus, LogOut,
} from "lucide-react";
import { clearToken } from "../auth/token";

const navItems = [
    { to: "/dashboard", label: "Dashboard",  icon: LayoutDashboard },
    { to: "/calendar",  label: "Calendar",   icon: CalendarDays },
    { to: "/reports",   label: "Reports",    icon: BarChart2 },
    { to: "/trades",    label: "Trades",     icon: ListOrdered },
    { to: "/journal",   label: "Journal",    icon: BookOpen },
    { to: "/notebook",  label: "Notebook",   icon: NotebookPen },
];

export default function Sidebar() {
    const navigate = useNavigate();

    function logout() {
        clearToken();
        navigate("/login");
    }

    return (
        <aside style={{
            width: 220,
            minWidth: 220,
            background: "var(--sidebar)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            height: "100vh",
        }}>
            {/* Logo */}
            <div style={{ padding: "24px 20px 20px" }}>
                <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>
                    FX Journal
                </span>
            </div>

            {/* New Trade button */}
            <div style={{ padding: "0 12px 16px" }}>
                <button
                    onClick={() => navigate("/trades?new=1")}
                    style={{
                        display: "flex", alignItems: "center", gap: 8,
                        width: "100%", padding: "8px 12px",
                        background: "var(--blue)", color: "#fff",
                        border: "none", borderRadius: 6,
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}
                >
                    <Plus size={14} />
                    New Trade
                </button>
            </div>

            {/* Nav */}
            <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 12px", flex: 1 }}>
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        style={({ isActive }) => ({
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "8px 12px", borderRadius: 6,
                            fontSize: 13, textDecoration: "none",
                            background: isActive ? "var(--card)" : "transparent",
                            color: isActive ? "var(--text)" : "var(--text-dim)",
                            fontWeight: isActive ? 500 : 400,
                            transition: "background 0.15s, color 0.15s",
                        })}
                    >
                        {({ isActive }) => (
                            <>
                                <Icon size={15} style={{ color: isActive ? "var(--blue)" : "var(--text-dim)", flexShrink: 0 }} />
                                {label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div style={{ padding: "12px 12px 20px" }}>
                <button
                    onClick={logout}
                    style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "8px 12px",
                        background: "none", border: "none",
                        color: "var(--text-dim)", fontSize: 13, cursor: "pointer",
                        borderRadius: 6,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-dim)")}
                >
                    <LogOut size={15} />
                    Logout
                </button>
            </div>
        </aside>
    );
}
