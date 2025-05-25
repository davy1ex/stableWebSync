import React, { useState } from "react";
import { useAuth } from "../model/useAuth";

export const LoginForm = ({ onLogin }: { onLogin: () => void }) => {
    const [input, setInput] = useState("");
    const { login, error } = useAuth();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        const ok = await login(input);
        setLoading(false);
        if (ok) onLogin();
    }

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Имя пользователя"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
            />
            <button type="submit" disabled={loading || !input}>Войти</button>
            {error && <div style={{color: 'red'}}>{error}</div>}
        </form>
    );
}; 