import { App } from "../App";
import { AuthPage } from "@/pages/AuthPage/AuthPage";
import { Board } from "@/widgets/Board/Board";

import { useTaskStore } from "@/entities/task";
import { useAuth } from "@/features/auth";
import { ROUTES } from "@/shared/const/ROUTES";
import { useEffect } from "react";
import { BrowserRouter, createBrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

export const routes = createBrowserRouter([
    {
        element: <App />,
        children: [
            {
                path: ROUTES.LOGIN,
                element: <AuthPage />,
            },
            {
                path: ROUTES.BOARD,
                element: <Board />,
            }
        ]
    }
])