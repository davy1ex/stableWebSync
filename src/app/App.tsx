import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { Header } from "@/widgets/Header";
import { ROUTES } from "@/shared/const/ROUTES";
import { AuthPage } from "@/pages/AuthPage/AuthPage";
import { useEffect, useState } from "react";
import { useTaskStore } from "@/entities/task";
import { fetchTasks } from "@/entities/task/api/syncApi";
import { useRewardStore } from "@/entities/reward";
import { fetchRewards } from "@/entities/reward/api/syncApi";
import { useSettingsStore } from "@/entities/settings";
import { usePointsStore } from "@/entities/Points";
import { download } from "@/shared/lib/download";
import { ToastContainer } from "@/shared/ui/Toast/ToastContainer";
import { ModalWindow } from "@/shared/ui/ModalWindow";
import { syncFromFirebase } from "@/features/sync/syncTasks";
import { startSyncListener } from "@/features/sync";
import { useInitSync } from "@/features/sync/initSync";
import { useThemeStore } from "@/features/theme/store";
import "./styles.css"

export const App = () => {
    const { user, logout, username, token } = useAuth();
    const location = useLocation();
    const updateTasks = useTaskStore((state) => state.updateTasks);
    const updateRewards = useRewardStore((state) => state.updateRewards);
    const totalPoints = usePointsStore((state) => state.totalPoints);
    console.log("APP totalPoints", totalPoints)
    const withoutServerSync = useSettingsStore((state) => state.getWithoutServerSync());

    const { mode, setMode, setAccent } = useThemeStore();
    const toggleTheme = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        document.body.setAttribute('data-theme', newMode);
    };
    // const changeAccent = (color: 'red' | 'blue' | 'yellow') => { // todo: add in next release switching accent
    //     setAccent(color);
    //     document.body.setAttribute('data-accent', color);
    // };

    const modal = useInitSync(user, username);

    useEffect(() => {                  
        // if (withoutServerSync) {
        //     const backUpData = () => {
        //         const tasks = JSON.parse(localStorage.getItem("tasks") || "[]")
        //         const rewards = JSON.parse(localStorage.getItem("rewards") || "[]")
        //         const projects = JSON.parse(localStorage.getItem("projects") || "[]")
        //         const settings = JSON.parse(localStorage.getItem("settings") || "[]")
        //         const data = {
        //             tasks: tasks,
        //             rewards: rewards,
        //             projects: projects,
        //             settings: settings
        //         }
        //         download(JSON.stringify(data, null, 2), "data.json")
        //     }
            // backUpData()
            
            // const interval = setInterval(() => {
            //     backUpData()
            // }, 10*60*1000)   
            // return () => clearInterval(interval)
        
    }, [])

    if (location.pathname === ROUTES.LOGIN && user) return <Navigate to={ROUTES.BOARD} replace />;
    if (!user && !withoutServerSync) return <AuthPage />;

    return (
        <div className="appContainer" style={{ backgroundColor: 'var(--background)', color: 'var(--text)'}} data-theme={mode}>
            <Header toggleTheme={toggleTheme} username={username} logout={logout} totalPoints={totalPoints} />
            <Outlet />
            <ToastContainer />
            {modal}
        </div>
    )
};