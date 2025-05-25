import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { useTaskStore } from '@/entities/task/model/store';
import { LoginForm } from '@/features/auth/ui/LoginForm';

const container = document.getElementById('root');
const root = createRoot(container!);

const SyncWrapper = () => {
    const connectSync = useTaskStore((s) => s.connectSync);
    const disconnectSync = useTaskStore((s) => s.disconnectSync);
    const [authed, setAuthed] = useState(() => Boolean(localStorage.getItem('token')));
    useEffect(() => {
        if (authed) connectSync();
        return () => disconnectSync();
    }, [authed]);
    if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;
    return <App />;
};

root.render(<SyncWrapper />);