import { useState } from "react";
import { api } from "@/shared/api"

const API_URL = "http://localhost:3001";

export function useAuth() {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
    const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'));
    const [error, setError] = useState<string | null>(null);

    async function login(username: string) {
        setError(null);
        const response = await api.post('/login', { username });

        if (!response.data) {
            setError('Authorization error');
            return false;
        }

        const data = response.data;
        setToken(data.token);
        setUsername(username);
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', username);
        window.location.reload();
        return true;
    }

    function logout() {
        setToken(null);
        setUsername(null);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.reload();
    }

    return { token, username, login, logout, error };
} 