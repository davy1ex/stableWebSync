import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../model/useAuth";
import { LoginForm } from "./LoginForm";

export const AuthPage = () => {
    const { token } = useAuth();
    if (token) return <Navigate to="/" replace />;
    return <LoginForm onLogin={() => {}} />;
}; 