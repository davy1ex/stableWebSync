import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.API_URL,
    timeout: 5000,
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            const { status } = error.response;

            // if (status === 401 || status === 403) {
            //     console.warn('Unauthorized - redirecting to login');
            //     window.location.href = '/login';
            //     localStorage.removeItem('token');
            //     localStorage.removeItem('username');
            // }
        }

        return Promise.reject(error);
    }
);
