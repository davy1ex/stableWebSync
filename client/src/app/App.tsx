import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { Header } from "@/shared/ui/Header";
import { ROUTES } from "@/shared/const/ROUTES";
import { AuthPage } from "@/pages/AuthPage/AuthPage";
import { useEffect } from "react";
import { useTaskStore } from "@/entities/task";
import { fetchTasks } from "@/entities/task/api/syncApi";


export const App = () => {
    const { token, username, logout } = useAuth();
    const location = useLocation();
    const updateTasks = useTaskStore((state) => state.updateTasks);
    const tasks = useTaskStore((state) => state.tasks);
    
    const setIsOnline = useTaskStore((state) => state.setOnline);
    
    if (location.pathname === ROUTES.LOGIN && token) return <Navigate to={ROUTES.BOARD} replace />;
    if (!token) return  <AuthPage />;

    useEffect(() => {
    //     const fetchTasks = async () => {
    //         try {
    //             const response = await fetch(`${process.env.API_URL}/sync`, {
    //                 headers: {
    //                     'Authorization': `Bearer ${token}`,
    //                     'Content-Type': 'application/json',
    //                 },
    //                 method: "POST",
    //                 body: JSON.stringify({
    //                     tasks: tasks
    //                 })
    //             });
    //             const data = await response.json();
    //             updateTasks(data.tasks)
    //             setIsOnline(true)
    //         } catch (error) {
    //             setIsOnline(false)
    //             console.error("Error fetching tasks:", error);
    //         }
    //     }
        const interval = setInterval(async () => {
            try {
                const tasks = await fetchTasks(token)
                updateTasks(tasks)
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        }, 5000);
    //     return () => clearInterval(interval);
    }, []);

    return (
        <>
            <Header username={username} logout={logout} />
            <Outlet />
        </>
    )
};