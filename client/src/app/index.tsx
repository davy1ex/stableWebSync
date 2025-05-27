import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { routes } from './providers/AppRoutes';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
    <RouterProvider router={routes} />
);