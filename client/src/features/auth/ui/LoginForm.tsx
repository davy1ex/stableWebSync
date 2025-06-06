import React, { useState } from "react";
import { useAuth } from "../model/useAuth";
import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "@/entities/settings";

export const LoginForm = ({ onLogin }: { onLogin: () => void }) => {
    const [input, setInput] = useState("");
    const [password, setPassword] = useState("");
    const { login, error } = useAuth();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const setWithoutServerSync = useSettingsStore((state) => state.setWithoutServerSync);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        setLoading(true);
        const ok = await login(input, password);
        setLoading(false);
        if (ok) {
            onLogin();
            navigate("/");
        }
    }

    if (loading) return (
        <div>
            Loading auth...
            <button type="button" onClick={() => {setWithoutServerSync(true)}}>Try with offline mode</button>
        </div>
    )


    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Username"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
            />
            <button type="submit" disabled={loading || !input}>Login</button>
            <button type="button" onClick={() => {setWithoutServerSync(true)}}>Try with offline mode</button>
            {error && <div style={{color: 'red'}}>{error}</div>}
        </form>
    );
}; 