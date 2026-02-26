import { getToken } from "../auth/token";

const BASE_URL = "http://127.0.0.1:8000";

// generic response handler
async function handleResponse(res: Response) {
    const data = await res.json().catch(() => null);

    if (!res.ok) {
        throw new Error(data?.detail || "Request failed");
    }

    return data;
}

// GET request with JWT
export async function apiGet(path: string) {
    const token = getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "GET",
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    return handleResponse(res);
}

// LOGIN
// OAuth2PasswordRequestForm uses form data not JSON
export async function apiLogin(email: string, password: string) {
    // converts JS data -> form data object
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);

    const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        // convert form data obj to string
        body: form.toString(),
    });

    return handleResponse(res);
}
