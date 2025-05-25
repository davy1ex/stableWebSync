import React, { useState } from "react";
import { useAuth } from "../model/useAuth";
import { useNavigate } from "react-router-dom";

export const LoginForm = ({ onLogin }: { onLogin: () => void }) => {
    const [input, setInput] = useState("");
    const { login, error } = useAuth();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        const ok = await login(input);
        setLoading(false);
        if (ok) {
            onLogin();
            navigate("/");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Username"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
            />
            <button type="submit" disabled={loading || !input}>Login</button>
            {error && <div style={{color: 'red'}}>{error}</div>}
        </form>
    );
}; 