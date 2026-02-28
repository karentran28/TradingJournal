import { useEffect, useState } from "react";
import { apiGet } from "../api/client"
import { clearToken } from "../auth/token"
import { useNavigate } from "react-router-dom"

export default function Dashboard() {
    const [email, setEmail] = useState<string>("");
    const [error, setError] = useState<string>("");
    const navigate = useNavigate()

    useEffect(() => {
        async function load() {
            try {
                const me = await apiGet("/me");
                setEmail(me.email);
            } catch (e: any) {
                setError(e.message || "Failed to load user")
            }
        }
        load();
    }, []);

    function logout() {
        clearToken();
        navigate("/login")
    }

    return (
        <div style={{ maxWidth: 800, margin: "40px auto", fontFamily: "system-ui" }}>
            <h2>Dashboard</h2>

            {error && <p style={{ color: "crimson"}}>{error}</p>}
            {!error && <p>Logged in as: {email}</p>}

            <button onClick={logout} style={{ padding: 10, marginTop: 10 }}>
                Logout
            </button>
        </div>
    );
}
