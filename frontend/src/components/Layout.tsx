import { JSX } from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }: { children: JSX.Element }) {
    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
            <Sidebar />
            <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                {children}
            </main>
        </div>
    );
}
