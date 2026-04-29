import { getToken } from "../auth/token";

const BASE_URL = "http://127.0.0.1:8000";

async function handleResponse(res: Response) {
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.detail || "Request failed");
    return data;
}

export async function apiGet(path: string, params?: Record<string, string>) {
    const token = getToken();
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") url.searchParams.append(k, v);
        });
    }
    const res = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return handleResponse(res);
}

export async function apiLogin(email: string, password: string) {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
    });
    return handleResponse(res);
}

export async function apiJson(path: string, method: string, bodyObj?: any) {
    const token = getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: bodyObj ? JSON.stringify(bodyObj) : undefined,
    });
    return handleResponse(res);
}
