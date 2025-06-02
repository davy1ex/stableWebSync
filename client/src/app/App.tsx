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
import { useSettingsStore } from "@/entities/settings";
import { usePointsStore } from "@/entities/Points";
import { download } from "@/shared/lib/download";
import { ToastContainer } from "@/shared/ui/Toast/ToastContainer";

export const App = () => {
    const { token, username, logout } = useAuth();
    const location = useLocation();
    const updateTasks = useTaskStore((state) => state.updateTasks);
    const updateRewards = useRewardStore((state) => state.updateRewards);
    const totalPoints = usePointsStore((state) => state.totalPoints);
    console.log("APP totalPoints", totalPoints)
    const withoutServerSync = useSettingsStore((state) => state.getWithoutServerSync());
    
    if (withoutServerSync) {
        useEffect(() => {
            const backUpData = () => {
                const tasks = JSON.parse(localStorage.getItem("tasks") || "[]")
                const rewards = JSON.parse(localStorage.getItem("rewards") || "[]")
                const projects = JSON.parse(localStorage.getItem("projects") || "[]")
                const settings = JSON.parse(localStorage.getItem("settings") || "[]")
                const data = {
                    tasks: tasks,
                    rewards: rewards,
                    projects: projects,
                    settings: settings
                }
                download(JSON.stringify(data, null, 2), "data.json")
            }
            backUpData()
            
            const interval = setInterval(() => {
                backUpData()
            }, 10*60*1000)   
            return () => clearInterval(interval)
        }, [])
        return (
            <>
                <Header username={username} logout={logout} totalPoints={totalPoints} />
                <Outlet />
                <ToastContainer />
            </>
        )
    }
    if (location.pathname === ROUTES.LOGIN && token) return <Navigate to={ROUTES.BOARD} replace />;
    if (!token) return  (
        <>
            <Header username={username} logout={logout} totalPoints={totalPoints} />
            <AuthPage />
        </>
    );

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