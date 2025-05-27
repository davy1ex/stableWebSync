import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { Header } from "@/shared/ui/Header";
import { ROUTES } from "@/shared/const/ROUTES";
import { AuthPage } from "@/pages/AuthPage/AuthPage";


export const App = () => {
    const { token, username, logout } = useAuth();
    const location = useLocation();

    if (location.pathname === ROUTES.LOGIN && token) return <Navigate to={ROUTES.BOARD} replace />;
    if (!token) return  <AuthPage />;

    return (
        <>
            <Header username={username} logout={logout} />
            <Outlet />
        </>
    )
};