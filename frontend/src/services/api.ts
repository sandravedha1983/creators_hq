import axios from "axios";

axios.defaults.timeout = 8000;

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://creators-hq-lz3d.onrender.com',
    timeout: 8000
});

// Send Token in Requests
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle Response Errors globally
API.interceptors.response.use(
    (response) => response,
    (error) => {
        const config = error.config;
        const isAuthEndpoint = config?.url?.includes('/api/auth/login') || 
                               config?.url?.includes('/api/login') ||
                               config?.url?.includes('/api/auth/register') ||
                               config?.url?.includes('/api/signup') ||
                               config?.url?.includes('/api/auth/admin-login') ||
                               config?.url?.includes('/api/admin/login');

        if (error.response?.status === 401 && !isAuthEndpoint) {
            localStorage.removeItem("token");
            window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        return Promise.reject(error);
    }
);

export default API;
