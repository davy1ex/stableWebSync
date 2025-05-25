import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { useTaskStore } from '@/entities/task/model/store';
import { LoginForm } from '@/features/auth/ui/LoginForm';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Board } from '@/widgets/Board/Board';
import { useAuth } from '@/features/auth/model/useAuth';
import { AuthPage } from '@/features/auth/ui/AuthPage';

const container = document.getElementById('root');
const root = createRoot(container!);

const Header = () => {
    const { username, logout } = useAuth();
    const navigate = useNavigate();
    if (!username) return null;
    return (
        <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: '#f5f5f5'}}>
            <span>Welcome, {username}</span>
            <button onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </header>
    );
};

const PrivateRoute = () => {
    const { token } = useAuth();
    return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const MainRoutes = () => {
    const connectSync = useTaskStore((s) => s.connectSync);
    const disconnectSync = useTaskStore((s) => s.disconnectSync);
    const { token } = useAuth();
    useEffect(() => {
        if (token) connectSync();
        return () => disconnectSync();
    }, [token]);
    return (
        <>
            <Header />
            <Routes>
                <Route path="/login" element={<AuthPage />} />
                <Route element={<PrivateRoute />}>
                    <Route path="/" element={<Board />} />
                </Route>
                <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
            </Routes>
        </>
    );
};

root.render(
    <BrowserRouter>
        <MainRoutes />
    </BrowserRouter>
);