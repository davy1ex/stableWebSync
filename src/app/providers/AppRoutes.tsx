import { App } from "../App";
import { AuthPage } from "@/pages/AuthPage/AuthPage";
import { Board } from "@/widgets/Board/Board";

import { ROUTES } from "@/shared/const/ROUTES";
import { createBrowserRouter, RouteObject } from "react-router-dom";

export const routeObjects: RouteObject[] = [
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
        },
      ],
    },
  ];

export const routes = createBrowserRouter(routeObjects);