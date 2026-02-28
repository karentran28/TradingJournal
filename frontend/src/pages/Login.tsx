import { useState } from "react"
import { apiLogin, apiGet} from "../api/client"
import { setToken } from "../auth/token"
import { useNavigate } from "react-router-dom";
export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate()

    async function handleLogin(e: React.FormEvent) {
        // prevent browser refreshing page
        e.preventDefault();
        setError("");
        setMsg("Logging in...");

        try {
            const res = await apiLogin(email, password);
            setToken(res.access_token);

            // test token works
            // const me = await apiGet("/me");
            // setMsg(`Logged in as ${me.email}`);
            
            // successful login redirect to dashboard
            navigate("/dashboard")

        } catch (err: any) {
            setError(err.message);
            setMsg("");
        }
    }

    return (
        <div style={{ maxWidth: 400, margin: "80px auto", fontFamily: "system-ui" }}>
        <h2>Login</h2>

        {/* onSubmit handles both button click and pressing enter */}
        <form onSubmit={handleLogin}>
            <input
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%", marginBottom: 10, padding: 10 }}
            />

            <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", marginBottom: 10, padding: 10 }}
            />

            <button style={{ padding: 10, width: "100%" }}>Login</button>
        </form>

        {msg && <p>{msg}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}
