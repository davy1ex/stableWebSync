import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { Header } from "@/shared/ui/Header";
import { ROUTES } from "@/shared/const/ROUTES";
import { AuthPage } from "@/pages/AuthPage/AuthPage";
import { useEffect } from "react";
import { useTaskStore } from "@/entities/task";
import { fetchTasks } from "@/entities/task/api/syncApi";
import { useRewardStore } from "@/entities/reward";
import { fetchRewards } from "@/entities/reward/api/syncApi";
import { useTotalPoints } from "@/entities/task/model/store";


export const App = () => {
    const { token, username, logout } = useAuth();
    const location = useLocation();
    const updateTasks = useTaskStore((state) => state.updateTasks);
    const updateRewards = useRewardStore((state) => state.updateRewards);
    const totalPoints = useTotalPoints();
        
    if (location.pathname === ROUTES.LOGIN && token) return <Navigate to={ROUTES.BOARD} replace />;
    if (!token) return  <AuthPage />;

    useEffect(() => {
        const syncOnLoad = async () => {
            try {
                if (token) {
                    const tasks = await fetchTasks(token)
                    const rewards = await fetchRewards(token)
                    console.log("rewards in apps", rewards)
                    updateTasks(tasks)
                    updateRewards(rewards)
                }
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        }
        syncOnLoad()

        const interval = setInterval(async () => {
            try {
                const tasks = await fetchTasks(token)
                const rewards = await fetchRewards(token)

                console.log("rewards in apps", rewards)
                updateTasks(tasks)
                updateRewards(rewards)
                
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <Header username={username} logout={logout} totalPoints={totalPoints} />
            <Outlet />
        </>
    )
};