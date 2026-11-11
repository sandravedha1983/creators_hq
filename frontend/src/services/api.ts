import axios from "axios";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

axios.defaults.timeout = 8000;

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://creators-hq-lz3d.onrender.com',
    timeout: 8000
});

API.interceptors.request.use(async (config) => {
    if (isSupabaseConfigured()) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
        }
    }
    return config;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        return Promise.reject(error);
    }
);

export default API;
