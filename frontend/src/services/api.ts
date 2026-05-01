import axios from "axios";

axios.defaults.timeout = 8000;

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
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
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        return Promise.reject(error);
    }
);

export default API;
